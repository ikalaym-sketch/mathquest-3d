// v0.35 Event／Ecology 動態分包；季節、關係與當前區域改變時只替換實際可見資產。
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle } from './AssetBundleService.js';

export function activateEventEcologyBundle(scope, assetIds = []) {
  const normalized = [...new Set(assetIds.filter(Boolean))];
  const bundleId = `scene:event:v035:${scope}:${hashAssetIds(normalized)}`;
  defineAssetBundle(bundleId, normalized);
  activateAssetBundle(bundleId);
  return { bundleId, assetIds: normalized, release: () => releaseAssetBundle(bundleId) };
}

function hashAssetIds(assetIds) {
  let hash = 2166136261;
  for (const char of assetIds.slice().sort().join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
