// 資料庫匯總入口（barrel）
import { WEAPONS_MELEE } from './weaponsMelee.js';
import { WEAPONS_RANGED } from './weaponsRanged.js';
import { ARMORS, ARMOR_SET_META } from './armors.js';
import { ITEMS, PETS, PET_SKILLS } from './itemsPets.js';
import { REGION_CRAFTS, REGION_MATERIALS } from './regionGameplayProfiles.js';
import {
  V032_ARMOR_COMPLETION_DEFINITIONS,
  V032_OFFHAND_DEFINITIONS,
} from './equipmentCombatV032Catalog.js';

// 種子/作物資料庫（10 種）— growthDuration 單位毫秒，供 Date.now() 差值運算
// mature 形狀/顏色供牧場程序化外觀使用
export const SEEDS = [
  { id: 'seed_01', name: 'Turnip Seed', nameZh: '蕪菁種子', crop: '蕪菁', rarity: 'Green', growthDuration: 60000, matureShape: 'sphere', matureColor: '#e8e0c0', sellPrice: 15, seasons: ['spring'], greenhouseAllowed: true },
  { id: 'seed_02', name: 'Carrot Seed', nameZh: '胡蘿蔔種子', crop: '胡蘿蔔', rarity: 'Green', growthDuration: 90000, matureShape: 'cone', matureColor: '#e88a2a', sellPrice: 20, seasons: ['spring', 'autumn'], greenhouseAllowed: true },
  { id: 'seed_03', name: 'Potato Seed', nameZh: '馬鈴薯種子', crop: '馬鈴薯', rarity: 'Green', growthDuration: 120000, matureShape: 'sphere', matureColor: '#b08040', sellPrice: 25, seasons: ['spring'], greenhouseAllowed: true },
  { id: 'seed_04', name: 'Tomato Seed', nameZh: '番茄種子', crop: '番茄', rarity: 'Blue', growthDuration: 150000, matureShape: 'sphere', matureColor: '#e83a2a', sellPrice: 35, seasons: ['summer'], greenhouseAllowed: true },
  { id: 'seed_05', name: 'Corn Seed', nameZh: '玉米種子', crop: '玉米', rarity: 'Blue', growthDuration: 180000, matureShape: 'cylinder', matureColor: '#e8c83a', sellPrice: 40, seasons: ['summer'], greenhouseAllowed: true },
  { id: 'seed_06', name: 'Pumpkin Seed', nameZh: '南瓜種子', crop: '南瓜', rarity: 'Blue', growthDuration: 240000, matureShape: 'sphere', matureColor: '#e8801a', sellPrice: 60, seasons: ['autumn'], greenhouseAllowed: true },
  { id: 'seed_07', name: 'Melon Seed', nameZh: '甜瓜種子', crop: '甜瓜', rarity: 'Blue', growthDuration: 300000, matureShape: 'sphere', matureColor: '#7ac74f', sellPrice: 80, seasons: ['summer'], greenhouseAllowed: true },
  { id: 'seed_08', name: 'Berry Seed', nameZh: '莓果種子', crop: '莓果', rarity: 'Green', growthDuration: 75000, matureShape: 'sphere', matureColor: '#8a2a6a', sellPrice: 22, seasons: ['spring', 'autumn'], greenhouseAllowed: true },
  { id: 'seed_09', name: 'Sunflower Seed', nameZh: '向日葵種子', crop: '向日葵', rarity: 'Orange', growthDuration: 360000, matureShape: 'cone', matureColor: '#e8d23a', sellPrice: 120, seasons: ['summer'], greenhouseAllowed: true },
  { id: 'seed_10', name: 'Star Fruit Seed', nameZh: '星光果種子', crop: '星光果', rarity: 'Orange', growthDuration: 420000, matureShape: 'sphere', matureColor: '#c0e83a', sellPrice: 150, seasons: ['winter'], greenhouseAllowed: true },
];

// 加工原料/成品（起司機、美乃滋機、紡織機用）
export const MATERIALS = [
  { id: 'mat_milk', name: '牛奶',   type: 'raw',       sellPrice: 30 },
  { id: 'mat_egg',  name: '雞蛋',    type: 'raw',       sellPrice: 20 },
  { id: 'mat_wool', name: '羊毛',   type: 'raw',       sellPrice: 25 },
  { id: 'mat_cheese',    name: '起司',    type: 'processed', from: 'mat_milk', sellPrice: 90 },
  { id: 'mat_mayo',      name: '美乃滋', type: 'processed', from: 'mat_egg',  sellPrice: 60 },
  { id: 'mat_cloth',     name: '布料',     type: 'processed', from: 'mat_wool', sellPrice: 75 },
  { id: 'mat_stone',     name: '石材',     type: 'raw',       sellPrice: 5 },
  { id: 'mat_wood',      name: '木材',      type: 'raw',       sellPrice: 5 },
  { id: 'mat_animal_feed', name: '營養飼料', type: 'farmSupply', rarity: 'Green', sellPrice: 4, buyPrice: 12, description: '照顧農場動物時消耗一袋，提升飽足與健康。' },
  { id: 'fish_sparkle_carp', name: '星光鯉魚', type: 'fish', rarity: 'Green', sellPrice: 35 },
  { id: 'fish_prism_trout', name: '稜鏡鱒魚', type: 'fish', rarity: 'Blue', sellPrice: 90 },
  { id: 'fish_rainbow_spirit', name: '彩虹魚靈', type: 'fish', rarity: 'Orange', sellPrice: 220 },
  ...REGION_MATERIALS,
];

// 全部武器合併方便查詢
export const WEAPONS = [...WEAPONS_MELEE, ...WEAPONS_RANGED];
export const EQUIPMENT_V032 = [...V032_ARMOR_COMPLETION_DEFINITIONS, ...V032_OFFHAND_DEFINITIONS];

// 統一 by-id 查詢表（避免各處重複 find）
export const DB = {};
[...WEAPONS, ...ARMORS, ...EQUIPMENT_V032, ...ITEMS, ...PETS, ...SEEDS, ...MATERIALS, ...REGION_CRAFTS].forEach((o) => {
  DB[o.id] = o;
});

export {
  WEAPONS_MELEE,
  WEAPONS_RANGED,
  ARMORS,
  ARMOR_SET_META,
  V032_ARMOR_COMPLETION_DEFINITIONS,
  V032_OFFHAND_DEFINITIONS,
  ITEMS,
  PETS,
  PET_SKILLS,
  REGION_CRAFTS,
  REGION_MATERIALS,
};
