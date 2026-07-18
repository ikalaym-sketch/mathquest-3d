// v0.30 星光村資產分包服務。
// 核心建築與地標固定駐留；生活／工坊／市場物件依玩家鄰近分區載入，離區後透過共用引用計數卸載。
import { VILLAGE_ASSETS } from '../data/productionAssetCatalog.js';
import { VILLAGE_LAYOUT } from '../data/villageLayout.js';
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle, replaceActiveAssetBundles } from './AssetBundleService.js';

export const VILLAGE_MODEL_ASSETS = Object.freeze(Object.fromEntries(
  Object.entries(VILLAGE_ASSETS).map(([id, asset]) => [id, asset.assetId]),
));

export const VILLAGE_BUILDING_ASSET_BY_LAYOUT_ID = Object.freeze({
  merchant_shop: VILLAGE_MODEL_ASSETS.general_store,
  potion_shop: VILLAGE_MODEL_ASSETS.potion_shop,
  bakery: VILLAGE_MODEL_ASSETS.bakery,
  blacksmith: VILLAGE_MODEL_ASSETS.blacksmith,
  carpenter: VILLAGE_MODEL_ASSETS.carpenter,
  tailor: VILLAGE_MODEL_ASSETS.tailor,
  home_a: VILLAGE_MODEL_ASSETS.resident_house_a,
  home_b: VILLAGE_MODEL_ASSETS.resident_house_b,
  home_c: VILLAGE_MODEL_ASSETS.resident_house_c,
  learning_hall: VILLAGE_MODEL_ASSETS.learning_hall,
  town_hall: VILLAGE_MODEL_ASSETS.town_hall,
});

export const VILLAGE_ZONE_PROP_PLACEMENTS = Object.freeze({
  plaza: [
    prop('bench', [-6, 0, -2.8], [0, .35, 0]), prop('bench', [6, 0, -2.8], [0, -.35, 0]),
    prop('lamp_post', [-8, 0, 5]), prop('lamp_post', [8, 0, 5]), prop('child_play_set', [7, 0, 12], [0, -.4, 0]),
    prop('notice_kiosk', [-11, 0, 1]), prop('clock_tower', [10, 0, 8]), prop('village_statue', [0, 0, 7]),
    prop('stone_well', [-11, 0, 9]), prop('festival_stage', [0, 0, 14]), prop('gift_table', [5, 0, 9]),
    prop('music_stand', [-5, 0, 10]),
  ],
  market: [
    prop('market_stall_a', [14, 0, 1], [0, .15, 0]), prop('market_stall_b', [20, 0, 2], [0, -.2, 0]),
    prop('produce_crate', [15, 0, 5]), prop('cloth_roll', [22, 0, 5]), prop('delivery_cart', [27, 0, 1], [0, -.7, 0]),
    prop('vendor_counter', [18, 0, -1]),
    prop('barrel', [12, 0, 4]), prop('crate', [25, 0, 6]), prop('sign_frame', [11, 0, -2]),
    prop('waste_bin', [29, 0, 6]), prop('cooking_stove', [24, 0, -3]),
  ],
  workshop: [
    prop('anvil', [-16, 0, 1]), prop('forge', [-19, 0, 1]), prop('workbench', [-23, 0, 3]),
    prop('tool_rack', [-27, 0, 2]), prop('lumber_stack', [-21, 0, 7]), prop('pottery_shelf', [-29, 0, 7]),
    prop('wall_panel', [-14, 0, 7]), prop('roof_panel', [-17, 0, 9]), prop('door_frame', [-25, 0, 9]),
    prop('window_frame', [-30, 0, 2]), prop('chimney_module', [-27, 0, -2]), prop('training_dummy', [-13, 0, 3]),
  ],
  residential: [
    prop('mailbox', [-21, 0, 17]), prop('flower_planter', [-13, 0, 17]), prop('planter_box', [-18, 0, 24]),
    prop('laundry_line', [-28, 0, 25]), prop('relationship_bench', [-10, 0, 22], [0, .4, 0]), prop('birdhouse', [-22, 0, 29]),
    prop('bed', [-27, 0, 18]), prop('table', [-24, 0, 21]), prop('chair', [-22, 0, 22]), prop('wardrobe', [-30, 0, 20]),
    prop('fence_segment', [-14, 0, 27]), prop('fence_gate', [-10, 0, 27]), prop('lantern_string', [-19, 0, 30]),
  ],
  learning: [
    prop('chalkboard', [15, 0, 17]), prop('abacus', [19, 0, 15]), prop('globe', [24, 0, 16]),
    prop('reading_cushion', [13, 0, 22]), prop('telescope', [28, 0, 21]), prop('game_table', [20, 0, 27]),
    prop('bookshelf', [11, 0, 18]), prop('study_desk', [17, 0, 24]), prop('toy_chest', [25, 0, 25]),
    prop('study_lamp', [22, 0, 20]), prop('easel', [29, 0, 16]),
  ],
  portal: [
    prop('village_gate', [0, 0, -31]), prop('teleport_plinth', [0, 0, -26]), prop('banner_post', [-5, 0, -25]),
    prop('banner_post', [5, 0, -25]), prop('lamp_post', [-7, 0, -22]), prop('lamp_post', [7, 0, -22]),
    prop('signpost', [-10, 0, -28]), prop('water_trough', [10, 0, -28]), prop('fishing_rack', [-11, 0, -21]),
    prop('picnic_set', [11, 0, -20]),
  ],
});

const CORE_BUNDLE = 'scene:village:core';
export const VILLAGE_CORE_ASSET_IDS = Object.freeze([
  ...Object.values(VILLAGE_BUILDING_ASSET_BY_LAYOUT_ID),
  VILLAGE_MODEL_ASSETS.star_tree,
  VILLAGE_MODEL_ASSETS.fountain,
  VILLAGE_MODEL_ASSETS.pond_bridge,
  VILLAGE_MODEL_ASSETS.quest_board,
  VILLAGE_MODEL_ASSETS.balloon_altar,
]);
defineAssetBundle(CORE_BUNDLE, VILLAGE_CORE_ASSET_IDS);

const zoneBundleIds = Object.freeze(Object.fromEntries(Object.entries(VILLAGE_ZONE_PROP_PLACEMENTS).map(([zoneId, placements]) => {
  const bundleId = `scene:village:zone:${zoneId}`;
  defineAssetBundle(bundleId, placements.map((item) => item.assetId));
  return [zoneId, bundleId];
})));

export function activateVillageCoreAssets() { return activateAssetBundle(CORE_BUNDLE); }
export function releaseVillageCoreAssets() { return releaseAssetBundle(CORE_BUNDLE); }
export function syncVillageZoneBundles(previousBundleIds, x, z) {
  const nextZoneIds = nearestZones(x, z, 2);
  const nextBundleIds = nextZoneIds.map((id) => zoneBundleIds[id]).filter(Boolean);
  replaceActiveAssetBundles(previousBundleIds, nextBundleIds);
  return nextBundleIds;
}
export function releaseVillageZoneBundles(bundleIds = []) { replaceActiveAssetBundles(bundleIds, []); }
export function getVillageZoneIdsForBundles(bundleIds = []) {
  const reverse = new Map(Object.entries(zoneBundleIds).map(([zone, bundle]) => [bundle, zone]));
  return bundleIds.map((id) => reverse.get(id)).filter(Boolean);
}
export function getVillageBundleContract() {
  const zoneAssetCounts = Object.values(VILLAGE_ZONE_PROP_PLACEMENTS)
    .map((items) => new Set(items.map((item) => item.assetId)).size)
    .sort((a, b) => b - a);
  return {
    coreAssetCount: new Set(VILLAGE_CORE_ASSET_IDS).size,
    zoneBundleIds: { ...zoneBundleIds },
    maxSimultaneousAssets: new Set(VILLAGE_CORE_ASSET_IDS).size + (zoneAssetCounts[0] || 0) + (zoneAssetCounts[1] || 0),
  };
}
export function getVillageRuntimeReachableAssetIds() {
  return [...new Set([
    ...VILLAGE_CORE_ASSET_IDS,
    ...Object.values(VILLAGE_ZONE_PROP_PLACEMENTS).flat().map((item) => item.assetId),
  ])];
}

function nearestZones(x, z, maxCount) {
  return Object.values(VILLAGE_LAYOUT.zones)
    .filter((zone) => VILLAGE_ZONE_PROP_PLACEMENTS[zone.id])
    .map((zone) => ({ id: zone.id, distance: Math.hypot(x - zone.center[0], z - zone.center[2]), radius: zone.radius }))
    .filter((entry) => entry.distance <= entry.radius + 13)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount)
    .map((entry) => entry.id);
}
function prop(id, position, rotation = [0, 0, 0], scale = 1) {
  return Object.freeze({ id: `${id}:${position.join(':')}`, assetId: VILLAGE_MODEL_ASSETS[id], position, rotation, scale });
}
