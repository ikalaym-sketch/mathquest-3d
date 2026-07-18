// v0.28 村莊關係服務：純函式處理每日交談、送禮、事件與條件式對話。
import { getVillageResidentProfile, getVillageWeekday } from '../data/villageResidentProfiles.js';
import { getSeasonSnapshot } from './SeasonCropService.js';

export const RELATION_TIERS = Object.freeze([
  { id: 'stranger', label: '初次認識', min: 0 },
  { id: 'acquainted', label: '熟悉村民', min: 20 },
  { id: 'friend', label: '可靠朋友', min: 45 },
  { id: 'close', label: '親密朋友', min: 70 },
  { id: 'bond', label: '特別羈絆', min: 90 },
]);

export function normalizeNpcRelation(relation = {}) {
  // v0.22 舊資料 affinity 上限為 10；升版時換算成百分制且不重複換算。
  const rawAffinity = Number(relation.affinity) || 0;
  const affinity = relation.schemaVersion >= 2 ? rawAffinity : rawAffinity <= 10 ? rawAffinity * 10 : rawAffinity;
  return {
    schemaVersion: 2,
    affinity: clamp(affinity, 0, 100),
    talkCount: Math.max(0, Number(relation.talkCount) || 0),
    lastTalkDay: Number(relation.lastTalkDay) || 0,
    lastGiftDay: Number(relation.lastGiftDay) || 0,
    giftsGiven: Math.max(0, Number(relation.giftsGiven) || 0),
    lastTopic: relation.lastTopic || null,
    memoryFlags: { ...(relation.memoryFlags || {}) },
    unlockedEventIds: [...new Set(relation.unlockedEventIds || [])],
    completedEventIds: [...new Set(relation.completedEventIds || [])],
  };
}

export function getRelationTier(affinity = 0) {
  return [...RELATION_TIERS].reverse().find((tier) => affinity >= tier.min) || RELATION_TIERS[0];
}

export function applyNpcTalk({ npcId, relation, worldClock = {}, companionModifiers = {} }) {
  const profile = getVillageResidentProfile(npcId);
  if (!profile) return { ok: false, reason: 'missing-npc' };
  const current = normalizeNpcRelation(relation);
  const dayIndex = Math.max(1, Number(worldClock.dayIndex) || 1);
  const firstTalkToday = current.lastTalkDay !== dayIndex;
  const affinityGain = firstTalkToday ? 2 + (Number(companionModifiers.firstTalkAffinityBonus) || 0) : 0;
  const next = {
    ...current,
    affinity: clamp(current.affinity + affinityGain, 0, 100),
    talkCount: current.talkCount + 1,
    lastTalkDay: dayIndex,
    lastTopic: selectTopic(profile, current.talkCount),
    memoryFlags: { ...current.memoryFlags, [`talked_day_${dayIndex}`]: true },
  };
  const event = unlockNextRelationEvent(profile, next);
  if (event) next.unlockedEventIds = [...new Set([...next.unlockedEventIds, event.id])];
  return {
    ok: true,
    relation: next,
    event,
    affinityGain,
    dialogue: buildNpcDialogue(profile, next, worldClock, { firstTalkToday, event }),
  };
}

export function evaluateNpcGift({ npcId, relation, itemId, worldClock = {} }) {
  const profile = getVillageResidentProfile(npcId);
  if (!profile) return { ok: false, reason: 'missing-npc' };
  if (!itemId) return { ok: false, reason: 'missing-item' };
  const current = normalizeNpcRelation(relation);
  const dayIndex = Math.max(1, Number(worldClock.dayIndex) || 1);
  if (current.lastGiftDay === dayIndex) return { ok: false, reason: 'gifted-today' };
  const preference = profile.giftPreferences.loved.includes(itemId)
    ? 'loved'
    : profile.giftPreferences.liked.includes(itemId)
      ? 'liked'
      : profile.giftPreferences.disliked.includes(itemId)
        ? 'disliked'
        : 'neutral';
  const gains = { loved: 10, liked: 6, neutral: 2, disliked: -3 };
  const affinityGain = gains[preference];
  const next = {
    ...current,
    affinity: clamp(current.affinity + affinityGain, 0, 100),
    lastGiftDay: dayIndex,
    giftsGiven: current.giftsGiven + 1,
    memoryFlags: { ...current.memoryFlags, [`gift_${itemId}`]: true, [`gift_day_${dayIndex}`]: true },
  };
  const event = unlockNextRelationEvent(profile, next);
  if (event) next.unlockedEventIds = [...new Set([...next.unlockedEventIds, event.id])];
  return { ok: true, relation: next, preference, affinityGain, event };
}

export function completeNpcRelationEvent(relation, eventId) {
  const current = normalizeNpcRelation(relation);
  if (!current.unlockedEventIds.includes(eventId)) return { ok: false, reason: 'locked-event', relation: current };
  if (current.completedEventIds.includes(eventId)) return { ok: false, reason: 'completed-event', relation: current };
  return {
    ok: true,
    relation: {
      ...current,
      completedEventIds: [...current.completedEventIds, eventId],
      affinity: clamp(current.affinity + 3, 0, 100),
      memoryFlags: { ...current.memoryFlags, [`event_${eventId}`]: true },
    },
  };
}

export function buildNpcDialogue(profile, relation, worldClock, context = {}) {
  const weather = worldClock.weather || 'sunny';
  const segment = worldClock.segment || 'morning';
  const tier = getRelationTier(relation.affinity);
  const weatherLines = profile.dialogue.weatherLines[weather] || profile.dialogue.weatherLines.sunny;
  const segmentLines = profile.dialogue.segmentLines[segment] || profile.dialogue.segmentLines.afternoon;
  const relationLine = profile.dialogue.relationLines.find(([id]) => id === tier.id)?.[1];
  const weekday = getVillageWeekday(worldClock.dayIndex);
  const weekly = profile.weeklyNotes?.[weekday.index];
  const season = getSeasonSnapshot(worldClock.dayIndex || 1);
  const seasonal = profile.dialogue.seasonLines?.[season.id]?.[0];
  const lines = [
    segmentLines[relation.talkCount % segmentLines.length],
    weatherLines[(relation.talkCount + 1) % weatherLines.length],
    relationLine,
    weekly,
    seasonal,
  ].filter(Boolean);
  if (context.event) lines.push(`新的關係事件「${context.event.title}」已解鎖：${context.event.summary}`);
  if (!context.firstTalkToday) lines.push('今天已經聊過了，我還是很高興你願意再來看看我。');
  return lines.slice(0, 5);
}

function unlockNextRelationEvent(profile, relation) {
  return profile.events.find((event) => relation.affinity >= event.affinity && !relation.unlockedEventIds.includes(event.id)) || null;
}

function selectTopic(profile, talkCount) {
  const pool = [profile.outdoorTopic, profile.morningTopic, profile.afternoonTopic, profile.eveningTopic].filter(Boolean);
  return pool[talkCount % pool.length] || '村莊生活';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
