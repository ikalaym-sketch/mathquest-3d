// v0.29.1 角色動畫狀態解析服務。
// 將玩家／NPC 的 locomotionState、actionState、武器 Archetype、Combo、農具與互動意圖
// 統一轉成「專屬 Clip 候選清單」。Runtime 會依 GLB 實際存在的 Clip 逐級回退，
// 因此現有只有 Idle／Walk／Attack 的舊模型仍能運作，未來正式動畫也不需再改玩法狀態機。

const NON_LOOPING_ACTIONS = new Set([
  'Attack',
  'ChargedAttack',
  'Skill',
  'Interact',
  'Hurt',
  'Stun',
  'Defeat',
  'Dodge',
  'JumpStart',
  'Land',
  'Gift',
  'Celebrate',
]);

const LOCOMOTION_CLIP_MAP = Object.freeze({
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  jumpStart: 'JumpStart',
  jumpLoop: 'JumpLoop',
  land: 'Land',
  dodge: 'Dodge',
  wade: 'Wade',
  swim: 'Swim',
  swimIdle: 'SwimIdle',
});

const TOOL_CLIP_MAP = Object.freeze({
  hoe: 'Hoe',
  wateringCan: 'Water',
  seedBag: 'Sow',
  hand: 'Harvest',
  sickle: 'Harvest',
  feed: 'Carry',
  brush: 'Interact',
  fishingRod: 'Fish',
  hammer: 'Hammer',
  saw: 'Saw',
  cook: 'Cook',
});

export function resolveCharacterAnimationState(motion = {}, weapon = null) {
  const normalized = normalizeMotionContract(motion, weapon);
  const actionClip = resolveActionClip(normalized);
  const locomotionClip = LOCOMOTION_CLIP_MAP[normalized.locomotionState] || 'Idle';
  const genericActionClip = resolveGenericActionClip(normalized);
  const clipCandidates = unique([
    actionClip,
    genericActionClip,
    locomotionClip,
    normalized.locomotionState === 'wade' ? 'Walk' : null,
    normalized.locomotionState === 'swim' ? 'Walk' : null,
    'Idle',
  ]);
  const requestedClip = clipCandidates[0] || 'Idle';

  return {
    ...normalized,
    requestedClip,
    clipCandidates,
    baseClip: genericActionClip || locomotionClip,
    loop: !NON_LOOPING_ACTIONS.has(normalized.actionState || requestedClip),
  };
}

export function normalizeMotionContract(motion = {}, weapon = null) {
  const legacyActionState = motion.isDefeated
    ? 'Defeat'
    : motion.isHurt
      ? 'Hurt'
      : motion.isAttacking
        ? 'Attack'
        : motion.isInteracting
          ? 'Interact'
          : null;
  const actionState = motion.actionState || legacyActionState || null;
  const locomotionState = motion.locomotionState || resolveLegacyLocomotion(motion);
  const animationSet = motion.animationSet || weapon?.animationSet || 'UnarmedFocus';
  const weaponArchetype = motion.weaponArchetype || weapon?.baseArchetype || weapon?.archetype || 'unarmed_focus';
  const comboIndex = clampComboIndex(motion.comboIndex);

  return {
    locomotionState,
    actionState,
    animationSet,
    weaponArchetype,
    comboIndex,
    toolAction: motion.toolAction || null,
    interactionType: motion.interactionType || null,
  };
}

export function isMovingAnimationState(state) {
  return ['walk', 'run', 'wade', 'swim'].includes(state?.locomotionState);
}

export function isAttackAnimationState(state) {
  return ['Attack', 'ChargedAttack', 'Skill'].includes(state?.actionState);
}

function resolveActionClip(state) {
  if (!state.actionState) return null;
  if (state.actionState === 'Attack') return `${state.animationSet}_Attack${String(state.comboIndex).padStart(2, '0')}`;
  if (state.actionState === 'ChargedAttack') return `${state.animationSet}_ChargedAttack`;
  if (state.actionState === 'Skill') return `${state.animationSet}_Skill`;
  if (state.actionState === 'Interact' && state.toolAction) return TOOL_CLIP_MAP[state.toolAction] || `Tool_${state.toolAction}`;
  if (state.actionState === 'Interact' && state.interactionType) return normalizeInteractionClip(state.interactionType);
  return state.actionState;
}

function resolveGenericActionClip(state) {
  if (!state.actionState) return null;
  if (['Attack', 'ChargedAttack', 'Skill'].includes(state.actionState)) return 'Attack';
  if (state.actionState === 'Interact') return 'Interact';
  return state.actionState;
}

function resolveLegacyLocomotion(motion) {
  if (motion.locomotion === 'swim') return motion.isMoving ? 'swim' : 'swimIdle';
  if (motion.locomotion === 'wade') return 'wade';
  if (motion.isRunning) return 'run';
  if (motion.isMoving) return 'walk';
  return 'idle';
}

function normalizeInteractionClip(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Interact';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function clampComboIndex(value) {
  const parsed = Number(value) || 1;
  return Math.max(1, Math.min(3, Math.floor(parsed)));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
