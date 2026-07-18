// v0.29 裝備 Runtime 唯一解析服務。
// 穿戴欄保存 equipment instanceId；定義、等級、詞綴與戰鬥效果不得再由 UI 各自推導。
import { ARMOR_SET_META, DB } from '../data/index.js';
import { ARMOR_SET_EFFECTS, WEAPON_LV5_EFFECT_IDS } from '../data/runtimeEffects.js';
import {
  ARMOR_SET_SLOT_IDS,
  DEFENSE_SLOT_IDS,
  getDefinitionEquipSlot,
  isTwoHandedDefinition,
  normalizeEquipmentSlot,
  supportsOffHand,
} from '../data/equipmentSchema.js';
import {
  findOwnedEquipmentInstance,
  resolveEquipmentDefinition,
  resolveEquipmentInstance,
  resolveEquippedEntry,
} from './EquipmentInstanceService.js';

export function validateEquipRequest({ inventory, equipmentInstances = {}, equipped = {}, slot, itemId }) {
  const normalizedSlot = normalizeEquipmentSlot(slot);
  if (!normalizedSlot) return { ok: false, reason: slot === 'pet' ? 'companion-system' : 'wrong-slot' };
  const instance = findOwnedEquipmentInstance(itemId, inventory, equipmentInstances);
  if (!instance) return { ok: false, reason: 'not-owned' };
  const item = DB[instance.definitionId];
  if (!item) return { ok: false, reason: 'missing-item' };
  const expectedSlot = getDefinitionEquipSlot(item);
  if (!expectedSlot || expectedSlot !== normalizedSlot) return { ok: false, reason: 'wrong-slot' };

  if (normalizedSlot === 'offHand') {
    const mainHand = resolveEquipmentDefinition(equipped?.mainHand, equipmentInstances);
    if (mainHand && !supportsOffHand(mainHand)) return { ok: false, reason: 'main-hand-locks-offhand' };
  }

  return {
    ok: true,
    item,
    instance,
    instanceId: instance.instanceId,
    category: 'equipment',
    slot: normalizedSlot,
    clearsOffHand: normalizedSlot === 'mainHand' && isTwoHandedDefinition(item),
  };
}

export function resolveArmorSetRuntime(equipped = {}, equipmentInstances = {}, equipmentLevels = {}) {
  const entries = ARMOR_SET_SLOT_IDS.map((slot) => resolveEquippedEntry(equipped, slot, equipmentInstances));
  const pieces = entries.map((entry) => entry.item).filter(Boolean);
  if (pieces.length !== ARMOR_SET_SLOT_IDS.length) return emptySetRuntime();
  const setKey = pieces[0]?.setKey;
  if (!setKey || pieces.some((piece) => piece.setKey !== setKey)) return emptySetRuntime();
  const effectIds = ARMOR_SET_EFFECTS[setKey];
  const allLv5 = entries.every(({ instance, item }) => Boolean(instance?.level >= 5 || equipmentLevels[item?.id]));
  return {
    active: true,
    setKey,
    pieces: entries.map(({ instance }) => instance?.instanceId).filter(Boolean),
    allLv5,
    effectId: allLv5 ? effectIds?.lv5 : effectIds?.base,
  };
}

export function resolveEquipmentRuntime({ equipped = {}, equipmentInstances = {}, equipmentLevels = {}, playerState = {}, activeEffects = {} } = {}) {
  const armorPieces = DEFENSE_SLOT_IDS
    .map((slot) => resolveEquippedEntry(equipped, slot, equipmentInstances).item)
    .filter((piece) => piece?.type === 'armor');
  const defense = armorPieces.reduce((sum, piece) => sum + (Number(piece.stats?.def) || 0), 0);
  const setRuntime = resolveArmorSetRuntime(equipped, equipmentInstances, equipmentLevels);
  const modifiers = {
    defense,
    moveSpeed: 1,
    attack: 1,
    criticalChance: 0,
    criticalMultiplier: 2,
    incomingDamage: Math.max(0.42, 100 / (100 + defense * 2.2)),
    reflectDamage: 0,
    lifesteal: 0,
    answerWrongOptionsRemoved: 0,
    outOfCombatHpPerSecond: 0,
    outOfCombatDelaySeconds: 6,
    dodgeDuration: 1,
    dodgeDecoy: false,
    harvestYield: 0,
    waterRetentionMinutes: 0,
    manaPerSecond: 0,
    spellCostMultiplier: 1,
    goldDrop: 1,
    rareDropChance: 0,
  };

  if (setRuntime.active) applyArmorSet(modifiers, setRuntime, playerState);
  applyActiveItemEffects(modifiers, activeEffects);
  return { ...modifiers, armorSet: setRuntime };
}

export function resolveMainHandRuntime(equipped = {}, equipmentInstances = {}, equipmentLevels = {}) {
  const instance = resolveEquipmentInstance(equipped?.mainHand, equipmentInstances);
  const item = instance ? DB[instance.definitionId] : null;
  return {
    instance,
    item,
    definitionId: item?.id || null,
    isLv5: Boolean(instance?.level >= 5 || (item && equipmentLevels[item.id])),
    affixes: instance?.affixes || [],
  };
}

export function applyWeaponLv5Profile(profile, weaponId, isLv5) {
  const next = {
    ...profile,
    effects: { ...(profile.effects || {}) },
    lv5EffectId: isLv5 ? WEAPON_LV5_EFFECT_IDS[weaponId] || null : null,
    critMultiplier: profile.critMultiplier || 2,
    damageMultiplier: profile.damageMultiplier || 1,
    status: { ...(profile.status || {}) },
    comboLength: Math.max(1, Number(profile.effects?.combo) || 1),
    finalComboMultiplier: 1,
  };
  if (!isLv5) return next;

  switch (weaponId) {
    case 'wpn_m_01': next.doubleStrikeChance = 0.1; break;
    case 'wpn_m_02': next.status.poisonStacks = 3; next.status.poisonSeconds = 8; break;
    case 'wpn_m_03': next.effects.stun = 0.45; next.status.stunChance = 0.45; next.status.stunSeconds = 1.6; break;
    case 'wpn_m_04': next.range *= 1.3; next.pierceCount = 3; break;
    case 'wpn_m_05': next.aoe *= 1.18; next.damageMultiplier *= 1.15; break;
    case 'wpn_m_06': next.effects.crit += 0.2; next.critMultiplier = 2.5; break;
    case 'wpn_m_07': next.highHpMultiplier = 1.5; break;
    case 'wpn_m_08': next.effects.lifesteal = 0.3; break;
    case 'wpn_m_09': next.comboLength = 5; next.finalComboMultiplier = 2; break;
    case 'wpn_m_10': next.counterChance = 1; next.counterMultiplier = 1.5; break;
    case 'wpn_r_01': next.dmg += 2; next.cooldown *= 0.77; break;
    case 'wpn_r_02': next.multiShotMultiplier = 1.7; next.homingShots = 2; break;
    case 'wpn_r_03': next.returnMultiplier = 2; next.damageMultiplier *= 1.65; break;
    case 'wpn_r_04': next.aoe *= 1.5; next.status.burnSeconds = 3; break;
    case 'wpn_r_05': next.aoe = Math.max(next.aoe, 5.5); next.pullStrength = 5; next.status.poisonSeconds = 3; break;
    case 'wpn_r_06': next.guaranteedCritEvery = 5; break;
    case 'wpn_r_07': next.projectileCount = 5; next.multiShotMultiplier = 5 / 3; next.aoe = Math.max(next.aoe, 4.4); break;
    case 'wpn_r_08': next.status.poisonStacks = 3; next.status.poisonSeconds = 8; break;
    case 'wpn_r_09': next.status.armorBreak = 0.3; next.status.armorBreakSeconds = 4; break;
    case 'wpn_r_10': next.status.elementGuaranteed = true; break;
    default: break;
  }
  return next;
}

export function rollRuntimeDamage(profile, { targetHpRatio = 1, attackIndex = 1, armorRuntime = null, activeEffects = {} } = {}) {
  let damage = profile.dmg * (profile.damageMultiplier || 1);
  let criticalChance = Number(profile.effects?.crit) || 0;
  const criticalMultiplier = profile.critMultiplier || 2;

  if (profile.highHpMultiplier && targetHpRatio > 0.5) damage *= profile.highHpMultiplier;
  if (profile.doubleStrikeChance && Math.random() < profile.doubleStrikeChance) damage *= 2;
  if (profile.guaranteedCritEvery && attackIndex % profile.guaranteedCritEvery === 0) criticalChance = 1;
  if (profile.comboLength > 1 && attackIndex % profile.comboLength === 0) damage *= profile.finalComboMultiplier || 1;
  if (profile.multiShotMultiplier) damage *= profile.multiShotMultiplier;
  if (profile.returnMultiplier) damage *= profile.returnMultiplier;

  damage *= armorRuntime?.attack || 1;
  damage *= activeEffects?.attackMultiplier || 1;
  criticalChance += armorRuntime?.criticalChance || 0;
  criticalChance += activeEffects?.criticalChance || 0;

  const crit = Math.random() < criticalChance;
  if (crit) damage *= criticalMultiplier;
  return { dmg: Math.max(1, Math.round(damage)), crit };
}

export function getArmorSetLabel(setRuntime) {
  if (!setRuntime?.active) return '未啟動套裝效果';
  const set = ARMOR_SET_META.find((entry) => entry.key === setRuntime.setKey);
  return `${set?.nameZh || setRuntime.setKey}套裝${setRuntime.allLv5 ? ' Lv5' : ''}`;
}

function applyArmorSet(modifiers, setRuntime, playerState) {
  const lv5 = setRuntime.allLv5;
  switch (setRuntime.setKey) {
    case 'leather': modifiers.moveSpeed *= lv5 ? 1.2 : 1.1; break;
    case 'spike': modifiers.reflectDamage = lv5 ? 0.3 : 0.15; break;
    case 'vampire': modifiers.lifesteal = lv5 ? 0.12 : 0.05; break;
    case 'scholar': modifiers.answerWrongOptionsRemoved = lv5 ? 2 : 1; break;
    case 'paladin': modifiers.outOfCombatHpPerSecond = lv5 ? 2.4 : 1.2; modifiers.outOfCombatDelaySeconds = lv5 ? 4 : 6; break;
    case 'ninja': modifiers.dodgeDuration = lv5 ? 2.15 : 2; modifiers.dodgeDecoy = lv5; break;
    case 'farmer': modifiers.harvestYield = lv5 ? 0.4 : 0.2; modifiers.waterRetentionMinutes = lv5 ? 1440 : 0; break;
    case 'mage': modifiers.manaPerSecond = lv5 ? 2 : 1; modifiers.spellCostMultiplier = lv5 ? 0.8 : 1; break;
    case 'berserker': {
      const ratio = (playerState.hp || 0) / Math.max(1, playerState.maxHp || 1);
      modifiers.attack *= ratio < 0.3 && lv5 ? 1.5 : 1 + Math.max(0, 1 - ratio) * 0.32;
      if (ratio < 0.3 && lv5) modifiers.moveSpeed *= 1.2;
      break;
    }
    case 'treasure': modifiers.goldDrop = lv5 ? 1.8 : 1.5; modifiers.rareDropChance = lv5 ? 0.08 : 0; break;
    default: break;
  }
}

function applyActiveItemEffects(modifiers, activeEffects) {
  if (activeEffects?.speed) modifiers.moveSpeed *= 1 + (activeEffects.speed.amount || 0);
  if (activeEffects?.attack) {
    modifiers.attack *= 1 + (activeEffects.attack.amount || 0);
    modifiers.criticalChance += activeEffects.attack.criticalChance || 0;
  }
}

function emptySetRuntime() {
  return { active: false, setKey: null, pieces: [], allLv5: false, effectId: null };
}
