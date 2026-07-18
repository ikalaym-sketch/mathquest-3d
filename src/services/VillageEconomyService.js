// v0.28 村莊經濟與委託服務：農場出貨會改變市場等級、貨架與每週委託。
import {
  ARMORS,
  DB,
  ITEMS,
  SEEDS,
  V032_ARMOR_COMPLETION_DEFINITIONS,
  V032_OFFHAND_DEFINITIONS,
  WEAPONS,
} from '../data/index.js';

export const INITIAL_VILLAGE_ECONOMY = Object.freeze({
  schemaVersion: 1,
  totalShipmentGold: 0,
  totalShipmentItems: 0,
  shippedByItem: {},
  marketTier: 1,
  lastShipmentDay: 0,
  activeWeek: 0,
  commissions: [],
  acceptedCommissionIds: [],
  completedCommissionIds: [],
  attendedFestivalIds: [],
});

const COMMISSION_TEMPLATES = [
  { id: 'bakery_turnip', requesterId: 'resident_01', itemId: 'seed_01', quantity: 3, rewardGold: 90, label: '早餐用蕪菁' },
  { id: 'bakery_milk', requesterId: 'resident_01', itemId: 'mat_milk', quantity: 2, rewardGold: 120, label: '新鮮牛奶' },
  { id: 'garden_berry', requesterId: 'resident_02', itemId: 'seed_08', quantity: 3, rewardGold: 100, label: '花園莓果' },
  { id: 'market_corn', requesterId: 'vendor_helper', itemId: 'seed_05', quantity: 4, rewardGold: 180, label: '市場玉米' },
  { id: 'smith_ore', requesterId: 'blacksmith', itemId: 'mat_sun_ore', quantity: 2, rewardGold: 220, label: '日耀礦補給' },
  { id: 'carpenter_wood', requesterId: 'carpenter', itemId: 'mat_wood', quantity: 5, rewardGold: 130, label: '修繕木材' },
  { id: 'student_carrot', requesterId: 'child_01', itemId: 'seed_02', quantity: 3, rewardGold: 90, label: '觀察用胡蘿蔔' },
  { id: 'traveler_fish', requesterId: 'traveler_01', itemId: 'fish_prism_trout', quantity: 1, rewardGold: 160, label: '旅行料理魚材' },
];

export function normalizeVillageEconomy(value = {}) {
  return {
    ...INITIAL_VILLAGE_ECONOMY,
    ...value,
    shippedByItem: { ...(value.shippedByItem || {}) },
    commissions: Array.isArray(value.commissions) ? value.commissions : [],
    acceptedCommissionIds: [...new Set(value.acceptedCommissionIds || [])],
    completedCommissionIds: [...new Set(value.completedCommissionIds || [])],
    attendedFestivalIds: [...new Set(value.attendedFestivalIds || [])],
  };
}

export function recordVillageShipment(economy, products, totalGold, dayIndex) {
  const next = normalizeVillageEconomy(economy);
  const shippedByItem = { ...next.shippedByItem };
  let itemCount = 0;
  for (const product of products || []) {
    const quantity = Math.max(1, Number(product.quantity) || 1);
    shippedByItem[product.itemId] = (shippedByItem[product.itemId] || 0) + quantity;
    itemCount += quantity;
  }
  const totalShipmentGold = next.totalShipmentGold + Math.max(0, Number(totalGold) || 0);
  return {
    ...next,
    shippedByItem,
    totalShipmentGold,
    totalShipmentItems: next.totalShipmentItems + itemCount,
    marketTier: totalShipmentGold >= 6000 ? 4 : totalShipmentGold >= 2500 ? 3 : totalShipmentGold >= 800 ? 2 : 1,
    lastShipmentDay: Math.max(1, Number(dayIndex) || 1),
  };
}

export function ensureWeeklyCommissions(economy, dayIndex = 1) {
  const next = normalizeVillageEconomy(economy);
  const week = Math.floor((Math.max(1, Number(dayIndex) || 1) - 1) / 7) + 1;
  if (next.activeWeek === week && next.commissions.length) return next;
  const rotated = [...COMMISSION_TEMPLATES]
    .sort((a, b) => stableScore(`${week}:${a.id}`) - stableScore(`${week}:${b.id}`))
    .slice(0, 4)
    .map((template) => ({ ...template, runId: `${template.id}:week:${week}`, week }));
  return { ...next, activeWeek: week, commissions: rotated, acceptedCommissionIds: [], completedCommissionIds: [] };
}

export function getVillageShopStock({ economy, dayIndex = 1, unlockedBlueprints = [] }) {
  const state = ensureWeeklyCommissions(economy, dayIndex);
  const tier = state.marketTier;
  const weekday = (Math.max(1, Number(dayIndex) || 1) - 1) % 7;
  const weapons = WEAPONS.filter((item) => item.rarity !== 'Orange').slice(0, tier + 2);
  const armors = ARMORS.filter((item) => item.rarity !== 'Orange' && item.slot === 'body').slice(0, Math.min(4, tier + 1));
  const items = ITEMS.slice(0, Math.min(ITEMS.length, 4 + tier * 2));
  const seeds = SEEDS.filter((seed, index) => index < 3 + tier * 2 || state.shippedByItem[seed.id] > 0);
  const rotationIds = [
    ['mat_animal_feed', 'seed_08'], ['item_09', 'seed_04'], ['item_05', 'seed_05'],
    ['item_10', 'seed_06'], ['item_06', 'seed_07'], ['item_07', 'seed_09'], ['item_08', 'seed_10'],
  ][weekday];
  const rotation = rotationIds.map((id) => DB[id]).filter(Boolean);
  const orange = unlockedBlueprints.length
    ? [...WEAPONS.filter((item) => item.rarity === 'Orange'), ...ARMORS.filter((item) => item.rarity === 'Orange' && item.slot === 'body')]
    : [];
  const v032Pool = [...V032_ARMOR_COMPLETION_DEFINITIONS, ...V032_OFFHAND_DEFINITIONS]
    .filter((item) => item.rarity !== 'Orange' || unlockedBlueprints.length);
  const v032Start = ((Math.max(1, Number(dayIndex) || 1) - 1) * 4) % Math.max(1, v032Pool.length);
  const v032Rotation = Array.from({ length: Math.min(4, v032Pool.length) }, (_, index) => v032Pool[(v032Start + index) % v032Pool.length]);
  return dedupe([...orange, ...weapons, ...armors, ...v032Rotation, ...items, ...seeds, ...rotation]);
}

export function canCompleteCommission(commission, inventory) {
  if (!commission) return false;
  if (inventory.farmProducts?.some((entry) => entry.itemId === commission.itemId)) {
    const count = inventory.farmProducts.filter((entry) => entry.itemId === commission.itemId).reduce((sum, entry) => sum + (entry.quantity || 1), 0);
    return count >= commission.quantity;
  }
  for (const category of ['materials', 'seeds', 'items']) {
    const count = (inventory[category] || []).filter((id) => id === commission.itemId).length;
    if (count >= commission.quantity) return true;
  }
  return false;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => item && !seen.has(item.id) && seen.add(item.id));
}

function stableScore(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
