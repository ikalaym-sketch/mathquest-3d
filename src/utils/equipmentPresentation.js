// v0.29 裝備顯示與能力計算單一入口。
// 支援 equipment instanceId，避免同款裝備的等級與詞綴被 UI 合併。
import { DB } from '../data/index.js';
import { getDefinitionEquipSlot } from '../data/equipmentSchema.js';
import { resolveEquipmentInstance, resolveEquippedEntry } from '../services/EquipmentInstanceService.js';

export const SLOT_META = Object.freeze({
  head: { label: '頭部', icon: '⛑️' },
  body: { label: '身體', icon: '🦺' },
  hands: { label: '手套', icon: '🧤' },
  legs: { label: '褲裝', icon: '👖' },
  feet: { label: '鞋子', icon: '🥾' },
  mainHand: { label: '主武器', icon: '⚔️' },
  offHand: { label: '副手', icon: '🛡️' },
  accessory: { label: '飾品', icon: '📿' },
});

const DISPLAY_NAME_ZH = {
  wpn_m_01: '木製短劍', wpn_r_01: '獵人弓', wpn_r_02: '追蹤法杖',
  arm_leather_head: '皮革頭盔', arm_leather_body: '皮革上衣', arm_leather_hands: '皮革手套',
  arm_leather_legs: '皮革護腿', arm_scholar_body: '學者長袍',
};

export function getDisplayName(item, instance = null) {
  if (!item) return '尚未裝備';
  const base = item.nameZh || DISPLAY_NAME_ZH[item.id] || item.name;
  return instance?.enhancement > 0 ? `${base} +${instance.enhancement}` : base;
}

export function getItemSlot(item) {
  return getDefinitionEquipSlot(item);
}

export function getItemCategory(item) {
  if (!item) return 'unknown';
  if (item.equipSlot === 'offHand') return 'armor';
  if (item.type === 'armor') return 'armor';
  if (item.type === 'ranged') {
    const archetype = item.archetype || '';
    const name = String(item.name || '').toLowerCase();
    return ['staff', 'grimoire', 'orb'].includes(archetype) || name.includes('staff') || name.includes('grimoire') || name.includes('orb') ? 'magic' : 'ranged';
  }
  if (item.type === 'melee') return 'melee';
  if (item.type === 'consumable') return 'item';
  return item.type || 'unknown';
}

export function getItemIcon(item) {
  if (!item) return '＋';
  if (item.type === 'armor') {
    return { head: '⛑️', body: '🦺', hands: '🧤', legs: '👖', feet: '🥾', accessory: '📿', offHand: '🛡️' }[item.equipSlot || item.slot] || '🛡️';
  }
  const archetypeIcons = {
    shortsword: '⚔️', dual_daggers: '🗡️', warhammer: '🔨', lance: '🔱', greataxe: '🪓', rapier: '🤺', greatsword: '⚔️',
    scythe: '⚒️', dual_axes: '🪓', gauntlets: '🥊', bow: '🏹', staff: '🪄', boomerang: '🪃', crossbow: '🏹', grimoire: '📕',
    throwing_knives: '🗡️', shuriken: '✴️', blowgun: '🎯', throwing_axe: '🪓', orb: '🔮', shield: '🛡️',
  };
  if (archetypeIcons[item.archetype]) return archetypeIcons[item.archetype];
  if (item.type === 'melee') return '⚔️';
  if (item.type === 'ranged') return '🎯';
  if (item.equipSlot === 'offHand') return '🛡️';
  return '🎒';
}

export function getTypeLabel(item) {
  const category = getItemCategory(item);
  return { melee: '近戰', ranged: '遠程', magic: '魔法', armor: '防具', item: '道具' }[category] || '物品';
}

export function getRarityTheme(rarity) {
  if (rarity === 'Orange') return { border: '#f5a623', bg: '#5a3510', label: '傳說' };
  if (rarity === 'Blue') return { border: '#59a8ff', bg: '#153d68', label: '稀有' };
  return { border: '#79d66b', bg: '#1e4c2b', label: '一般' };
}

export function createEquipmentView(instanceId, equipmentInstances = {}) {
  const instance = resolveEquipmentInstance(instanceId, equipmentInstances);
  const item = instance ? DB[instance.definitionId] || null : null;
  return item ? { instanceId: instance.instanceId, instance, item, slot: getItemSlot(item) } : null;
}

export function calculateEquipmentStats(equipped, playerState = {}, equipmentInstances = {}) {
  let attack = 5;
  let defense = 0;
  let attackSpeed = 1;
  let range = 1;
  let magic = 0;

  for (const slot of Object.keys(SLOT_META)) {
    const { item } = resolveEquippedEntry(equipped, slot, equipmentInstances);
    if (!item) continue;
    if (slot === 'mainHand' || slot === 'offHand') {
      attack += item.stats?.atk || 0;
      if (slot === 'mainHand') {
        attackSpeed = item.stats?.atkSpeed || 1;
        range = item.stats?.range || 1;
      }
      if (getItemCategory(item) === 'magic') magic += Math.round((item.stats?.atk || 0) * 1.5);
    }
    if (item.type === 'armor') defense += item.stats?.def || 0;
  }

  const maxHp = playerState.maxHp || 100;
  const speed = Math.round(100 * Math.max(0.5, attackSpeed));
  const power = Math.round(attack * 5 + defense * 4 + maxHp * 0.45 + speed * 0.2 + magic * 2);
  return { power, attack, defense, maxHp, speed, range: Number(range.toFixed(1)), magic };
}

export function compareWithEquipped(view, equipped, playerState, equipmentInstances = {}) {
  if (!view?.item || !view.slot) return null;
  const current = resolveEquippedEntry(equipped, view.slot, equipmentInstances);
  const before = calculateEquipmentStats(equipped, playerState, equipmentInstances);
  const after = calculateEquipmentStats({ ...equipped, [view.slot]: view.instanceId }, playerState, equipmentInstances);
  return {
    slot: view.slot,
    currentItem: current.item,
    currentInstance: current.instance,
    before,
    after,
    delta: Object.fromEntries(Object.keys(after).map((key) => [key, Number((after[key] - before[key]).toFixed(1))])),
  };
}
