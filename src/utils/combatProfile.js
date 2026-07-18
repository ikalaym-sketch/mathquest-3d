// v0.29 武器戰鬥屬性：equipment instance → 定義 → 可執行 Runtime Profile。
import { DB } from '../data/index.js';
import { useStore } from '../store/useStore.js';
import { applyWeaponLv5Profile, rollRuntimeDamage } from '../services/EquipmentRuntimeService.js';
import { resolveEquipmentInstance } from '../services/EquipmentInstanceService.js';
import { getBaseCombatArchetype } from '../data/combatArchetypes.js';

const UNARMED_CONTRACT = getBaseCombatArchetype('unarmed_focus');
const FIST = Object.freeze({
  dmg: 12, range: 2.2, cooldown: 0.5, aoe: 0, ranged: false, element: null, knockback: 2,
  effects: {}, status: {}, mpCost: 0, archetype: 'unarmed', baseArchetype: 'unarmed_focus', animationSet: UNARMED_CONTRACT.animationSet, handedness: 'dual',
  deliveryAssetId: null, impactAssetId: null,
  hitProfileId: UNARMED_CONTRACT.hitProfileId,
  projectileProfileId: UNARMED_CONTRACT.projectileProfileId,
  vfxProfileId: UNARMED_CONTRACT.vfxProfileId,
  audioProfileId: UNARMED_CONTRACT.audioProfileId,
  cooldownProfileId: UNARMED_CONTRACT.cooldownProfileId,
  attackContract: { deliveryMode: UNARMED_CONTRACT.deliveryMode, execution: UNARMED_CONTRACT.execution },
});

export function getCombatProfile(weaponRef, isLv5Override = null) {
  const state = useStore.getState();
  const instance = resolveEquipmentInstance(weaponRef, state.equipmentInstances);
  const weaponId = instance?.definitionId || (DB[weaponRef] ? weaponRef : null);
  const weapon = weaponId ? DB[weaponId] : null;
  if (!weapon) return applyWeaponLv5Profile({ ...FIST, effects: {}, status: {} }, null, false);

  const stats = weapon.stats || {};
  const ranged = weapon.type === 'ranged';
  const baseContract = getBaseCombatArchetype(weapon.baseArchetype);
  const attackSpeed = stats.atkSpeed || 1;
  const cooldown = Math.max(0.15, (1 / attackSpeed) * (baseContract.execution.cooldownMultiplier || 1));
  const damage = Math.round((stats.atk || 8) * (ranged ? 2.5 : 3));
  const range = ranged ? Math.max(6, stats.range || 8) : Math.max(2, (stats.range || 1.2) * 1.6);

  let aoe = 0;
  if (stats.aoeArc) aoe = range;
  if (stats.aoeRadius) aoe = stats.aoeRadius + 1;
  if (stats.spread) aoe = Math.max(aoe, 3);

  const profile = {
    weaponInstanceId: instance?.instanceId || null,
    weaponId,
    archetype: weapon.archetype || (ranged ? 'ranged' : 'melee'),
    baseArchetype: weapon.baseArchetype || baseContract.id,
    animationSet: weapon.animationSet || (ranged ? 'Ranged' : 'Melee'),
    handedness: weapon.handedness || 'one',
    deliveryAssetId: weapon.deliveryAssetId || null,
    impactAssetId: weapon.impactAssetId || null,
    hitProfileId: weapon.hitProfileId || baseContract.hitProfileId,
    projectileProfileId: weapon.projectileProfileId || baseContract.projectileProfileId,
    vfxProfileId: weapon.vfxProfileId || baseContract.vfxProfileId,
    audioProfileId: weapon.audioProfileId || baseContract.audioProfileId,
    cooldownProfileId: weapon.cooldownProfileId || baseContract.cooldownProfileId,
    attackContract: weapon.attackContract || { deliveryMode: baseContract.deliveryMode, execution: baseContract.execution },
    dmg: damage,
    range,
    cooldown,
    aoe,
    ranged,
    element: stats.element || null,
    knockback: stats.pull ? -4 : stats.stunChance ? 6 : stats.atk >= 20 ? 5 : ranged ? 1.5 : 3,
    mpCost: stats.mpCost || 0,
    effects: {
      crit: stats.critChance || 0,
      lifesteal: stats.lifesteal || 0,
      poison: stats.poison || 0,
      stun: stats.stunChance || 0,
      armorBreak: stats.armorBreak || 0,
      combo: stats.comboHits || 0,
      homing: Boolean(stats.homing),
      pierce: Boolean(stats.pierce),
    },
    status: {
      poisonDamage: stats.poison || 0,
      poisonSeconds: stats.duration || (stats.poison ? 4 : 0),
      poisonStacks: stats.poison ? 1 : 0,
      stunSeconds: stats.stunChance ? 0.6 : 0,
      stunChance: stats.stunChance || 0,
      armorBreak: stats.armorBreak || 0,
      armorBreakSeconds: stats.armorBreak ? 2 : 0,
      burnSeconds: stats.element === 'fire' ? 3 : 0,
    },
    projectile: stats.projectile || null,
    returns: Boolean(stats.returns),
    pull: Boolean(stats.pull),
    pierce: Boolean(stats.pierce),
    pierceCount: stats.pierce ? 2 : 1,
    spread: stats.spread || 0,
  };

  const affixes = instance?.affixes?.length ? instance.affixes : state.weaponAffixes?.[weaponId];
  for (const affix of affixes || []) {
    if (affix.type === 'atk') profile.dmg = Math.round(profile.dmg * (1 + affix.value));
    else if (affix.type === 'crit') profile.effects.crit += affix.value;
    else if (affix.type === 'lifesteal') profile.effects.lifesteal += affix.value;
    else if (affix.type === 'speed') profile.cooldown = Math.max(0.15, profile.cooldown * (1 - affix.value));
    else if (affix.type === 'range') profile.range += affix.value;
  }

  const isLv5 = isLv5Override ?? Boolean(instance?.level >= 5 || state.equipmentLevels?.[weaponId]);
  return applyWeaponLv5Profile(profile, weaponId, isLv5);
}

export function rollDamage(profile, options = {}) {
  return rollRuntimeDamage(profile, options);
}
