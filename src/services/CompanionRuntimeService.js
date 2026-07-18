// v0.28 動物守護夥伴服務：遷移、等級／好感、取得條件與 Runtime Modifier 統一處理。
import { COMPANION_PROFILES, LEGACY_PET_COMPANION_MAP, STARTER_COMPANION_IDS, getCompanionProfile } from '../data/companionProfiles.js';

export const INITIAL_COMPANION_STATE = Object.freeze({
  schemaVersion: 1,
  starterChosen: false,
  activeId: null,
  ownedIds: [],
  records: {},
  acquisitionFlags: {},
  activityCounts: {},
});

export function normalizeCompanionState(value = {}, legacyEquippedPet = null, legacyPetData = {}) {
  let ownedIds = [...new Set(value.ownedIds || [])].filter((id) => COMPANION_PROFILES[id]);
  let activeId = COMPANION_PROFILES[value.activeId] ? value.activeId : null;
  const mappedLegacy = LEGACY_PET_COMPANION_MAP[legacyEquippedPet];
  if (!activeId && mappedLegacy) activeId = mappedLegacy;
  if (mappedLegacy && !ownedIds.includes(mappedLegacy)) ownedIds.push(mappedLegacy);
  const records = { ...(value.records || {}) };
  for (const [legacyId, oldRecord] of Object.entries(legacyPetData || {})) {
    const id = LEGACY_PET_COMPANION_MAP[legacyId];
    if (!id || records[id]) continue;
    records[id] = normalizeCompanionRecord({ level: oldRecord.level, exp: oldRecord.exp, affinity: Math.min(100, (oldRecord.level || 1) * 8) });
  }
  for (const id of ownedIds) records[id] = normalizeCompanionRecord(records[id]);
  return {
    ...INITIAL_COMPANION_STATE,
    ...value,
    starterChosen: Boolean(value.starterChosen || mappedLegacy || activeId),
    activeId,
    ownedIds,
    records,
    acquisitionFlags: { ...(value.acquisitionFlags || {}) },
    activityCounts: { ...(value.activityCounts || {}) },
  };
}

export function chooseStarterCompanion(state, id) {
  const current = normalizeCompanionState(state);
  if (current.starterChosen) return { ok: false, reason: 'starter-already-chosen', state: current };
  if (!STARTER_COMPANION_IDS.includes(id)) return { ok: false, reason: 'not-starter', state: current };
  return {
    ok: true,
    state: {
      ...current,
      starterChosen: true,
      activeId: id,
      ownedIds: [id],
      records: { ...current.records, [id]: normalizeCompanionRecord({ affinity: 10 }) },
      acquisitionFlags: { ...current.acquisitionFlags, [`starter:${id}`]: true },
    },
  };
}

export function unlockCompanion(state, id, reason = 'event') {
  const current = normalizeCompanionState(state);
  if (!getCompanionProfile(id)) return { ok: false, reason: 'missing-companion', state: current };
  if (current.ownedIds.includes(id)) return { ok: false, reason: 'owned', state: current };
  return {
    ok: true,
    state: {
      ...current,
      activeId: current.activeId || id,
      ownedIds: [...current.ownedIds, id],
      records: { ...current.records, [id]: normalizeCompanionRecord({ affinity: 5 }) },
      acquisitionFlags: { ...current.acquisitionFlags, [`unlocked:${id}`]: reason },
    },
  };
}

export function applyCompanionActivity(state, type, payload = {}) {
  let current = normalizeCompanionState(state);
  const activeId = current.activeId;
  const counts = { ...current.activityCounts, [type]: (current.activityCounts[type] || 0) + 1 };
  let levelUp = false;
  if (activeId && current.ownedIds.includes(activeId)) {
    const gains = { talk: 2, gift: 3, harvest: 3, animalCare: 4, animalProduct: 5, correct: 3, kill: 2, boss: 20, explore: 5, fish: 4, process: 4 };
    const affinityGains = { talk: 1, gift: 2, harvest: 1, animalCare: 2, animalProduct: 2, correct: 1, boss: 3, explore: 1, fish: 1, process: 1 };
    const record = normalizeCompanionRecord(current.records[activeId]);
    let exp = record.exp + (gains[type] || 1);
    let level = record.level;
    while (exp >= level * 60) { exp -= level * 60; level += 1; levelUp = true; }
    current = {
      ...current,
      records: {
        ...current.records,
        [activeId]: { ...record, exp, level, affinity: clamp(record.affinity + (affinityGains[type] || 0), 0, 100), lastActivity: type },
      },
    };
  }
  current = { ...current, activityCounts: counts };
  const unlocks = evaluateCompanionAcquisitions(current, type, payload);
  for (const id of unlocks) current = unlockCompanion(current, id, `${type}:${payload.bossId || payload.regionId || counts[type]}`).state;
  return { state: current, unlocks, levelUp };
}

export function interactWithCompanion(state, action, dayIndex) {
  const current = normalizeCompanionState(state);
  const id = current.activeId;
  if (!id) return { ok: false, reason: 'no-active', state: current };
  const record = normalizeCompanionRecord(current.records[id]);
  const key = `${action}:${dayIndex}`;
  if (record.dailyFlags[key]) return { ok: false, reason: 'already-done', state: current };
  const gains = { pet: 3, play: 5, feed: 6, rest: 2 };
  return {
    ok: true,
    state: {
      ...current,
      records: {
        ...current.records,
        [id]: {
          ...record,
          affinity: clamp(record.affinity + (gains[action] || 1), 0, 100),
          mood: action === 'play' ? 'excited' : action === 'feed' ? 'happy' : 'calm',
          dailyFlags: { ...record.dailyFlags, [key]: true },
          lastInteraction: action,
        },
      },
    },
  };
}

export function getActiveCompanionRuntime(state) {
  const current = normalizeCompanionState(state?.companionState, state?.equipped?.pet, state?.petData);
  const profile = getCompanionProfile(current.activeId);
  const record = profile ? normalizeCompanionRecord(current.records[profile.id]) : null;
  if (!profile || !record) return { id: null, profile: null, record: null, modifiers: {} };
  const levelScale = 1 + Math.min(0.5, Math.max(0, record.level - 1) * 0.025);
  return {
    id: profile.id,
    profile,
    record,
    modifiers: Object.fromEntries(Object.entries(profile.modifiers || {}).map(([key, value]) => [key, typeof value === 'number' ? value * levelScale : value])),
  };
}

function evaluateCompanionAcquisitions(state, type, payload) {
  const result = [];
  for (const profile of Object.values(COMPANION_PROFILES)) {
    if (profile.starter || state.ownedIds.includes(profile.id)) continue;
    const rule = profile.acquisition;
    if (rule.type === 'boss' && type === 'boss' && payload.bossId === rule.bossId) result.push(profile.id);
    if (rule.type === 'farm_activity' && type === 'animalProduct' && (state.activityCounts.animalProduct || 0) >= rule.animalProducts) result.push(profile.id);
    if (rule.type === 'region_event' && type === 'explore' && payload.regionId === rule.regionId && (payload.eventCount || state.activityCounts.explore || 0) >= rule.eventCount) result.push(profile.id);
    if (rule.type === 'relationship' && type === 'relationship' && payload.npcId === rule.npcId && payload.affinity >= rule.affinity) result.push(profile.id);
  }
  return result;
}

function normalizeCompanionRecord(record = {}) {
  return {
    level: Math.max(1, Number(record.level) || 1),
    exp: Math.max(0, Number(record.exp) || 0),
    affinity: clamp(Number(record.affinity) || 0, 0, 100),
    mood: record.mood || 'calm',
    dailyFlags: { ...(record.dailyFlags || {}) },
    lastActivity: record.lastActivity || null,
    lastInteraction: record.lastInteraction || null,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
