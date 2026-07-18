// v0.29.1 場景資產分包與 Residency 服務。
// 同一 assetId 可同時被核心角色、區域、室內、戰鬥或活動包引用；只有所有 Bundle 都釋放後才清除快取。
import { releaseRuntimeBundleAsset, retainRuntimeBundleAsset } from './AssetRuntimeService.js';

const bundleDefinitions = new Map();
const activeBundleCounts = new Map();
const assetReferenceCounts = new Map();

export function defineAssetBundle(bundleId, assetIds = []) {
  const normalized = [...new Set(assetIds.filter(Boolean))];
  bundleDefinitions.set(bundleId, Object.freeze(normalized));
  return normalized;
}

export function activateAssetBundle(bundleId) {
  const assets = bundleDefinitions.get(bundleId) || [];
  const bundleCount = (activeBundleCounts.get(bundleId) || 0) + 1;
  activeBundleCounts.set(bundleId, bundleCount);
  if (bundleCount > 1) return assets;
  for (const assetId of assets) {
    const nextCount = (assetReferenceCounts.get(assetId) || 0) + 1;
    assetReferenceCounts.set(assetId, nextCount);
    if (nextCount === 1) retainRuntimeBundleAsset(assetId);
  }
  return assets;
}

export function releaseAssetBundle(bundleId) {
  const assets = bundleDefinitions.get(bundleId) || [];
  const currentCount = activeBundleCounts.get(bundleId) || 0;
  if (currentCount <= 0) return assets;
  if (currentCount === 1) activeBundleCounts.delete(bundleId);
  else {
    activeBundleCounts.set(bundleId, currentCount - 1);
    return assets;
  }
  for (const assetId of assets) {
    const nextCount = Math.max(0, (assetReferenceCounts.get(assetId) || 0) - 1);
    if (nextCount === 0) {
      assetReferenceCounts.delete(assetId);
      releaseRuntimeBundleAsset(assetId);
    } else assetReferenceCounts.set(assetId, nextCount);
  }
  return assets;
}

export function replaceActiveAssetBundles(previousBundleIds = [], nextBundleIds = []) {
  const previous = new Set(previousBundleIds);
  const next = new Set(nextBundleIds);
  next.forEach((bundleId) => { if (!previous.has(bundleId)) activateAssetBundle(bundleId); });
  previous.forEach((bundleId) => { if (!next.has(bundleId)) releaseAssetBundle(bundleId); });
}

export function getAssetBundleResidencySnapshot() {
  return {
    bundles: Object.fromEntries(activeBundleCounts),
    assets: Object.fromEntries(assetReferenceCounts),
  };
}
