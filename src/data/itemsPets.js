// 消耗道具資料庫（10 種）
// 每筆包含：id, name, type, rarity, stats(效果數值), description, lv5_effect(升級/強化版效果)
export const ITEMS = [
  {
    id: 'item_01', name: 'Basic Puzzle Card', nameZh: '基礎解謎卡', type: 'consumable', rarity: 'Green', effectId: 'item.math_heal.basic',
    stats: { effect: 'mathHeal', healPercent: 30, difficulty: 'easy' },
    description: '完成簡單數學題後恢復 30% 生命；Lv5 正確時再恢復 15% 魔力。',
    lv5_effect: '答對時額外恢復 15% 魔力。',
  },
  {
    id: 'item_02', name: 'Advanced Puzzle Card', nameZh: '高階解謎卡', type: 'consumable', rarity: 'Blue', effectId: 'item.math_heal.advanced',
    stats: { effect: 'mathHeal', healPercent: 100, difficulty: 'hard' },
    description: '完成高階數學題後完全恢復生命；答錯仍可恢復 40% 生命。',
    lv5_effect: '答錯時仍恢復 40% 生命。',
  },
  {
    id: 'item_03', name: 'Red Potion', nameZh: '紅色藥水', type: 'consumable', rarity: 'Green', effectId: 'item.heal.hp',
    stats: { effect: 'healHp', healPercent: 50 }, description: '立即恢復最大生命的 50%。', lv5_effect: '保留為未來藥水強化欄位。',
  },
  {
    id: 'item_04', name: 'Blue Potion', nameZh: '藍色藥水', type: 'consumable', rarity: 'Green', effectId: 'item.heal.mp',
    stats: { effect: 'healMp', healPercent: 50 }, description: '立即恢復最大魔力的 50%，下一次魔法消耗減半。', lv5_effect: '下一次魔法消耗減半。',
  },
  {
    id: 'item_05', name: 'Gale Potion', nameZh: '疾風藥水', type: 'consumable', rarity: 'Blue', effectId: 'item.buff.speed',
    stats: { effect: 'buffSpeed', amount: 0.5, duration: 20 }, description: '移動速度提高 50%，持續 20 個遊戲分鐘。', lv5_effect: '正式強化資料尚未開放。',
  },
  {
    id: 'item_06', name: 'Might Potion', nameZh: '力量藥水', type: 'consumable', rarity: 'Blue', effectId: 'item.buff.attack',
    stats: { effect: 'buffAtk', amount: 0.5, duration: 20 }, description: '攻擊提高 50% 並增加 20% 爆擊率，持續 20 個遊戲分鐘。', lv5_effect: '正式強化資料尚未開放。',
  },
  {
    id: 'item_07', name: 'Guardian Scroll', nameZh: '守護卷軸', type: 'consumable', rarity: 'Orange', effectId: 'item.buff.guardian',
    stats: { effect: 'invincible', duration: 10 }, description: '啟動守護結界 10 個遊戲分鐘，阻擋傷害並反射 50%。', lv5_effect: '守護期間反射 50% 被阻擋傷害。',
  },
  {
    id: 'item_08', name: 'Warp Scroll', nameZh: '傳送卷軸', type: 'consumable', rarity: 'Green', effectId: 'item.teleport.village',
    stats: { effect: 'teleport', target: 'village' }, description: '透過正式場景轉場返回星光村並完全恢復體力。', lv5_effect: '抵達時完全恢復體力。',
  },
  {
    id: 'item_09', name: 'Universal Bait', nameZh: '萬用魚餌', type: 'consumable', rarity: 'Blue', effectId: 'item.fishing.rare_guarantee',
    stats: { effect: 'fishing', guarantee: 'rare' }, description: '下一次釣魚至少獲得稀有魚，並有 8% 機率升級為傳說魚。', lv5_effect: '包含傳說魚升級機率。',
  },
  {
    id: 'item_10', name: 'Growth Powder', nameZh: '成長粉', type: 'consumable', rarity: 'Orange', effectId: 'item.farm.instant_grow',
    stats: { effect: 'instantGrow' }, description: '立即讓農場中一株尚未成熟的作物成熟。', lv5_effect: '正式 3×3 強化版本尚未開放，介面不再誤導。',
  },
];

// 寵物資料庫（10 種）
// 每筆包含：id, name, level, exp, currentSkill, appearance(外觀類型), skillType, rarity, description
// 技能庫：Healing(每20s回血) / Empower(機率加ATK) / Swift(跑速Buff)
export const PET_SKILLS = {
  Healing: { name: 'Healing', desc: 'Restores HP every 20 seconds.', interval: 20, healPercent: 8 },
  Empower: { name: 'Empower', desc: 'Chance to raise ATK on attack.', chance: 0.2, atkBonus: 0.15 },
  Swift: { name: 'Swift', desc: 'Passive move speed buff.', speedBonus: 0.12 },
};

export const PETS = [
  {
    id: 'pet_01', name: 'Lumo the Light Sprite', level: 1, exp: 0,
    currentSkill: 'Healing', skillType: 'Healing', appearance: 'lightOrb',
    rarity: 'Blue', description: 'A glowing orb that mends its master over time.',
  },
  {
    id: 'pet_02', name: 'Bolt the Cube Bot', level: 1, exp: 0,
    currentSkill: 'Empower', skillType: 'Empower', appearance: 'cubeRobot',
    rarity: 'Blue', description: 'A blocky machine that supercharges attacks.',
  },
  {
    id: 'pet_03', name: 'Ember the Baby Dragon', level: 1, exp: 0,
    currentSkill: 'Empower', skillType: 'Empower', appearance: 'babyDragon',
    rarity: 'Orange', description: 'A tiny dragon whose roar empowers its ally.',
  },
  {
    id: 'pet_04', name: 'Dewdrop the Slime', level: 1, exp: 0,
    currentSkill: 'Healing', skillType: 'Healing', appearance: 'slime',
    rarity: 'Green', description: 'A gentle slime that oozes healing dew.',
  },
  {
    id: 'pet_05', name: 'Zephyr the Wind Fox', level: 1, exp: 0,
    currentSkill: 'Swift', skillType: 'Swift', appearance: 'fox',
    rarity: 'Blue', description: 'A breezy fox that quickens your step.',
  },
  {
    id: 'pet_06', name: 'Pip the Star Chick', level: 1, exp: 0,
    currentSkill: 'Swift', skillType: 'Swift', appearance: 'chick',
    rarity: 'Green', description: 'A cheerful chick that pep-talks you into speed.',
  },
  {
    id: 'pet_07', name: 'Terra the Rock Turtle', level: 1, exp: 0,
    currentSkill: 'Healing', skillType: 'Healing', appearance: 'turtle',
    rarity: 'Blue', description: 'A sturdy turtle radiating steady recovery.',
  },
  {
    id: 'pet_08', name: 'Sparky the Thunder Mouse', level: 1, exp: 0,
    currentSkill: 'Empower', skillType: 'Empower', appearance: 'mouse',
    rarity: 'Blue', description: 'An electric mouse that jolts your weapon.',
  },
  {
    id: 'pet_09', name: 'Coral the Sea Spirit', level: 1, exp: 0,
    currentSkill: 'Healing', skillType: 'Healing', appearance: 'seaSpirit',
    rarity: 'Orange', description: 'A tidal spirit that soothes wounds with mist.',
  },
  {
    id: 'pet_10', name: 'Nimbus the Cloud Cat', level: 1, exp: 0,
    currentSkill: 'Swift', skillType: 'Swift', appearance: 'cat',
    rarity: 'Orange', description: 'A floating cat that carries you on the wind.',
  },
];
