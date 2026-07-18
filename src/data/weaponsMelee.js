// 近戰武器資料庫（10 種）
// 每筆包含：id, name, type, rarity(Green/Blue/Orange), stats, description, lv5_effect
// stats 說明：atk 攻擊力、atkSpeed 攻速倍率、range 有效距離、特殊數值視武器而定
import { WEAPON_LV5_EFFECT_IDS } from './runtimeEffects.js';
import { resolveWeaponCombatContract } from './combatArchetypes.js';
export const WEAPONS_MELEE = [
  {
    id: 'wpn_m_01',
    nameZh: '木製短劍',
    name: 'Wooden Shortsword',
    type: 'melee',
    rarity: 'Green',
    stats: { atk: 8, atkSpeed: 1.0, range: 1.2 },
    description: '平衡、容易上手的練習短劍。',
    lv5_effect: '攻擊有 10% 機率造成雙倍傷害。',
  },
  {
    id: 'wpn_m_02',
    nameZh: '雙子匕首',
    name: 'Twin Daggers',
    type: 'melee',
    rarity: 'Blue',
    stats: { atk: 6, atkSpeed: 1.5, range: 1.0, poison: 3 },
    description: '塗有弱毒的雙短刃，攻擊速度很快。',
    lv5_effect: '毒素可疊加 3 層並持續 8 秒。',
  },
  {
    id: 'wpn_m_03',
    nameZh: '英雄戰鎚',
    name: "Hero's Warhammer",
    type: 'melee',
    rarity: 'Blue',
    stats: { atk: 18, atkSpeed: 0.5, range: 1.4, stunChance: 0.25 },
    description: '沉重戰鎚，命中時有機率讓敵人短暫失去行動。',
    lv5_effect: '暈眩機率提高至 45%，並延長暈眩時間。',
  },
  {
    id: 'wpn_m_04',
    nameZh: '騎士長槍',
    name: 'Knight Lance',
    type: 'melee',
    rarity: 'Blue',
    stats: { atk: 14, atkSpeed: 0.8, range: 2.2, pierce: true },
    description: '攻擊距離長，適合保持安全間距。',
    lv5_effect: '攻擊距離增加 30%，並提高穿透能力。',
  },
  {
    id: 'wpn_m_05',
    nameZh: '狂戰巨斧',
    name: 'Berserker Greataxe',
    type: 'melee',
    rarity: 'Orange',
    stats: { atk: 22, atkSpeed: 0.6, range: 1.6, aoeArc: 120 },
    description: '以寬廣範圍攻擊附近多名敵人。',
    lv5_effect: '攻擊範圍與範圍傷害進一步提高。',
  },
  {
    id: 'wpn_m_06',
    nameZh: '貴族細劍',
    name: 'Noble Rapier',
    type: 'melee',
    rarity: 'Blue',
    stats: { atk: 10, atkSpeed: 1.3, range: 1.5, critChance: 0.2 },
    description: '攻擊迅速，較容易造成強力一擊。',
    lv5_effect: '強力一擊機率增加 20%，傷害倍率提高至 2.5 倍。',
  },
  {
    id: 'wpn_m_07',
    nameZh: '處刑巨劍',
    name: 'Executioner Greatsword',
    type: 'melee',
    rarity: 'Orange',
    stats: { atk: 30, atkSpeed: 0.45, range: 1.8 },
    description: '速度較慢，但具有極高的單次傷害。',
    lv5_effect: '攻擊生命高於一半的敵人時造成 50% 額外傷害。',
  },
  {
    id: 'wpn_m_08',
    nameZh: '收割者戰鐮',
    name: 'Reaper Scythe',
    type: 'melee',
    rarity: 'Orange',
    stats: { atk: 16, atkSpeed: 0.9, range: 1.7, lifesteal: 0.15 },
    description: '命中敵人時可恢復部分生命。',
    lv5_effect: '吸血提高至造成傷害的 30%。',
  },
  {
    id: 'wpn_m_09',
    nameZh: '野性雙斧',
    name: 'Savage Dual Axes',
    type: 'melee',
    rarity: 'Blue',
    stats: { atk: 9, atkSpeed: 1.4, range: 1.1, comboHits: 3 },
    description: '可連續揮擊並累積連擊節奏。',
    lv5_effect: '連擊延長為 5 段，最後一擊造成雙倍傷害。',
  },
  {
    id: 'wpn_m_10',
    nameZh: '鏡盾拳套',
    name: 'Iron Gauntlets',
    type: 'melee',
    rarity: 'Blue',
    stats: { atk: 11, atkSpeed: 1.1, range: 0.9, counter: 0.2 },
    description: '近身作戰用的強化拳套，可懲罰近身攻擊者。',
    lv5_effect: '受到近身怪物攻擊時，自動反擊 150% 的實際傷害。',
  },
];

const MELEE_EQUIPMENT_PROFILES = Object.freeze({
  wpn_m_01: { archetype: 'shortsword', handedness: 'one', animationSet: 'SwordOneHand' },
  wpn_m_02: { archetype: 'dual_daggers', handedness: 'dual', animationSet: 'DualBlade' },
  wpn_m_03: { archetype: 'warhammer', handedness: 'two', animationSet: 'HeavyHammer' },
  wpn_m_04: { archetype: 'lance', handedness: 'two', animationSet: 'Spear' },
  wpn_m_05: { archetype: 'greataxe', handedness: 'two', animationSet: 'HeavyAxe' },
  wpn_m_06: { archetype: 'rapier', handedness: 'one', animationSet: 'Rapier' },
  wpn_m_07: { archetype: 'greatsword', handedness: 'two', animationSet: 'Greatsword' },
  wpn_m_08: { archetype: 'scythe', handedness: 'two', animationSet: 'Scythe' },
  wpn_m_09: { archetype: 'dual_axes', handedness: 'dual', animationSet: 'DualAxe' },
  wpn_m_10: { archetype: 'gauntlets', handedness: 'dual', animationSet: 'Gauntlet' },
});

WEAPONS_MELEE.forEach((weapon) => {
  Object.assign(weapon, {
    equipSlot: 'mainHand',
    supportsOffHand: !['two', 'dual'].includes(MELEE_EQUIPMENT_PROFILES[weapon.id]?.handedness),
    visualAssetId: `equipment:weapon:${MELEE_EQUIPMENT_PROFILES[weapon.id]?.archetype || 'melee'}`,
    ...MELEE_EQUIPMENT_PROFILES[weapon.id],
    ...resolveWeaponCombatContract(weapon, MELEE_EQUIPMENT_PROFILES[weapon.id]?.archetype),
  });
  weapon.lv5EffectId = WEAPON_LV5_EFFECT_IDS[weapon.id] || null;
});
