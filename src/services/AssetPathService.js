// v0.29.1 Canonical 資產路徑唯一解析服務。
// 正式 Runtime 只接受 assetId 或 Registry Asset 物件；禁止元件與資料檔直接傳入 /models/... 路徑。
import { getCanonicalAsset } from '../data/productionAssetCatalog.js';

export function getCanonicalPath(assetRef) {
  const asset = resolveCanonicalAsset(assetRef);
  return asset?.canonicalPath ? stripKnownBase(asset.canonicalPath) : null;
}

export function resolveAssetUrl(assetRef, baseUrl = null) {
  const canonicalPath = getCanonicalPath(assetRef);
  if (!canonicalPath) return null;
  const resolvedBase = normalizeBaseUrl(baseUrl ?? import.meta.env?.BASE_URL ?? '/');
  return `${resolvedBase}${canonicalPath}`;
}


export function resolvePublicAssetUrl(relativePath, baseUrl = null) {
  const path = stripKnownBase(relativePath);
  if (!path) return null;
  const resolvedBase = normalizeBaseUrl(baseUrl ?? import.meta.env?.BASE_URL ?? '/');
  return `${resolvedBase}${path}`;
}

export function resolveAssetDescriptor(assetRef, baseUrl = null) {
  const asset = resolveCanonicalAsset(assetRef);
  const canonicalPath = asset ? getCanonicalPath(asset) : null;
  return {
    asset,
    assetId: asset?.assetId || null,
    canonicalPath,
    url: canonicalPath ? resolveAssetUrl(asset, baseUrl) : null,
  };
}

export function isCanonicalAssetRef(assetRef) {
  return Boolean(resolveCanonicalAsset(assetRef));
}

function resolveCanonicalAsset(assetRef) {
  if (!assetRef) return null;
  if (typeof assetRef === 'string') return getCanonicalAsset(assetRef);
  if (assetRef.assetId) return getCanonicalAsset(assetRef.assetId) || null;
  return null;
}

function normalizeBaseUrl(value) {
  const base = String(value || '/').trim();
  if (!base || base === './') return './';
  return `${base.startsWith('/') ? base : `/${base}`}`.replace(/\/+$/, '/');
}

function stripKnownBase(value) {
  let path = String(value || '').trim().replace(/^\.\//, '').replace(/^\/+/, '');
  const configuredBase = String(import.meta.env?.BASE_URL || '').replace(/^\/+|\/+$/g, '');
  if (configuredBase && path.startsWith(`${configuredBase}/`)) path = path.slice(configuredBase.length + 1);
  return path;
}
