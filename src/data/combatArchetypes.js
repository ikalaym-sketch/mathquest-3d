// v0.29.1 十二種基礎戰鬥 Archetype 契約。
// 武器外觀可以有更多名稱，但動畫、命中幾何、投射物與冷卻只能映射至本表。

export const BASE_COMBAT_ARCHETYPE_IDS = Object.freeze([
  'one_hand_blade',
  'dual_wield',
  'heavy_blunt',
  'polearm',
  'heavy_blade',
  'scythe',
  'bow',
  'crossbow',
  'arcane_staff',
  'grimoire',
  'thrown',
  'unarmed_focus',
]);

export const BASE_COMBAT_ARCHETYPES = Object.freeze({
  one_hand_blade: contract('one_hand_blade', 'OneHandBlade', 'melee-arc', 'one', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'Skill'], execution('arc', 3, 0.9, 0, 0.95, 'blade')),
  dual_wield: contract('dual_wield', 'DualWield', 'melee-multi', 'dual', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'Skill'], execution('multi-arc', 4, 1.05, 0, 0.86, 'dual')),
  heavy_blunt: contract('heavy_blunt', 'HeavyBlunt', 'melee-impact', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'HammerSmash', 'Skill'], execution('impact', 5, 1.35, 0, 1.18, 'heavy')),
  polearm: contract('polearm', 'Polearm', 'melee-line', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'SpearThrust', 'Skill'], execution('line', 3, 0.82, 0, 1.04, 'polearm')),
  heavy_blade: contract('heavy_blade', 'HeavyBlade', 'melee-arc', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'Skill'], execution('wide-arc', 5, 1.2, 0, 1.12, 'heavy')),
  scythe: contract('scythe', 'Scythe', 'melee-wide-arc', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'Skill'], execution('wide-arc', 6, 1.45, 0, 1.08, 'scythe')),
  bow: contract('bow', 'Bow', 'projectile', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'BowShoot', 'Skill'], execution('projectile', 1, 0.75, 12, 1, 'bow')),
  crossbow: contract('crossbow', 'Crossbow', 'projectile', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'CrossbowReload', 'Skill'], execution('projectile-impact', 6, 1.1, 10, 1.2, 'crossbow')),
  arcane_staff: contract('arcane_staff', 'ArcaneStaff', 'projectile-magic', 'two', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'StaffCast', 'Skill'], execution('homing-projectile', 2, 1.05, 8.5, 1.08, 'arcane')),
  grimoire: contract('grimoire', 'Grimoire', 'area-magic', 'one', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'BookCast', 'Skill'], execution('target-area', 8, 1.55, 7, 1.24, 'grimoire')),
  thrown: contract('thrown', 'Thrown', 'projectile-return', 'one', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'BoomerangThrow', 'BoomerangCatch', 'Skill'], execution('return-projectile', 3, 0.88, 11, 0.9, 'thrown')),
  unarmed_focus: contract('unarmed_focus', 'UnarmedFocus', 'hybrid-focus', 'dual', ['Attack01', 'Attack02', 'Attack03', 'ChargedAttack', 'Skill'], execution('focus-burst', 4, 1.1, 7.5, 0.92, 'focus')),
});


export const PLAYER_COMBAT_ANIMATION_CLIPS = Object.freeze(
  BASE_COMBAT_ARCHETYPE_IDS.flatMap((id) => {
    const contractDef = BASE_COMBAT_ARCHETYPES[id];
    return contractDef.requiredClips.map((clip) => `${contractDef.animationSet}_${clip}`);
  }),
);

const VISUAL_ARCHETYPE_TO_BASE = Object.freeze({
  shortsword: 'one_hand_blade',
  rapier: 'one_hand_blade',
  dual_daggers: 'dual_wield',
  dual_axes: 'dual_wield',
  warhammer: 'heavy_blunt',
  lance: 'polearm',
  greataxe: 'heavy_blade',
  greatsword: 'heavy_blade',
  scythe: 'scythe',
  bow: 'bow',
  crossbow: 'crossbow',
  staff: 'arcane_staff',
  grimoire: 'grimoire',
  boomerang: 'thrown',
  throwing_knives: 'thrown',
  shuriken: 'thrown',
  blowgun: 'thrown',
  throwing_axe: 'thrown',
  gauntlets: 'unarmed_focus',
  orb: 'unarmed_focus',
});

export function resolveWeaponCombatContract(weapon, visualArchetype = null) {
  const archetype = visualArchetype || weapon?.archetype || null;
  const baseArchetype = VISUAL_ARCHETYPE_TO_BASE[archetype] || (weapon?.type === 'ranged' ? 'thrown' : 'one_hand_blade');
  const base = BASE_COMBAT_ARCHETYPES[baseArchetype];
  return {
    baseArchetype,
    animationSet: base.animationSet,
    deliveryAssetId: `equipment:delivery:${weapon?.id || baseArchetype}`,
    impactAssetId: `equipment:impact:${weapon?.id || baseArchetype}`,
    hitProfileId: base.hitProfileId,
    projectileProfileId: base.projectileProfileId,
    vfxProfileId: base.vfxProfileId,
    audioProfileId: base.audioProfileId,
    cooldownProfileId: base.cooldownProfileId,
    attackContract: {
      deliveryMode: resolveDeliveryMode(weapon, base.deliveryMode),
      handedness: weapon?.handedness || base.handedness,
      comboLength: 3,
      requiredClips: [...base.requiredClips],
      execution: { ...base.execution },
    },
  };
}

export function getBaseCombatArchetype(id) {
  return BASE_COMBAT_ARCHETYPES[id] || BASE_COMBAT_ARCHETYPES.one_hand_blade;
}

function resolveDeliveryMode(weapon, fallback) {
  const stats = weapon?.stats || {};
  if (stats.pierce) return 'melee-line';
  if (stats.aoeArc || stats.aoeRadius || stats.spread || stats.pull) return 'area';
  if (weapon?.type === 'ranged') return 'projectile';
  return fallback;
}

function execution(shape, maxTargets, areaScale, projectileSpeed, cooldownMultiplier, audioProfileId) {
  return Object.freeze({ shape, maxTargets, areaScale, projectileSpeed, cooldownMultiplier, audioProfileId });
}

function contract(id, animationSet, deliveryMode, handedness, requiredClips, runtime) {
  return Object.freeze({
    id,
    animationSet,
    deliveryMode,
    handedness,
    requiredClips: Object.freeze(requiredClips),
    execution: runtime,
    hitProfileId: `hit:${id}`,
    projectileProfileId: `projectile:${id}`,
    vfxProfileId: `vfx:${id}`,
    audioProfileId: `audio:${runtime.audioProfileId}`,
    cooldownProfileId: `cooldown:${id}`,
  });
}
