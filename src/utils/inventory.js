// v0.4.0 背包輔助：計數與顯示
import { DB } from '../data/index.js';

// 將 id 陣列聚合為 [{ id, count, item }]（item 為 DB 物件）
export function aggregate(idArray) {
  const counts = {};
  idArray.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.entries(counts).map(([id, count]) => ({ id, count, item: DB[id] }));
}

// 稀有度 → 顏色
export function rarityColor(rarity) {
  return rarity === 'Orange' ? '#e8801a' : rarity === 'Blue' ? '#3a8ae8' : '#5ac74f';
}

// 物品可販售價格（種子/材料用 sellPrice；裝備用固定估值）
export function sellPrice(item) {
  if (!item) return 1;
  if (item.sellPrice) return item.sellPrice;
  if (item.rarity === 'Orange') return 200;
  if (item.rarity === 'Blue') return 80;
  return 30;
}

// 物品購買價格（販售價 x2.5）
export function buyPrice(item) {
  return Math.round(sellPrice(item) * 2.5);
}
