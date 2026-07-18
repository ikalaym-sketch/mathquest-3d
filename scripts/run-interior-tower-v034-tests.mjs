// v0.34 Interior & Trial Tower 永久驗收。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V034_ALLOCATION,
  V034_INTERIOR_ROOM_DEFINITIONS,
  V034_INTERIOR_SUPPORT_DEFINITIONS,
  V034_INTERIOR_TOWER_ASSET_DEFINITIONS,
  V034_TOWER_FLOOR_ASSET_MAP,
  V034_TOWER_MECHANISM_DEFINITIONS,
  V034_TOWER_THEME_DEFINITIONS,
  getTrialTowerDefinitionsForConfig,
} from '../src/data/interiorTowerV034Catalog.js';
import { getAllTrialFloorConfigs, TOWER_THEMES } from '../src/data/trialTower.js';
import { REGION_PRODUCTION_LAYOUTS } from '../src/data/regionProductionLayouts.js';
import { CANONICAL_ASSET_COUNT, CANONICAL_ASSET_REGISTRY, getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { getInteriorV034AssetIds, getTrialTowerV034AssetIds } from '../src/services/InteriorTowerAssetService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const cases = [];

await check('v034_exact_allocation_and_registry_total', async () => {
  const expected = { interiorRooms: 32, interiorSupport: 28, interiorTotal: 60, towerThemes: 30, towerMechanisms: 6, towerTotal: 36, total: 96, canonicalBefore: 649, canonicalAfter: 745 };
  for (const [key, value] of Object.entries(expected)) if (V034_ALLOCATION[key] !== value) throw new Error(`${key}應${value}，實際${V034_ALLOCATION[key]}`);
  if (V034_INTERIOR_TOWER_ASSET_DEFINITIONS.length !== 96 || CANONICAL_ASSET_COUNT < 745) throw new Error(`v0.34應96新增且總數不得低於745，實際${V034_INTERIOR_TOWER_ASSET_DEFINITIONS.length}／${CANONICAL_ASSET_COUNT}`);
  const ids = new Set(V034_INTERIOR_TOWER_ASSET_DEFINITIONS.map((item) => item.assetId));
  const paths = new Set(V034_INTERIOR_TOWER_ASSET_DEFINITIONS.map((item) => item.canonicalPath));
  if (ids.size !== 96 || paths.size !== 96) throw new Error('v0.34 assetId或canonicalPath重複。');
  const category = countBy(Object.values(CANONICAL_ASSET_REGISTRY), 'category');
  if (category.interior !== 60 || category['trial-tower'] !== 36) throw new Error(`分類錯誤：interior=${category.interior}, tower=${category['trial-tower']}`);
  return { ...V034_ALLOCATION };
});

await check('physical_glb_modular_lod_and_material_contracts', async () => {
  let bytes = 0;
  let lod1 = 0;
  let lod2 = 0;
  for (const definition of V034_INTERIOR_TOWER_ASSET_DEFINITIONS) {
    const asset = getCanonicalAsset(definition.assetId);
    if (!asset || asset.release !== 'v0.34') throw new Error(`${definition.assetId}未進入v0.34 Registry。`);
    const buffer = await fs.readFile(path.join(root, 'public', asset.canonicalPath));
    if (buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${asset.assetId}不是GLB。`);
    const json = parseGlbJson(buffer);
    const nodes = new Set((json.nodes || []).map((node) => node.name));
    for (const required of asset.requiredNodes || []) if (!nodes.has(required)) throw new Error(`${asset.assetId}缺少${required}。`);
    const lod = inspectLod(json);
    const ratio1 = lod.lod1 / lod.lod0;
    const ratio2 = lod.lod2 / lod.lod0;
    if (ratio1 < 0.45 || ratio1 > 0.6 || ratio2 < 0.15 || ratio2 > 0.25) throw new Error(`${asset.assetId} LOD比例錯誤：${ratio1.toFixed(3)}/${ratio2.toFixed(3)}`);
    if ((json.materials || []).length > 1) throw new Error(`${asset.assetId}優化後仍有${json.materials.length}材質。`);
    if ((json.images || []).length || (json.textures || []).length) throw new Error(`${asset.assetId}不應內嵌Texture。`);
    bytes += buffer.length;
    lod1 += ratio1;
    lod2 += ratio2;
  }
  return { physicalGlb: 96, bytes, averageLod1: round(lod1 / 96), averageLod2: round(lod2 / 96), sharedMaterialMax: 1 };
});

await check('thirty_two_purpose_identifiable_interiors_and_support_kit', async () => {
  const worldRooms = Object.values(REGION_PRODUCTION_LAYOUTS).flatMap((layout) => layout.structures.map((structure) => `${layout.id}:${structure.id}`));
  const catalogRooms = V034_INTERIOR_ROOM_DEFINITIONS.map((item) => `${item.regionId}:${item.roomId}`);
  if (worldRooms.length !== 32 || new Set(catalogRooms).size !== 32) throw new Error(`室內用途數不是32：world=${worldRooms.length}, catalog=${new Set(catalogRooms).size}`);
  for (const id of worldRooms) if (!catalogRooms.includes(id)) throw new Error(`缺少室內用途${id}`);
  if (V034_INTERIOR_SUPPORT_DEFINITIONS.length !== 28 || new Set(V034_INTERIOR_SUPPORT_DEFINITIONS.map((item) => item.supportId)).size !== 28) throw new Error('28個室內支援模組不完整。');
  for (const layout of Object.values(REGION_PRODUCTION_LAYOUTS)) {
    for (const structure of layout.structures) {
      const interior = { regionId: layout.id, structureId: structure.id, furnitureTheme: structure.type, interactions: [{ kind: 'storyShelf' }, { kind: 'workbench' }, { kind: 'rest' }] };
      const assets = getInteriorV034AssetIds(interior);
      if (assets.length < 4 || assets.length > 5) throw new Error(`${layout.id}:${structure.id} Bundle應4至5個，實際${assets.length}`);
    }
  }
  return { purposeRooms: 32, structurePurposes: new Set(V034_INTERIOR_ROOM_DEFINITIONS.map((item) => item.structureType)).size, supportModules: 28, maxRoomBundle: 5 };
});

await check('ten_theme_hundred_floor_deterministic_composition', async () => {
  const floors = getAllTrialFloorConfigs();
  if (TOWER_THEMES.length !== 10 || floors.length !== 100 || Object.keys(V034_TOWER_FLOOR_ASSET_MAP).length !== 100) throw new Error('10主題／100層配置錯誤。');
  if (V034_TOWER_THEME_DEFINITIONS.length !== 30 || V034_TOWER_MECHANISM_DEFINITIONS.length !== 6) throw new Error('30主題模組／6機關錯誤。');
  for (const config of floors) {
    const first = getTrialTowerDefinitionsForConfig(config).map((item) => item.assetId);
    const second = getTrialTowerDefinitionsForConfig(config).map((item) => item.assetId);
    if (first.length !== 4 || first.join('|') !== second.join('|')) throw new Error(`第${config.floor}層不是4模組確定組合。`);
    if (first.join('|') !== getTrialTowerV034AssetIds(config.floor).join('|')) throw new Error(`第${config.floor}層Residency與Catalog不同步。`);
    for (const assetId of first) if (!getCanonicalAsset(assetId)) throw new Error(`第${config.floor}層資產未註冊：${assetId}`);
  }
  return { themes: 10, floors: 100, themeModules: 30, sharedMechanisms: 6, assetsPerFloor: 4 };
});

await check('sixteen_atlases_and_meshopt_roundtrip_audit', async () => {
  const atlas = JSON.parse(await fs.readFile(path.join(root, 'public/textures/atlases/atlas-manifest.json'), 'utf8'));
  const pairs = atlas.atlases.reduce((sum, item) => sum + item.files.length, 0);
  if (atlas.atlases.length !== 16 || pairs !== 73) throw new Error(`v0.34 Atlas基線應16／73，實際${atlas.release} ${atlas.atlases.length}／${pairs}`);
  if (!atlas.atlases.some((item) => item.atlasId === 'atlas_interior_festival_tower')) throw new Error('缺少室內／節慶／塔Atlas。');
  const meshopt = JSON.parse(await fs.readFile(path.join(root, 'public/manifests/meshopt-v034-audit.json'), 'utf8'));
  if (!meshopt.ok || meshopt.assetCount !== 96 || meshopt.status !== 'encoder-integrated-roundtrip-audited') throw new Error('Meshopt 96資產round-trip稽核未通過。');
  if (meshopt.runtimeExtensionWritten !== false || meshopt.runtimeExtensionRequired !== false) throw new Error('v0.34不得在實機門檻前謊稱強制Meshopt Runtime改寫。');
  if (!(meshopt.totals.candidateRatio > 0 && meshopt.totals.candidateRatio < 1)) throw new Error(`Meshopt候選壓縮率異常：${meshopt.totals.candidateRatio}`);
  return { atlases: 16, channelPairs: 73, meshoptAssets: 96, meshoptCandidateRatio: meshopt.totals.candidateRatio, runtimeRewriteDeferredTo: meshopt.physicalCompatibilityGate };
});

await check('runtime_interior_tower_consumers_and_residency', async () => {
  const files = [
    'src/components/World/CanonicalInteriorKit.jsx',
    'src/components/World/RegionInteriorLayer.jsx',
    'src/components/Trial/TrialTowerAssetLayer.jsx',
    'src/components/Trial/TrialTowerArena.jsx',
    'src/services/InteriorTowerAssetService.js',
  ];
  const source = (await Promise.all(files.map((file) => fs.readFile(path.join(root, file), 'utf8')))).join('\n');
  for (const token of ['<CanonicalInteriorKit', '<TrialTowerAssetLayer', 'activateInteriorV034Assets', 'releaseInteriorV034Assets', 'activateTrialTowerV034Assets', 'releaseTrialTowerV034Assets', 'assetId={room.assetId}']) if (!source.includes(token)) throw new Error(`Runtime未接線：${token}`);
  return { runtimeConsumers: 2, residencyService: true, roomBundleMax: 5, floorBundleAssets: 4 };
});

const report = { generatedAt: new Date().toISOString(), version: '0.34.0-interior-trial-tower', ok: errors.length === 0, caseCount: cases.length, cases, errors };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function check(id, callback) {
  try { cases.push({ id, status: 'PASSED', result: await callback() }); }
  catch (error) { const message = error?.message || String(error); errors.push(`${id}: ${message}`); cases.push({ id, status: 'FAILED', error: message }); }
}

function parseGlbJson(buffer) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString('utf8').trim());
    offset += 8 + length;
  }
  throw new Error('GLB缺少JSON Chunk。');
}

function inspectLod(json) {
  const nodes = json.nodes || [];
  const index = (name) => nodes.findIndex((node) => node.name === name);
  return { lod0: countNodeVertices(json, index('LOD0')), lod1: countNodeVertices(json, index('LOD1')), lod2: countNodeVertices(json, index('LOD2')) };
}

function countNodeVertices(json, nodeIndex, visited = new Set()) {
  if (nodeIndex < 0 || visited.has(nodeIndex)) return 0;
  visited.add(nodeIndex);
  const node = json.nodes[nodeIndex];
  let count = 0;
  if (Number.isInteger(node.mesh)) for (const primitive of json.meshes?.[node.mesh]?.primitives || []) count += json.accessors?.[primitive.attributes?.POSITION]?.count || 0;
  for (const child of node.children || []) count += countNodeVertices(json, child, visited);
  return count;
}

function countBy(items, key) { return items.reduce((output, item) => ({ ...output, [item[key]]: (output[item[key]] || 0) + 1 }), {}); }
function round(value) { return Number(value.toFixed(3)); }
