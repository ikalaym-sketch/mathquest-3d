// v0.34 室內與試煉塔分包 Residency；單一 Pocket／樓層只駐留當下會渲染的四至五個模組。
import { V034_TOWER_FLOOR_ASSET_MAP, getInteriorRoomDefinition, getInteriorSupportDefinitions } from '../data/interiorTowerV034Catalog.js';
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle } from './AssetBundleService.js';

const INTERIOR_PREFIX = 'scene:interior:v034:';
const TOWER_PREFIX = 'scene:trial-tower:v034:floor:';

for (const [floor, assetIds] of Object.entries(V034_TOWER_FLOOR_ASSET_MAP)) defineAssetBundle(`${TOWER_PREFIX}${floor}`, assetIds);

export function getInteriorV034AssetIds(interior) {
  const room = getInteriorRoomDefinition(interior?.regionId, interior?.structureId);
  return [room?.assetId, ...getInteriorSupportDefinitions(interior).map((item) => item.assetId)].filter(Boolean);
}

export function activateInteriorV034Assets(interior) {
  const id = interiorBundleId(interior);
  defineAssetBundle(id, getInteriorV034AssetIds(interior));
  return activateAssetBundle(id);
}

export function releaseInteriorV034Assets(interior) {
  return releaseAssetBundle(interiorBundleId(interior));
}

export function getTrialTowerV034AssetIds(floor) {
  return V034_TOWER_FLOOR_ASSET_MAP[Math.max(1, Math.min(100, Number(floor) || 1))] || [];
}

export function activateTrialTowerV034Assets(floor) {
  return activateAssetBundle(`${TOWER_PREFIX}${Math.max(1, Math.min(100, Number(floor) || 1))}`);
}

export function releaseTrialTowerV034Assets(floor) {
  return releaseAssetBundle(`${TOWER_PREFIX}${Math.max(1, Math.min(100, Number(floor) || 1))}`);
}

function interiorBundleId(interior) {
  return `${INTERIOR_PREFIX}${interior?.regionId || 'unknown'}:${interior?.structureId || 'unknown'}`;
}
