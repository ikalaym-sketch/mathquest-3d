// v0.29.1 正式動畫 GLB 載入與控制元件。
// 支援 SkinnedMesh 安全複製、動畫候選回退、Socket 掛載、Material Profile、引用計數與實例級遙測。
import { Suspense, useEffect, useId, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { LoopOnce, LoopRepeat } from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import ErrorBoundary from './ErrorBoundary.jsx';
import { registerRuntimeAsset, reportRuntimeWarning } from '../../input/runtimeAcceptance.js';
import { resolveAssetDescriptor, resolveAssetUrl } from '../../services/AssetPathService.js';
import { registerRuntimeAssetResources, retainRuntimeAsset } from '../../services/AssetRuntimeService.js';
import { applyRuntimeMaterialProfile, updateRuntimeMaterialTime } from '../../services/RuntimeMaterialService.js';
import { applyRuntimeTextureAtlas } from '../../services/RuntimeTextureAtlasService.js';

function LoadedAnimatedModel({
  assetId,
  instanceId,
  kind = 'model',
  clipName = 'Idle',
  clipCandidates = null,
  loop = true,
  attachments = null,
  materialOverrides = null,
  hiddenBodyNodes = null,
  materialQuality = 'medium',
  onReady = null,
  ...props
}) {
  const generatedId = useId();
  const descriptor = useMemo(() => resolveAssetDescriptor(assetId), [assetId]);
  const { scene, animations } = useGLTF(descriptor.url);
  const groupRef = useRef(null);
  const materialRuntimeRef = useRef(null);
  const atlasRuntimeRef = useRef(null);
  const renderer = useThree((state) => state.gl);
  const resolvedClipRef = useRef(null);

  const model = useMemo(() => {
    const cloned = cloneSkeleton(scene);
    const hidden = new Set(hiddenBodyNodes || []);
    cloned.traverse((node) => { if (hidden.has(node.name)) node.visible = false; });
    const runtime = applyRuntimeMaterialProfile(cloned, descriptor.asset, {
      quality: materialQuality,
      colorOverrides: materialOverrides,
    });
    materialRuntimeRef.current = runtime;
    return cloned;
  }, [descriptor.asset, hiddenBodyNodes, materialOverrides, materialQuality, scene]);

  const { actions, names } = useAnimations(animations, groupRef);
  const clipCandidateKey = (clipCandidates || []).join('|');
  const requestedCandidates = useMemo(() => unique([...(clipCandidates || []), clipName, 'Idle']), [clipCandidateKey, clipName]);
  const attachmentTargets = useMemo(() => {
    if (!attachments) return [];
    const targets = [];
    model.traverse((node) => {
      const attachment = attachments[node.name];
      if (attachment) targets.push({ node, attachment });
    });
    return targets;
  }, [attachments, model]);

  useFrame(({ clock }) => {
    updateRuntimeMaterialTime(materialRuntimeRef.current?.dynamicMaterials, clock.getElapsedTime());
  });

  useEffect(() => {
    let cancelled = false;
    applyRuntimeTextureAtlas(model, descriptor.asset, renderer, { quality: materialQuality }).then((runtime) => {
      if (cancelled) runtime.dispose();
      else atlasRuntimeRef.current = runtime;
    }).catch(() => {});
    return () => { cancelled = true; atlasRuntimeRef.current?.dispose?.(); atlasRuntimeRef.current = null; };
  }, [descriptor.asset, materialQuality, model, renderer]);

  useEffect(() => {
    const activeName = requestedCandidates.find((candidate) => names.includes(candidate)) || names[0];
    resolvedClipRef.current = activeName || null;
    if (!activeName) {
      reportRuntimeWarning('ASSET_ANIMATION_MISSING', `${descriptor.assetId}:${requestedCandidates.join('|')}`);
      return undefined;
    }
    if (activeName !== requestedCandidates[0]) {
      reportRuntimeWarning('ASSET_ANIMATION_FALLBACK', `${descriptor.assetId}:${requestedCandidates[0]}->${activeName}`);
    }
    for (const [name, action] of Object.entries(actions || {})) {
      if (name !== activeName) action?.fadeOut(0.12);
    }
    const action = actions[activeName];
    action.reset().fadeIn(0.16).play();
    action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    return () => action.fadeOut(0.12);
  }, [actions, descriptor.assetId, loop, names, requestedCandidates]);

  useEffect(() => {
    registerRuntimeAssetResources(descriptor.assetId, scene, descriptor.url);
    const releaseResidency = retainRuntimeAsset(descriptor.assetId, descriptor.url);
    return () => releaseResidency();
  }, [descriptor.assetId, descriptor.url, scene]);

  useEffect(() => {
    const id = instanceId || `${kind}:${descriptor.assetId}:${generatedId}`;
    const unregister = registerRuntimeAsset(id, {
      instanceId: id,
      assetId: descriptor.assetId,
      kind,
      url: descriptor.canonicalPath,
      requestedClip: requestedCandidates[0] || clipName,
      resolvedClip: resolvedClipRef.current,
      animationNames: names,
      skinnedMeshCount: countNodes(model, 'isSkinnedMesh'),
      meshCount: countNodes(model, 'isMesh'),
      socketCount: countSockets(model),
      materialProfile: descriptor.asset?.materialProfile || null,
      shaderProfile: materialRuntimeRef.current?.profile?.shaderId || null,
    });
    onReady?.({ descriptor, animationNames: names, model, resolvedClip: resolvedClipRef.current });
    return unregister;
  }, [clipName, descriptor, generatedId, instanceId, kind, model, names, onReady, requestedCandidates]);

  useEffect(() => {
    const runtime = materialRuntimeRef.current;
    return () => runtime?.dispose?.();
  }, [model]);

  return (
    <group ref={groupRef} {...props}>
      <primitive object={model} />
      {attachmentTargets.map(({ node, attachment }) => createPortal(attachment, node, node.uuid))}
    </group>
  );
}

export default function AnimatedProductionModel({ assetId = null, fallback = null, ...props }) {
  if (!resolveAssetUrl(assetId)) {
    if (assetId) reportRuntimeWarning('ASSET_ID_NOT_REGISTERED', assetId);
    return fallback;
  }
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedAnimatedModel assetId={assetId} {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

export function preloadAnimatedProductionModel(assetId) {
  const url = resolveAssetUrl(assetId);
  if (url) useGLTF.preload(url);
}

function countNodes(root, flag) {
  let count = 0;
  root.traverse((node) => { if (node[flag]) count += 1; });
  return count;
}

function countSockets(root) {
  let count = 0;
  root.traverse((node) => { if (node.name?.startsWith('SOCKET_')) count += 1; });
  return count;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
