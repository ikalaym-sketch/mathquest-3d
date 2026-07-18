import { useGLTF } from '@react-three/drei';
import { resolveAssetUrl } from './AssetPathService.js';
// v0.30.1 GLB Runtime 引用與GPU資源生命週期服務。
// Bundle預載與畫面實例共用同一份assetId引用計數；兩者都歸零後才允許清除useGLTF快取，
// 並對快取Scene持有的Geometry、Material與Texture各執行一次dispose，避免場景切換後GPU記憶體只升不降。

const runtimeEntries = new Map();
const CLEAR_DELAY_MS = 1500;

export function retainRuntimeAsset(assetId, url) {
  if (!assetId || !url) return () => {};
  const current = ensureEntry(assetId, url);
  cancelPendingClear(current);
  current.url = url;
  current.instanceReferenceCount += 1;
  return (clearCallback = null) => releaseRuntimeAsset(assetId, clearCallback);
}

export function releaseRuntimeAsset(assetId, clearCallback = null) {
  const current = runtimeEntries.get(assetId);
  if (!current) return;
  current.instanceReferenceCount = Math.max(0, current.instanceReferenceCount - 1);
  if (clearCallback) current.clearCallback = clearCallback;
  scheduleClearIfUnused(current);
}

export function retainRuntimeBundleAsset(assetId, options = {}) {
  const url = resolveAssetUrl(assetId);
  if (!assetId || !url) return null;
  const current = ensureEntry(assetId, url);
  cancelPendingClear(current);
  current.bundleReferenceCount += 1;
  if (options.preload !== false && current.bundleReferenceCount === 1) useGLTF.preload(url);
  return url;
}

export function releaseRuntimeBundleAsset(assetId) {
  const current = runtimeEntries.get(assetId);
  if (!current) return;
  current.bundleReferenceCount = Math.max(0, current.bundleReferenceCount - 1);
  scheduleClearIfUnused(current);
}

// Loader取得useGLTF共享Scene後登記原始資源；不得登記已套用實例材質的clone。
// 後續最後一個引用釋放時，只處理這份快取Scene，實例clone的材質與Atlas仍由各元件自己的cleanup負責。
export function registerRuntimeAssetResources(assetId, root, url = null) {
  if (!assetId || !root?.traverse) return false;
  const current = ensureEntry(assetId, url || resolveAssetUrl(assetId));
  current.resourceRoot = root;
  return true;
}

export function getAssetRuntimeResidencySnapshot() {
  return Array.from(runtimeEntries.values()).map((entry) => ({
    assetId: entry.assetId,
    url: entry.url,
    referenceCount: totalReferences(entry),
    instanceReferenceCount: entry.instanceReferenceCount,
    bundleReferenceCount: entry.bundleReferenceCount,
    pendingClear: Boolean(entry.clearTimer),
    hasRegisteredResources: Boolean(entry.resourceRoot),
  }));
}

export function preloadRuntimeAsset(assetId) {
  const url = resolveAssetUrl(assetId);
  if (url) useGLTF.preload(url);
  return url;
}

export function clearRuntimeAsset(assetId) {
  const url = resolveAssetUrl(assetId);
  if (!url) return null;
  const current = ensureEntry(assetId, url);
  if (totalReferences(current) === 0) scheduleClearIfUnused(current, 0);
  return url;
}

// 場景切換完成或系統收到記憶體壓力時可立即清理「引用已歸零」項目；
// 仍被Bundle或元件持有的資產永遠不會被此函式銷毀。
export function flushUnusedRuntimeAssets() {
  const disposed = [];
  for (const current of [...runtimeEntries.values()]) {
    if (totalReferences(current) > 0) continue;
    disposeRuntimeEntry(current);
    disposed.push(current.assetId);
  }
  return disposed;
}

function ensureEntry(assetId, url = null) {
  const existing = runtimeEntries.get(assetId);
  if (existing) {
    if (url) existing.url = url;
    return existing;
  }
  const entry = {
    assetId,
    url,
    instanceReferenceCount: 0,
    bundleReferenceCount: 0,
    clearTimer: null,
    clearCallback: null,
    resourceRoot: null,
  };
  runtimeEntries.set(assetId, entry);
  return entry;
}

function totalReferences(entry) {
  return entry.instanceReferenceCount + entry.bundleReferenceCount;
}

function cancelPendingClear(entry) {
  if (entry.clearTimer) clearTimeout(entry.clearTimer);
  entry.clearTimer = null;
}

function scheduleClearIfUnused(entry, delay = CLEAR_DELAY_MS) {
  if (totalReferences(entry) > 0) return;
  cancelPendingClear(entry);
  entry.clearTimer = setTimeout(() => {
    const latest = runtimeEntries.get(entry.assetId);
    if (!latest || totalReferences(latest) > 0) return;
    disposeRuntimeEntry(latest);
  }, delay);
}

function disposeRuntimeEntry(entry) {
  cancelPendingClear(entry);
  disposeObjectResources(entry.resourceRoot);
  if (entry.clearCallback) entry.clearCallback(entry.url);
  else if (entry.url) useGLTF.clear(entry.url);
  runtimeEntries.delete(entry.assetId);
}

function disposeObjectResources(root) {
  if (!root?.traverse) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((node) => {
    if (node.geometry?.dispose) geometries.add(node.geometry);
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of nodeMaterials) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture && value.dispose) textures.add(value);
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose?.();
  for (const geometry of geometries) geometry.dispose();
}
