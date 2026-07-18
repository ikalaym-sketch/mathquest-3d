// 生產管線共用材質解析器；相同 Profile／顏色只建立一次材質，避免每個 Mesh 產生獨立 Material。
import * as THREE from 'three';

const cache = new Map();

export function resolvePipelineMaterial({ profileId = 'toon', color = '#cccccc', roughness = 0.82, metalness = 0.02 }) {
  const key = `${profileId}:${color}:${roughness}:${metalness}`;
  if (cache.has(key)) return cache.get(key);
  // GLTFExporter對MeshStandardMaterial支援最完整；toon視覺改由flatShading與高粗糙度表現，避免匯出時遺失材質屬性。
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: profileId === 'toon' ? Math.max(0.88, roughness) : roughness,
    metalness: profileId === 'toon' ? 0 : metalness,
    flatShading: profileId === 'toon',
  });
  material.name = key;
  cache.set(key, material);
  return material;
}
