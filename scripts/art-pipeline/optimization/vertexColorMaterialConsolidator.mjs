// v0.29.1 Vertex Color Material Consolidator。
// 將無 Texture 的純色 Material 烘焙到 Geometry Color Attribute，並在單一 GLB 內共用少量 Standard Material。
// 此為正式可重複維護的 Optimizer；遇到 Texture 或混合透明群組時會安全跳過，不破壞未支援資產。
import * as THREE from 'three';

const TEXTURE_PROPERTIES = Object.freeze([
  'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap',
  'envMap', 'lightMap', 'metalnessMap', 'normalMap', 'roughnessMap', 'specularMap',
]);

export function consolidateVertexColorMaterials(scene) {
  const meshes = [];
  const sourceMaterials = new Set();
  scene.traverse((node) => {
    if (!node.isMesh || !node.material || !node.geometry) return;
    meshes.push(node);
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => sourceMaterials.add(material));
  });

  if ([...sourceMaterials].some(hasTextureDependency)) {
    return { optimized: false, reason: 'textured-material-present', beforeMaterials: sourceMaterials.size, afterMaterials: sourceMaterials.size, meshes: meshes.length };
  }
  if (meshes.some(hasMixedTransparencyGroups)) {
    return { optimized: false, reason: 'mixed-transparency-groups', beforeMaterials: sourceMaterials.size, afterMaterials: sourceMaterials.size, meshes: meshes.length };
  }

  const sharedMaterials = new Map();
  for (const mesh of meshes) {
    const sourceList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const sourceMaterial = sourceList[0];
    const transparent = isTransparent(sourceMaterial);
    const side = sourceMaterial?.side ?? THREE.FrontSide;
    const materialKey = `${transparent ? 'transparent' : 'opaque'}:${side}`;
    const sharedMaterial = getSharedMaterial(sharedMaterials, materialKey, sourceMaterial, transparent, side);

    const geometry = bakeGeometryColors(mesh.geometry, sourceList);
    mesh.geometry = geometry;
    mesh.material = sharedMaterial;
    mesh.userData = { ...mesh.userData, canonicalVertexColorMaterial: true };
  }

  return {
    optimized: true,
    reason: 'vertex-color-consolidated',
    beforeMaterials: sourceMaterials.size,
    afterMaterials: sharedMaterials.size,
    meshes: meshes.length,
  };
}

function bakeGeometryColors(sourceGeometry, materials) {
  const usesMaterialGroups = materials.length > 1 && sourceGeometry.groups?.length > 0;
  const geometry = usesMaterialGroups && sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
  const vertexCount = geometry.attributes.position?.count || 0;
  const existingColors = geometry.attributes.color || null;
  const colors = new Uint8Array(vertexCount * 3);
  colors.fill(255);

  if (usesMaterialGroups) {
    const groups = geometry.groups?.length ? geometry.groups : [{ start: 0, count: vertexCount, materialIndex: 0 }];
    for (const group of groups) {
      const material = materials[group.materialIndex] || materials[0];
      writeColorRange(colors, group.start, group.count, resolveBakeColor(material), existingColors, material?.vertexColors === true);
    }
    geometry.clearGroups();
  } else {
    const material = materials[0];
    writeColorRange(colors, 0, vertexCount, resolveBakeColor(material), existingColors, material?.vertexColors === true);
    geometry.clearGroups();
  }

  geometry.setAttribute('color', new THREE.Uint8BufferAttribute(colors, 3, true));
  return geometry;
}

function getSharedMaterial(cache, key, source, transparent, side) {
  if (cache.has(key)) return cache.get(key);
  const material = new THREE.MeshStandardMaterial({
    name: `CanonicalVertexColor:${key}`,
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.02,
    transparent,
    opacity: transparent ? Math.max(0.001, Math.min(1, source?.opacity ?? 1)) : 1,
    alphaTest: transparent ? source?.alphaTest || 0 : 0,
    depthWrite: !transparent,
    side,
  });
  cache.set(key, material);
  return material;
}

function resolveBakeColor(material) {
  const color = material?.color?.clone?.() || new THREE.Color('#ffffff');
  if (material?.emissive) {
    const strength = Math.max(0, Number(material.emissiveIntensity) || 0) * 0.25;
    color.r = Math.min(1, color.r + material.emissive.r * strength);
    color.g = Math.min(1, color.g + material.emissive.g * strength);
    color.b = Math.min(1, color.b + material.emissive.b * strength);
  }
  return color;
}

function writeColorRange(buffer, start, count, color, existingColors = null, preserveVertexColors = false) {
  const end = Math.min(buffer.length / 3, start + count);
  for (let index = Math.max(0, start); index < end; index += 1) {
    const offset = index * 3;
    const existingR = preserveVertexColors && existingColors ? existingColors.getX(index) : 1;
    const existingG = preserveVertexColors && existingColors ? existingColors.getY(index) : 1;
    const existingB = preserveVertexColors && existingColors ? existingColors.getZ(index) : 1;
    buffer[offset] = Math.round(Math.max(0, Math.min(1, existingR * color.r)) * 255);
    buffer[offset + 1] = Math.round(Math.max(0, Math.min(1, existingG * color.g)) * 255);
    buffer[offset + 2] = Math.round(Math.max(0, Math.min(1, existingB * color.b)) * 255);
  }
}

function hasTextureDependency(material) {
  return TEXTURE_PROPERTIES.some((property) => Boolean(material?.[property]));
}

function hasMixedTransparencyGroups(mesh) {
  if (!Array.isArray(mesh.material)) return false;
  const classes = new Set(mesh.material.filter(Boolean).map((material) => isTransparent(material)));
  return classes.size > 1;
}

function isTransparent(material) {
  return Boolean(material?.transparent || (material?.opacity ?? 1) < 0.999 || (material?.alphaTest ?? 0) > 0);
}
