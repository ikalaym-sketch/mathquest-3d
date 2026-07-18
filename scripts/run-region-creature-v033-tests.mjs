// v0.33 Regions, Forest & Creatures 永久驗收。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V033_ALLOCATION,
  V033_CREATURE_DEFINITIONS,
  V033_FOREST_ASSET_DEFINITIONS,
  V033_REGION_CREATURE_ASSET_DEFINITIONS,
  V033_REGION_DYNAMIC_EFFECT_PROFILES,
  V033_REGION_ENVIRONMENT_DEFINITIONS,
  V033_REGION_STRUCTURE_DEFINITIONS,
  V033_REGION_THEMES,
} from '../src/data/regionCreatureV033Catalog.js';
import { REGION_ENCOUNTERS } from '../src/data/regionEncounters.js';
import { CANONICAL_ASSET_COUNT, CANONICAL_ASSET_REGISTRY, getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { MATERIAL_RUNTIME_PROFILES } from '../src/services/MaterialProfileService.js';
import { getRegionV033ResidencyAssetIds } from '../src/services/RegionExpansionAssetService.js';
import { getForestSubareaAssetIds } from '../src/services/ForestAssetService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const cases = [];

await check('v033_exact_allocation_and_registry_total', async () => {
  const expected = { forest: 30, regionStructures: 24, regionEnvironment: 40, creatures: 32, total: 126, canonicalBefore: 523, canonicalAfter: 649 };
  for (const [key, value] of Object.entries(expected)) if (V033_ALLOCATION[key] !== value) throw new Error(`${key}應${value}，實際${V033_ALLOCATION[key]}`);
  if (V033_REGION_CREATURE_ASSET_DEFINITIONS.length !== 126 || CANONICAL_ASSET_COUNT < 649) throw new Error(`v0.33應126新增且總數不得低於649，實際${V033_REGION_CREATURE_ASSET_DEFINITIONS.length}／${CANONICAL_ASSET_COUNT}`);
  const ids = new Set(V033_REGION_CREATURE_ASSET_DEFINITIONS.map((definition) => definition.assetId));
  const paths = new Set(V033_REGION_CREATURE_ASSET_DEFINITIONS.map((definition) => definition.canonicalPath));
  if (ids.size !== 126 || paths.size !== 126) throw new Error('v0.33 assetId或canonicalPath重複。');
  return { ...V033_ALLOCATION };
});

await check('target_distribution_forest_regions_creatures', async () => {
  const category = countBy(Object.values(CANONICAL_ASSET_REGISTRY), 'category');
  const regions = (category['region-structure'] || 0) + (category.bridge || 0) + (category['region-environment'] || 0);
  const creatures = (category.monster || 0) + (category.elite || 0) + (category.boss || 0) + (category.creature || 0);
  if (category.forest !== 45 || regions !== 120 || creatures !== 72) throw new Error(`目標分配錯誤：forest=${category.forest}, regions=${regions}, creatures=${creatures}`);
  if (V033_FOREST_ASSET_DEFINITIONS.length !== 30 || V033_REGION_STRUCTURE_DEFINITIONS.length !== 24 || V033_REGION_ENVIRONMENT_DEFINITIONS.length !== 40 || V033_CREATURE_DEFINITIONS.length !== 32) throw new Error('Catalog分項數量錯誤。');
  return { forest: category.forest, regions, creatures };
});

await check('physical_glb_lod_material_and_animation_contracts', async () => {
  let bytes = 0;
  let materials = 0;
  let lod1Total = 0;
  let lod2Total = 0;
  for (const definition of V033_REGION_CREATURE_ASSET_DEFINITIONS) {
    const asset = getCanonicalAsset(definition.assetId);
    if (!asset || asset.release !== 'v0.33') throw new Error(`${definition.assetId}未進入v0.33 Registry。`);
    const buffer = await fs.readFile(path.join(root, 'public', asset.canonicalPath));
    if (buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${asset.assetId}不是GLB。`);
    const json = parseGlbJson(buffer);
    const nodes = new Set((json.nodes || []).map((node) => node.name));
    for (const required of asset.requiredNodes || []) if (!nodes.has(required)) throw new Error(`${asset.assetId}缺少${required}。`);
    const animations = new Set((json.animations || []).map((clip) => clip.name));
    for (const required of asset.requiredClips || []) if (!animations.has(required)) throw new Error(`${asset.assetId}缺少動畫${required}。`);
    const lod = inspectLod(json);
    if (!(lod.lod0 > 0 && lod.lod1 > 0 && lod.lod2 > 0)) throw new Error(`${asset.assetId} LOD不完整。`);
    const ratio1 = lod.lod1 / lod.lod0;
    const ratio2 = lod.lod2 / lod.lod0;
    if (ratio1 < 0.45 || ratio1 > 0.6 || ratio2 < 0.15 || ratio2 > 0.25) throw new Error(`${asset.assetId} LOD比例錯誤：${ratio1.toFixed(3)}/${ratio2.toFixed(3)}`);
    if ((json.materials || []).length > 1) throw new Error(`${asset.assetId}優化後仍有${json.materials.length}材質。`);
    if ((json.images || []).length || (json.textures || []).length) throw new Error(`${asset.assetId}不應內嵌Texture。`);
    bytes += buffer.length;
    materials += (json.materials || []).length;
    lod1Total += ratio1;
    lod2Total += ratio2;
  }
  return { physicalGlb: 126, bytes, materials, averageLod1: round(lod1Total / 126), averageLod2: round(lod2Total / 126) };
});

await check('forty_existing_encounters_have_region_silhouettes', async () => {
  const bossSignatures = new Set();
  let normalMotifs = 0;
  let eliteCrests = 0;
  for (const [regionId, encounter] of Object.entries(REGION_ENCOUNTERS)) {
    // sun_canyon 的區域ID前綴與遭遇資產前綴不同；以正式 model/actor id 為準。
    const prefix = encounter.normal[0].id.split('_')[0];
    for (const definition of encounter.normal) {
      const nodes = await glbNodeNames(definition.modelAssetId);
      if (!nodes.some((name) => name.startsWith(`MOTIF_${prefix}`))) throw new Error(`${definition.id}缺少區域輪廓Motif。`);
      normalMotifs += 1;
    }
    const eliteNodes = await glbNodeNames(encounter.elite.modelAssetId);
    if (!eliteNodes.includes(`ELITE_${prefix}_crest`)) throw new Error(`${encounter.elite.id}缺少Elite Crest。`);
    eliteCrests += 1;
    const bossNodes = await glbNodeNames(encounter.boss.modelAssetId);
    const signature = bossNodes.filter((name) => name.startsWith('BOSS_')).sort().join('|');
    if (!signature || !signature.includes(`BOSS_${prefix}_`)) throw new Error(`${encounter.boss.id}缺少專屬Boss輪廓節點。`);
    bossSignatures.add(signature);
  }
  if (normalMotifs !== 24 || eliteCrests !== 8 || bossSignatures.size !== 8) throw new Error(`遭遇輪廓覆蓋錯誤：${normalMotifs}/24, ${eliteCrests}/8, ${bossSignatures.size}/8。`);
  return { normalReworked: normalMotifs, eliteReworked: eliteCrests, uniqueBossSilhouettes: bossSignatures.size };
});

await check('region_atlas_material_and_shader_runtime', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/textures/atlases/atlas-manifest.json'), 'utf8'));
  const atlasIds = new Set(manifest.atlases.map((entry) => entry.atlasId));
  const required = ['atlas_forest', 'atlas_wind', 'atlas_snow', 'atlas_crystal', 'atlas_canyon', 'atlas_mushroom', 'atlas_clockwork'];
  for (const atlasId of required) if (!atlasIds.has(atlasId)) throw new Error(`缺少${atlasId}。`);
  const pairs = manifest.atlases.reduce((sum, entry) => sum + entry.files.length, 0);
  if (manifest.atlases.length < 15 || pairs < 68) throw new Error(`v0.33 Atlas不得低於15／68，實際${manifest.atlases.length}／${pairs}。`);
  for (const theme of V033_REGION_THEMES) if (!MATERIAL_RUNTIME_PROFILES[theme.materialProfile]) throw new Error(`缺少Material Profile：${theme.materialProfile}`);
  return { release: manifest.release, atlases: manifest.atlases.length, channelPairs: pairs };
});

await check('bundle_residency_and_forest_subarea_limits', async () => {
  const regionCounts = V033_REGION_THEMES.map(({ regionId }) => getRegionV033ResidencyAssetIds(regionId).length);
  if (Math.max(...regionCounts) > 28) throw new Error(`區域Bundle超過28資產：${Math.max(...regionCounts)}`);
  const forestSubareas = ['whispering_grove', 'waterfall_path', 'ancient_gate', 'mossy_shrine'];
  const forestCounts = forestSubareas.map((id) => getForestSubareaAssetIds(id).length);
  if (Math.max(...forestCounts) > 15) throw new Error(`森林子區Bundle超過15資產：${Math.max(...forestCounts)}`);
  return { regionBundleMax: Math.max(...regionCounts), forestSubareaBundleMax: Math.max(...forestCounts), mobileSceneLimit: 70 };
});

await check('dynamic_effects_decal_instancing_and_runtime_consumers', async () => {
  for (const { regionId } of V033_REGION_THEMES) if (V033_REGION_DYNAMIC_EFFECT_PROFILES[regionId]?.length !== 3) throw new Error(`${regionId}不是三種動態效果。`);
  const sources = await Promise.all([
    'src/components/World/RegionExpansionLayer.jsx',
    'src/components/World/ForestV033ExpansionLayer.jsx',
    'src/components/Scenes/RegionScene.jsx',
    'src/components/Scenes/ForestRuinsScene.jsx',
  ].map((file) => fs.readFile(path.join(root, file), 'utf8')));
  const source = sources.join('\n');
  for (const token of ['<Decal', '<instancedMesh', 'RegionDynamicEffects', '<RegionExpansionLayer', '<ForestV033ExpansionLayer']) if (!source.includes(token)) throw new Error(`Runtime未接線：${token}`);
  return { regions: V033_REGION_THEMES.length, dynamicEffects: 24, decal: true, instancing: true, runtimeConsumers: 2 };
});

const report = { generatedAt: new Date().toISOString(), version: '0.33.0-regions-forest-creatures', ok: errors.length === 0, caseCount: cases.length, cases, errors };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function check(id, callback) {
  try { cases.push({ id, status: 'PASSED', result: await callback() }); }
  catch (error) { const message = error?.message || String(error); errors.push(`${id}: ${message}`); cases.push({ id, status: 'FAILED', error: message }); }
}

async function glbNodeNames(assetId) {
  const asset = getCanonicalAsset(assetId);
  const json = parseGlbJson(await fs.readFile(path.join(root, 'public', asset.canonicalPath)));
  return (json.nodes || []).map((node) => node.name || '');
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

function countBy(items, key) {
  return items.reduce((output, item) => ({ ...output, [item[key]]: (output[item[key]] || 0) + 1 }), {});
}

function round(value) { return Number(value.toFixed(3)); }
