// v0.31 角色與夥伴的 Runtime 視覺契約。
// Registry 只回答「資產是什麼」；本服務集中回答「哪個玩法身份會實際使用哪些資產」。
import {
  COMPANION_V031_VISUAL_PROFILES,
  HUMANOID_BODY_VARIANT_DEFINITIONS,
  RESIDENT_CHARACTER_VISUAL_PROFILES,
  V031_CHARACTER_ASSET_DEFINITIONS,
  V031_COMPANION_MODULE_DEFINITIONS,
} from '../data/characterCompanionV031Catalog.js';

// v0.32滿八欄裝備會額外駐留10個GLB；村莊完整居民由4降為2，維持整體手機峰值68/70。
export const MAX_DETAILED_CHARACTER_ACTORS = 2;
export const CHARACTER_DETAIL_ENTER_DISTANCE = 24;
export const CHARACTER_DETAIL_EXIT_DISTANCE = 30;

const detailCandidates = new Map();
let selectedActorIds = new Set();
let nextRebalanceAt = 0;

export function getResidentCharacterVisualProfile(residentId) {
  return RESIDENT_CHARACTER_VISUAL_PROFILES[residentId] || null;
}

export function getCompanionVisualProfile(companionId) {
  return COMPANION_V031_VISUAL_PROFILES[companionId] || null;
}

export function getV031CharacterRuntimeAssetIds() {
  return V031_CHARACTER_ASSET_DEFINITIONS.map((definition) => definition.assetId);
}

export function getV031CompanionRuntimeAssetIds() {
  return V031_COMPANION_MODULE_DEFINITIONS.map((definition) => definition.assetId);
}

export function getCharacterCompanionRuntimeAssetIds() {
  return [...getV031CharacterRuntimeAssetIds(), ...getV031CompanionRuntimeAssetIds()];
}

export function getSharedHumanoidBodyAssetIds() {
  return HUMANOID_BODY_VARIANT_DEFINITIONS.map((definition) => definition.assetId);
}

export function registerCharacterDetailCandidate(actorId, listener) {
  detailCandidates.set(actorId, {
    actorId,
    distance: Number.POSITIVE_INFINITY,
    listener,
    updatedAt: 0,
  });
  listener(selectedActorIds.has(actorId));
  return () => {
    detailCandidates.delete(actorId);
    if (selectedActorIds.has(actorId)) {
      selectedActorIds = new Set([...selectedActorIds].filter((id) => id !== actorId));
      notifyDetailCandidates();
    }
  };
}

export function updateCharacterDetailCandidate(actorId, distance, now = runtimeNow()) {
  const candidate = detailCandidates.get(actorId);
  if (!candidate) return false;
  candidate.distance = Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY;
  candidate.updatedAt = now;
  if (now >= nextRebalanceAt) {
    nextRebalanceAt = now + 180;
    rebalanceCharacterDetailBudget(now);
  }
  return selectedActorIds.has(actorId);
}

export function rebalanceCharacterDetailBudget(now = runtimeNow()) {
  const eligible = [...detailCandidates.values()]
    .filter((candidate) => {
      if (now - candidate.updatedAt > 1200) return false;
      const limit = selectedActorIds.has(candidate.actorId)
        ? CHARACTER_DETAIL_EXIT_DISTANCE
        : CHARACTER_DETAIL_ENTER_DISTANCE;
      return candidate.distance <= limit;
    })
    .sort((left, right) => left.distance - right.distance || left.actorId.localeCompare(right.actorId));
  const next = new Set(eligible.slice(0, MAX_DETAILED_CHARACTER_ACTORS).map((candidate) => candidate.actorId));
  if (sameSet(next, selectedActorIds)) return getCharacterDetailBudgetSnapshot();
  selectedActorIds = next;
  notifyDetailCandidates();
  return getCharacterDetailBudgetSnapshot();
}

export function getCharacterDetailBudgetSnapshot() {
  return {
    limit: MAX_DETAILED_CHARACTER_ACTORS,
    selectedActorIds: [...selectedActorIds],
    candidates: [...detailCandidates.values()].map(({ actorId, distance }) => ({ actorId, distance })),
  };
}

// 永久測試使用；Runtime 不應呼叫。
export function resetCharacterDetailBudgetForTests() {
  detailCandidates.clear();
  selectedActorIds = new Set();
  nextRebalanceAt = 0;
}

export function resolveResidentAnimation({ isMoving = false, scheduleState = 'idle', timeSegment = 'day', isTalking = false, emote = null } = {}) {
  if (emote) return { locomotionState: 'idle', actionState: emote };
  if (isTalking) return { locomotionState: 'idle', actionState: 'Talk' };
  if (isMoving) return { locomotionState: 'walk', actionState: null };
  if (scheduleState === 'working') return { locomotionState: 'idle', actionState: 'Work' };
  if (scheduleState === 'resting') {
    return { locomotionState: 'idle', actionState: ['night', 'lateNight'].includes(timeSegment) ? 'Sleep' : 'Sit' };
  }
  return { locomotionState: 'idle', actionState: null };
}

function notifyDetailCandidates() {
  detailCandidates.forEach((candidate) => candidate.listener(selectedActorIds.has(candidate.actorId)));
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((id) => right.has(id));
}

function runtimeNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
