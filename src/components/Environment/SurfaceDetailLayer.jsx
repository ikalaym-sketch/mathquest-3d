import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { buildPlacementExclusions, createSeededRandom, isPointExcluded } from '../../utils/placementGeometry.js';

const SCENE_BOUNDS = {
  village: { minX: -44, maxX: 44, minZ: -40, maxZ: 40 },
  farm: { minX: -40, maxX: 40, minZ: -36, maxZ: 36 },
  forest: { minX: -51, maxX: 51, minZ: -49, maxZ: 49 },
};

export default function SurfaceDetailLayer({ sceneId, layout, density = 1, weather = 'sunny' }) {
  const details = useMemo(() => buildDetails(sceneId, layout, density), [sceneId, layout, density]);
  const rainy = weather === 'lightRain';

  return (
    <group name={`surface-detail-${sceneId}`}>
      <Instances limit={details.grass.length + 1} range={details.grass.length} frustumCulled>
        <coneGeometry args={[0.11, 0.62, 4]} />
        <meshStandardMaterial color="#438f46" roughness={1} />
        {details.grass.map((item) => (
          <Instance key={item.id} position={[item.x, item.y, item.z]} rotation={[0, item.rotation, 0]} scale={item.scale} />
        ))}
      </Instances>

      <Instances limit={details.flowers.length + 1} range={details.flowers.length} frustumCulled>
        <dodecahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#ffe19a" roughness={0.9} vertexColors />
        {details.flowers.map((item) => (
          <Instance key={item.id} position={[item.x, item.y, item.z]} rotation={[0, item.rotation, 0]} scale={item.scale} color={item.color} />
        ))}
      </Instances>

      <Instances limit={details.leaves.length + 1} range={details.leaves.length} frustumCulled>
        <circleGeometry args={[0.18, 7]} />
        <meshStandardMaterial color="#bd7d42" roughness={1} side={2} vertexColors />
        {details.leaves.map((item) => (
          <Instance key={item.id} position={[item.x, item.y, item.z]} rotation={[-Math.PI / 2, 0, item.rotation]} scale={item.scale} color={item.color} />
        ))}
      </Instances>

      {rainy && details.puddles.map((item) => (
        <mesh key={item.id} position={[item.x, 0.018, item.z]} rotation={[-Math.PI / 2, 0, item.rotation]} scale={[item.scaleX, item.scaleZ, 1]} receiveShadow>
          <circleGeometry args={[0.58, 18]} />
          <meshPhysicalMaterial color="#7db8ca" roughness={0.12} metalness={0.05} transparent opacity={0.34} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function buildDetails(sceneId, layout, density) {
  const bounds = layout?.bounds || SCENE_BOUNDS[sceneId] || SCENE_BOUNDS.village;
  const exclusions = buildPlacementExclusions({ layout, sceneId });
  const random = createSeededRandom(`${sceneId}:${layout?.id || 'layout'}:surface-v1`);
  const areaScale = Math.max(0.45, Math.min(1.35, density));
  const counts = {
    grass: Math.round((sceneId === 'forest' ? 900 : 620) * areaScale),
    flowers: Math.round((sceneId === 'forest' ? 150 : 110) * areaScale),
    leaves: Math.round((sceneId === 'forest' ? 250 : 100) * areaScale),
    puddles: sceneId === 'forest' ? 8 : 6,
  };

  const grass = samplePoints(counts.grass, random, bounds, exclusions, 0.18, (index, x, z) => ({
    id: `g_${index}`, x, z, y: 0.29, rotation: random() * Math.PI * 2, scale: 0.55 + random() * 0.55,
  }));
  const flowerPalette = sceneId === 'forest'
    ? ['#ffe0e9', '#e1d4ff', '#d8f4ff', '#fff0a6']
    : ['#ffd2df', '#fff0a6', '#d9e7ff', '#ffffff'];
  const flowers = samplePoints(counts.flowers, random, bounds, exclusions, 0.5, (index, x, z) => ({
    id: `f_${index}`, x, z, y: 0.22, rotation: random() * Math.PI * 2, scale: 0.65 + random() * 0.65, color: flowerPalette[index % flowerPalette.length],
  }));
  const leafPalette = sceneId === 'forest' ? ['#b96e35', '#d29b55', '#8f6c37'] : ['#a56f39', '#d2a155', '#8c7041'];
  const leaves = samplePoints(counts.leaves, random, bounds, exclusions, 0.1, (index, x, z) => ({
    id: `l_${index}`, x, z, y: 0.025, rotation: random() * Math.PI * 2, scale: 0.45 + random() * 0.7, color: leafPalette[index % leafPalette.length],
  }));
  const puddles = samplePoints(counts.puddles, random, bounds, exclusions, 0.75, (index, x, z) => ({
    id: `p_${index}`, x, z, rotation: random() * Math.PI, scaleX: 0.7 + random() * 1.1, scaleZ: 0.55 + random() * 0.75,
  }));

  return { grass, flowers, leaves, puddles };
}

function samplePoints(targetCount, random, bounds, exclusions, margin, factory) {
  const result = [];
  const maxAttempts = Math.max(targetCount * 14, 100);
  let attempts = 0;
  while (result.length < targetCount && attempts < maxAttempts) {
    attempts += 1;
    const x = bounds.minX + random() * (bounds.maxX - bounds.minX);
    const z = bounds.minZ + random() * (bounds.maxZ - bounds.minZ);
    if (isPointExcluded({ x, z }, exclusions, margin)) continue;
    result.push(factory(result.length, x, z));
  }
  return result;
}
