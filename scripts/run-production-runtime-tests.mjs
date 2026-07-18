// 全量 Runtime 資產驗證：Canonical GLB、Registry、GLB Header、節點、動畫、LOD、材質與Atlas契約。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProductionRuntimeContracts } from '../src/services/ProductionRuntimeValidationService.js';
import { CANONICAL_ASSET_REGISTRY, CANONICAL_ASSET_COUNT } from '../src/data/productionAssetCatalog.js';
import { MATERIAL_LIMIT_BY_TIER } from '../src/data/artGovernanceProfiles.js';
import { REGION_STRUCTURE_CATALOG } from '../src/data/physicalObjectCatalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const contract = validateProductionRuntimeContracts();
errors.push(...contract.errors);
warnings.push(...contract.warnings);
const files = [];

for (const asset of Object.values(CANONICAL_ASSET_REGISTRY)) {
  const glb = inspectAsset(asset);
  if (!glb) continue;
  const requiredClips = asset.requiredClips || asset.clips || [];
  const requiredNodes = asset.requiredNodes || [];
  assertClips(asset.assetId, glb.json, requiredClips);
  assertNodes(asset.assetId, glb.json, requiredNodes);

  const isAnimatedCharacterBody = asset.category === 'character' && (asset.requiredClips?.length || asset.clips?.length);
  if (isAnimatedCharacterBody && !glb.json.skins?.length) errors.push(`${asset.assetId}: animated character body GLB has no skin.`);
  if (asset.category === 'region-structure') validateStructureAsset(asset, glb.json);
  if (asset.category === 'monster' || asset.category === 'elite' || asset.category === 'boss') assertNodes(asset.assetId, glb.json, ['ActorRoot', 'Body', 'Head', 'AttackPivot']);

  const materialLimit = MATERIAL_LIMIT_BY_TIER[asset.tier] || null;
  const materialCount = glb.json.materials?.length || 0;
  if (materialLimit && materialCount > materialLimit) {
    const message = `${asset.assetId}: materials ${materialCount} exceed ${asset.tier} limit ${materialLimit}.`;
    if (asset.artStatus === 'keep') errors.push(message); else warnings.push(message);
  }

  const imageCount = glb.json.images?.length || 0;
  const textureCount = glb.json.textures?.length || 0;
  if (imageCount === 0 && ['hero', 'gameplay'].includes(asset.tier) && !asset.materialProfile) warnings.push(`${asset.assetId}: no embedded texture and no Material Profile.`);

  const lod = inspectLod(glb.json);
  if (asset.lodProfile && ['environment-standard', 'environment-light', 'building-hero'].includes(asset.lodProfile)) validateEnvironmentLod(asset.assetId, lod);
}

if (files.length !== CANONICAL_ASSET_COUNT) errors.push(`Expected ${CANONICAL_ASSET_COUNT} physical GLB files, inspected ${files.length}.`);

const totals = files.reduce((sum, item) => ({
  bytes: sum.bytes + item.bytes,
  vertices: sum.vertices + item.vertices,
  materials: sum.materials + item.materials,
  animations: sum.animations + item.animations.length,
  skins: sum.skins + item.skins,
  images: sum.images + item.images,
  textures: sum.textures + item.textures,
}), { bytes: 0, vertices: 0, materials: 0, animations: 0, skins: 0, images: 0, textures: 0 });

const report = {
  generatedAt: new Date().toISOString(),
  version: '0.35.0-canonical-800',
  ok: errors.length === 0,
  contract: contract.summary,
  assetFiles: files.length,
  totals,
  byCategory: countBy(files, 'category'),
  byTier: countBy(files, 'tier'),
  byArtStatus: countBy(files, 'artStatus'),
  lodSummary: summarizeLod(files),
  errors,
  warnings,
  files: process.argv.includes('--verbose') ? files : undefined,
};

if (process.argv.includes('--write-report')) fs.writeFileSync(path.join(root, 'docs', 'PRODUCTION_RUNTIME_VALIDATION.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

function inspectAsset(asset) {
  const filepath = path.join(root, 'public', asset.canonicalPath);
  if (!fs.existsSync(filepath)) {
    errors.push(`${asset.assetId}: file missing at ${asset.canonicalPath}.`);
    return null;
  }
  const buffer = fs.readFileSync(filepath);
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') {
    errors.push(`${asset.assetId}: invalid GLB header.`);
    return null;
  }
  let json;
  try { json = parseGlbJson(buffer); }
  catch (error) {
    errors.push(`${asset.assetId}: cannot parse GLB JSON: ${String(error)}.`);
    return null;
  }
  const lod = inspectLod(json);
  const item = {
    assetId: asset.assetId,
    category: asset.category,
    tier: asset.tier,
    artStatus: asset.artStatus,
    path: asset.canonicalPath,
    bytes: buffer.length,
    nodes: json.nodes?.length || 0,
    meshes: json.meshes?.length || 0,
    vertices: countVertices(json),
    materials: json.materials?.length || 0,
    skins: json.skins?.length || 0,
    images: json.images?.length || 0,
    textures: json.textures?.length || 0,
    animations: json.animations?.map((entry) => entry.name) || [],
    lod,
  };
  files.push(item);
  return { buffer, json };
}

function validateStructureAsset(asset, json) {
  const type = asset.assetId.split(':').pop();
  const catalog = REGION_STRUCTURE_CATALOG[type];
  if (!catalog) return;
  const actualSocketCount = nodeNames(json).filter((name) => name.startsWith('SOCKET_')).length;
  if (actualSocketCount < (catalog.sockets?.length || 0)) errors.push(`${asset.assetId}: expected ${catalog.sockets.length} sockets, got ${actualSocketCount}.`);
  if ((json.meshes?.length || 0) < (catalog.parts?.length || 0)) errors.push(`${asset.assetId}: expected at least ${catalog.parts.length} meshes.`);
}

function validateEnvironmentLod(assetId, lod) {
  if (!(lod.lod0 > 0 && lod.lod1 > 0 && lod.lod2 > 0)) {
    errors.push(`${assetId}: LOD0/LOD1/LOD2 is incomplete.`);
    return;
  }
  const ratio1 = lod.lod1 / lod.lod0;
  const ratio2 = lod.lod2 / lod.lod0;
  if (ratio1 > 0.6 || ratio1 < 0.45) warnings.push(`${assetId}: LOD1 ratio ${(ratio1 * 100).toFixed(1)}% is outside 45–60%.`);
  if (ratio2 > 0.25 || ratio2 < 0.15) warnings.push(`${assetId}: LOD2 ratio ${(ratio2 * 100).toFixed(1)}% is outside 15–25%.`);
}

function parseGlbJson(buffer) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) return JSON.parse(chunk.toString('utf8').trim());
    offset += 8 + length;
  }
  throw new Error('JSON chunk not found');
}

function countVertices(json) {
  return (json.meshes || []).reduce((total, mesh) => total + (mesh.primitives || []).reduce((meshTotal, primitive) => {
    const accessor = json.accessors?.[primitive.attributes?.POSITION];
    return meshTotal + (accessor?.count || 0);
  }, 0), 0);
}

function inspectLod(json) {
  const names = json.nodes || [];
  const findRoot = (name) => names.findIndex((node) => node.name === name);
  return {
    lod0: countNodeVertices(json, findRoot('LOD0')),
    lod1: countNodeVertices(json, findRoot('LOD1')),
    lod2: countNodeVertices(json, findRoot('LOD2')),
  };
}

function countNodeVertices(json, nodeIndex, visited = new Set()) {
  if (nodeIndex == null || nodeIndex < 0 || visited.has(nodeIndex)) return 0;
  visited.add(nodeIndex);
  const node = json.nodes?.[nodeIndex];
  if (!node) return 0;
  let count = 0;
  if (Number.isInteger(node.mesh)) {
    const mesh = json.meshes?.[node.mesh];
    count += (mesh?.primitives || []).reduce((sum, primitive) => sum + (json.accessors?.[primitive.attributes?.POSITION]?.count || 0), 0);
  }
  for (const child of node.children || []) count += countNodeVertices(json, child, visited);
  return count;
}

function assertClips(id, json, required) {
  const names = new Set(json.animations?.map((entry) => entry.name) || []);
  for (const clip of required) if (!names.has(clip)) errors.push(`${id}: GLB missing clip ${clip}.`);
}

function assertNodes(id, json, required) {
  const names = new Set(nodeNames(json));
  for (const name of required) if (!names.has(name)) errors.push(`${id}: GLB missing node ${name}.`);
}

function nodeNames(json) {
  return (json.nodes || []).map((node) => node.name || '');
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    result[item[key]] = (result[item[key]] || 0) + 1;
    return result;
  }, {});
}

function summarizeLod(items) {
  const lodItems = items.filter((item) => item.lod.lod0 > 0);
  if (!lodItems.length) return { assets: 0 };
  return {
    assets: lodItems.length,
    averageLod0Vertices: Math.round(lodItems.reduce((sum, item) => sum + item.lod.lod0, 0) / lodItems.length),
    averageLod1Ratio: Number((lodItems.reduce((sum, item) => sum + item.lod.lod1 / item.lod.lod0, 0) / lodItems.length).toFixed(3)),
    averageLod2Ratio: Number((lodItems.reduce((sum, item) => sum + item.lod.lod2 / item.lod.lod0, 0) / lodItems.length).toFixed(3)),
  };
}
