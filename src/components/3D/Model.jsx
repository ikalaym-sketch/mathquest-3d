// v0.29.1 靜態 GLB 載入元件。
// 正式入口只接受 assetId；路徑、Material Profile、Shader、引用計數、清除與遙測都由共用服務處理。
import { Suspense, useEffect, useId, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Vector3 } from 'three';
import ErrorBoundary from './ErrorBoundary.jsx';
import { registerRuntimeAsset, reportRuntimeWarning } from '../../input/runtimeAcceptance.js';
import { resolveAssetDescriptor, resolveAssetUrl } from '../../services/AssetPathService.js';
import { clearRuntimeAsset, preloadRuntimeAsset, registerRuntimeAssetResources, retainRuntimeAsset } from '../../services/AssetRuntimeService.js';
import { applyRuntimeMaterialProfile, updateRuntimeMaterialTime } from '../../services/RuntimeMaterialService.js';
import { applyRuntimeTextureAtlas } from '../../services/RuntimeTextureAtlasService.js';
import { LOD_PROFILES } from '../../data/artGovernanceProfiles.js';

export const USE_EXTERNAL_MODELS = true;

function GLTFModel({ assetId, instanceId = null, kind = 'static-model', materialQuality = 'medium', materialOverrides = null, onReady = null, ...props }) {
  const generatedId = useId();
  const descriptor = useMemo(() => resolveAssetDescriptor(assetId), [assetId]);
  const { scene } = useGLTF(descriptor.url);
  const materialRuntimeRef = useRef(null);
  const atlasRuntimeRef = useRef(null);
  const modelRef = useRef(null);
  const activeLodRef = useRef(-1);
  const renderer = useThree((state) => state.gl);

  const model = useMemo(() => {
    const cloned = cloneSkeleton(scene);
    const runtime = applyRuntimeMaterialProfile(cloned, descriptor.asset, {
      quality: materialQuality,
      colorOverrides: materialOverrides,
    });
    materialRuntimeRef.current = runtime;
    return cloned;
  }, [descriptor.asset, materialOverrides, materialQuality, scene]);

  const lodGroups = useMemo(() => ({
    lod0: model.getObjectByName('LOD0'),
    lod1: model.getObjectByName('LOD1'),
    lod2: model.getObjectByName('LOD2'),
  }), [model]);
  const lodDistances = useMemo(() => {
    const profile = LOD_PROFILES[descriptor.asset?.lodProfile];
    return profile?.distances?.slice(1, 3) || null;
  }, [descriptor.asset?.lodProfile]);

  useFrame(({ camera, clock }) => {
    updateRuntimeMaterialTime(materialRuntimeRef.current?.dynamicMaterials, clock.getElapsedTime());
    if (!lodDistances || !modelRef.current || !lodGroups.lod0 || !lodGroups.lod1 || !lodGroups.lod2) return;
    const distance = camera.position.distanceTo(modelRef.current.getWorldPosition(TEMP_VECTOR));
    const next = distance < lodDistances[0] ? 0 : distance < lodDistances[1] ? 1 : 2;
    if (next === activeLodRef.current) return;
    activeLodRef.current = next;
    lodGroups.lod0.visible = next === 0;
    lodGroups.lod1.visible = next === 1;
    lodGroups.lod2.visible = next === 2;
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
    registerRuntimeAssetResources(descriptor.assetId, scene, descriptor.url);
    const releaseResidency = retainRuntimeAsset(descriptor.assetId, descriptor.url);
    return () => releaseResidency();
  }, [descriptor.assetId, descriptor.url, scene]);

  useEffect(() => {
    let meshCount = 0;
    let socketCount = 0;
    model.traverse((node) => {
      if (node.isMesh) meshCount += 1;
      if (node.name?.startsWith('SOCKET_')) socketCount += 1;
    });
    const id = instanceId || `${kind}:${descriptor.assetId}:${generatedId}`;
    const unregister = registerRuntimeAsset(id, {
      instanceId: id,
      assetId: descriptor.assetId,
      kind,
      url: descriptor.canonicalPath,
      meshCount,
      socketCount,
      materialProfile: descriptor.asset?.materialProfile || null,
      shaderProfile: materialRuntimeRef.current?.profile?.shaderId || null,
      lodProfile: descriptor.asset?.lodProfile || null,
      lodCount: [lodGroups.lod0, lodGroups.lod1, lodGroups.lod2].filter(Boolean).length,
      lodDistances,
    });
    onReady?.({ model, meshCount, socketCount, descriptor });
    return unregister;
  }, [descriptor, generatedId, instanceId, kind, lodDistances, lodGroups, model, onReady]);

  useEffect(() => {
    const runtime = materialRuntimeRef.current;
    return () => runtime?.dispose?.();
  }, [model]);

  return <primitive ref={modelRef} object={model} {...props} />;
}

export default function Model({ assetId = null, fallback = null, ...props }) {
  const resolvedUrl = resolveAssetUrl(assetId);
  if (!USE_EXTERNAL_MODELS || !resolvedUrl) {
    if (assetId) reportRuntimeWarning('ASSET_ID_NOT_REGISTERED', assetId);
    return fallback;
  }
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GLTFModel assetId={assetId} {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

export const preloadModel = preloadRuntimeAsset;
export const clearModel = clearRuntimeAsset;

const TEMP_VECTOR = new Vector3();
