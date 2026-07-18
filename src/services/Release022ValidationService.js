// v0.20-v0.22 合併驗證：戰鬥、塔樓、UI、故事、NPC 與學習資料的交叉關聯。
import { BOSS_PROFILE_REGION_IDS, ELITE_COMBAT_PROFILES, getBossCombatProfile } from '../data/combatEncounterProfiles.js';
import { TRIAL_ARENA_THEMES, TRIAL_ROOM_VARIANTS, getTrialRoomScenario } from '../data/trialTowerRooms.js';
import { getAllTrialFloorConfigs } from '../data/trialTower.js';
import { STORY_CHAPTERS, STORY_QUESTS, getStoryUnlockedRegionIds } from '../data/storyContent.js';
import { NPC_STORY_PROFILES } from '../data/npcStoryProfiles.js';
import { UI_DEFAULTS, sanitizeUiPreferences } from '../data/uiSystem.js';
import { getRegionProductionLayout } from '../data/regionProductionLayouts.js';
import { getRegionGameplayProfile } from '../data/regionGameplayProfiles.js';
import { getRegionEncounter } from '../data/regionEncounters.js';

export function validateRelease022Content() {
  const errors = [];
  const warnings = [];

  if (BOSS_PROFILE_REGION_IDS.length !== 8) errors.push(`區域 Boss Profile 應為 8，實際 ${BOSS_PROFILE_REGION_IDS.length}`);
  BOSS_PROFILE_REGION_IDS.forEach((regionId) => {
    const profile = getBossCombatProfile({ id: `${regionId}_boss`, regionId });
    if (!profile || profile.phases.length !== 3) errors.push(`${regionId} Boss 必須有 3 階段`);
    const phaseIds = new Set(profile?.phases.map((item) => item.id));
    if (phaseIds.size !== 3) errors.push(`${regionId} Boss 階段 ID 重複`);
    profile?.phases.forEach((phase) => {
      if (!phase.skills?.length) errors.push(`${regionId}/${phase.id} 缺少技能`);
      phase.skills?.forEach((skill) => {
        if (!['ring', 'line', 'targetCircle'].includes(skill.kind)) errors.push(`${regionId}/${skill.id} 技能類型無效`);
        if (!(skill.telegraphMs >= 700)) errors.push(`${regionId}/${skill.id} 預警時間不足 700ms`);
      });
    });
    if ((profile?.seal.requiredCorrect || 0) > (profile?.seal.questionCount || 0)) errors.push(`${regionId} 封印門檻大於題數`);
  });

  if (Object.keys(ELITE_COMBAT_PROFILES).length !== 8) errors.push('精英 Profile 必須覆蓋 8 區');
  Object.entries(ELITE_COMBAT_PROFILES).forEach(([regionId, profile]) => {
    if (profile.barrierHits < 1 || profile.pulseEvery < 3 || profile.enrageThreshold <= 0 || profile.enrageThreshold >= 1) errors.push(`${regionId} 精英特性數值無效`);
  });

  if (TRIAL_ARENA_THEMES.length !== 10) errors.push(`試煉塔主題場景應為 10，實際 ${TRIAL_ARENA_THEMES.length}`);
  if (new Set(TRIAL_ARENA_THEMES.map((item) => item.baseShape)).size < 7) errors.push('試煉塔場地輪廓差異不足 7 種');
  TRIAL_ARENA_THEMES.forEach((theme) => { if (theme.obstacles.length < 3) errors.push(`${theme.id} 場景障礙不足 3 個`); });
  const floors = getAllTrialFloorConfigs();
  const roomTypes = new Set(floors.map((item) => item.roomType));
  Object.keys(TRIAL_ROOM_VARIANTS).forEach((type) => { if (!roomTypes.has(type)) warnings.push(`100 層配置未使用房型 ${type}`); });
  floors.forEach((config) => {
    const scenario = getTrialRoomScenario(config);
    if (!scenario || scenario.floor !== config.floor) errors.push(`第 ${config.floor} 層場景 Scenario 無效`);
    if (config.isMilestone) {
      const profile = getBossCombatProfile(config.boss);
      if (!profile?.phases?.length) errors.push(`第 ${config.floor} 層 Boss 缺少正式戰鬥 Profile`);
    }
  });

  if (STORY_CHAPTERS.length !== 8) errors.push(`主線章節應為 8，實際 ${STORY_CHAPTERS.length}`);
  if (STORY_QUESTS.length !== 40) errors.push(`主線任務應為 40，實際 ${STORY_QUESTS.length}`);
  const orderedChapters = [...STORY_CHAPTERS].sort((left, right) => left.order - right.order);
  if (new Set(orderedChapters.map((chapter) => chapter.order)).size !== 8) errors.push('主線章節順序重複');
  orderedChapters.slice(0, -1).forEach((chapter) => { if (!chapter.unlocksRegionId) errors.push(`${chapter.id} 缺少下一區解鎖目標`); });
  if (orderedChapters.at(-1)?.unlocksRegionId != null) errors.push('最終章不得再指向下一區');
  if (new Set(getStoryUnlockedRegionIds(orderedChapters.map((chapter) => chapter.id))).size !== 7) errors.push('主線應可解鎖 7 個後續區域');
  STORY_CHAPTERS.forEach((chapter) => {
    if (chapter.questIds.length !== 5) errors.push(`${chapter.id} 應有 5 條任務`);
    const layout = getRegionProductionLayout(chapter.regionId);
    const gameplay = getRegionGameplayProfile(chapter.regionId);
    const encounter = getRegionEncounter(chapter.regionId);
    chapter.questIds.forEach((questId) => {
      const quest = STORY_QUESTS.find((item) => item.id === questId);
      if (!quest) { errors.push(`${chapter.id} 缺少任務 ${questId}`); return; }
      const objective = quest.objective;
      if (objective.type === 'visit' && !layout?.subareas.some((item) => item.id === objective.targetId)) errors.push(`${quest.id} 指向不存在子區 ${objective.targetId}`);
      if (objective.type === 'mechanic' && !gameplay?.mechanic.nodes.some((item) => item.id === objective.targetId)) errors.push(`${quest.id} 指向不存在機制 ${objective.targetId}`);
      if (objective.type === 'structure' && !gameplay?.structureInteractions.some((item) => item.targetId === objective.targetId)) errors.push(`${quest.id} 指向不存在 Socket ${objective.targetId}`);
      if (objective.tier === 'elite' && encounter?.elite.id !== objective.targetId) errors.push(`${quest.id} 精英 ID 不一致`);
      if (objective.tier === 'boss' && encounter?.boss.id !== objective.targetId) errors.push(`${quest.id} Boss ID 不一致`);
    });
  });

  if (Object.keys(NPC_STORY_PROFILES).length < 4) errors.push('村莊功能 NPC 對話 Profile 不足');
  const sanitized = sanitizeUiPreferences({ ...UI_DEFAULTS, textScale: 'invalid', handedness: 'invalid' });
  if (sanitized.textScale !== UI_DEFAULTS.textScale || sanitized.handedness !== UI_DEFAULTS.handedness) errors.push('UI 設定白名單回復失敗');
  ['textScale', 'hudScale', 'handedness', 'compactHud', 'showMinimap', 'reducedMotion', 'highContrast', 'colorVision', 'subtitles', 'voiceGuidance'].forEach((key) => {
    if (!(key in UI_DEFAULTS)) errors.push(`UI_DEFAULTS 缺少 ${key}`);
  });

  return {
    ok: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    summary: {
      regionBossProfiles: BOSS_PROFILE_REGION_IDS.length,
      bossPhases: BOSS_PROFILE_REGION_IDS.length * 3,
      eliteProfiles: Object.keys(ELITE_COMBAT_PROFILES).length,
      towerThemes: TRIAL_ARENA_THEMES.length,
      towerRoomTypes: Object.keys(TRIAL_ROOM_VARIANTS).length,
      towerFloors: floors.length,
      storyChapters: STORY_CHAPTERS.length,
      storyQuests: STORY_QUESTS.length,
      villageNpcProfiles: Object.keys(NPC_STORY_PROFILES).length,
      uiPreferenceKeys: Object.keys(UI_DEFAULTS).length,
    },
  };
}
