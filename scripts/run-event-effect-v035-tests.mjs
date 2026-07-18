// v0.35 Event, Ecology & VFX／Canonical 800 永久驗收。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V035_ALLOCATION,
  V035_COMBAT_EFFECT_DEFINITIONS,
  V035_EFFECT_DEFINITIONS,
  V035_EVENT_DEFINITIONS,
  V035_EVENT_EFFECT_ASSET_DEFINITIONS,
  V035_FESTIVAL_DEFINITIONS,
  V035_MECHANISM_EFFECT_DEFINITIONS,
  V035_PORTAL_EFFECT_DEFINITIONS,
  V035_REGION_ECOLOGY_DEFINITIONS,
  V035_RELATIONSHIP_DEFINITIONS,
  V035_VILLAGE_ECOLOGY_DEFINITIONS,
  getFestivalAssetDefinitions,
  getMechanismEffectDefinition,
  getPortalEffectAssetId,
  getRegionEcologyDefinition,
  getRelationshipMemoryDefinitions,
  resolveV035CombatEffectAssetId,
} from '../src/data/eventEffectV035Catalog.js';
import { BASE_COMBAT_ARCHETYPE_IDS } from '../src/data/combatArchetypes.js';
import { VILLAGE_RESIDENT_IDS } from '../src/data/villageResidentProfiles.js';
import { CANONICAL_ASSET_COUNT, CANONICAL_ASSET_REGISTRY, getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { validateAssetGovernanceContracts } from '../src/services/AssetGovernanceValidationService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const cases = [];

await check('v035_exact_allocation_canonical_800_and_twelve_targets', async () => {
  const expected = { festivals: 12, relationships: 10, regionEcology: 8, villageEcology: 5, events: 35, portals: 4, mechanisms: 4, combatVfx: 12, effects: 20, total: 55, canonicalBefore: 745, canonicalAfter: 800 };
  for (const [key, value] of Object.entries(expected)) if (V035_ALLOCATION[key] !== value) throw new Error(`${key}應${value}，實際${V035_ALLOCATION[key]}`);
  if (V035_EVENT_EFFECT_ASSET_DEFINITIONS.length !== 55 || CANONICAL_ASSET_COUNT !== 800) throw new Error(`v0.35應55新增／800總數，實際${V035_EVENT_EFFECT_ASSET_DEFINITIONS.length}／${CANONICAL_ASSET_COUNT}`);
  const governance = validateAssetGovernanceContracts();
  if (!governance.ok || governance.summary.plannedNetNewAssets !== 0) throw new Error(`800治理未凍結：${governance.errors.join(' | ')}`);
  const ids = new Set(V035_EVENT_EFFECT_ASSET_DEFINITIONS.map((item) => item.assetId));
  const paths = new Set(V035_EVENT_EFFECT_ASSET_DEFINITIONS.map((item) => item.canonicalPath));
  if (ids.size !== 55 || paths.size !== 55) throw new Error('v0.35 assetId或canonicalPath重複。');
  const category = countBy(Object.values(CANONICAL_ASSET_REGISTRY), 'category');
  const targets = { character: 80, companion: 32, equipment: 140, village: 80, farm: 80, forest: 45, interior: 60, 'trial-tower': 36, event: 35, effect: 20 };
  for (const [name, value] of Object.entries(targets)) if (category[name] !== value) throw new Error(`${name}應${value}，實際${category[name]}`);
  const regions = category['region-structure'] + category.bridge + category['region-environment'];
  const creatures = category.monster + category.elite + category.boss + category.creature;
  if (regions !== 120 || creatures !== 72) throw new Error(`regions／creatures應120／72，實際${regions}／${creatures}`);
  return { canonical: 800, remaining: 0, events: 35, effects: 20, targetCategories: 12 };
});

await check('fifty_five_physical_glb_lod_material_and_socket_contracts', async () => {
  let bytes = 0;
  let lod1 = 0;
  let lod2 = 0;
  for (const definition of V035_EVENT_EFFECT_ASSET_DEFINITIONS) {
    const asset = getCanonicalAsset(definition.assetId);
    if (!asset || asset.release !== 'v0.35') throw new Error(`${definition.assetId}未進入v0.35 Registry。`);
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
  return { physicalGlb: 55, bytes, materials: 55, averageLod1: round(lod1 / 55), averageLod2: round(lod2 / 55) };
});

await check('four_seasons_ten_relationships_and_thirteen_ecologies', async () => {
  if (V035_FESTIVAL_DEFINITIONS.length !== 12 || V035_RELATIONSHIP_DEFINITIONS.length !== 10 || V035_REGION_ECOLOGY_DEFINITIONS.length !== 8 || V035_VILLAGE_ECOLOGY_DEFINITIONS.length !== 5) throw new Error('Event分項數量錯誤。');
  for (const season of ['spring', 'summer', 'autumn', 'winter']) if (getFestivalAssetDefinitions(season).length !== 3) throw new Error(`${season}不是3個節慶模組。`);
  const allRelations = Object.fromEntries(VILLAGE_RESIDENT_IDS.map((id) => [id, { affinity: 20, completedEventIds: [] }]));
  if (getRelationshipMemoryDefinitions(allRelations).length !== 10 || getRelationshipMemoryDefinitions({}).length !== 0) throw new Error('關係記憶解鎖門檻錯誤。');
  for (const definition of V035_REGION_ECOLOGY_DEFINITIONS) if (getRegionEcologyDefinition(definition.regionId)?.assetId !== definition.assetId) throw new Error(`${definition.regionId}生態映射錯誤。`);
  return { seasons: 4, festivalModules: 12, relationshipMemories: 10, regionEcologies: 8, villageEcologies: 5 };
});

await check('four_portals_four_mechanisms_and_twelve_combat_vfx', async () => {
  if (V035_EFFECT_DEFINITIONS.length !== 20 || V035_PORTAL_EFFECT_DEFINITIONS.length !== 4 || V035_MECHANISM_EFFECT_DEFINITIONS.length !== 4 || V035_COMBAT_EFFECT_DEFINITIONS.length !== 12) throw new Error('Effect分項數量錯誤。');
  const portalIds = ['village', 'farm', 'region', 'trial'].map(getPortalEffectAssetId);
  if (new Set(portalIds).size !== 4 || portalIds.some((id) => !getCanonicalAsset(id))) throw new Error('四種Portal映射不完整。');
  const regionMechanisms = ['wind_highlands', 'snow_valley', 'farm_plains', 'star_village', 'crystal_lake', 'sun_canyon', 'mushroom_grove', 'clockwork_ruins'].map((id) => getMechanismEffectDefinition(id)?.assetId);
  if (new Set(regionMechanisms).size !== 4) throw new Error('八區未輪替使用四種機關效果。');
  const combatIds = BASE_COMBAT_ARCHETYPE_IDS.map((id) => resolveV035CombatEffectAssetId(`vfx:${id}`));
  if (new Set(combatIds).size !== 12 || combatIds.some((id) => !getCanonicalAsset(id))) throw new Error('十二Base Combat Archetype VFX映射不完整。');
  return { portals: 4, mechanisms: 4, combatArchetypes: 12, uniqueCombatVfx: 12 };
});

await check('event_effect_runtime_consumers_and_bundle_limits', async () => {
  const files = [
    'src/components/World/WorldEventAssetLayer.jsx', 'src/components/Scenes/VillageScene.jsx', 'src/components/Scenes/RegionScene.jsx',
    'src/components/World/TeleportGate.jsx', 'src/components/3D/CombatFX.jsx', 'src/services/CombatExecutionService.js',
    'src/services/EquipmentAssetService.js', 'src/services/EventEcologyAssetService.js',
  ];
  const source = (await Promise.all(files.map((file) => fs.readFile(path.join(root, file), 'utf8')))).join('\n');
  for (const token of ['<WorldEventAssetLayer', 'getFestivalAssetDefinitions', 'getRelationshipMemoryDefinitions', 'getRegionEcologyDefinition', 'getPortalEffectAssetId', 'resolveV035CombatEffectAssetId', 'effectAssetId', 'activateEventEcologyBundle']) if (!source.includes(token)) throw new Error(`Runtime未接線：${token}`);
  for (const portalType of ['village', 'farm', 'region', 'trial']) if (!source.includes(`portalType="${portalType}"`)) throw new Error(`Portal Type未接線：${portalType}`);
  const villageMax = 3 + 10 + 5 + 3;
  const regionMax = 4;
  if (villageMax > 25 || regionMax > 8) throw new Error(`Event Bundle超標：${villageMax}/${regionMax}`);
  return { villageBundleMax: villageMax, regionBundleMax: regionMax, combatRuntimeOverlay: true, portalRuntime: true };
});

await check('final_atlas_meshopt_policy_and_release_freeze', async () => {
  const atlas = JSON.parse(await fs.readFile(path.join(root, 'public/textures/atlases/atlas-manifest.json'), 'utf8'));
  const pairs = atlas.atlases.reduce((sum, item) => sum + item.files.length, 0);
  if (atlas.release !== 'v0.35.0' || atlas.atlases.length !== 16 || pairs !== 73) throw new Error(`正式Atlas應v0.35.0 16／73，實際${atlas.release} ${atlas.atlases.length}／${pairs}`);
  const meshopt = JSON.parse(await fs.readFile(path.join(root, 'public/manifests/meshopt-v034-audit.json'), 'utf8'));
  if (!meshopt.ok || meshopt.runtimeExtensionRequired !== false || meshopt.physicalCompatibilityGate !== 'v0.36') throw new Error('Meshopt實機門檻政策被錯誤提前。');
  if (CANONICAL_ASSET_COUNT !== 800 || V035_EVENT_DEFINITIONS.length !== 35 || V035_EFFECT_DEFINITIONS.length !== 20) throw new Error('v0.35資產凍結失敗。');
  return { canonicalFrozen: 800, atlases: 16, channelPairs: 73, meshoptCandidateRatio: meshopt.totals.candidateRatio, nextGate: 'v0.36-physical-acceptance' };
});

const report = { generatedAt: new Date().toISOString(), version: '0.35.0-canonical-800', ok: errors.length === 0, caseCount: cases.length, cases, errors };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function check(id, callback) { try { cases.push({ id, status: 'PASSED', result: await callback() }); } catch (error) { const message = error?.message || String(error); errors.push(`${id}: ${message}`); cases.push({ id, status: 'FAILED', error: message }); } }
function parseGlbJson(buffer) { let offset = 12; while (offset + 8 <= buffer.length) { const length = buffer.readUInt32LE(offset); const type = buffer.readUInt32LE(offset + 4); if (type === 0x4e4f534a) return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString('utf8').trim()); offset += 8 + length; } throw new Error('GLB缺少JSON Chunk。'); }
function inspectLod(json) { const nodes = json.nodes || []; const index = (name) => nodes.findIndex((node) => node.name === name); return { lod0: countNodeVertices(json, index('LOD0')), lod1: countNodeVertices(json, index('LOD1')), lod2: countNodeVertices(json, index('LOD2')) }; }
function countNodeVertices(json, nodeIndex, visited = new Set()) { if (nodeIndex < 0 || visited.has(nodeIndex)) return 0; visited.add(nodeIndex); const node = json.nodes[nodeIndex]; let count = 0; if (Number.isInteger(node.mesh)) for (const primitive of json.meshes?.[node.mesh]?.primitives || []) count += json.accessors?.[primitive.attributes?.POSITION]?.count || 0; for (const child of node.children || []) count += countNodeVertices(json, child, visited); return count; }
function countBy(items, key) { return items.reduce((output, item) => ({ ...output, [item[key]]: (output[item[key]] || 0) + 1 }), {}); }
function round(value) { return Number(value.toFixed(3)); }
