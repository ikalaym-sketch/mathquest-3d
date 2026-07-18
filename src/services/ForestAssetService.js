// v0.29.1 森林遺跡 GLB Residency 服務。
// 每個子區都是正式 Bundle；相鄰子區共用的資產由全域引用計數避免誤清除。
import { FOREST_RUINS_LAYOUT } from '../data/forestRuinsLayout.js';
import { FOREST_ASSETS } from '../data/productionAssetCatalog.js';
import { getV033ForestAssetsForSubarea } from '../data/regionCreatureV033Catalog.js';
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle, replaceActiveAssetBundles } from './AssetBundleService.js';

export const FOREST_MODEL_ASSETS = Object.freeze(Object.fromEntries(
  Object.entries(FOREST_ASSETS).map(([id, asset]) => [id, asset.assetId]),
));

for (const subareaId of Object.keys(FOREST_RUINS_LAYOUT.subareas)) {
  defineAssetBundle(getForestBundleId(subareaId), getForestSubareaAssetIds(subareaId));
}

export function getForestSubareaAssetIds(subareaId) {
  const area = FOREST_RUINS_LAYOUT.subareas[subareaId];
  if (!area) return [];
  const shared = ['lantern_post', 'fern_cluster'];
  const legacy = [...new Set([...area.assets, ...shared])].map((key) => FOREST_MODEL_ASSETS[key]).filter(Boolean);
  const expansion = getV033ForestAssetsForSubarea(subareaId).map((definition) => definition.assetId);
  return [...new Set([...legacy, ...expansion])];
}

// 舊函式名稱保留，回傳內容已是 assetId 而不是 URL。
export const getForestSubareaAssetUrls = getForestSubareaAssetIds;

export function preloadForestSubareas(subareaIds) {
  return subareaIds.map((id) => activateAssetBundle(getForestBundleId(id)));
}

export function releaseForestSubareas(subareaIds) {
  return subareaIds.map((id) => releaseAssetBundle(getForestBundleId(id)));
}

export function releaseAllForestAssets() {
  return Object.keys(FOREST_RUINS_LAYOUT.subareas).map((id) => releaseAssetBundle(getForestBundleId(id)));
}

export function syncForestResidency(previousIds, nextIds) {
  replaceActiveAssetBundles(previousIds.map(getForestBundleId), nextIds.map(getForestBundleId));
}

function getForestBundleId(subareaId) {
  return `scene:forest:subarea:${subareaId}`;
}
