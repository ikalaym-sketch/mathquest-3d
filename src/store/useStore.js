// Zustand 主狀態庫（含加密持久化）
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encrypt, decrypt } from '../utils/crypto.js';
import { ACHIEVEMENTS, pickDailyQuests } from '../data/achievements.js';
import { STARTER_REGION_IDS } from '../data/worldRegions.js';
import { getTrialFloorConfig, TRIAL_TOWER_MAX_FLOOR } from '../data/trialTower.js';
import { DB } from '../data/index.js';
import { formatGameTime, getTimeSegment } from '../systems/timeWeatherConfig.js';
import { getRegionGameplayProfile } from '../data/regionGameplayProfiles.js';
import { applyRegionEventSignal, createRegionEventRun, pickNextRegionEvent } from '../services/RegionGameplayService.js';
import { UI_DEFAULTS, sanitizeUiPreferences } from '../data/uiSystem.js';
import { STORY_CHAPTERS, STORY_QUEST_BY_ID, getChapterForRegion, getStoryUnlockedRegionIds } from '../data/storyContent.js';
import { applyStorySignal, backfillChapterProgress } from '../services/StoryProgressService.js';
import { chooseNpcLine, getNpcStoryProfile } from '../data/npcStoryProfiles.js';
import { resolveEquipmentRuntime, resolveMainHandRuntime, validateEquipRequest } from '../services/EquipmentRuntimeService.js';
import { resolveItemUse, pruneExpiredEffects } from '../services/ItemRuntimeService.js';
import { calculateShipment, createFarmProductInstance, normalizeFarmProductInstance, removeFarmProductByInstance } from '../services/FarmInventoryService.js';
import { useFarmStore } from './farmStore.js';
import { createVillageSlice } from './villageSlice.js';
import { createCompanionSlice } from './companionSlice.js';
import { normalizeVillageEconomy } from '../services/VillageEconomyService.js';
import { normalizeCompanionState } from '../services/CompanionRuntimeService.js';
import { normalizeNpcRelation } from '../services/VillageRelationshipService.js';
import { EQUIPMENT_SLOT_IDS, normalizeEquippedSlots } from '../data/equipmentSchema.js';
import {
  PLAYER_ACCESSORY_OPTIONS,
  PLAYER_FACE_OPTIONS,
  PLAYER_HAIR_OPTIONS,
  PLAYER_OUTFIT_OPTIONS,
} from '../data/characterCompanionV031Catalog.js';
import {
  addEquipmentDefinitionToState,
  createInitialEquipmentState,
  ensureEquipmentDefinitions,
  findOwnedEquipmentInstance,
  migrateEquipmentState,
  removeEquipmentFromState,
} from '../services/EquipmentInstanceService.js';

// 供 store 內部引用（避免在 action 內重複 import）
const ACHIEVEMENTS_REF = ACHIEVEMENTS;
const DAILY_PICK_REF = pickDailyQuests;

// 自訂 storage：寫入前加密、讀取後解密（接上 LocalStorage）
const memoryStorage = new Map();
const encryptedStorage = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      if (raw == null) return null;
      return decrypt(raw);
    } catch (error) {
      return memoryStorage.get(name) || null;
    }
  },
  setItem: (name, value) => {
    const encrypted = encrypt(value);
    try {
      window.localStorage.setItem(name, encrypted);
    } catch (error) {
      memoryStorage.set(name, encrypted);
    }
  },
  removeItem: (name) => {
    try { window.localStorage.removeItem(name); } catch (error) { memoryStorage.delete(name); }
  },
};

// 玩家初始狀態
const INITIAL_PLAYER = {
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  stamina: 100, maxStamina: 100,
  gold: 50, level: 1, xp: 0,
};

const INITIAL_CHARACTER_PROFILE = {
  created: false,
  name: '星光冒險者',
  bodyType: 'balanced',
  skinColor: '#f2c9a5',
  hairStyle: 'short',
  hairColor: '#47352b',
  face: 'smile',
  outfitStyle: 'adventurer',
  accessory: 'none',
};

const ALLOWED_HAIR_STYLES = PLAYER_HAIR_OPTIONS.map((option) => option.id);
const ALLOWED_FACES = PLAYER_FACE_OPTIONS.map((option) => option.id);
const ALLOWED_OUTFITS = PLAYER_OUTFIT_OPTIONS.map((option) => option.id);
const ALLOWED_ACCESSORIES = PLAYER_ACCESSORY_OPTIONS.map((option) => option.id);

const INITIAL_EQUIPMENT = createInitialEquipmentState();

// 主存檔 v0.27 遷移：品質農產品與道具 Runtime 欄位集中處理，供正式讀檔與驗證器共用。
export function migrateMainSaveState(persistedState = {}) {
  const worldMinute = persistedState?.worldClock?.totalMinutes || 0;
  const inventory = { ...(persistedState?.inventory || {}) };
  const migratedProducts = (inventory.farmProducts || [])
    .map((item) => normalizeFarmProductInstance(item, worldMinute))
    .filter(Boolean);
  const retainedMaterials = [];

  // v0.26 以前會把收成作物直接壓成 seed ID 放進 materials。
  // 遷移時逐筆轉成 normal 品質農產品實例，確保舊玩家不會遺失數量或價值。
  (inventory.materials || []).forEach((itemId) => {
    const item = DB[itemId];
    if (item?.crop) {
      migratedProducts.push(createFarmProductInstance({
        itemId,
        quality: 'normal',
        quantity: 1,
        worldMinute,
        sourceType: 'legacy-harvest',
        metadata: { migratedFromMaterials: true },
      }));
    } else {
      retainedMaterials.push(itemId);
    }
  });
  inventory.materials = retainedMaterials;
  inventory.farmProducts = migratedProducts;
  const npcRelations = Object.fromEntries(Object.entries(persistedState?.npcRelations || {}).map(([id, relation]) => [id, normalizeNpcRelation(relation)]));
  const companionState = normalizeCompanionState(persistedState?.companionState, persistedState?.equipped?.pet, persistedState?.petData);
  const equipmentState = migrateEquipmentState({ ...persistedState, inventory });
  return {
    ...persistedState,
    characterProfile: normalizeCharacterProfile(persistedState?.characterProfile),
    inventory: equipmentState.inventory,
    equipmentInstances: equipmentState.equipmentInstances,
    equipped: equipmentState.equipped,
    equipmentAppearance: equipmentState.equipmentAppearance,
    equipmentLevels: equipmentState.equipmentLevels,
    weaponAffixes: equipmentState.weaponAffixes,
    npcRelations,
    villageEconomy: normalizeVillageEconomy(persistedState?.villageEconomy),
    companionState,
    activeItemEffects: persistedState?.activeItemEffects || {},
    nextSpellDiscount: persistedState?.nextSpellDiscount || 1,
    fishingBuff: persistedState?.fishingBuff || null,
  };
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── 核心存檔資料（會被持久化）──────────────────────────────
      playerState: { ...INITIAL_PLAYER },
      characterProfile: { ...INITIAL_CHARACTER_PROFILE },
      characterEditorOpen: false,
      inventory: {
        equipment: [...INITIAL_EQUIPMENT.inventoryEquipment],
        weapons: [...INITIAL_EQUIPMENT.legacyInventory.weapons],
        armors: [...INITIAL_EQUIPMENT.legacyInventory.armors],
        pets: [],
        items: ['item_03', 'item_04'],
        seeds: ['seed_01', 'seed_01', 'seed_02'],
        materials: ['mat_animal_feed', 'mat_animal_feed', 'mat_animal_feed', 'mat_animal_feed', 'mat_animal_feed'],
        farmProducts: [],
      },
      equipmentInstances: { ...INITIAL_EQUIPMENT.equipmentInstances },
      equipped: { ...INITIAL_EQUIPMENT.equipped },
      equipmentAppearance: { ...INITIAL_EQUIPMENT.equipmentAppearance },
      gameProgress: { unlockedDifficulty: 1, currentBiome: 'village', bossDefeated: [] },
      worldProgress: {
        currentRegionId: 'star_village',
        unlockedRegionIds: [...STARTER_REGION_IDS],
        discoveredRegionIds: ['star_village'],
        completedEvents: {},
        regionVisits: {},
        regionObjectives: {},
        regionKillProgress: {},
        exploredSubareas: {},
        regionEventRuns: {},
        regionMechanicProgress: {},
        structureInteractions: {},
        regionExplorationRewards: {},
        dailyRiftCompletions: {},
      },
      trialTower: {
        active: false,
        currentFloor: 1,
        highestFloor: 1,
        portalReady: false,
        completedMilestones: [],
        completedFloors: [],
        towerComplete: false,
      },
      storyProgress: {
        activeChapterId: 'chapter_star',
        acceptedQuestIds: [],
        completedQuestIds: [],
        questProgress: {},
        completedChapterIds: [],
      },
      npcRelations: {},
      villageEconomy: normalizeVillageEconomy(),
      companionState: normalizeCompanionState(),
      learningJournal: { interactions: [], totalSceneInteractions: 0, correctSceneInteractions: 0 },
      uiPreferences: { ...UI_DEFAULTS },

      // 數學表現（IRT 動態難度用）
      mathPerformance: { currentRank: 0, consecutiveCorrect: 0, consecutiveWrong: 0, showVisualHint: false },
      skillMastery: {},
      // 學習報表統計：五大維度 {correct, total}
      mathStats: {
        Addition: { correct: 0, total: 0 },
        Subtraction: { correct: 0, total: 0 },
        Multiplication: { correct: 0, total: 0 },
        Division: { correct: 0, total: 0 },
        Advanced: { correct: 0, total: 0 },
        Geometry: { correct: 0, total: 0 },
        Money: { correct: 0, total: 0 },
        Measurement: { correct: 0, total: 0 },
        Fractions: { correct: 0, total: 0 },
        Logic: { correct: 0, total: 0 },
      },

      // ── 執行期狀態（不需持久化，但放這方便存取）──────────────
      isPaused: false,        // Time Freeze：數學題/UI 開啟時為 true
      currentScene: 'village', // village / farm / wilderness / region / trialTower
      sceneEpoch: 0,          // 每次切換場景遞增；所有延遲回呼必須匹配此代次才可執行。
      isTransitioning: false,  // 轉場黑屏中
      // 全域數學挑戰：{ baseGrade, onResolve(correct) } 或 null
      // 觸發時自動開啟 Time Freeze，MathModal 監聽此狀態彈出
      mathChallenge: null,
      // 氣球射擊小遊戲開關（祭壇觸發）
      balloonGame: false,
      // 已解鎖橘裝藍圖（打 Boss 掉落）
      unlockedBlueprints: [],
      // 學習報表面板開關
      showReport: false,
      // Boss 封印挑戰：{ bossId, onResolve(allCorrect) } 或 null
      sealChallenge: null,
      // 通用面板系統：null 或 'inventory'|'equipment'|'shop'|'blacksmith'|'carpenter'|'build'|'machine'
      activePanel: null,
      panelData: null,
      // 舊版相容索引；正式等級由 equipmentInstances[instanceId].level 管理。
      equipmentLevels: {},
      // 進行中任務：{ id, type:'collect'|'scholar', label, target, materialId?, progress, done }
      quests: [],
      // 每日獎勵：記錄上次領取日期（YYYY-MM-DD）與連續天數
      lastDaily: null,
      dailyStreak: 0,
      // 天賦（智慧點解鎖的被動）+ 智慧點
      talents: { power: false, swift: false, fortune: false, vitality: false, guardian: false, scholar: false, greed: false },
      wisdomPoints: 0,
      // 成就解鎖狀態 { [id]: true }
      achievements: {},
      // 累積統計（成就/紀錄用）
      stats: { kills: 0, harvests: 0, bossKills: 0, correctAnswers: 0 },
      // 個人最佳紀錄
      records: { maxGold: 50, bossKills: 0, bestMathStreak: 0, totalKills: 0, bestWave: 0 },
      // 寵物養成 { [petId]: { level, exp } }
      petData: {},
      // 每日任務 { date, quests:[{id,label,type,target,materialId?,progress,done,reward}] }
      dailyQuests: { date: null, quests: [] },
      // 無盡試煉模式
      trialActive: false,
      trialWave: 0,
      // 舊版相容索引；正式詞綴由 equipmentInstances[instanceId].affixes 管理。
      weaponAffixes: {},
      // 目前生態系事件（野外隨機）{ name, kind, color } 或 null
      biomeEvent: null,
      // 目前野外生態系 id（供音樂主題）
      currentBiomeId: 1,
      worldHint: null,
      sceneChunkLoading: false,
      worldMapOpen: false,
      activeRegionEvent: null,
      activeRegionSubarea: null,
      activeRegionMonsterCount: 0,
      quickSlots: ['item_03', 'item_04', null, null, null],
      renderQuality: 'high',
      timeSpeed: 'normal',
      weatherType: 'sunny',
      weatherMode: 'auto',
      weatherNextChangeAt: 720,
      worldClock: { totalMinutes: 480, minutes: 480, dayIndex: 1, timeText: '08:00', segment: 'morning', weather: 'sunny', weatherLabel: '晴天', weatherIcon: '☀️', sceneId: 'village', indoorZoneId: null },
      quickItemMessage: null,
      // v0.27.0 道具增益採世界時間，離開遊戲不使用 Date.now() 偷跑。
      activeItemEffects: {},
      nextSpellDiscount: 1,
      fishingBuff: null,
      pendingFarmCommand: null,
      pendingSceneTransition: null,
      lastCombatAtWorldMinute: 0,
      lastCombatAtMs: 0,
      defeatState: null,
      respawnToken: 0,
      activeDialogue: null,
      // v0.24~v0.26 執行期環境狀態：不持久化，避免讀檔後出生在水中或室內 Pocket。
      waterRuntime: { state: 'ground', waterId: null, profileId: null, oxygen: null, isUnderwater: false, iceStress: null },
      activeRegionInterior: null,
      playerTeleportRequest: null,

      // ── Actions ───────────────────────────────────────────────
      // Time Freeze 開關
      setPaused: (v) => set({ isPaused: v }),
      // 水域狀態由 Player 每幀節流發布，UI 只讀取快照，不直接控制物理。
      setWaterRuntime: (snapshot) => set((state) => {
        const next = { ...state.waterRuntime, ...snapshot };
        const same = state.waterRuntime.state === next.state
          && state.waterRuntime.waterId === next.waterId
          && state.waterRuntime.profileId === next.profileId
          && state.waterRuntime.isUnderwater === next.isUnderwater
          && Math.abs((state.waterRuntime.oxygen ?? -1) - (next.oxygen ?? -1)) < 0.25
          && Math.abs((state.waterRuntime.iceStress ?? -1) - (next.iceStress ?? -1)) < 0.03;
        return same ? {} : { waterRuntime: next };
      }),
      requestPlayerTeleport: (position, reason = 'system') => set((state) => ({
        playerTeleportRequest: {
          id: (state.playerTeleportRequest?.id || 0) + 1,
          position: { x: Number(position.x), y: Number(position.y), z: Number(position.z) },
          reason,
        },
      })),
      consumePlayerTeleport: (requestId) => set((state) => state.playerTeleportRequest?.id === requestId ? { playerTeleportRequest: null } : {}),
      enterRegionInterior: (interior) => set((state) => ({
        activeRegionInterior: interior,
        playerTeleportRequest: {
          id: (state.playerTeleportRequest?.id || 0) + 1,
          position: { ...interior.spawn },
          reason: 'enter-region-interior',
        },
      })),
      exitRegionInterior: () => set((state) => {
        const target = state.activeRegionInterior?.returnPosition;
        return {
          activeRegionInterior: null,
          playerTeleportRequest: target ? {
            id: (state.playerTeleportRequest?.id || 0) + 1,
            position: { ...target },
            reason: 'exit-region-interior',
          } : state.playerTeleportRequest,
        };
      }),
      completeCharacterCreation: (profile) => {
        const safeName = String(profile?.name || '').trim().slice(0, 12) || '星光冒險者';
        const allowedBody = ['compact', 'balanced', 'sturdy'];
        set({
          characterProfile: {
            created: true,
            name: safeName,
            bodyType: allowedBody.includes(profile?.bodyType) ? profile.bodyType : 'balanced',
            skinColor: /^#[0-9a-f]{6}$/i.test(profile?.skinColor || '') ? profile.skinColor : INITIAL_CHARACTER_PROFILE.skinColor,
            hairStyle: ALLOWED_HAIR_STYLES.includes(profile?.hairStyle) ? profile.hairStyle : 'short',
            hairColor: /^#[0-9a-f]{6}$/i.test(profile?.hairColor || '') ? profile.hairColor : INITIAL_CHARACTER_PROFILE.hairColor,
            face: ALLOWED_FACES.includes(profile?.face) ? profile.face : 'smile',
            outfitStyle: ALLOWED_OUTFITS.includes(profile?.outfitStyle) ? profile.outfitStyle : 'adventurer',
            accessory: ALLOWED_ACCESSORIES.includes(profile?.accessory) ? profile.accessory : 'none',
          },
          characterEditorOpen: false,
          isPaused: false,
        });
      },
      openCharacterEditor: () => set({ characterEditorOpen: true, activePanel: null, panelData: null, isPaused: true }),
      closeCharacterEditor: () => set({ characterEditorOpen: false, isPaused: false }),
      restUntilMorning: () => set((state) => {
        const currentTotal = Number(state.worldClock?.totalMinutes) || 480;
        const currentDayStart = Math.floor(currentTotal / 1440) * 1440;
        let targetTotal = currentDayStart + 7 * 60;
        if (targetTotal <= currentTotal) targetTotal += 1440;
        const minutes = targetTotal % 1440;
        return {
          playerState: { ...state.playerState, hp: state.playerState.maxHp, mp: state.playerState.maxMp, stamina: state.playerState.maxStamina },
          worldClock: {
            ...state.worldClock,
            totalMinutes: targetTotal,
            minutes,
            dayIndex: Math.floor(targetTotal / 1440) + 1,
            timeText: formatGameTime(minutes),
            segment: getTimeSegment(minutes),
          },
          weatherMode: 'auto',
          weatherNextChangeAt: Math.max(state.weatherNextChangeAt || 0, targetTotal + 120),
        };
      }),
      triggerDefeat: (sceneId) => set((state) => state.defeatState ? {} : ({
        defeatState: { sceneId, occurredAt: Date.now() },
        isPaused: true,
      })),
      requestRespawn: () => set((state) => ({
        playerState: { ...state.playerState, hp: state.playerState.maxHp, mp: state.playerState.maxMp, stamina: state.playerState.maxStamina },
        defeatState: null,
        isPaused: false,
        respawnToken: state.respawnToken + 1,
      })),

      // 開啟數學挑戰（任何場景呼叫）：自動 Time Freeze
      // opts: { baseGrade?, onResolve?(correct) }
      openMathChallenge: (opts = {}) => {
        const sceneEpoch = get().sceneEpoch;
        set({
          isPaused: true,
          mathChallenge: {
            baseGrade: opts.baseGrade || null,
            skillContext: opts.skillContext || null,
            onResolve: opts.onResolve || null,
            sceneEpoch,
          },
        });
      },

      // 解決挑戰：只有仍位於原場景代次時才執行回呼，避免切區後舊題目改寫新場景。
      resolveMathChallenge: (correct) => {
        const state = get();
        const challenge = state.mathChallenge;
        const callbackValid = challenge && challenge.sceneEpoch === state.sceneEpoch;
        set({ mathChallenge: null, isPaused: false });
        if (callbackValid && challenge.onResolve) challenge.onResolve(correct);
      },

      // 氣球小遊戲：開啟時凍結主世界
      openBalloonGame: () => set({ balloonGame: true, isPaused: true }),
      closeBalloonGame: () => set({ balloonGame: false, isPaused: false }),

      // 學習報表開關（開啟時 Time Freeze）
      openReport: () => set({ showReport: true, isPaused: true }),
      closeReport: () => set({ showReport: false, isPaused: false }),

      // 解鎖藍圖（商人開始販售對應橘裝）
      unlockBlueprint: (blueprintId) =>
        set((s) =>
          s.unlockedBlueprints.includes(blueprintId)
            ? {}
            : { unlockedBlueprints: [...s.unlockedBlueprints, blueprintId] }
        ),

      // 記錄 Boss 已擊敗
      defeatBoss: (bossId) =>
        set((s) =>
          s.gameProgress.bossDefeated.includes(bossId)
            ? {}
            : { gameProgress: { ...s.gameProgress, bossDefeated: [...s.gameProgress.bossDefeated, bossId] } }
        ),

      // 開啟 Boss 封印連環問答（Time Freeze）
      openSealChallenge: (opts) => {
        const sceneEpoch = get().sceneEpoch;
        set({ isPaused: true, sealChallenge: { ...opts, bossId: opts.bossId, onResolve: opts.onResolve, sceneEpoch } });
      },
      resolveSealChallenge: (allCorrect) => {
        const state = get();
        const challenge = state.sealChallenge;
        const callbackValid = challenge && challenge.sceneEpoch === state.sceneEpoch;
        set({ sealChallenge: null, isPaused: false });
        if (callbackValid && challenge.onResolve) challenge.onResolve(allCorrect);
      },

      // 兒童 UI 與可及性設定：所有值先通過 Canonical 白名單再寫入。
      setUiPreference: (key, value) => set((state) => ({
        uiPreferences: sanitizeUiPreferences({ ...state.uiPreferences, [key]: value }),
      })),
      resetUiPreferences: () => set({ uiPreferences: { ...UI_DEFAULTS } }),

      // 章節初始化：接受該章五條任務，並依既有探索／機關／Socket／Boss 存檔回填，避免升版後卡關。
      ensureStoryProgress: (regionId = null) => {
        const state = get();
        const resolvedRegionId = regionId || state.worldProgress.currentRegionId;
        const chapter = getChapterForRegion(resolvedRegionId) || STORY_CHAPTERS[0];
        if (!chapter) return null;
        const result = backfillChapterProgress(state.storyProgress, chapter, state);
        const unlockedByStory = getStoryUnlockedRegionIds(result.storyProgress.completedChapterIds);
        const unlockedRegionIds = [...new Set([...(state.worldProgress.unlockedRegionIds || []), ...unlockedByStory])];
        if (result.changed || unlockedRegionIds.length !== state.worldProgress.unlockedRegionIds.length) {
          set({
            storyProgress: result.storyProgress,
            worldProgress: { ...state.worldProgress, unlockedRegionIds },
          });
        }
        return chapter;
      },

      // 場景、戰鬥與互動統一送入故事 Signal；完成任務後只發一次獎勵。
      recordStorySignal: (signal) => {
        const state = get();
        const result = applyStorySignal(state.storyProgress, signal);
        if (!result.changed) return { changed: false };
        const storyUnlocks = getStoryUnlockedRegionIds(result.storyProgress.completedChapterIds);
        const newlyUnlocked = storyUnlocks.find((regionId) => !state.worldProgress.unlockedRegionIds.includes(regionId)) || null;
        set((currentState) => ({
          storyProgress: result.storyProgress,
          worldProgress: {
            ...currentState.worldProgress,
            unlockedRegionIds: [...new Set([...(currentState.worldProgress.unlockedRegionIds || []), ...storyUnlocks])],
          },
          playerState: { ...currentState.playerState, gold: currentState.playerState.gold + result.rewardGold },
        }));
        const lastQuestId = result.completedQuestIds.at(-1);
        const completedQuest = lastQuestId ? STORY_QUEST_BY_ID[lastQuestId] : null;
        if (newlyUnlocked) {
          const unlockedChapter = STORY_CHAPTERS.find((item) => item.regionId === newlyUnlocked);
          get().showWorldHint(`章節完成：已解鎖${unlockedChapter?.title?.split('｜')[1] || '下一個區域'} · +${result.rewardGold}G`);
        } else if (result.newlyCompletedChapterIds?.includes('chapter_clockwork')) {
          get().showWorldHint(`八區主線完成：時序核心已穩定 · +${result.rewardGold}G`);
        } else if (completedQuest) get().showWorldHint(`主線任務完成：${completedQuest.title} · +${result.rewardGold}G`);
        return { changed: true, completedQuestIds: result.completedQuestIds, newlyUnlockedRegionId: newlyUnlocked };
      },

      // NPC 對話會記錄談話次數、好感與最近主題，並提供原有服務入口。
      talkToNpc: (npcId, options = {}) => {
        const state = get();
        const baseNpcProfile = getNpcStoryProfile(npcId, options.name);
        const npcProfile = {
          ...baseNpcProfile,
          role: options.role || baseNpcProfile.role,
          topics: Array.isArray(options.topics) && options.topics.length ? options.topics : baseNpcProfile.topics,
        };
        const previous = state.npcRelations[npcId] || { affinity: 0, talkCount: 0, lastTopic: null, memoryFlags: {} };
        const chapter = STORY_CHAPTERS.find((item) => item.id === state.storyProgress.activeChapterId);
        const nextRelation = {
          ...previous,
          affinity: Math.min(10, previous.affinity + (previous.talkCount === 0 ? 2 : 1)),
          talkCount: previous.talkCount + 1,
          lastTopic: npcProfile.topics[previous.talkCount % npcProfile.topics.length],
          lastTalkedAt: Date.now(),
          memoryFlags: {
            ...(previous.memoryFlags || {}),
            met: true,
            [`chapter_${chapter?.id || 'none'}`]: true,
          },
        };
        set((currentState) => ({
          npcRelations: { ...currentState.npcRelations, [npcId]: nextRelation },
          activeDialogue: {
            npcId,
            name: options.name || npcProfile.name,
            role: npcProfile.role,
            lines: chooseNpcLine(npcProfile, nextRelation, { chapterTitle: chapter?.title }),
            affinity: nextRelation.affinity,
            topic: nextRelation.lastTopic,
            servicePanel: options.servicePanel || npcProfile.servicePanel,
            serviceAction: options.serviceAction || null,
          },
          isPaused: true,
        }));
        return nextRelation;
      },
      closeNpcDialogue: () => set({ activeDialogue: null, isPaused: false }),

      // 場景式學習紀錄與傳統題目分開保存，供家長報表查看「實際操作」成果。
      recordLearningInteraction: (entry = {}) => set((state) => {
        const interactions = [...(state.learningJournal.interactions || []), {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          source: entry.source || 'scene',
          skillId: entry.skillId || null,
          context: entry.context || null,
          correct: Boolean(entry.correct),
          occurredAt: Date.now(),
        }].slice(-200);
        return {
          learningJournal: {
            interactions,
            totalSceneInteractions: (state.learningJournal.totalSceneInteractions || 0) + 1,
            correctSceneInteractions: (state.learningJournal.correctSceneInteractions || 0) + (entry.correct ? 1 : 0),
          },
        };
      }),

      // 場景切換會遞增 Callback 代次並清除所有帶函式的暫態狀態，防止卸載後回呼污染新場景。
      setScene: (scene) => set((state) => ({
        currentScene: scene,
        sceneEpoch: state.sceneEpoch + 1,
        mathChallenge: null,
        sealChallenge: null,
        activeDialogue: null,
        balloonGame: false,
        activeRegionInterior: null,
        playerTeleportRequest: null,
        pendingSceneTransition: null,
        waterRuntime: { state: 'ground', waterId: null, profileId: null, oxygen: null, isUnderwater: false, iceStress: null },
        isPaused: false,
      })),
      setTransitioning: (v) => set({ isTransitioning: v }),

      // 九宮格世界地圖：開啟時暫停主世界，避免玩家在選區時仍被怪物攻擊。
      openWorldMap: () => set({ worldMapOpen: true, isPaused: true }),
      closeWorldMap: () => set({ worldMapOpen: false, isPaused: false }),
      enterRegion: (regionId) =>
        set((state) => {
          if (!state.worldProgress.unlockedRegionIds.includes(regionId)) return {};
          const visits = { ...state.worldProgress.regionVisits };
          visits[regionId] = (visits[regionId] || 0) + 1;
          const discovered = state.worldProgress.discoveredRegionIds.includes(regionId)
            ? state.worldProgress.discoveredRegionIds
            : [...state.worldProgress.discoveredRegionIds, regionId];
          return {
            worldProgress: {
              ...state.worldProgress,
              currentRegionId: regionId,
              discoveredRegionIds: discovered,
              regionVisits: visits,
            },
            worldMapOpen: false,
            isPaused: false,
          };
        }),
      // 確保目前區域具有一條尚未完成的多步驟事件；三條事件全數完成後不再重複建立。
      ensureRegionEvent: (regionId) => {
        const state = get();
        const profile = getRegionGameplayProfile(regionId);
        if (!profile) return null;
        const existing = state.worldProgress.regionEventRuns?.[regionId];
        if (existing?.status === 'active') return existing;
        const eventDefinition = pickNextRegionEvent(
          profile,
          state.worldProgress.regionVisits?.[regionId] || 0,
          state.worldProgress.completedEvents || {},
        );
        if (!eventDefinition) return null;
        const run = createRegionEventRun(eventDefinition);
        set((currentState) => ({
          worldProgress: {
            ...currentState.worldProgress,
            regionEventRuns: { ...(currentState.worldProgress.regionEventRuns || {}), [regionId]: run },
          },
        }));
        return run;
      },

      // 所有場景行為統一轉成 Signal 推進事件，避免 UI 元件各自改寫事件進度。
      recordRegionEventSignal: (signal) => {
        const initialState = get();
        const regionId = signal?.regionId || initialState.worldProgress.currentRegionId;
        const profile = getRegionGameplayProfile(regionId);
        if (!profile) return { changed: false };
        let run = initialState.worldProgress.regionEventRuns?.[regionId];
        if (!run || run.status !== 'active') run = get().ensureRegionEvent(regionId);
        if (!run) return { changed: false };
        const eventDefinition = profile.events.find((item) => item.id === run.eventId);
        const result = applyRegionEventSignal(run, eventDefinition, signal);
        if (!result.changed) return result;

        set((currentState) => {
          const completedEvents = { ...(currentState.worldProgress.completedEvents || {}) };
          const materials = [...(currentState.inventory.materials || [])];
          let playerState = currentState.playerState;
          if (result.completed) {
            completedEvents[`${regionId}:${eventDefinition.id}`] = true;
            materials.push(profile.materialId);
            playerState = { ...currentState.playerState, gold: currentState.playerState.gold + eventDefinition.rewardGold };
          }
          return {
            worldProgress: {
              ...currentState.worldProgress,
              completedEvents,
              regionEventRuns: { ...(currentState.worldProgress.regionEventRuns || {}), [regionId]: result.run },
            },
            inventory: { ...currentState.inventory, materials },
            playerState,
            activeRegionEvent: result.completed ? null : currentState.activeRegionEvent,
          };
        });
        if (result.completed) get().showWorldHint(`事件完成：${eventDefinition.name} · +${eventDefinition.rewardGold}G`);
        return result;
      },

      // 記錄四個子區探索；首次完成全區探索時發放一次性獎勵。
      discoverRegionSubarea: (regionId, subareaId) => {
        const state = get();
        const profile = getRegionGameplayProfile(regionId);
        if (!profile || !subareaId) return { changed: false };
        const current = state.worldProgress.exploredSubareas?.[regionId] || [];
        if (current.includes(subareaId)) {
          get().recordRegionEventSignal({ regionId, type: 'visit', targetId: subareaId, amount: 1 });
          get().recordStorySignal({ regionId, type: 'visit', targetId: subareaId, amount: 1 });
          return { changed: false, explored: current.length };
        }
        const next = [...current, subareaId];
        const alreadyRewarded = Boolean(state.worldProgress.regionExplorationRewards?.[regionId]);
        const completed = next.length >= 4;
        set((currentState) => {
          const materials = [...(currentState.inventory.materials || [])];
          let playerState = currentState.playerState;
          const rewards = { ...(currentState.worldProgress.regionExplorationRewards || {}) };
          if (completed && !alreadyRewarded) {
            materials.push(profile.materialId, profile.materialId);
            playerState = { ...currentState.playerState, gold: currentState.playerState.gold + 100 };
            rewards[regionId] = true;
          }
          return {
            worldProgress: {
              ...currentState.worldProgress,
              exploredSubareas: { ...(currentState.worldProgress.exploredSubareas || {}), [regionId]: next },
              regionExplorationRewards: rewards,
            },
            inventory: { ...currentState.inventory, materials },
            playerState,
          };
        });
        get().showWorldHint(completed && !alreadyRewarded ? '區域探索完成：+100G 與 2 個區域素材' : `發現新子區：${subareaId} · ${next.length}/4`);
        get().recordRegionEventSignal({ regionId, type: 'visit', targetId: subareaId, amount: 1 });
        get().recordStorySignal({ regionId, type: 'visit', targetId: subareaId, amount: 1 });
        return { changed: true, explored: next.length, completed };
      },

      // 核心機制節點採順序解鎖；答題正確後才寫入完成狀態並發放一個區域素材。
      completeRegionMechanic: (regionId, nodeId) => {
        const state = get();
        const profile = getRegionGameplayProfile(regionId);
        const mechanicNode = profile?.mechanic?.nodes.find((item) => item.id === nodeId);
        if (!profile || !mechanicNode) return { ok: false, reason: 'missing' };
        const completedMap = { ...(state.worldProgress.regionMechanicProgress?.[regionId] || {}) };
        if (completedMap[nodeId]) {
          const eventResult = get().recordRegionEventSignal({ regionId, type: 'mechanic', targetId: nodeId, amount: 1 });
          get().recordStorySignal({ regionId, type: 'mechanic', targetId: nodeId, amount: 1 });
          return { ok: true, already: true, eventChanged: Boolean(eventResult?.changed), eventCompleted: Boolean(eventResult?.completed) };
        }
        const previous = profile.mechanic.nodes.find((item) => item.order === mechanicNode.order - 1);
        if (previous && !completedMap[previous.id]) return { ok: false, reason: 'order', previousLabel: previous.label };
        completedMap[nodeId] = true;
        set((currentState) => ({
          worldProgress: {
            ...currentState.worldProgress,
            regionMechanicProgress: { ...(currentState.worldProgress.regionMechanicProgress || {}), [regionId]: completedMap },
          },
          inventory: { ...currentState.inventory, materials: [...(currentState.inventory.materials || []), profile.materialId] },
        }));
        get().showWorldHint(`完成：${mechanicNode.label} · 取得區域素材`);
        get().recordRegionEventSignal({ regionId, type: 'mechanic', targetId: nodeId, amount: 1 });
        get().recordStorySignal({ regionId, type: 'mechanic', targetId: nodeId, amount: 1 });
        get().recordLearningInteraction({ source: 'region', skillId: profile.skillContext, correct: true, context: nodeId });
        return { ok: true, completedCount: Object.keys(completedMap).length };
      },

      // 結構 Socket 同時是任務、NPC 與工坊的唯一互動來源。
      recordRegionStructureInteraction: (regionId, targetId) => {
        if (!regionId || !targetId) return false;
        set((currentState) => ({
          worldProgress: {
            ...currentState.worldProgress,
            structureInteractions: {
              ...(currentState.worldProgress.structureInteractions || {}),
              [`${regionId}:${targetId}`]: true,
            },
          },
        }));
        get().recordRegionEventSignal({ regionId, type: 'structure', targetId, amount: 1 });
        get().recordStorySignal({ regionId, type: 'structure', targetId, amount: 1 });
        return true;
      },

      // 區域工坊：4 個區域素材 + 120G 製作一次性紀念品。
      craftRegionKeepsake: (regionId) => {
        const state = get();
        const profile = getRegionGameplayProfile(regionId);
        if (!profile) return { ok: false, reason: 'region' };
        if ((state.inventory.items || []).includes(profile.keepsakeId)) return { ok: false, reason: 'owned' };
        if (state.playerState.gold < 120) return { ok: false, reason: 'gold' };
        const materials = [...(state.inventory.materials || [])];
        const indexes = [];
        materials.forEach((itemId, index) => { if (itemId === profile.materialId && indexes.length < 4) indexes.push(index); });
        if (indexes.length < 4) return { ok: false, reason: 'material' };
        for (const index of indexes.reverse()) materials.splice(index, 1);
        set((currentState) => ({
          inventory: { ...currentState.inventory, materials, items: [...(currentState.inventory.items || []), profile.keepsakeId] },
          playerState: { ...currentState.playerState, gold: currentState.playerState.gold - 120 },
        }));
        get().showWorldHint('區域紀念品製作完成');
        return { ok: true, itemId: profile.keepsakeId };
      },

      // 每日秘境只在同一日期首次擊敗守護者時發放獎勵，防止重新進場重複刷取。
      completeDailyRift: (dayKey, rewardMaterialId, rewardGold = 180) => {
        const state = get();
        if (!dayKey || state.worldProgress.dailyRiftCompletions?.[dayKey]) return { ok: false, reason: 'completed' };
        set((currentState) => ({
          worldProgress: {
            ...currentState.worldProgress,
            dailyRiftCompletions: { ...(currentState.worldProgress.dailyRiftCompletions || {}), [dayKey]: true },
          },
          inventory: { ...currentState.inventory, materials: [...(currentState.inventory.materials || []), rewardMaterialId] },
          playerState: { ...currentState.playerState, gold: currentState.playerState.gold + rewardGold },
        }));
        get().showWorldHint(`每日秘境完成：+${rewardGold}G`);
        return { ok: true };
      },

      completeRegionEvent: (regionId, eventName) => {
        const state = get();
        const key = `${regionId}:${eventName}`;
        if (state.worldProgress.completedEvents?.[key]) return false;
        const completedEvents = { ...(state.worldProgress.completedEvents || {}), [key]: true };
        set({
          worldProgress: { ...state.worldProgress, completedEvents },
          playerState: { ...state.playerState, gold: state.playerState.gold + 80 },
          activeRegionEvent: null,
        });
        const eventCount = Object.keys(completedEvents).filter((entry) => entry.startsWith(`${regionId}:`)).length;
        get().recordCompanionActivity?.('explore', { regionId, eventName, eventCount });
        return true;
      },
      setActiveRegionEvent: (eventData) => set({ activeRegionEvent: eventData }),
      setActiveRegionSubarea: (subareaId) => set({ activeRegionSubarea: subareaId }),
      setActiveRegionMonsterCount: (count) => set({ activeRegionMonsterCount: Math.max(0, Number(count) || 0) }),

      completeRegionObjective: (regionId, objectiveId) =>
        set((state) => {
          const key = `${regionId}:${objectiveId}`;
          if (state.worldProgress.regionObjectives?.[key]) return {};
          return {
            worldProgress: {
              ...state.worldProgress,
              regionObjectives: { ...(state.worldProgress.regionObjectives || {}), [key]: true },
            },
          };
        }),
      incrementRegionKillObjective: (regionId, objectiveId, target = 5) => {
        const key = `${regionId}:${objectiveId}`;
        const state = get();
        if (state.worldProgress.regionObjectives?.[key]) return target;
        const current = (state.worldProgress.regionKillProgress?.[key] || 0) + 1;
        const completed = current >= target;
        set((currentState) => ({
          worldProgress: {
            ...currentState.worldProgress,
            regionKillProgress: {
              ...(currentState.worldProgress.regionKillProgress || {}),
              [key]: Math.min(target, current),
            },
            regionObjectives: completed
              ? { ...(currentState.worldProgress.regionObjectives || {}), [key]: true }
              : (currentState.worldProgress.regionObjectives || {}),
          },
        }));
        return Math.min(target, current);
      },

      // 試煉之塔：離開時保留 currentFloor，玩家可從村莊傳送門接續。
      startOrResumeTrialTower: () =>
        set((state) => ({
          trialTower: { ...state.trialTower, active: true, portalReady: false },
        })),
      setTrialPortalReady: (ready) =>
        set((state) => ({ trialTower: { ...state.trialTower, portalReady: ready } })),
      advanceTrialFloor: () => {
        const state = get();
        const current = state.trialTower.currentFloor;
        const config = getTrialFloorConfig(current);
        const completedFloors = state.trialTower.completedFloors || [];
        const alreadyCompleted = completedFloors.includes(current);
        const milestoneDone = (state.trialTower.completedMilestones || []).includes(current);
        const nextCompletedFloors = alreadyCompleted ? completedFloors : [...completedFloors, current];
        const completedMilestones = config.isMilestone && !milestoneDone
          ? [...(state.trialTower.completedMilestones || []), current]
          : (state.trialTower.completedMilestones || []);
        const completedTower = current >= TRIAL_TOWER_MAX_FLOOR;
        const nextFloor = completedTower ? TRIAL_TOWER_MAX_FLOOR : current + 1;
        const materials = [...state.inventory.materials];
        if (config.rewardMaterial && !alreadyCompleted) materials.push(config.rewardMaterial);
        const rewardGold = alreadyCompleted ? 0 : config.rewardGold;
        set((currentState) => ({
          trialTower: {
            ...currentState.trialTower,
            currentFloor: nextFloor,
            highestFloor: Math.max(currentState.trialTower.highestFloor, nextFloor),
            portalReady: false,
            completedMilestones,
            completedFloors: nextCompletedFloors,
            towerComplete: completedTower || currentState.trialTower.towerComplete,
          },
          playerState: { ...currentState.playerState, gold: currentState.playerState.gold + rewardGold },
          inventory: { ...currentState.inventory, materials },
          records: { ...currentState.records, bestWave: Math.max(currentState.records.bestWave || 0, current) },
        }));
        return { floor: current, nextFloor, config, rewardGranted: !alreadyCompleted, completedTower };
      },
      exitTrialTower: () =>
        set((state) => ({
          trialTower: { ...state.trialTower, active: false, portalReady: false },
        })),

      // 金錢增減（夾在 0 以上）
      addGold: (n) =>
        set((s) => ({ playerState: { ...s.playerState, gold: Math.max(0, s.playerState.gold + n) } })),

      // HP/MP 調整（夾在 0~max）
      modifyHp: (n) =>
        set((s) => ({
          playerState: { ...s.playerState, hp: clamp(s.playerState.hp + n, 0, s.playerState.maxHp) },
        })),
      modifyMp: (n) =>
        set((s) => ({
          playerState: { ...s.playerState, mp: clamp(s.playerState.mp + n, 0, s.playerState.maxMp) },
        })),

      // 畫質設定與快捷道具共用 Action。
      setRenderQuality: (qualityId) => set({ renderQuality: ['low','medium','high','ultra'].includes(qualityId) ? qualityId : 'high' }),
      setTimeSpeed: (speed) => set({ timeSpeed: ['slow','normal','fast'].includes(speed) ? speed : 'normal' }),
      setWeatherType: (weather, mode = 'manual') => set({
        weatherType: ['sunny','cloudy','lightRain','breeze','mist'].includes(weather) ? weather : 'sunny',
        weatherMode: mode === 'auto' ? 'auto' : 'manual',
      }),
      setWeatherMode: (mode) => set({ weatherMode: mode === 'manual' ? 'manual' : 'auto' }),
      advanceWeatherCycle: (totalMinutes) => set((state) => {
        if (state.weatherMode !== 'auto' || totalMinutes < state.weatherNextChangeAt) return {};
        const sequence = ['sunny', 'breeze', 'cloudy', 'lightRain', 'mist', 'sunny', 'cloudy'];
        const currentIndex = Math.max(0, sequence.indexOf(state.weatherType));
        const dayIndex = Math.max(1, Math.floor(totalMinutes / 1440) + 1);
        const nextIndex = (currentIndex + 1 + (dayIndex % 2)) % sequence.length;
        const nextWeather = sequence[nextIndex];
        const duration = nextWeather === 'lightRain' ? 180 : nextWeather === 'mist' ? 140 : 240;
        return { weatherType: nextWeather, weatherNextChangeAt: totalMinutes + duration };
      }),
      publishWorldClock: (snapshot) => set((state) => {
        const worldClock = { ...state.worldClock, ...snapshot };
        const activeItemEffects = pruneExpiredEffects(state.activeItemEffects, worldClock.totalMinutes);
        return { worldClock, activeItemEffects };
      }),
      assignQuickSlot: (slotIndex, itemId) => {
        const state = get();
        if (slotIndex < 0 || slotIndex > 4) return false;
        if (itemId && !(state.inventory.items || []).includes(itemId)) return false;
        const quickSlots = [...state.quickSlots]; quickSlots[slotIndex] = itemId || null; set({ quickSlots }); return true;
      },
      clearQuickSlot: (slotIndex) => {
        const state=get(); if(slotIndex<0||slotIndex>4)return; const quickSlots=[...state.quickSlots]; quickSlots[slotIndex]=null; set({quickSlots});
      },
      useInventoryItem: (itemId) => {
        const state = get();
        const item = DB[itemId];
        const items = [...(state.inventory.items || [])];
        const index = items.indexOf(itemId);
        if (!item || index < 0) {
          set({ quickItemMessage: '道具數量不足' });
          return { ok: false, reason: 'missing' };
        }
        // 成長粉必須先確認存在可成長作物；無有效目標時不得先消耗道具。
        if (itemId === 'item_10' && !useFarmStore.getState().farmGrid.some((cell) => cell.currentSeedId && !cell.isReady && !cell.isWithered)) {
          const result = { ok: false, reason: 'no-crop' };
          set({ quickItemMessage: '目前沒有尚未成熟的作物，成長粉不會被消耗' });
          return result;
        }
        const outcome = resolveItemUse(item, state);
        if (!outcome.ok) {
          const reasonMessage = outcome.reason === 'fullHp' ? '生命值已經全滿'
            : outcome.reason === 'fullMp' ? '魔力值已經全滿'
              : '此道具目前無法使用，物品不會被消耗';
          set({ quickItemMessage: reasonMessage });
          return outcome;
        }
        if (outcome.consume) items.splice(index, 1);
        const patch = { inventory: { ...state.inventory, items }, quickItemMessage: outcome.message };
        if (outcome.playerPatch) patch.playerState = { ...state.playerState, ...outcome.playerPatch };
        if (outcome.activeEffect) patch.activeItemEffects = {
          ...state.activeItemEffects,
          [outcome.activeEffect.key]: outcome.activeEffect,
        };
        if (outcome.nextSpellDiscount) patch.nextSpellDiscount = outcome.nextSpellDiscount;
        if (outcome.fishingBuff) patch.fishingBuff = outcome.fishingBuff;
        if (outcome.farmCommand) patch.pendingFarmCommand = { ...outcome.farmCommand, id: Date.now() };
        if (outcome.transitionScene) patch.pendingSceneTransition = { scene: outcome.transitionScene, id: Date.now() };
        if (outcome.restoreStamina) patch.playerState = { ...(patch.playerState || state.playerState), stamina: state.playerState.maxStamina };
        if (outcome.mathChallenge) {
          const capturedEpoch = state.sceneEpoch;
          patch.isPaused = true;
          patch.mathChallenge = {
            baseGrade: outcome.mathChallenge.baseGrade,
            onResolve: (correct) => {
              if (get().sceneEpoch !== capturedEpoch) return;
              const healPercent = correct ? outcome.mathChallenge.healPercent : outcome.mathChallenge.wrongHealPercent;
              if (healPercent) get().healHpPercent(healPercent);
              if (correct && outcome.mathChallenge.restoreMpPercent) get().healMpPercent(outcome.mathChallenge.restoreMpPercent);
            },
          };
        }
        set(patch);
        if (typeof window !== 'undefined') {
          window.clearTimeout(window.__mqQuickItemMessageTimer);
          window.__mqQuickItemMessageTimer = window.setTimeout(() => set({ quickItemMessage: null }), 1800);
        }
        return { ok: true };
      },
      consumePendingFarmCommand: (commandId) => set((state) => state.pendingFarmCommand?.id === commandId ? { pendingFarmCommand: null } : {}),
      consumePendingSceneTransition: (requestId) => set((state) => state.pendingSceneTransition?.id === requestId ? { pendingSceneTransition: null } : {}),
      useQuickSlot: (slotIndex) => { const id=get().quickSlots?.[slotIndex]; if(!id){set({quickItemMessage:'這個快捷格是空的'});return {ok:false,reason:'empty'};} return get().useInventoryItem(id); },

      // 依百分比回血/回魔
      healHpPercent: (pct) =>
        set((s) => ({
          playerState: {
            ...s.playerState,
            hp: clamp(s.playerState.hp + s.playerState.maxHp * (pct / 100), 0, s.playerState.maxHp),
          },
        })),

      healMpPercent: (pct) =>
        set((state) => ({
          playerState: {
            ...state.playerState,
            mp: clamp(state.playerState.mp + state.playerState.maxMp * (pct / 100), 0, state.playerState.maxMp),
          },
        })),
      consumeStamina: (amount, reason = 'action') => {
        const state = get();
        const cost = Math.max(0, Number(amount) || 0);
        if (state.playerState.stamina < cost) {
          set({ quickItemMessage: '體力不足，請休息或補充食物' });
          return { ok: false, reason: 'stamina', required: cost };
        }
        set({ playerState: { ...state.playerState, stamina: state.playerState.stamina - cost }, lastStaminaAction: reason });
        return { ok: true };
      },
      restoreStamina: (amount) => set((state) => ({
        playerState: { ...state.playerState, stamina: clamp(state.playerState.stamina + Math.max(0, Number(amount) || 0), 0, state.playerState.maxStamina) },
      })),
      performFishing: () => {
        const state = get();
        const buff = state.fishingBuff;
        const roll = Math.random();
        let itemId = roll < 0.08 || (buff && Math.random() < (buff.legendaryChance || 0)) ? 'fish_rainbow_spirit'
          : buff?.guarantee === 'rare' || roll < 0.35 ? 'fish_prism_trout'
            : 'fish_sparkle_carp';
        const materials = [...(state.inventory.materials || []), itemId];
        const fishingBuff = buff ? (buff.uses > 1 ? { ...buff, uses: buff.uses - 1 } : null) : null;
        set({ inventory: { ...state.inventory, materials }, fishingBuff });
        return { ok: true, itemId, item: DB[itemId] };
      },

      getEquipmentRuntime: () => {
        const state = get();
        return resolveEquipmentRuntime({ equipped: state.equipped, equipmentInstances: state.equipmentInstances, equipmentLevels: state.equipmentLevels, playerState: state.playerState, activeEffects: state.activeItemEffects });
      },
      consumeSpellCost: (baseCost = 0) => {
        const state = get();
        const runtime = state.getEquipmentRuntime();
        const discount = Math.max(0.1, Number(state.nextSpellDiscount) || 1);
        const cost = Math.max(0, Math.ceil((Number(baseCost) || 0) * runtime.spellCostMultiplier * discount));
        if (state.playerState.mp < cost) {
          set({ quickItemMessage: '魔力不足' });
          return { ok: false, cost };
        }
        set({ playerState: { ...state.playerState, mp: state.playerState.mp - cost }, nextSpellDiscount: 1 });
        return { ok: true, cost };
      },
      receiveDamage: (amount, context = {}) => {
        const state = get();
        const runtime = state.getEquipmentRuntime();
        const guardian = state.activeItemEffects?.guardian;
        const rawDamage = Math.max(0, Number(amount) || 0);
        const incomingMultiplier = guardian ? 0 : runtime.incomingDamage;
        const finalDamage = Math.max(0, Math.round(rawDamage * incomingMultiplier));
        const hp = clamp(state.playerState.hp - finalDamage, 0, state.playerState.maxHp);
        set({ playerState: { ...state.playerState, hp }, lastCombatAtWorldMinute: state.worldClock.totalMinutes || 0, lastCombatAtMs: Date.now() });

        // 守護卷軸即使把實際傷害降為 0，也必須以敵方原始攻擊值計算反射；
        // 一般反傷套裝則以玩家實際承受傷害計算，避免防禦與反傷互相重複放大。
        const reflectRatio = guardian?.reflectDamage || runtime.reflectDamage;
        const reflectBase = guardian ? rawDamage : finalDamage;
        if (context.source?.takeHit && reflectRatio > 0 && reflectBase > 0) {
          context.source.takeHit(Math.max(1, Math.round(reflectBase * reflectRatio)), { reflected: true, ignoreHurtCooldown: true });
        }

        // 鏡盾 Lv5 只反擊近身怪物攻擊；環境傷害、Boss 範圍技能與反射傷害不得觸發。
        const mainHand = resolveMainHandRuntime(state.equipped, state.equipmentInstances, state.equipmentLevels);
        if (mainHand.definitionId === 'wpn_m_10'
          && mainHand.isLv5
          && context.sourceType === 'monster'
          && context.source?.takeHit
          && finalDamage > 0
          && !context.reflected) {
          context.source.takeHit(Math.max(1, Math.round(finalDamage * 1.5)), { counter: true, ignoreHurtCooldown: true });
        }
        return { damage: finalDamage, hp };
      },
      applyDamageRecovery: (damage) => {
        const runtime = get().getEquipmentRuntime();
        if (runtime.lifesteal <= 0) return 0;
        const heal = Math.max(1, Math.round((Number(damage) || 0) * runtime.lifesteal));
        get().healHpPercent((heal / Math.max(1, get().playerState.maxHp)) * 100);
        return heal;
      },

      // 確保舊存檔具備 Canonical 初始裝備實例，不覆蓋玩家既有選擇。
      ensureStarterEquipment: () =>
        set((state) => {
          const next = ensureEquipmentDefinitions(state);
          const equipped = normalizeEquippedSlots(next.equipped);
          if (!equipped.mainHand) equipped.mainHand = findOwnedEquipmentInstance('wpn_m_01', next.inventory, next.equipmentInstances)?.instanceId || null;
          if (!equipped.body) equipped.body = findOwnedEquipmentInstance('arm_leather_body', next.inventory, next.equipmentInstances)?.instanceId || null;
          return { inventory: next.inventory, equipmentInstances: next.equipmentInstances, equipped };
        }),

      // 正式八欄裝備：head/body/hands/legs/feet/mainHand/offHand/accessory。
      equip: (slot, itemId) => {
        const state = get();
        const validation = validateEquipRequest({ inventory: state.inventory, equipmentInstances: state.equipmentInstances, equipped: state.equipped, slot, itemId });
        if (!validation.ok) {
          const message = validation.reason === 'not-owned' ? '尚未擁有這件裝備'
            : validation.reason === 'main-hand-locks-offhand' ? '目前主武器需要雙手，不能裝備副手'
              : validation.reason === 'companion-system' ? '守護夥伴請從夥伴名冊切換'
                : '裝備欄位不符合';
          set({ quickItemMessage: message });
          return validation;
        }
        const equipped = { ...state.equipped, [validation.slot]: validation.instanceId };
        if (validation.clearsOffHand) equipped.offHand = null;
        set({ equipped });
        return { ok: true, instanceId: validation.instanceId, slot: validation.slot };
      },
      unequip: (slot) => {
        if (!EQUIPMENT_SLOT_IDS.includes(slot)) return { ok: false, reason: 'wrong-slot' };
        set((state) => ({ equipped: { ...state.equipped, [slot]: null } }));
        return { ok: true };
      },

      addFarmProduct: (product) => {
        const state = get();
        const normalized = normalizeFarmProductInstance(product, state.worldClock.totalMinutes || 0);
        if (!normalized) return { ok: false, reason: 'invalid-product' };
        set({ inventory: { ...state.inventory, farmProducts: [...(state.inventory.farmProducts || []), normalized] } });
        return { ok: true, product: normalized };
      },
      removeFarmProduct: (instanceId, quantity = 1) => {
        const state = get();
        const result = removeFarmProductByInstance(state.inventory.farmProducts || [], instanceId, quantity);
        if (!result.removed) return { ok: false, reason: 'missing-product' };
        set({ inventory: { ...state.inventory, farmProducts: result.next } });
        return { ok: true, product: result.removed };
      },
      shipAllFarmProducts: () => {
        const state = get();
        const shippedProducts = [...(state.inventory.farmProducts || [])];
        const shipment = calculateShipment(shippedProducts);
        if (!shipment.itemCount) return { ok: false, reason: 'empty', ...shipment };
        set({
          inventory: { ...state.inventory, farmProducts: [] },
          playerState: { ...state.playerState, gold: state.playerState.gold + shipment.totalGold },
        });
        get().recordVillageShipment?.(shippedProducts, shipment.totalGold);
        return { ok: true, ...shipment };
      },

      // 背包新增；武器／防具自動建立唯一 equipment instance。
      addToInventory: (category, itemId) =>
        set((state) => {
          if (category === 'weapons' || category === 'armors' || category === 'equipment') {
            const patch = addEquipmentDefinitionToState(state, itemId, { source: 'inventory-add' });
            return patch ? { inventory: patch.inventory, equipmentInstances: patch.equipmentInstances } : {};
          }
          return { inventory: { ...state.inventory, [category]: [...(state.inventory[category] || []), itemId] } };
        }),

      // 移除第一個未穿戴、未鎖定的裝備實例；一般物品維持原行為。
      removeFromInventory: (category, itemId) =>
        set((state) => {
          if (category === 'weapons' || category === 'armors' || category === 'equipment') {
            const patch = removeEquipmentFromState(state, itemId);
            return patch ? { inventory: patch.inventory, equipmentInstances: patch.equipmentInstances } : {};
          }
          const arr = [...(state.inventory[category] || [])];
          const index = arr.indexOf(itemId);
          if (index >= 0) arr.splice(index, 1);
          return { inventory: { ...state.inventory, [category]: arr } };
        }),

      // ── 面板系統：開啟時 Time Freeze ──────────────────────
      openPanel: (name, data = null) => set({ activePanel: name, panelData: data, isPaused: true }),
      closePanel: () => set({ activePanel: null, panelData: null, isPaused: false }),

      // ── 商店：購買（扣金幣、入袋）/ 販售（出袋、加金幣）──
      buyItem: (category, itemId, price) => {
        const state = get();
        if (state.playerState.gold < price) return false;
        if (category === 'weapons' || category === 'armors' || category === 'equipment') {
          const patch = addEquipmentDefinitionToState(state, itemId, { source: 'shop' });
          if (!patch) return false;
          set({
            playerState: { ...state.playerState, gold: state.playerState.gold - price },
            inventory: patch.inventory,
            equipmentInstances: patch.equipmentInstances,
          });
          return true;
        }
        set({
          playerState: { ...state.playerState, gold: state.playerState.gold - price },
          inventory: { ...state.inventory, [category]: [...(state.inventory[category] || []), itemId] },
        });
        return true;
      },
      sellItem: (category, itemId, price) => {
        const state = get();
        if (category === 'weapons' || category === 'armors' || category === 'equipment') {
          const patch = removeEquipmentFromState(state, itemId);
          if (!patch) return false;
          set({
            playerState: { ...state.playerState, gold: state.playerState.gold + price },
            inventory: patch.inventory,
            equipmentInstances: patch.equipmentInstances,
          });
          return true;
        }
        const arr = [...(state.inventory[category] || [])];
        const index = arr.indexOf(itemId);
        if (index < 0) return false;
        arr.splice(index, 1);
        set({
          playerState: { ...state.playerState, gold: state.playerState.gold + price },
          inventory: { ...state.inventory, [category]: arr },
        });
        return true;
      },

      // ── 鐵匠：升級指定裝備實例，避免同款裝備共用一個等級 ────────
      upgradeEquipment: (itemRef, goldCost, materialId) => {
        const state = get();
        const instance = findOwnedEquipmentInstance(itemRef, state.inventory, state.equipmentInstances);
        if (!instance) return { ok: false, reason: 'missing-equipment' };
        if (instance.level >= 5) return { ok: false, reason: 'max-level' };
        if (state.playerState.gold < goldCost) return { ok: false, reason: 'gold' };

        const materials = [...(state.inventory.materials || [])];
        const materialIndex = materialId ? materials.indexOf(materialId) : -1;
        if (materialId && materialIndex < 0) return { ok: false, reason: 'material' };
        if (materialIndex >= 0) materials.splice(materialIndex, 1);

        const equipmentInstances = {
          ...state.equipmentInstances,
          [instance.instanceId]: { ...instance, level: 5 },
        };
        set({
          playerState: { ...state.playerState, gold: state.playerState.gold - goldCost },
          inventory: { ...state.inventory, materials },
          equipmentInstances,
          // 暫時同步舊索引，讓尚未改造的報表不會讀到錯誤結果。
          equipmentLevels: { ...state.equipmentLevels, [instance.definitionId]: true },
        });
        return { ok: true, instanceId: instance.instanceId, definitionId: instance.definitionId, level: 5 };
      },

      // ── 任務系統 ─────────────────────────────────────────
      addQuest: (quest) =>
        set((s) => (s.quests.some((q) => q.id === quest.id) ? {} : { quests: [...s.quests, quest] })),
      completeQuest: (questId) =>
        set((s) => ({ quests: s.quests.map((q) => (q.id === questId ? { ...q, done: true } : q)) })),
      removeQuest: (questId) => set((s) => ({ quests: s.quests.filter((q) => q.id !== questId) })),

      // ── 每日獎勵 ──
      claimDaily: () => {
        const s = get();
        const today = new Date().toISOString().slice(0, 10);
        if (s.lastDaily === today) return null;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const streak = s.lastDaily === yesterday ? s.dailyStreak + 1 : 1;
        const reward = 50 + Math.min(streak, 7) * 20;
        set((st) => ({
          lastDaily: today,
          dailyStreak: streak,
          playerState: { ...st.playerState, gold: st.playerState.gold + reward },
        }));
        return { reward, streak };
      },

      // ── 戰鬥/遊戲事件匯總（成就、寵物經驗、紀錄、每日任務進度）──
      onCombatEvent: (type, data = {}) => {
        const s = get();
        const stats = { ...s.stats };
        if (type === 'kill') stats.kills += 1;
        if (type === 'boss') stats.bossKills += 1;
        if (type === 'harvest') stats.harvests += 1;
        if (type === 'correct') stats.correctAnswers += 1;

        // 紀錄更新
        const records = { ...s.records };
        records.totalKills = stats.kills;
        records.bossKills = stats.bossKills;
        records.maxGold = Math.max(records.maxGold, s.playerState.gold);
        records.bestMathStreak = Math.max(records.bestMathStreak, s.mathPerformance.consecutiveCorrect);

        // 舊 Pet 經驗已停止；守護夥伴成長由 recordCompanionActivity 單一路徑處理。
        const petData = s.petData;

        // 每日任務進度
        let dq = s.dailyQuests;
        if (dq.quests.length) {
          dq = {
            ...dq,
            quests: dq.quests.map((q) => {
              if (q.done) return q;
              if ((type === 'kill' && q.type === 'kills') ||
                  (type === 'harvest' && q.type === 'harvests') ||
                  (type === 'correct' && q.type === 'correctAnswers') ||
                  (type === 'boss' && q.type === 'bossKills')) {
                const progress = q.progress + 1;
                return { ...q, progress, done: progress >= q.target };
              }
              return q;
            }),
          };
        }

        set({ stats, records, petData, dailyQuests: dq });
        get().recordCompanionActivity?.(type, data);
        get().checkAchievements();
      },

      // ── 成就檢查（達成即解鎖 + 給金幣）──
      checkAchievements: () => {
        // 動態載入避免循環：改為直接引用（於檔尾 import）
        const s = get();
        const list = ACHIEVEMENTS_REF;
        let changed = false;
        const ach = { ...s.achievements };
        let bonus = 0;
        list.forEach((a) => {
          if (!ach[a.id] && a.check(s.stats)) {
            ach[a.id] = true;
            bonus += a.reward;
            changed = true;
          }
        });
        if (changed) {
          set((st) => ({ achievements: ach, playerState: { ...st.playerState, gold: st.playerState.gold + bonus } }));
        }
      },

      // ── 天賦：花智慧點解鎖被動 ──
      unlockTalent: (key) => {
        const s = get();
        const COST = 5;
        if (s.talents[key] || s.wisdomPoints < COST) return false;
        const patch = { talents: { ...s.talents, [key]: true }, wisdomPoints: s.wisdomPoints - COST };
        // vitality：一次性提升最大 HP +30 並補滿
        if (key === 'vitality') {
          patch.playerState = { ...s.playerState, maxHp: s.playerState.maxHp + 30, hp: s.playerState.hp + 30 };
        }
        set(patch);
        return true;
      },

      // ── 每日任務：確保今日已產生 ──
      ensureDailyQuests: () => {
        const s = get();
        const today = new Date().toISOString().slice(0, 10);
        if (s.dailyQuests.date === today) return;
        set({ dailyQuests: { date: today, quests: DAILY_PICK_REF(today) } });
      },
      claimDailyQuest: (id) => {
        const s = get();
        const q = s.dailyQuests.quests.find((x) => x.id === id);
        if (!q || !q.done || q.claimed) return;
        set((st) => ({
          dailyQuests: { ...st.dailyQuests, quests: st.dailyQuests.quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
          playerState: { ...st.playerState, gold: st.playerState.gold + q.reward },
        }));
      },

      // ── 無盡試煉 ──────────────────────────────────────────
      startTrial: () => set({ trialActive: true, trialWave: 1 }),
      clearTrialWave: () =>
        set((s) => {
          const wave = s.trialWave;
          const records = { ...s.records, bestWave: Math.max(s.records.bestWave || 0, wave) };
          return {
            trialWave: wave + 1,
            records,
            playerState: { ...s.playerState, gold: s.playerState.gold + wave * 20 },
          };
        }),
      stopTrial: () => set({ trialActive: false, trialWave: 0 }),

      setSceneChunkLoading: (value) => set({ sceneChunkLoading: Boolean(value) }),

      showWorldHint: (text) => {
        set({ worldHint: text });
        if (typeof window !== 'undefined') {
          window.clearTimeout(window.__mqWorldHintTimer);
          window.__mqWorldHintTimer = window.setTimeout(() => set({ worldHint: null }), 1800);
        }
      },

      // 生態系事件開關
      setBiomeEvent: (e) => set({ biomeEvent: e }),
      setCurrentBiomeId: (id) => set({ currentBiomeId: id }),

      // ── 武器附魔：詞綴寫入唯一裝備實例，不再污染同款武器 ─────────
      enchantWeapon: (weaponRef) => {
        const state = get();
        const COST = 200;
        const instance = findOwnedEquipmentInstance(weaponRef, state.inventory, state.equipmentInstances);
        const definition = instance ? DB[instance.definitionId] : null;
        if (!instance || !definition?.weapon) return { ok: false, reason: 'noweapon' };
        if (state.playerState.gold < COST) return { ok: false, reason: 'gold' };
        const POOL = [
          { type: 'atk', label: 'ATK', min: 0.1, max: 0.3 },        // +10~30% 傷害
          { type: 'crit', label: 'Crit', min: 0.08, max: 0.2 },     // +8~20% 爆擊
          { type: 'lifesteal', label: 'Lifesteal', min: 0.05, max: 0.15 },
          { type: 'speed', label: 'Atk Speed', min: 0.1, max: 0.25 }, // 攻速（縮短冷卻）
          { type: 'range', label: 'Range', min: 0.3, max: 1.0 },
        ];
        const count = 1 + (Math.random() < 0.5 ? 1 : 0); // 1~2 條
        const chosen = [];
        const pool = [...POOL];
        for (let i = 0; i < count && pool.length; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          const a = pool.splice(idx, 1)[0];
          const value = +(a.min + Math.random() * (a.max - a.min)).toFixed(2);
          chosen.push({ type: a.type, label: a.label, value });
        }
        const equipmentInstances = {
          ...state.equipmentInstances,
          [instance.instanceId]: { ...instance, affixes: chosen },
        };
        set({
          playerState: { ...state.playerState, gold: state.playerState.gold - COST },
          equipmentInstances,
          // 暫時同步舊索引，供尚未改造的歷史統計使用。
          weaponAffixes: { ...state.weaponAffixes, [instance.definitionId]: chosen },
        });
        return { ok: true, instanceId: instance.instanceId, definitionId: instance.definitionId, affixes: chosen };
      },

      // ── 每日獎勵 END ──

      // v0.28 村莊生活與守護夥伴採獨立 Slice；同名舊方法由此處 Canonical 實作覆寫。
      ...createVillageSlice(set, get),
      ...createCompanionSlice(set, get),

      reportSkillAttempt: (skillId, isCorrect) => set((state) => {
        if (!skillId) return {};
        const previous = state.skillMastery[skillId] || { correct: 0, total: 0, streak: 0, mastery: 0, lastReviewedAt: null };
        const correct = previous.correct + (isCorrect ? 1 : 0);
        const total = previous.total + 1;
        const streak = isCorrect ? previous.streak + 1 : 0;
        const accuracy = correct / total;
        const streakBonus = Math.min(0.15, streak * 0.03);
        const mastery = Math.max(0, Math.min(1, accuracy * 0.85 + streakBonus));
        return {
          skillMastery: {
            ...state.skillMastery,
            [skillId]: { correct, total, streak, mastery: Number(mastery.toFixed(3)), lastReviewedAt: Date.now() },
          },
        };
      }),

      // ── 數學表現：作答結果回報（IRT 升降階核心）──────────────
      reportAnswer: (isCorrect, dimension) =>
        set((s) => {
          const mp = { ...s.mathPerformance };
          if (isCorrect) {
            mp.consecutiveCorrect += 1;
            mp.consecutiveWrong = 0;
            mp.showVisualHint = false;
            // 連對 3 題 → 升階（上限 rank 4）
            if (mp.consecutiveCorrect >= 3) {
              mp.currentRank = Math.min(4, mp.currentRank + 1);
              mp.consecutiveCorrect = 0;
            }
          } else {
            mp.consecutiveWrong += 1;
            mp.consecutiveCorrect = 0;
            // 連錯 2 題 → 降階並開啟視覺提示（防呆）
            if (mp.consecutiveWrong >= 2) {
              mp.currentRank = Math.max(0, mp.currentRank - 1);
              mp.consecutiveWrong = 0;
              mp.showVisualHint = true;
            }
          }
          // 更新學習報表統計
          const stats = { ...s.mathStats };
          if (dimension && stats[dimension]) {
            stats[dimension] = {
              correct: stats[dimension].correct + (isCorrect ? 1 : 0),
              total: stats[dimension].total + 1,
            };
          }
          // 答對加智慧點（天賦用）
          const wisdomPoints = s.wisdomPoints + (isCorrect ? 1 : 0);
          return { mathPerformance: mp, mathStats: stats, wisdomPoints };
        }) || (isCorrect && get().onCombatEvent('correct')),

      // 重置存檔（設定選單用）；每次建立全新的裝備實例，避免共用物件參照。
      resetSave: () => {
        const equipmentState = createInitialEquipmentState();
        set({
          playerState: { ...INITIAL_PLAYER },
          characterProfile: { ...INITIAL_CHARACTER_PROFILE },
          characterEditorOpen: false,
          skillMastery: {},
          defeatState: null,
          respawnToken: 0,
          inventory: {
            equipment: [...equipmentState.inventoryEquipment],
            weapons: [...equipmentState.legacyInventory.weapons],
            armors: [...equipmentState.legacyInventory.armors],
            pets: [],
            items: ['item_03', 'item_04'],
            seeds: ['seed_01', 'seed_02'],
            materials: ['mat_animal_feed', 'mat_animal_feed', 'mat_animal_feed', 'mat_animal_feed', 'mat_animal_feed'],
            farmProducts: [],
          },
          equipmentInstances: { ...equipmentState.equipmentInstances },
          equipped: { ...equipmentState.equipped },
          equipmentAppearance: { ...equipmentState.equipmentAppearance },
          equipmentLevels: {},
          weaponAffixes: {},
          gameProgress: { unlockedDifficulty: 1, currentBiome: 'village', bossDefeated: [] },
          worldProgress: {
            currentRegionId: 'star_village',
            unlockedRegionIds: [...STARTER_REGION_IDS],
            discoveredRegionIds: ['star_village'],
            completedEvents: {},
            regionVisits: {},
            regionObjectives: {},
            regionKillProgress: {},
            exploredSubareas: {},
            regionEventRuns: {},
            regionMechanicProgress: {},
            structureInteractions: {},
            regionExplorationRewards: {},
            dailyRiftCompletions: {},
          },
          trialTower: {
            active: false,
            currentFloor: 1,
            highestFloor: 1,
            portalReady: false,
            completedMilestones: [],
            completedFloors: [],
            towerComplete: false,
          },
          storyProgress: { activeChapterId: 'chapter_star', acceptedQuestIds: [], completedQuestIds: [], questProgress: {}, completedChapterIds: [] },
          npcRelations: {},
          villageEconomy: normalizeVillageEconomy(),
          companionState: normalizeCompanionState(),
          learningJournal: { interactions: [], totalSceneInteractions: 0, correctSceneInteractions: 0 },
          uiPreferences: { ...UI_DEFAULTS },
          activeDialogue: null,
          npcEmote: null,
          quickSlots: ['item_03', 'item_04', null, null, null],
          renderQuality: 'high',
          timeSpeed: 'normal',
          weatherType: 'sunny',
          weatherMode: 'auto',
          weatherNextChangeAt: 720,
          worldClock: { totalMinutes: 480, minutes: 480, dayIndex: 1, timeText: '08:00', segment: 'morning', weather: 'sunny', weatherLabel: '晴天', weatherIcon: '☀️', sceneId: 'village', indoorZoneId: null },
          activeItemEffects: {},
          nextSpellDiscount: 1,
          fishingBuff: null,
          pendingFarmCommand: null,
          pendingSceneTransition: null,
        });
      },
    }),
    {
      name: 'mathquest3d_save',
      storage: createJSONStorage(() => encryptedStorage),
      version: 6,
      migrate: (persistedState) => migrateMainSaveState(persistedState),
      // 只持久化存檔資料，執行期旗標（isPaused 等）不寫入
      partialize: (s) => ({
        playerState: s.playerState,
        characterProfile: s.characterProfile,
        inventory: s.inventory,
        equipmentInstances: s.equipmentInstances,
        equipped: s.equipped,
        equipmentAppearance: s.equipmentAppearance,
        gameProgress: s.gameProgress,
        worldProgress: s.worldProgress,
        trialTower: s.trialTower,
        storyProgress: s.storyProgress,
        npcRelations: s.npcRelations,
        villageEconomy: s.villageEconomy,
        companionState: s.companionState,
        learningJournal: s.learningJournal,
        uiPreferences: s.uiPreferences,
        quickSlots: s.quickSlots,
        renderQuality: s.renderQuality,
        timeSpeed: s.timeSpeed,
        weatherType: s.weatherType,
        weatherMode: s.weatherMode,
        weatherNextChangeAt: s.weatherNextChangeAt,
        worldClock: s.worldClock,
        mathPerformance: s.mathPerformance,
        skillMastery: s.skillMastery,
        mathStats: s.mathStats,
        unlockedBlueprints: s.unlockedBlueprints,
        equipmentLevels: s.equipmentLevels,
        weaponAffixes: s.weaponAffixes,
        quests: s.quests,
        lastDaily: s.lastDaily,
        dailyStreak: s.dailyStreak,
        talents: s.talents,
        wisdomPoints: s.wisdomPoints,
        achievements: s.achievements,
        stats: s.stats,
        records: s.records,
        petData: s.petData,
        dailyQuests: s.dailyQuests,
        activeItemEffects: s.activeItemEffects,
        nextSpellDiscount: s.nextSpellDiscount,
        fishingBuff: s.fishingBuff,
      }),
    }
  )
);

// 數值夾取小工具
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function normalizeCharacterProfile(profile = {}) {
  const merged = { ...INITIAL_CHARACTER_PROFILE, ...profile };
  return {
    ...merged,
    hairStyle: ALLOWED_HAIR_STYLES.includes(merged.hairStyle) ? merged.hairStyle : INITIAL_CHARACTER_PROFILE.hairStyle,
    face: ALLOWED_FACES.includes(merged.face) ? merged.face : INITIAL_CHARACTER_PROFILE.face,
    outfitStyle: ALLOWED_OUTFITS.includes(merged.outfitStyle) ? merged.outfitStyle : INITIAL_CHARACTER_PROFILE.outfitStyle,
    accessory: ALLOWED_ACCESSORIES.includes(merged.accessory) ? merged.accessory : INITIAL_CHARACTER_PROFILE.accessory,
  };
}
