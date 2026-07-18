// v0.33 區域擴充 Runtime：Canonical 結構／環境／生物、三種動態效果、Decal 與 Instancing。
import { Decal, Sparkles } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Matrix4, Quaternion, Vector3 } from 'three';
import AnimatedProductionModel from '../3D/AnimatedProductionModel.jsx';
import LodEnvironmentModel from '../3D/LodEnvironmentModel.jsx';
import { V033_REGION_DYNAMIC_EFFECT_PROFILES, getV033RegionAssets } from '../../data/regionCreatureV033Catalog.js';
import { activateRegionV033Assets, releaseRegionV033Assets } from '../../services/RegionExpansionAssetService.js';

export default function RegionExpansionLayer({ regionId, layout }) {
  const assets = useMemo(() => getV033RegionAssets(regionId), [regionId]);
  const structures = assets.filter((asset) => asset.purpose === 'region-structure-module');
  const environment = assets.filter((asset) => asset.purpose === 'region-environment-module');
  const creatures = assets.filter((asset) => asset.purpose === 'region-ambient-creature');

  useEffect(() => {
    activateRegionV033Assets(regionId);
    return () => releaseRegionV033Assets(regionId);
  }, [regionId]);

  if (!layout || assets.length === 0) return null;
  return (
    <group name={`region-v033-expansion-${regionId}`}>
      {structures.map((asset, index) => {
        const area = layout.subareas[index % layout.subareas.length];
        const offset = index === 0 ? [4, -3] : index === 1 ? [-4, 3] : [3, 4];
        return (
          <LodEnvironmentModel
            key={asset.assetId}
            assetId={asset.assetId}
            instanceId={`${regionId}-v033-structure-${index}`}
            position={[area.center[0] + offset[0], area.elevation, area.center[1] + offset[1]]}
            rotation={[0, index * 0.7, 0]}
            scale={asset.tier === 'hero' ? 0.85 : 0.72}
          />
        );
      })}
      {environment.map((asset, index) => {
        const area = layout.subareas[index % layout.subareas.length];
        const angle = index * 1.37 + area.center[0] * 0.02;
        return (
          <LodEnvironmentModel
            key={asset.assetId}
            assetId={asset.assetId}
            instanceId={`${regionId}-v033-environment-${index}`}
            position={[area.center[0] + Math.cos(angle) * 7, area.elevation + 0.04, area.center[1] + Math.sin(angle) * 7]}
            rotation={[0, angle, 0]}
            scale={asset.role === 'ground-decal' ? 1.2 : 0.82}
          />
        );
      })}
      {creatures.map((asset, index) => {
        const area = layout.subareas[index % layout.subareas.length];
        return (
          <AnimatedProductionModel
            key={asset.assetId}
            assetId={asset.assetId}
            instanceId={`${regionId}-ambient-creature-${index}`}
            kind="region-ambient-creature"
            clipName="Idle"
            position={[area.center[0] - 5 + index * 2.4, area.elevation + 0.05, area.center[1] + 5 - index * 1.7]}
            rotation={[0, index * 0.9, 0]}
            scale={0.62}
          />
        );
      })}
      <RegionDynamicEffects regionId={regionId} layout={layout} />
      <RegionInstancedDetails regionId={regionId} layout={layout} />
      <RegionGroundDecal regionId={regionId} layout={layout} />
    </group>
  );
}

function RegionDynamicEffects({ regionId, layout }) {
  const profiles = V033_REGION_DYNAMIC_EFFECT_PROFILES[regionId] || [];
  return profiles.map((profile, index) => {
    const area = layout.subareas[(index + 1) % layout.subareas.length];
    return <DynamicEffect key={profile.id} profile={profile} position={[area.center[0], area.elevation + 1.2, area.center[1]]} index={index} />;
  });
}

function DynamicEffect({ profile, position, index }) {
  const ref = useRef(null);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (0.25 + index * 0.12);
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * (0.8 + index * 0.2)) * 0.22;
  });
  if (profile.kind === 'particles' || profile.kind === 'orbit') {
    return <group ref={ref} position={position} userData={{ shaderProfile: profile.shaderProfile }}><Sparkles count={18 + index * 7} scale={[5, 2.5, 5]} size={3} speed={0.35 + index * 0.1} color={profile.color} /></group>;
  }
  if (profile.kind === 'beam' || profile.kind === 'pulse') {
    return <mesh ref={ref} position={position} userData={{ shaderProfile: profile.shaderProfile }}><cylinderGeometry args={[0.08 + index * 0.04, 0.35, 4 + index, 10]} /><meshBasicMaterial color={profile.color} transparent opacity={0.36} depthWrite={false} /></mesh>;
  }
  return <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]} userData={{ shaderProfile: profile.shaderProfile }}><torusGeometry args={[1.2 + index * 0.4, 0.08, 8, 28]} /><meshBasicMaterial color={profile.color} transparent opacity={0.55} depthWrite={false} /></mesh>;
}

function RegionInstancedDetails({ regionId, layout }) {
  const ref = useRef(null);
  const count = 18;
  const color = layout.palette?.accent || '#ffffff';
  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    for (let index = 0; index < count; index += 1) {
      const area = layout.subareas[index % layout.subareas.length];
      const angle = index * 2.399;
      const radius = 9 + (index % 4) * 2;
      const position = new Vector3(area.center[0] + Math.cos(angle) * radius, area.elevation + 0.35, area.center[1] + Math.sin(angle) * radius);
      scale.setScalar(0.45 + (index % 3) * 0.12);
      matrix.compose(position, quaternion.setFromAxisAngle(new Vector3(0, 1, 0), angle), scale);
      ref.current.setMatrixAt(index, matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [layout]);
  return (
    <instancedMesh ref={ref} args={[null, null, count]} name={`${regionId}-instanced-region-detail`} frustumCulled>
      <coneGeometry args={[0.35, 1.2, 6]} />
      <meshStandardMaterial color={new Color(color)} roughness={0.9} />
    </instancedMesh>
  );
}

function RegionGroundDecal({ regionId, layout }) {
  const center = layout.subareas[0];
  return (
    <mesh position={[center.center[0], center.elevation - 0.05, center.center[1]]} rotation={[-Math.PI / 2, 0, 0]} name={`${regionId}-terrain-decal-host`}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      <Decal position={[0, 0, 0.01]} rotation={[0, 0, 0]} scale={[4.2, 4.2, 1]}>
        <meshBasicMaterial color={layout.palette.accent} transparent opacity={0.18} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
      </Decal>
    </mesh>
  );
}
