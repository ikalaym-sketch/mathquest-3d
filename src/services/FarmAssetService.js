// v0.30 農場資產 Residency 與作物解析服務。
// 核心建築／動物固定駐留；設施依玩家鄰近分區載入；作物只保存seed與stage，不保存模型URL。
import { FARM_ASSETS, FARM_EXPANSION_ASSETS } from '../data/productionAssetCatalog.js';
import { FARM_LAYOUT } from '../data/farmLayout.js';
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle, replaceActiveAssetBundles } from './AssetBundleService.js';

export const FARM_MODEL_ASSETS = Object.freeze(Object.fromEntries(
  [...Object.entries(FARM_ASSETS), ...Object.entries(FARM_EXPANSION_ASSETS)].map(([id, asset]) => [id, asset.assetId]),
));


// 玩家執行農務時，僅保存工具語意ID；此映射負責轉成正式Canonical GLB。
// 動物刷、飼料袋與徒手互動目前不屬本版八件農具GLB，會由角色層使用既有輕量Fallback。
const FARM_TOOL_ASSET_KEY_BY_ACTION_ID = Object.freeze({
  hoe: 'tool_hoe',
  wateringCan: 'tool_watering_can',
  seedBag: 'tool_seed_bag',
  sickle: 'tool_sickle',
  axe: 'tool_axe',
  pickaxe: 'tool_pickaxe',
  hammer: 'tool_hammer',
  fishingRod: 'tool_fishing_rod',
});

export function resolveFarmToolModelAssetId(toolId) {
  const assetKey = FARM_TOOL_ASSET_KEY_BY_ACTION_ID[toolId];
  return assetKey ? FARM_MODEL_ASSETS[assetKey] || null : null;
}

export const FARM_ZONE_PROP_PLACEMENTS = Object.freeze({
  fields: [
    prop('irrigation_pump', [-17, 0, -2]), prop('sprinkler', [-9, 0, -4]), prop('canal_gate', [-3, 0, 0]),
    prop('compost_bin', [-18, 0, 7]), prop('scarecrow', [-3, 0, 4]), prop('seedling_tray', [-17, 0, 5]), prop('tool_shed', [-22, 0, 5]),
    prop('field_sign', [-11, 0, 7]),
  ],
  paddock: [
    prop('chicken_coop', [22, 0, 6]), prop('sheep_shelter', [20, 0, -1]), prop('cow_shed', [10, 0, -2]),
    prop('animal_feeder', [15, 0, 8]), prop('animal_waterer', [11, 0, 7]), prop('nesting_box', [23, 0, 2]),
    prop('milking_station', [9, 0, 3]), prop('grooming_post', [19, 0, 5]),
  ],
  workshop: [
    prop('grain_mill', [-25, 0, -18]), prop('cheese_press', [-20, 0, -18]), prop('butter_churn', [-17, 0, -14]),
    prop('jam_kettle', [-26, 0, -13]), prop('loom', [-21, 0, -11]), prop('smoker', [-16, 0, -19]),
    prop('dehydrator', [-28, 0, -20]), prop('packing_table', [-19, 0, -22]), prop('cold_storage', [-27, 0, -9]),
  ],
  orchard: [
    prop('orchard_ladder', [18, 0, -19]), prop('fruit_basket', [22, 0, -17]), prop('bee_hive', [27, 0, -22]),
    prop('greenhouse', [12, 0, -24]), prop('rain_collector', [10, 0, -17]), prop('solar_dryer', [27, 0, -14]),
  ],
  shipping: [
    prop('shipping_crate', [23, 0, 23]), prop('shipping_scale', [27, 0, 22]), prop('produce_cart', [30, 0, 25]),
    prop('fruit_basket', [24, 0, 26]), prop('packing_table', [29, 0, 19]),
  ],
  windmill: [
    prop('grain_silo', [7, 0, -27]), prop('flour_sifter', [-5, 0, -25]), prop('solar_dryer', [-8, 0, -29]),
  ],
});

const CORE_BUNDLE_ID = 'scene:farm:core';
const coreAssets = Object.values(FARM_ASSETS).map((asset) => asset.assetId);
defineAssetBundle(CORE_BUNDLE_ID, coreAssets);

const zoneBundleIds = Object.freeze(Object.fromEntries(Object.entries(FARM_ZONE_PROP_PLACEMENTS).map(([zoneId, placements]) => {
  const bundleId = `scene:farm:zone:${zoneId}`;
  defineAssetBundle(bundleId, placements.map((item) => item.assetId));
  return [zoneId, bundleId];
})));

export function preloadFarmAssets() { return activateAssetBundle(CORE_BUNDLE_ID); }
export function releaseFarmAssets() { return releaseAssetBundle(CORE_BUNDLE_ID); }
export function syncFarmZoneBundles(previousBundleIds, x, z) {
  const nextBundleIds = nearestZones(x, z, 2).map((zoneId) => zoneBundleIds[zoneId]).filter(Boolean);
  replaceActiveAssetBundles(previousBundleIds, nextBundleIds);
  return nextBundleIds;
}
export function releaseFarmZoneBundles(bundleIds = []) { replaceActiveAssetBundles(bundleIds, []); }
export function getFarmZoneIdsForBundles(bundleIds = []) {
  const reverse = new Map(Object.entries(zoneBundleIds).map(([zone, bundle]) => [bundle, zone]));
  return bundleIds.map((id) => reverse.get(id)).filter(Boolean);
}

const SEED_CROP_KEY = Object.freeze({
  seed_01: 'wheat', seed_02: 'carrot', seed_03: 'pumpkin', seed_04: 'tomato', seed_05: 'corn',
  seed_06: 'pumpkin', seed_07: 'pumpkin', seed_08: 'strawberry', seed_09: 'corn', seed_10: 'strawberry',
});
export function resolveCropModelAssetId(seedId, stage) {
  if (!seedId || !['seeded', 'sprout', 'growing', 'mature'].includes(stage)) return null;
  const cropKey = SEED_CROP_KEY[seedId] || 'wheat';
  const suffix = stage === 'seeded' ? 'seed' : stage;
  return FARM_MODEL_ASSETS[`crop_${cropKey}_${suffix}`] || null;
}
export function getFarmBundleContract() {
  const largestZone = Math.max(...Object.values(FARM_ZONE_PROP_PLACEMENTS).map((items) => new Set(items.map((item) => item.assetId)).size));
  return { coreAssetCount: new Set(coreAssets).size, largestZoneAssetCount: largestZone, maxSimultaneousAssets: new Set(coreAssets).size + largestZone * 2 };
}
export function getFarmRuntimeReachableAssetIds() {
  return [...new Set([
    ...coreAssets,
    ...Object.values(FARM_ZONE_PROP_PLACEMENTS).flat().map((item) => item.assetId),
    ...Object.keys(FARM_TOOL_ASSET_KEY_BY_ACTION_ID).map((toolId) => resolveFarmToolModelAssetId(toolId)),
    ...Object.keys(SEED_CROP_KEY).flatMap((seedId) => ['seeded', 'sprout', 'growing', 'mature'].map((stage) => resolveCropModelAssetId(seedId, stage))),
  ].filter(Boolean))];
}

function nearestZones(x, z, maxCount) {
  return Object.values(FARM_LAYOUT.zones)
    .filter((zone) => FARM_ZONE_PROP_PLACEMENTS[zone.id])
    .map((zone) => ({ id: zone.id, distance: Math.hypot(x - zone.center[0], z - zone.center[2]), radius: zone.radius }))
    .filter((entry) => entry.distance <= entry.radius + 15)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount)
    .map((entry) => entry.id);
}
function prop(id, position, rotation = [0, 0, 0], scale = 1) {
  return Object.freeze({ id: `${id}:${position.join(':')}`, assetId: FARM_MODEL_ASSETS[id], position, rotation, scale });
}
