// v0.33 八區擴充資產分包；每次只駐留當前區域，不把 126 個新增資產同時載入。
import { REGION_PRODUCTION_LAYOUTS } from '../data/regionProductionLayouts.js';
import { REGION_ENCOUNTERS } from '../data/regionEncounters.js';
import { REGION_ENVIRONMENT_KITS } from '../data/regionEnvironmentAssetCatalog.js';
import { V033_REGION_THEMES, getV033RegionAssets } from '../data/regionCreatureV033Catalog.js';
import { BRIDGE_ASSET, STRUCTURE_ASSETS } from '../data/productionAssetCatalog.js';
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle } from './AssetBundleService.js';

const BUNDLE_PREFIX = 'scene:region:v033:';

for (const { regionId } of V033_REGION_THEMES) defineAssetBundle(bundleId(regionId), getRegionV033ResidencyAssetIds(regionId));

export function getRegionV033ResidencyAssetIds(regionId) {
  const layout = REGION_PRODUCTION_LAYOUTS[regionId];
  const encounter = REGION_ENCOUNTERS[regionId];
  const oldEnvironment = REGION_ENVIRONMENT_KITS[regionId]?.assets || [];
  const assetIds = [
    ...getV033RegionAssets(regionId).map((definition) => definition.assetId),
    ...(layout?.structures || []).map((instance) => STRUCTURE_ASSETS[instance.type]?.assetId),
    ...(layout?.bridges?.length ? [BRIDGE_ASSET.assetId] : []),
    ...oldEnvironment.map((asset) => asset.assetId),
    ...(encounter?.normal || []).map((definition) => definition.modelAssetId),
    encounter?.elite?.modelAssetId,
    encounter?.boss?.modelAssetId,
  ];
  return [...new Set(assetIds.filter(Boolean))];
}

export function activateRegionV033Assets(regionId) {
  return activateAssetBundle(bundleId(regionId));
}

export function releaseRegionV033Assets(regionId) {
  return releaseAssetBundle(bundleId(regionId));
}

function bundleId(regionId) {
  return `${BUNDLE_PREFIX}${regionId}`;
}
