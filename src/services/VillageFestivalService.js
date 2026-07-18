// v0.28 村莊季節活動：四季各一場，需求、報酬與完成窗口集中管理。
import { getSeasonSnapshot } from './SeasonCropService.js';

const FESTIVALS = Object.freeze({
  spring: { id: 'spring_produce_fair', name: '春芽農產品市集', icon: '🌱', itemId: 'seed_01', quantity: 3, rewardGold: 180, description: '帶著新鮮蕪菁參加市集，村民會分享春季種植心得。' },
  summer: { id: 'summer_companion_picnic', name: '夏日夥伴野餐會', icon: '🧺', itemId: 'seed_08', quantity: 2, rewardGold: 220, description: '準備莓果與守護夥伴一起參加河畔野餐。' },
  autumn: { id: 'autumn_harvest_math', name: '秋收數學祭', icon: '🎃', itemId: 'seed_09', quantity: 2, rewardGold: 260, description: '以南瓜展示收穫數量、重量與排列方式。' },
  winter: { id: 'winter_crystal_lantern', name: '冬夜水晶燈節', icon: '🏮', itemId: 'mat_lake_crystal', quantity: 2, rewardGold: 320, description: '使用湖光水晶點亮村莊，和居民回顧一年旅程。' },
});

export function getVillageFestival(dayIndex = 1) {
  const season = getSeasonSnapshot(dayIndex);
  const template = FESTIVALS[season.id];
  const year = Math.floor((Math.max(1, dayIndex) - 1) / 112) + 1;
  const active = season.dayOfSeason >= 20 && season.dayOfSeason <= 22;
  const daysUntil = season.dayOfSeason < 20 ? 20 - season.dayOfSeason : season.dayOfSeason > 22 ? 28 - season.dayOfSeason + 20 : 0;
  return { ...template, runId: `${template.id}:year:${year}`, seasonId: season.id, seasonLabel: season.label, dayOfSeason: season.dayOfSeason, active, daysUntil };
}

export function canCompleteVillageFestival(festival, inventory) {
  if (!festival?.active) return false;
  return countInventoryItem(inventory, festival.itemId) >= festival.quantity;
}

export function countInventoryItem(inventory = {}, itemId) {
  const farmCount = (inventory.farmProducts || []).filter((entry) => entry.itemId === itemId).reduce((sum, entry) => sum + (entry.quantity || 1), 0);
  const standard = ['materials', 'seeds', 'items'].reduce((sum, category) => sum + (inventory[category] || []).filter((id) => id === itemId).length, 0);
  return farmCount + standard;
}
