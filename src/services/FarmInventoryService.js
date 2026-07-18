// v0.27.0 農產品實例服務。
// 有品質、日期與單價的農產品禁止再壓平為單純 ID 陣列。
import { DB } from '../data/index.js';

export const QUALITY_MULTIPLIER = Object.freeze({ normal: 1, good: 1.2, high: 1.5, star: 2 });
export const QUALITY_LABEL = Object.freeze({ normal: '一般', good: '良好', high: '優良', star: '星級' });

export function createFarmProductInstance({ itemId, quantity = 1, quality = 'normal', worldMinute = 0, sourceType = 'crop', unitValue = null, metadata = {} }) {
  const item = DB[itemId];
  if (!item) throw new Error(`Unknown farm product item: ${itemId}`);
  const safeQuality = QUALITY_MULTIPLIER[quality] ? quality : 'normal';
  const value = Number.isFinite(unitValue) ? unitValue : Math.round((item.sellPrice || 1) * QUALITY_MULTIPLIER[safeQuality]);
  return {
    instanceId: `farm_${itemId}_${Math.round(worldMinute)}_${Math.random().toString(36).slice(2, 9)}`,
    itemId,
    quantity: Math.max(1, Math.floor(quantity)),
    quality: safeQuality,
    unitValue: Math.max(1, Math.round(value)),
    harvestedWorldMinute: Math.max(0, Number(worldMinute) || 0),
    sourceType,
    metadata: { ...metadata },
  };
}

export function normalizeFarmProductInstance(value, fallbackWorldMinute = 0) {
  if (typeof value === 'string') return createFarmProductInstance({ itemId: value, worldMinute: fallbackWorldMinute, quality: 'normal', sourceType: 'legacy' });
  if (!value?.itemId || !DB[value.itemId]) return null;
  return {
    ...value,
    instanceId: value.instanceId || `farm_${value.itemId}_${Math.round(fallbackWorldMinute)}_${Math.random().toString(36).slice(2, 9)}`,
    quantity: Math.max(1, Math.floor(Number(value.quantity) || 1)),
    quality: QUALITY_MULTIPLIER[value.quality] ? value.quality : 'normal',
    unitValue: Math.max(1, Math.round(Number(value.unitValue) || (DB[value.itemId].sellPrice || 1))),
    harvestedWorldMinute: Math.max(0, Number(value.harvestedWorldMinute) || fallbackWorldMinute),
    sourceType: value.sourceType || 'legacy',
    metadata: { ...(value.metadata || {}) },
  };
}

export function calculateShipment(products = []) {
  const valid = products.map((product) => normalizeFarmProductInstance(product)).filter(Boolean);
  return {
    itemCount: valid.reduce((sum, product) => sum + product.quantity, 0),
    totalGold: valid.reduce((sum, product) => sum + product.unitValue * product.quantity, 0),
    products: valid,
  };
}

export function removeFarmProductByInstance(products, instanceId, quantity = 1) {
  let remaining = Math.max(1, Math.floor(quantity));
  const next = [];
  let removed = null;
  for (const product of products || []) {
    if (product.instanceId !== instanceId || remaining <= 0) {
      next.push(product);
      continue;
    }
    const take = Math.min(product.quantity, remaining);
    removed = { ...product, quantity: take };
    remaining -= take;
    if (product.quantity > take) next.push({ ...product, quantity: product.quantity - take });
  }
  return { next, removed };
}

export function aggregateFarmProducts(products = []) {
  const groups = new Map();
  products.map((product) => normalizeFarmProductInstance(product)).filter(Boolean).forEach((product) => {
    const key = `${product.itemId}:${product.quality}:${product.unitValue}`;
    const current = groups.get(key) || { ...product, quantity: 0 };
    current.quantity += product.quantity;
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => b.quality.localeCompare(a.quality) || a.itemId.localeCompare(b.itemId));
}
