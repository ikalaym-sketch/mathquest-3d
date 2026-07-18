// 防具資料庫（10 套 × 4 部位 = 40 件）
import { ARMOR_SET_EFFECTS } from './runtimeEffects.js';
// 以「套裝定義」為單一真實來源，展開成 40 個獨立部位物件，
// 避免手抄 40 次造成不一致；展開結果即為完整資料，非佔位符。

// 每個部位的基礎防禦係數（頭/身/手/腿佔比不同）

const HIDDEN_BODY_NODES_BY_SLOT = Object.freeze({
  head: ['hair', 'head_accessory'],
  body: ['torso', 'trim'],
  hands: ['lower_arm_l', 'lower_arm_r', 'hand_l', 'hand_r'],
  legs: ['upper_leg_l', 'upper_leg_r', 'lower_leg_l', 'lower_leg_r'],
});

const SLOT_DEF = {
  head: { label: 'Helm', labelZh: '頭盔', defRatio: 0.25 },
  body: { label: 'Armor', labelZh: '上衣', defRatio: 0.4 },
  hands: { label: 'Gauntlets', labelZh: '手套', defRatio: 0.15 },
  legs: { label: 'Greaves', labelZh: '護腿', defRatio: 0.2 },
};

// 10 套裝定義：baseDef 為整套總防禦，色碼供紙娃娃染色使用
const ARMOR_SETS = [
  {
    key: 'leather', nameZh: '皮革', name: 'Leather', rarity: 'Green', baseDef: 20, color: '#8a5a2b',
    setBonus: '移動速度提高 10%。',
    lv5_effect: '移動速度提高 20%。',
    desc: 'Light hide gear favored by scouts.',
  },
  {
    key: 'spike', nameZh: '棘刺', name: 'Spiked', rarity: 'Blue', baseDef: 30, color: '#556070',
    setBonus: '受到傷害時反射 15% 給攻擊者。',
    lv5_effect: '反射提高至 30%。',
    desc: 'Barbed plating that punishes those who strike it.',
  },
  {
    key: 'vampire', nameZh: '夜影', name: 'Vampire', rarity: 'Orange', baseDef: 28, color: '#4a1020',
    setBonus: '攻擊命中時恢復造成傷害的 5%。',
    lv5_effect: '吸血提高至造成傷害的 12%。',
    desc: 'Cursed regalia that feeds on the blood of foes.',
  },
  {
    key: 'scholar', nameZh: '學者', name: 'Scholar', rarity: 'Blue', baseDef: 22, color: '#2a3a6a',
    setBonus: '數學挑戰會移除 1 個錯誤選項。',
    lv5_effect: '數學挑戰會移除 2 個錯誤選項。',
    desc: 'Robes woven for those who solve rather than swing.',
  },
  {
    key: 'paladin', nameZh: '聖光騎士', name: 'Paladin', rarity: 'Orange', baseDef: 36, color: '#c9b477',
    setBonus: '離開戰鬥 6 秒後，每秒恢復 1.2 點生命。',
    lv5_effect: '恢復提高為每秒 2.4 點，並提前至 4 秒開始。',
    desc: 'Holy plate blessed with restorative light.',
  },
  {
    key: 'ninja', nameZh: '忍者', name: 'Ninja', rarity: 'Orange', baseDef: 24, color: '#1c1c24',
    setBonus: '翻滾無敵時間延長。',
    lv5_effect: '翻滾無敵時間進一步延長。',
    desc: 'Silent garb built for evasion over defense.',
  },
  {
    key: 'farmer', nameZh: '豐收農夫', name: 'Farmer', rarity: 'Green', baseDef: 18, color: '#7a9a3a',
    setBonus: '收成數量提高 20%。',
    lv5_effect: '收成數量提高 40%，澆水效果多維持一個遊戲日。',
    desc: 'Sturdy work clothes that bless the harvest.',
  },
  {
    key: 'mage', nameZh: '星光法師', name: 'Mage', rarity: 'Blue', baseDef: 20, color: '#5a2a8a',
    setBonus: '每秒恢復 1 點魔力。',
    lv5_effect: '每秒恢復 2 點魔力，魔法消耗降低 20%。',
    desc: 'Arcane vestments humming with raw mana.',
  },
  {
    key: 'berserker', nameZh: '勇氣戰士', name: 'Berserker', rarity: 'Orange', baseDef: 26, color: '#8a2a1a',
    setBonus: '生命越低，攻擊力越高。',
    lv5_effect: '生命低於 30% 時，攻擊提高 50%、速度提高 20%。',
    desc: 'Battle-scarred armor that thrives on desperation.',
  },
  {
    key: 'treasure', nameZh: '尋寶家', name: 'Treasure Hunter', rarity: 'Orange', baseDef: 22, color: '#c78a2a',
    setBonus: '金幣掉落提高 50%。',
    lv5_effect: '金幣掉落提高 80%，並增加稀有素材掉落機率。',
    desc: 'Gilded gear that seems to attract fortune.',
  },
];

// 展開為 40 件（每套 4 部位）
export const ARMORS = ARMOR_SETS.flatMap((set) =>
  Object.entries(SLOT_DEF).map(([slot, s]) => ({
    id: `arm_${set.key}_${slot}`,
    name: `${set.name} ${s.label}`,
    nameZh: `${set.nameZh}${s.labelZh}`, 
    type: 'armor',
    slot, // head / body / hands / legs
    equipSlot: slot,
    archetype: `${set.key}_${slot}`,
    visualAssetId: `equipment:armor:${set.key}_${slot}`,
    visualSocket: `SOCKET_${slot}`,
    hideBodyNodes: HIDDEN_BODY_NODES_BY_SLOT[slot] || [],
    setKey: set.key,
    rarity: set.rarity,
    color: set.color,
    // 該部位防禦 = 整套基礎防禦 × 部位佔比（四捨五入）
    stats: { def: Math.round(set.baseDef * s.defRatio) },
    description: `${set.desc}（${s.labelZh}部位）`,
    // 部位無單獨特效，套裝效果統一由 setBonus/lv5 表示
    setBonus: set.setBonus,
    lv5_effect: set.lv5_effect,
    setEffectId: ARMOR_SET_EFFECTS[set.key]?.base || null,
    lv5EffectId: ARMOR_SET_EFFECTS[set.key]?.lv5 || null,
  }))
);

// 供 UI/邏輯查詢套裝資訊
export const ARMOR_SET_META = ARMOR_SETS;
