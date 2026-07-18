// 主線進度純函式服務。
// Store 只負責讀寫狀態；任務比對、既有存檔回填與章節完成判斷集中在此，避免 UI 或戰鬥元件各自複製規則。
import { STORY_CHAPTERS, STORY_QUEST_BY_ID } from '../data/storyContent.js';

function normalizeAmount(value) {
  return Math.max(1, Number(value) || 1);
}

export function objectiveMatchesSignal(objective, signal) {
  if (!objective || !signal || objective.type !== signal.type) return false;
  if (objective.regionId && objective.regionId !== signal.regionId) return false;
  if (objective.targetId && objective.targetId !== signal.targetId) return false;
  if (objective.tier && objective.tier !== signal.tier) return false;
  return true;
}

export function applyStorySignal(storyProgress, signal) {
  const accepted = storyProgress?.acceptedQuestIds || [];
  const completed = new Set(storyProgress?.completedQuestIds || []);
  const progressMap = { ...(storyProgress?.questProgress || {}) };
  const completedQuestIds = [];
  let rewardGold = 0;
  let changed = false;

  accepted.forEach((questId) => {
    if (completed.has(questId)) return;
    const quest = STORY_QUEST_BY_ID[questId];
    const objective = quest?.objective;
    if (!objectiveMatchesSignal(objective, signal)) return;
    const next = Math.min(objective.target, (progressMap[questId] || 0) + normalizeAmount(signal.amount));
    if (next === progressMap[questId]) return;
    progressMap[questId] = next;
    changed = true;
    if (next >= objective.target) {
      completed.add(questId);
      completedQuestIds.push(questId);
      rewardGold += quest.rewardGold;
    }
  });

  if (!changed) return { changed: false, storyProgress };
  const nextStoryProgress = finalizeStoryProgress(storyProgress, progressMap, completed);
  const previousCompletedChapters = new Set(storyProgress?.completedChapterIds || []);
  const newlyCompletedChapterIds = nextStoryProgress.completedChapterIds.filter((chapterId) => !previousCompletedChapters.has(chapterId));
  return {
    changed: true,
    rewardGold,
    completedQuestIds,
    newlyCompletedChapterIds,
    storyProgress: nextStoryProgress,
  };
}

export function backfillChapterProgress(storyProgress, chapter, runtimeState) {
  if (!chapter) return { changed: false, storyProgress };
  const accepted = new Set(storyProgress?.acceptedQuestIds || []);
  const completed = new Set(storyProgress?.completedQuestIds || []);
  const progressMap = { ...(storyProgress?.questProgress || {}) };
  let changed = false;

  chapter.questIds.forEach((questId) => {
    accepted.add(questId);
    if (completed.has(questId)) return;
    const quest = STORY_QUEST_BY_ID[questId];
    if (!quest || !hasExistingEvidence(quest.objective, runtimeState)) return;
    progressMap[questId] = quest.objective.target;
    completed.add(questId);
    changed = true;
  });

  const nextBase = {
    ...(storyProgress || {}),
    activeChapterId: chapter.id,
    acceptedQuestIds: [...accepted],
  };
  const next = finalizeStoryProgress(nextBase, progressMap, completed);
  const acceptanceChanged = nextBase.activeChapterId !== storyProgress?.activeChapterId
    || accepted.size !== (storyProgress?.acceptedQuestIds || []).length;
  return { changed: changed || acceptanceChanged, storyProgress: next };
}

export function hasExistingEvidence(objective, runtimeState = {}) {
  const world = runtimeState.worldProgress || {};
  const game = runtimeState.gameProgress || {};
  if (!objective) return false;
  if (objective.type === 'visit') return (world.exploredSubareas?.[objective.regionId] || []).includes(objective.targetId);
  if (objective.type === 'mechanic') return Boolean(world.regionMechanicProgress?.[objective.regionId]?.[objective.targetId]);
  if (objective.type === 'structure') return Boolean(world.structureInteractions?.[`${objective.regionId}:${objective.targetId}`]);
  if (objective.type === 'defeat' && objective.tier === 'boss') return (game.bossDefeated || []).includes(objective.targetId);
  // 精英可重生，舊版本未保存精英唯一擊殺證據；不以一般擊殺數誤判完成。
  return false;
}

function finalizeStoryProgress(base, progressMap, completedSet) {
  const completedChapterIds = new Set(base?.completedChapterIds || []);
  STORY_CHAPTERS.forEach((chapter) => {
    if (chapter.questIds.every((questId) => completedSet.has(questId))) completedChapterIds.add(chapter.id);
  });
  return {
    ...(base || {}),
    questProgress: progressMap,
    completedQuestIds: [...completedSet],
    completedChapterIds: [...completedChapterIds],
  };
}
