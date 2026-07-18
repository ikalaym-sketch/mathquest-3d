// v0.29.1 環境 GLB LOD Runtime。
// LOD 距離由 Canonical Registry 的 lodProfile 驅動，並整合 Material／Shader、引用計數、Fallback 與遙測。
import { Suspense, useEffect, useId, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Vector3 } from 'three';
import ErrorBoundary from './ErrorBoundary.jsx';
import { registerRuntimeAsset, reportRuntimeWarning } from '../../input/runtimeAcceptance.js';
import { resolveAssetDescriptor, resolveAssetUrl } from '../../services/AssetPathService.js';
import { registerRuntimeAssetResources, retainRuntimeAsset } from '../../services/AssetRuntimeService.js';
import { applyRuntimeMaterialProfile, updateRuntimeMaterialTime } from '../../services/RuntimeMaterialService.js';
import { applyRuntimeTextureAtlas } from '../../services/RuntimeTextureAtlasService.js';
import { LOD_PROFILES } from '../../data/artGovernanceProfiles.js';

function LoadedLodEnvironmentModel({ assetId, instanceId, distances = null, materialQuality = 'medium', ...props }) {
  const generatedId = useId();
  const groupRef = useRef(null);
  const descriptor = useMemo(() => resolveAssetDescriptor(assetId), [assetId]);
  const { scene } = useGLTF(descriptor.url);
  const materialRuntimeRef = useRef(null);
  const atlasRuntimeRef = useRef(null);
  const renderer = useThree((state) => state.gl);
  const cloned = useMemo(() => {
    const next = cloneSkeleton(scene);
    materialRuntimeRef.current = applyRuntimeMaterialProfile(next, descriptor.asset, { quality: materialQuality });
    return next;
  }, [descriptor.asset, materialQuality, scene]);
  const lodGroups = useMemo(() => ({
    lod0: cloned.getObjectByName('LOD0'),
    lod1: cloned.getObjectByName('LOD1'),
    lod2: cloned.getObjectByName('LOD2'),
  }), [cloned]);
  const resolvedDistances = useMemo(() => {
    if (Array.isArray(distances) && distances.length >= 2) return distances;
    const profile = LOD_PROFILES[descriptor.asset?.lodProfile];
    return profile?.distances?.slice(1, 3) || [24, 46];
  }, [descriptor.asset?.lodProfile, distances]);
  const activeLod = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    applyRuntimeTextureAtlas(cloned, descriptor.asset, renderer, { quality: materialQuality }).then((runtime) => {
      if (cancelled) runtime.dispose();
      else atlasRuntimeRef.current = runtime;
    }).catch(() => {});
    return () => { cancelled = true; atlasRuntimeRef.current?.dispose?.(); atlasRuntimeRef.current = null; };
  }, [cloned, descriptor.asset, materialQuality, renderer]);

  useEffect(() => {
    cloned.traverse((object) => {
      if (object.name.startsWith('COLLIDER_') || object.name.startsWith('SOCKET_')) object.visible = false;
    });
    if (!lodGroups.lod0 || !lodGroups.lod1 || !lodGroups.lod2) {
      reportRuntimeWarning('ASSET_LOD_MISSING', descriptor.assetId);
    }
  }, [cloned, descriptor.assetId, lodGroups]);

  useEffect(() => {
    registerRuntimeAssetResources(descriptor.assetId, scene, descriptor.url);
    const releaseResidency = retainRuntimeAsset(descriptor.assetId, descriptor.url);
    return () => releaseResidency();
  }, [descriptor.assetId, descriptor.url, scene]);

  useEffect(() => {
    const id = instanceId || `lod-environment:${descriptor.assetId}:${generatedId}`;
    return registerRuntimeAsset(id, {
      instanceId: id,
      assetId: descriptor.assetId,
      kind: 'lod-environment',
      url: descriptor.canonicalPath,
      meshCount: countMeshes(cloned),
      socketCount: countNamedPrefix(cloned, 'SOCKET_'),
      colliderCount: countNamedPrefix(cloned, 'COLLIDER_'),
      lodCount: [lodGroups.lod0, lodGroups.lod1, lodGroups.lod2].filter(Boolean).length,
      lodProfile: descriptor.asset?.lodProfile || null,
      lodDistances: resolvedDistances,
      materialProfile: descriptor.asset?.materialProfile || null,
      shaderProfile: materialRuntimeRef.current?.profile?.shaderId || null,
    });
  }, [cloned, descriptor, generatedId, instanceId, lodGroups, resolvedDistances]);

  useFrame(({ camera, clock }) => {
    updateRuntimeMaterialTime(materialRuntimeRef.current?.dynamicMaterials, clock.getElapsedTime());
    if (!groupRef.current) return;
    const distance = camera.position.distanceTo(groupRef.current.getWorldPosition(TEMP_VECTOR));
    const next = distance < resolvedDistances[0] ? 0 : distance < resolvedDistances[1] ? 1 : 2;
    if (next === activeLod.current) return;
    activeLod.current = next;
    if (lodGroups.lod0) lodGroups.lod0.visible = next === 0;
    if (lodGroups.lod1) lodGroups.lod1.visible = next === 1;
    if (lodGroups.lod2) lodGroups.lod2.visible = next === 2;
  });

  useEffect(() => {
    const runtime = materialRuntimeRef.current;
    return () => runtime?.dispose?.();
  }, [cloned]);

  return <group ref={groupRef} name={instanceId} {...props}><primitive object={cloned} /></group>;
}

export default function LodEnvironmentModel({ assetId = null, fallback = null, ...props }) {
  if (!resolveAssetUrl(assetId)) {
    if (assetId) reportRuntimeWarning('ASSET_ID_NOT_REGISTERED', assetId);
    return fallback;
  }
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedLodEnvironmentModel assetId={assetId} {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

function countMeshes(root) {
  let count = 0;
  root.traverse((node) => { if (node.isMesh) count += 1; });
  return count;
}

function countNamedPrefix(root, prefix) {
  let count = 0;
  root.traverse((node) => { if (node.name?.startsWith(prefix)) count += 1; });
  return count;
}

const TEMP_VECTOR = new Vector3();
