// v0.25 產生八區環境 Kit GLB。
// 每個資產固定包含 LOD0/LOD1/LOD2、COLLIDER_Main 與 SOCKET_Story 節點，供 Runtime 與驗證器共用。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { REGION_ENVIRONMENT_KITS } from '../src/data/regionEnvironmentAssetCatalog.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';
import { enforceLodBudgets } from './art-pipeline/lod/lodBudgetEnforcer.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelRoot = path.join(root, 'public', 'models', 'regions', 'environment');

// 同色材質共用同一 Material，避免每個 Mesh 產生獨立 Draw Call 材質。
const MATERIAL_CACHE = new Map();
function getMaterial(color) {
  const key = new THREE.Color(color).getHexString();
  if (!MATERIAL_CACHE.has(key)) MATERIAL_CACHE.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02 }));
  return MATERIAL_CACHE.get(key);
}


const generated = [];
for (const kit of Object.values(REGION_ENVIRONMENT_KITS)) {
  const targetDir = path.join(modelRoot, kit.regionId);
  await fs.mkdir(targetDir, { recursive: true });
  for (const asset of kit.assets) {
    const scene = createEnvironmentScene(kit, asset);
    const canonicalAsset = getCanonicalAsset(asset.assetId);
    if (!canonicalAsset) throw new Error(`環境資產缺少 Canonical Registry：${asset.assetId}`);
    const target = path.join(root, 'public', canonicalAsset.canonicalPath);
    await exportGlb(scene, target, canonicalAsset);
    generated.push(path.relative(root, target).replaceAll('\\', '/'));
  }
}
console.log(JSON.stringify({ generatedCount: generated.length, files: generated }, null, 2));

function createEnvironmentScene(kit, asset) {
  const scene = new THREE.Scene();
  scene.name = `${asset.id}_scene`;
  const rootGroup = new THREE.Group();
  rootGroup.name = asset.id;
  rootGroup.userData = { assetType: 'region_environment', regionId: kit.regionId, assetId: asset.id, lodContract: 'LOD0/LOD1/LOD2' };
  scene.add(rootGroup);

  const seed = hashString(`${kit.regionId}:${asset.id}`);
  const palette = [kit.accent, kit.shore, mixColor(kit.accent, '#ffffff', 0.35), mixColor(kit.accent, '#2d3340', 0.36)];
  const lod0 = createLodGroup('LOD0', asset, palette, seed, 1, 7);
  const lod1 = createLodGroup('LOD1', asset, palette, seed + 11, 0.96, 4);
  const lod2 = createLodGroup('LOD2', asset, palette, seed + 23, 0.9, 1);
  lod0.visible = true;
  lod1.visible = false;
  lod2.visible = false;
  rootGroup.add(lod0, lod1, lod2);

  const collider = new THREE.Object3D();
  collider.name = 'COLLIDER_Main';
  collider.userData = { shape: 'cuboid', halfExtents: asset.collider || [0, 0, 0], solid: Boolean(asset.solid) };
  rootGroup.add(collider);
  const storySocket = new THREE.Object3D();
  storySocket.name = 'SOCKET_Story';
  storySocket.position.set(0, 1.15, 0);
  storySocket.userData = { socketType: 'story', assetId: asset.id };
  rootGroup.add(storySocket);
  enforceLodBudgets(scene, [1, 0.53, 0.2]);
  return scene;
}

function createLodGroup(name, asset, palette, seed, scale, detailCount) {
  const group = new THREE.Group();
  group.name = name;
  group.userData = { lod: Number(name.slice(-1)), detailCount };
  const random = seededRandom(seed);
  const kind = detectKind(asset.id);
  const builders = {
    tree: buildTree,
    lamp: buildLamp,
    fence: buildFence,
    arch: buildArch,
    crate: buildCrate,
    cart: buildCart,
    crystal: buildCrystal,
    rock: buildRock,
    cactus: buildCactus,
    mushroom: buildMushroom,
    gear: buildGear,
    pipe: buildPipe,
    reeds: buildReeds,
    stall: buildStall,
    obelisk: buildObelisk,
    default: buildCluster,
  };
  (builders[kind] || builders.default)(group, palette, random, detailCount);
  group.scale.setScalar(scale);
  group.traverse((object) => {
    if (object.isMesh) {
      object.name ||= `${asset.id}_${name}_mesh`;
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return group;
}

function detectKind(id) {
  if (/orchard|pine/.test(id)) return 'tree';
  if (/lamp|lantern/.test(id)) return 'lamp';
  if (/fence|barrier|irrigation/.test(id)) return 'fence';
  if (/arch/.test(id)) return 'arch';
  if (/crate|supply|camp/.test(id)) return 'crate';
  if (/cart/.test(id)) return 'cart';
  if (/crystal|prism|frozen_marker/.test(id)) return 'crystal';
  if (/rock|strata|stalagmite|fairy_stone|snow_bank/.test(id)) return 'rock';
  if (/cactus|scarecrow/.test(id)) return 'cactus';
  if (/mushroom|spore/.test(id)) return 'mushroom';
  if (/gear|clock|console/.test(id)) return 'gear';
  if (/pipe/.test(id)) return 'pipe';
  if (/reed|grass|lily/.test(id)) return 'reeds';
  if (/stall|study/.test(id)) return 'stall';
  if (/obelisk/.test(id)) return 'obelisk';
  return 'default';
}

function addMesh(group, geometry, color, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], name = 'part') {
  const mesh = new THREE.Mesh(geometry, getMaterial(color));
  mesh.name = name;
  mesh.position.fromArray(position);
  mesh.rotation.fromArray(rotation);
  mesh.scale.fromArray(scale);
  group.add(mesh);
}

function buildTree(group, palette, random, count) {
  addMesh(group, new THREE.CylinderGeometry(0.22, 0.34, 2.4, 8), palette[3], [0, 1.2, 0], [0, 0, 0], [1, 1, 1], 'trunk');
  for (let i = 0; i < Math.max(1, Math.ceil(count / 2)); i += 1) addMesh(group, new THREE.ConeGeometry(0.9 - i * 0.08, 1.5, 8), palette[i % 3], [(i - 1) * 0.3, 2.1 + i * 0.45, 0], [0, i * 0.5, 0], [1, 1, 1], `canopy_${i}`);
}
function buildLamp(group, palette, random, count) {
  addMesh(group, new THREE.CylinderGeometry(0.08, 0.12, 2.2, 8), palette[3], [0, 1.1, 0], [0, 0, 0], [1, 1, 1], 'post');
  addMesh(group, new THREE.OctahedronGeometry(0.34, 0), palette[2], [0, 2.35, 0], [0, 0, Math.PI / 4], [1, 1, 1], 'light');
  if (count > 2) addMesh(group, new THREE.TorusGeometry(0.28, 0.06, 8, 16), palette[1], [0, 2.35, 0], [Math.PI / 2, 0, 0], [1, 1, 1], 'ring');
}
function buildFence(group, palette, random, count) {
  addMesh(group, new THREE.BoxGeometry(3.2, 0.18, 0.18), palette[1], [0, 0.8, 0], [0, 0, 0], [1, 1, 1], 'rail');
  addMesh(group, new THREE.BoxGeometry(3.2, 0.15, 0.15), palette[1], [0, 1.25, 0], [0, 0, 0], [1, 1, 1], 'rail_upper');
  for (const x of [-1.5, 0, 1.5]) addMesh(group, new THREE.BoxGeometry(0.18, 1.65, 0.18), palette[3], [x, 0.82, 0], [0, 0, 0], [1, 1, 1], `post_${x}`);
}
function buildArch(group, palette, random, count) {
  for (const x of [-1.35, 1.35]) addMesh(group, new THREE.BoxGeometry(0.28, 2.8, 0.36), palette[3], [x, 1.4, 0], [0, 0, 0], [1, 1, 1], `pillar_${x}`);
  addMesh(group, new THREE.TorusGeometry(1.35, 0.18, 8, 24, Math.PI), palette[0], [0, 2.75, 0], [0, 0, 0], [1, 1, 1], 'arch');
}
function buildCrate(group, palette, random, count) {
  const boxes = Math.max(1, Math.min(4, Math.ceil(count / 2)));
  for (let i = 0; i < boxes; i += 1) addMesh(group, new THREE.BoxGeometry(1.05, 0.85, 0.9), i % 2 ? palette[1] : palette[3], [(i % 2) * 0.9 - 0.4, 0.42 + Math.floor(i / 2) * 0.78, (i % 3) * 0.18], [0, i * 0.12, 0], [1, 1, 1], `crate_${i}`);
}
function buildCart(group, palette, random, count) {
  addMesh(group, new THREE.BoxGeometry(2.5, 0.75, 1.35), palette[1], [0, 0.82, 0], [0, 0, 0], [1, 1, 1], 'cart_body');
  for (const x of [-0.85, 0.85]) addMesh(group, new THREE.TorusGeometry(0.48, 0.12, 8, 18), palette[3], [x, 0.48, 0.72], [0, Math.PI / 2, 0], [1, 1, 1], `wheel_${x}`);
  if (count > 3) addMesh(group, new THREE.CylinderGeometry(0.7, 0.8, 1.4, 10), palette[2], [0, 1.65, 0], [0, 0, Math.PI / 2], [1, 1, 1], 'load');
}
function buildCrystal(group, palette, random, count) {
  for (let i = 0; i < Math.max(1, Math.min(5, count)); i += 1) {
    const angle = (i / Math.max(1, count)) * Math.PI * 2;
    addMesh(group, new THREE.OctahedronGeometry(0.45 + (i % 3) * 0.16, 0), palette[i % 3], [Math.cos(angle) * 0.62, 0.55 + (i % 2) * 0.35, Math.sin(angle) * 0.62], [0, angle, 0.12 * i], [0.75, 1.45, 0.75], `crystal_${i}`);
  }
}
function buildRock(group, palette, random, count) {
  for (let i = 0; i < Math.max(1, Math.min(5, count)); i += 1) addMesh(group, new THREE.DodecahedronGeometry(0.55 + (i % 3) * 0.2, 0), i % 2 ? palette[1] : palette[3], [(i - 2) * 0.42, 0.48 + (i % 2) * 0.28, (i % 3 - 1) * 0.28], [i * 0.21, i * 0.47, 0], [1, 0.85 + random() * 0.4, 1], `rock_${i}`);
}
function buildCactus(group, palette, random, count) {
  addMesh(group, new THREE.CylinderGeometry(0.24, 0.3, 2.5, 8), palette[0], [0, 1.25, 0], [0, 0, 0], [1, 1, 1], 'stem');
  if (count > 2) for (const side of [-1, 1]) addMesh(group, new THREE.CylinderGeometry(0.11, 0.14, 0.9, 7), palette[0], [side * 0.38, 1.35, 0], [0, 0, Math.PI / 2], [1, 1, 1], `arm_${side}`);
}
function buildMushroom(group, palette, random, count) {
  const mushrooms = Math.max(1, Math.min(4, Math.ceil(count / 2)));
  for (let i = 0; i < mushrooms; i += 1) {
    const x = (i - (mushrooms - 1) / 2) * 0.72;
    addMesh(group, new THREE.CylinderGeometry(0.12, 0.18, 1.1 + i * 0.18, 8), palette[2], [x, 0.55 + i * 0.09, 0], [0, 0, 0], [1, 1, 1], `stem_${i}`);
    addMesh(group, new THREE.SphereGeometry(0.52 + i * 0.08, 12, 8), i % 2 ? palette[0] : palette[1], [x, 1.15 + i * 0.18, 0], [0, 0, 0], [1, 0.45, 1], `cap_${i}`);
  }
}
function buildGear(group, palette, random, count) {
  addMesh(group, new THREE.TorusGeometry(0.9, 0.22, 10, 20), palette[0], [0, 1.1, 0], [0, Math.PI / 2, 0], [1, 1, 1], 'gear_ring');
  const teeth = Math.max(4, count + 3);
  for (let i = 0; i < teeth; i += 1) {
    const angle = (i / teeth) * Math.PI * 2;
    addMesh(group, new THREE.BoxGeometry(0.28, 0.28, 0.38), palette[1], [0, 1.1 + Math.sin(angle) * 1.15, Math.cos(angle) * 1.15], [angle, 0, 0], [1, 1, 1], `tooth_${i}`);
  }
  addMesh(group, new THREE.CylinderGeometry(0.24, 0.24, 0.8, 10), palette[3], [0, 1.1, 0], [0, 0, Math.PI / 2], [1, 1, 1], 'axle');
}
function buildPipe(group, palette, random, count) {
  addMesh(group, new THREE.CylinderGeometry(0.18, 0.22, 2.4, 8), palette[3], [0, 1.2, 0], [0, 0, 0], [1, 1, 1], 'pipe_main');
  if (count > 2) addMesh(group, new THREE.TorusGeometry(0.45, 0.16, 8, 16, Math.PI / 2), palette[1], [0.45, 2.15, 0], [0, 0, Math.PI / 2], [1, 1, 1], 'pipe_bend');
  if (count > 4) addMesh(group, new THREE.CylinderGeometry(0.1, 0.12, 1.2, 8), palette[0], [0.85, 2.15, 0], [0, 0, Math.PI / 2], [1, 1, 1], 'pipe_outlet');
}
function buildReeds(group, palette, random, count) {
  const reeds = Math.max(1, Math.min(7, count));
  for (let i = 0; i < reeds; i += 1) {
    const angle = (i / reeds) * Math.PI * 2;
    addMesh(group, new THREE.CylinderGeometry(0.025, 0.04, 0.9 + (i % 3) * 0.18, 6), palette[0], [Math.cos(angle) * 0.5, 0.5, Math.sin(angle) * 0.5], [0, 0, 0], [1, 1, 1], `reed_${i}`);
  }
}
function buildStall(group, palette, random, count) {
  addMesh(group, new THREE.BoxGeometry(2.6, 0.25, 1.5), palette[3], [0, 0.75, 0], [0, 0, 0], [1, 1, 1], 'table');
  for (const x of [-1.1, 1.1]) addMesh(group, new THREE.BoxGeometry(0.16, 2.2, 0.16), palette[3], [x, 1.1, 0], [0, 0, 0], [1, 1, 1], `post_${x}`);
  addMesh(group, new THREE.BoxGeometry(3, 0.2, 1.8), palette[0], [0, 2.2, 0], [0, 0, 0], [1, 1, 1], 'canopy');
  if (count > 3) buildCrate(group, palette, random, 2);
}
function buildObelisk(group, palette, random, count) {
  addMesh(group, new THREE.CylinderGeometry(0.48, 0.72, 3.4, 6), palette[3], [0, 1.7, 0], [0, 0, 0], [1, 1, 1], 'obelisk');
  addMesh(group, new THREE.OctahedronGeometry(0.5, 0), palette[2], [0, 3.65, 0], [0, 0, Math.PI / 4], [1, 1, 1], 'emblem');
}
function buildCluster(group, palette, random, count) {
  for (let i = 0; i < Math.max(1, Math.min(6, count)); i += 1) addMesh(group, new THREE.IcosahedronGeometry(0.35 + random() * 0.35, 0), palette[i % palette.length], [(random() - 0.5) * 1.8, 0.4 + random() * 0.7, (random() - 0.5) * 1.8], [random(), random(), random()], [1, 1, 1], `cluster_${i}`);
}

function mixColor(a, b, ratio) {
  const ca = new THREE.Color(a); const cb = new THREE.Color(b); ca.lerp(cb, ratio); return `#${ca.getHexString()}`;
}
function hashString(value) { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function seededRandom(initial) { let seed = initial >>> 0; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
async function exportGlb(scene, target, asset) {
  return exportCanonicalGlb({ scene, target, asset, onlyVisible: false });
}
