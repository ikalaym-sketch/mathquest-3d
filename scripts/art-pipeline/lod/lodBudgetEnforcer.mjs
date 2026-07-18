// v0.30 真實LOD幾何預算執行器。
// LOD1／LOD2 會重建為較少頂點與三角形的輪廓代理幾何；禁止以縮放或僅切換名稱冒充減面。
import * as THREE from 'three';

export function enforceLodBudgets(scene, ratios = [1, 0.53, 0.2]) {
  const lod0 = scene.getObjectByName('LOD0');
  const lod1 = scene.getObjectByName('LOD1');
  const lod2 = scene.getObjectByName('LOD2');
  if (!lod0 || !lod1 || !lod2) return { applied: false, reason: 'lod-groups-missing' };

  scene.updateMatrixWorld(true);
  const lod0Vertices = countVertices(lod0);
  if (lod0Vertices < 12) return { applied: false, reason: 'lod0-too-small', lod0Vertices };

  const parent = lod0.parent;
  const nextLod1 = buildProxyGroup(lod0, 'LOD1', Math.max(6, even(Math.round(lod0Vertices * ratios[1]))), 4);
  const nextLod2 = buildProxyGroup(lod0, 'LOD2', Math.max(6, even(Math.round(lod0Vertices * ratios[2]))), 2);
  nextLod1.visible = false;
  nextLod2.visible = false;
  parent.remove(lod1, lod2);
  disposeGroup(lod1);
  disposeGroup(lod2);
  parent.add(nextLod1, nextLod2);

  return {
    applied: true,
    lod0Vertices,
    lod1Vertices: countVertices(nextLod1),
    lod2Vertices: countVertices(nextLod2),
  };
}

function buildProxyGroup(source, name, targetVertices, maxParts) {
  const group = new THREE.Group();
  group.name = name;
  group.userData = { lod: Number(name.slice(-1)), geometryReduction: 'proxy-prism' };

  const sourceParts = collectSourceParts(source);
  const partCount = Math.max(1, Math.min(maxParts, sourceParts.length, Math.floor(targetVertices / 6)));
  const selected = sourceParts.slice(0, partCount);
  const allocations = allocateVertices(targetVertices, partCount);

  selected.forEach((part, index) => {
    const geometry = createBoundingPrism(part.box, allocations[index]);
    const mesh = new THREE.Mesh(geometry, part.material);
    mesh.name = `${name}_proxy_${index + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}

function collectSourceParts(source) {
  const parts = [];
  source.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    const box = new THREE.Box3().setFromObject(node);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const volume = Math.max(0.0001, size.x * size.y * size.z);
    parts.push({ box, volume, material: Array.isArray(node.material) ? node.material[0] : node.material });
  });
  if (!parts.length) {
    const box = new THREE.Box3().setFromObject(source);
    parts.push({ box, volume: 1, material: new THREE.MeshStandardMaterial({ color: '#999999' }) });
  }
  return parts.sort((a, b) => b.volume - a.volume);
}

function allocateVertices(target, count) {
  const allocations = Array(count).fill(6);
  let remaining = Math.max(0, target - count * 6);
  let index = 0;
  while (remaining >= 2) {
    allocations[index % count] += 2;
    remaining -= 2;
    index += 1;
  }
  return allocations;
}

function createBoundingPrism(box, requestedVertices) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const segments = Math.max(3, Math.floor(requestedVertices / 2));
  const positions = [];
  const indices = [];
  const radiusX = Math.max(0.04, size.x / 2);
  const radiusZ = Math.max(0.04, size.z / 2);
  const bottom = center.y - Math.max(0.04, size.y / 2);
  const top = center.y + Math.max(0.04, size.y / 2);

  for (let layer = 0; layer < 2; layer += 1) {
    const y = layer === 0 ? bottom : top;
    for (let i = 0; i < segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2 + Math.PI / 4;
      positions.push(center.x + Math.cos(angle) * radiusX, y, center.z + Math.sin(angle) * radiusZ);
    }
  }
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    indices.push(i, next, segments + next, i, segments + next, segments + i);
  }
  for (let i = 1; i < segments - 1; i += 1) {
    indices.push(0, i + 1, i);
    indices.push(segments, segments + i, segments + i + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function countVertices(root) {
  let count = 0;
  root.traverse((node) => { if (node.isMesh) count += node.geometry?.attributes?.position?.count || 0; });
  return count;
}

function disposeGroup(group) {
  group.traverse((node) => { if (node.isMesh) node.geometry?.dispose?.(); });
}

function even(value) { return value % 2 === 0 ? value : value + 1; }
