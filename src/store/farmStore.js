// v0.27.0 星光農莊狀態庫。
// 單一世界時間、四季、農具、體力、品質農產品、動物照顧與加工都集中在此模組。
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encrypt, decrypt } from '../utils/crypto.js';
import { DB } from '../data/index.js';
import { FARM_MAX_LEVEL, getFarmLevelConfig, isFarmCellUnlocked } from '../data/farmProgression.js';
import {
  CROP_STAGES,
  calculateHarvestOutcome,
  createFarmGrid,
  getAnimalProductState as getLegacyAnimalProductState,
  normalizeFarmCell,
  plantFarmCell,
  prepareFarmCell,
  simulateFarmGrid,
  waterFarmCell,
} from '../systems/farmSimulation.js';
import { createFarmProductInstance } from '../services/FarmInventoryService.js';
import { resolveFarmToolAction } from '../services/FarmToolService.js';
import { canPlantSeedInSeason, getSeasonSnapshot } from '../services/SeasonCropService.js';
import {
  advanceAnimalDailyState,
  applyAnimalCare,
  createFarmAnimal,
  normalizeFarmAnimal,
  resolveAnimalProductQuality,
  resolveAnimalMood,
} from '../services/AnimalCareService.js';

const farmMemoryStorage = new Map();
const encStorage = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      return raw == null ? null : decrypt(raw);
    } catch (error) {
      return farmMemoryStorage.get(name) || null;
    }
  },
  setItem: (name, value) => {
    const encrypted = encrypt(value);
    try { window.localStorage.setItem(name, encrypted); }
    catch (error) { farmMemoryStorage.set(name, encrypted); }
  },
  removeItem: (name) => {
    try { window.localStorage.removeItem(name); }
    catch (error) { farmMemoryStorage.delete(name); }
  },
};

const ANIMAL_DEFAULTS = Object.freeze([
  createFarmAnimal({ id: 'cow', type: 'cow', name: '小莓', product: 'mat_milk' }),
  createFarmAnimal({ id: 'sheep', type: 'sheep', name: '棉花', product: 'mat_wool' }),
  createFarmAnimal({ id: 'chicken', type: 'chicken', name: '啾啾', product: 'mat_egg' }),
]);

function initAnimals() {
  return ANIMAL_DEFAULTS.map((animal, index) => ({
    ...animal,
    x: -3,
    z: index * 2 - 2,
    productReadyAtWorldMinute: 0,
  }));
}

const INITIAL_HOME_STORAGE = { items: [], materials: [], seeds: [] };
const INITIAL_STATS = { harvests: 0, starHarvests: 0, animalProducts: 0, shippedGold: 0, rainWateredCells: 0 };
const MACHINE_DURATION_MINUTES = 180;

export const useFarmStore = create(
  persist(
    (set, get) => ({
      farmGrid: createFarmGrid(1, false),
      farmLevel: 1,
      selectedTool: 'smart',
      toolLevels: { hoe: 1, seedBag: 1, wateringCan: 1, sickle: 1, brush: 1, feed: 1, hand: 1 },
      lastToolAction: null,
      craftedObjects: [],
      animals: initAnimals(),
      groundDrops: [],
      homeDecorOwned: ['flowerBox'],
      homeDecorPlaced: ['flowerBox'],
      homeStorage: { ...INITIAL_HOME_STORAGE },
      homeInteriorTab: 'life',
      farmStats: { ...INITIAL_STATS },
      lastSimulationWorldMinute: 480,
      lastSimulationDayIndex: 1,
      lastSimulationWeather: 'sunny',
      lastSimulationSummary: { wateredByRain: 0, matured: 0, withered: 0 },
      pendingUpgrade: null,

      setSelectedTool: (toolId) => set({ selectedTool: toolId || 'smart' }),
      resolveToolAction: (action) => resolveFarmToolAction({ selectedTool: get().selectedTool, action, toolLevels: get().toolLevels }),
      recordToolAction: (action, toolResult) => set({ lastToolAction: { id: Date.now(), action, toolId: toolResult.toolId, staminaCost: toolResult.staminaCost } }),

      addHomeDecor: (decorId) => set((state) => state.homeDecorOwned.includes(decorId) ? {} : { homeDecorOwned: [...state.homeDecorOwned, decorId] }),
      toggleHomeDecor: (decorId) => set((state) => {
        if (!state.homeDecorOwned.includes(decorId)) return {};
        const placed = state.homeDecorPlaced.includes(decorId);
        return { homeDecorPlaced: placed ? state.homeDecorPlaced.filter((id) => id !== decorId) : [...state.homeDecorPlaced, decorId] };
      }),
      setHomeInteriorTab: (tab) => set({ homeInteriorTab: ['life', 'storage', 'decor'].includes(tab) ? tab : 'life' }),
      depositHomeStorage: (category, itemId) => {
        if (!Object.hasOwn(INITIAL_HOME_STORAGE, category) || !itemId) return false;
        set((state) => ({ homeStorage: { ...state.homeStorage, [category]: [...(state.homeStorage[category] || []), itemId] } }));
        return true;
      },
      withdrawHomeStorage: (category, itemId) => {
        const state = get();
        if (!Object.hasOwn(INITIAL_HOME_STORAGE, category)) return false;
        const values = [...(state.homeStorage[category] || [])];
        const index = values.indexOf(itemId);
        if (index < 0) return false;
        values.splice(index, 1);
        set({ homeStorage: { ...state.homeStorage, [category]: values } });
        return true;
      },

      expandFarm: (requestedLevel = null) => {
        const state = get();
        const nextLevel = Math.min(FARM_MAX_LEVEL, requestedLevel || state.farmLevel + 1);
        if (nextLevel <= state.farmLevel) return false;
        set({
          farmLevel: nextLevel,
          farmGrid: state.farmGrid.map((cell) => normalizeFarmCell({ ...cell, isUnlocked: isFarmCellUnlocked(cell.row, cell.col, nextLevel) }, nextLevel)),
          pendingUpgrade: null,
        });
        return true;
      },

      startFarmUpgrade: ({ requestedLevel = null, worldMinute = 0, durationMinutes = 1440 } = {}) => {
        const state = get();
        const nextLevel = Math.min(FARM_MAX_LEVEL, requestedLevel || state.farmLevel + 1);
        if (state.pendingUpgrade || nextLevel <= state.farmLevel) return { ok: false, reason: 'invalid' };
        set({ pendingUpgrade: { targetLevel: nextLevel, startedWorldMinute: worldMinute, finishWorldMinute: worldMinute + durationMinutes } });
        return { ok: true, targetLevel: nextLevel };
      },
      completeFarmUpgradeIfReady: (worldMinute) => {
        const pending = get().pendingUpgrade;
        if (!pending || worldMinute < pending.finishWorldMinute) return false;
        return get().expandFarm(pending.targetLevel);
      },

      prepareCell: (cellId) => {
        let changed = false;
        set((state) => ({
          farmGrid: state.farmGrid.map((cell) => {
            if (cell.id !== cellId) return cell;
            const next = prepareFarmCell(cell);
            changed = next !== cell;
            return next;
          }),
        }));
        return changed;
      },

      plantSeed: (cellId, seedId, worldMinute = null, dayIndex = 1) => {
        const state = get();
        const seed = DB[seedId];
        const season = getSeasonSnapshot(dayIndex);
        if (!seed) return { ok: false, reason: 'missing-seed' };
        if (!canPlantSeedInSeason(seed, season.id, state.farmLevel)) return { ok: false, reason: 'wrong-season', season };
        let changed = false;
        const farmGrid = state.farmGrid.map((cell) => {
          if (cell.id !== cellId) return cell;
          const next = plantFarmCell(cell, seedId, worldMinute);
          changed = next !== cell;
          return next;
        });
        if (!changed) return { ok: false, reason: 'invalid-cell' };
        set({ farmGrid });
        return { ok: true, season };
      },

      waterCell: (cellId, worldMinute = null, retentionMinutes = 0) => {
        let changed = false;
        set((state) => ({
          farmGrid: state.farmGrid.map((cell) => {
            if (cell.id !== cellId) return cell;
            const next = waterFarmCell(cell, worldMinute, retentionMinutes);
            changed = next !== cell;
            return next;
          }),
        }));
        return changed;
      },

      advanceFarmSimulation: (worldClock = null, weather = 'sunny') => {
        const state = get();
        const worldMinute = Number.isFinite(worldClock?.totalMinutes) ? worldClock.totalMinutes : state.lastSimulationWorldMinute;
        const dayIndex = Number(worldClock?.dayIndex) || Math.floor(worldMinute / 1440) + 1;
        const result = simulateFarmGrid({ grid: state.farmGrid, level: state.farmLevel, worldMinute, weather, seedById: DB });
        const elapsedDays = Math.max(0, dayIndex - state.lastSimulationDayIndex);
        const animals = state.animals.map((animal) => advanceAnimalDailyState(animal, elapsedDays));
        set((current) => ({
          farmGrid: result.grid,
          animals,
          lastSimulationWorldMinute: worldMinute,
          lastSimulationDayIndex: dayIndex,
          lastSimulationWeather: weather,
          lastSimulationSummary: result.summary,
          farmStats: { ...current.farmStats, rainWateredCells: current.farmStats.rainWateredCells + result.summary.wateredByRain },
        }));
        get().completeFarmUpgradeIfReady(worldMinute);
        return result.summary;
      },
      checkGrowth: (worldClock = null, weather = 'sunny') => get().advanceFarmSimulation(worldClock, weather),
      getStage: (cell) => normalizeFarmCell(cell, get().farmLevel).stage,

      harvestCell: (cellId, mathCorrect, worldMinute = 0, yieldBonus = 0) => {
        const state = get();
        const cell = state.farmGrid.find((item) => item.id === cellId);
        const seed = cell ? DB[cell.currentSeedId] : null;
        const outcome = calculateHarvestOutcome(cell, seed, state.farmLevel, mathCorrect, yieldBonus);
        if (!outcome) return null;
        const product = createFarmProductInstance({
          itemId: outcome.seedId,
          quantity: outcome.qty,
          quality: outcome.quality,
          unitValue: outcome.unitValue,
          worldMinute,
          sourceType: 'crop',
          metadata: { cropName: outcome.crop, farmLevel: state.farmLevel },
        });
        set((current) => ({
          farmGrid: current.farmGrid.map((item) => item.id === cellId
            ? normalizeFarmCell({ ...item, currentSeedId: null, plantedAt: 0, plantedWorldMinute: null, wateredAt: 0, moisture: Math.max(0.28, item.moisture * 0.5), growthRatio: 0, stage: CROP_STAGES.PREPARED, isWatered: false, isReady: false, isWithered: false }, current.farmLevel)
            : item),
          farmStats: { ...current.farmStats, harvests: current.farmStats.harvests + 1, starHarvests: current.farmStats.starHarvests + (outcome.quality === 'star' ? 1 : 0) },
        }));
        return { ...outcome, product };
      },

      instantGrowFirstCrop: () => {
        const state = get();
        const target = state.farmGrid.find((cell) => cell.currentSeedId && !cell.isReady && !cell.isWithered);
        if (!target) return { ok: false, reason: 'no-crop' };
        set({ farmGrid: state.farmGrid.map((cell) => cell.id === target.id ? { ...cell, growthRatio: 1, stage: CROP_STAGES.MATURE, isReady: true, isWithered: false } : cell) });
        return { ok: true, cellId: target.id };
      },

      clearWitheredCell: (cellId) => {
        let cleared = false;
        set((state) => ({ farmGrid: state.farmGrid.map((cell) => {
          if (cell.id !== cellId || !cell.isWithered) return cell;
          cleared = true;
          return normalizeFarmCell({ ...cell, currentSeedId: null, plantedAt: 0, plantedWorldMinute: null, growthRatio: 0, moisture: 0.2, stage: CROP_STAGES.PREPARED, isWithered: false }, state.farmLevel);
        }) }));
        return cleared;
      },

      buildObject: (type, x, z) => {
        if (!['sprinkler', 'cheeseMaker', 'mayoMaker', 'loom'].includes(type)) return false;
        set((state) => ({ craftedObjects: [...state.craftedObjects, { id: `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`, type, x, z, placedAt: Date.now(), processingItem: null, finishWorldMinute: 0 }] }));
        return true;
      },
      runSprinkler: (objId, worldMinute = null, retentionMinutes = 0) => set((state) => {
        const object = state.craftedObjects.find((item) => item.id === objId);
        if (!object || object.type !== 'sprinkler') return {};
        const targetIds = neighborCellIds(object.x, object.z);
        return { farmGrid: state.farmGrid.map((cell) => targetIds.includes(cell.id) ? waterFarmCell(cell, worldMinute, retentionMinutes) : cell) };
      }),
      processInMachine: (objId, itemId, worldMinute = 0, quality = 'normal', durationReduction = 0) => {
        const state = get();
        const machine = state.craftedObjects.find((object) => object.id === objId);
        if (!machine || machine.processingItem) return { ok: false, reason: 'busy' };
        const duration = Math.max(60, MACHINE_DURATION_MINUTES - Math.max(0, Number(durationReduction) || 0));
        set({ craftedObjects: state.craftedObjects.map((object) => object.id === objId ? { ...object, processingItem: { itemId, quality }, finishWorldMinute: worldMinute + duration } : object) });
        return { ok: true, finishWorldMinute: worldMinute + duration, duration };
      },
      collectFromMachine: (objId, worldMinute = 0) => {
        const state = get();
        const object = state.craftedObjects.find((item) => item.id === objId);
        if (!object?.processingItem || worldMinute < object.finishWorldMinute) return null;
        const itemId = machineProduct(object.type);
        const sourceQuality = object.processingItem.quality || 'normal';
        const product = createFarmProductInstance({ itemId, quality: sourceQuality, quantity: 1, worldMinute, sourceType: 'machine', metadata: { machineType: object.type } });
        set({ craftedObjects: state.craftedObjects.map((item) => item.id === objId ? { ...item, processingItem: null, finishWorldMinute: 0 } : item) });
        return product;
      },

      getAnimalProductState: (animalId, worldMinute = null) => {
        const state = get();
        const animal = state.animals.find((item) => item.id === animalId);
        return animal ? getLegacyAnimalProductState(animal, worldMinute, state.farmLevel) : null;
      },
      careAnimal: (animalId, action, { dayIndex = 1, worldMinute = 0, companionMoodBonus = 0 } = {}) => {
        const state = get();
        const animal = state.animals.find((item) => item.id === animalId);
        if (!animal) return { ok: false, reason: 'missing' };
        const result = applyAnimalCare(animal, action, { dayIndex, worldMinute });
        if (!result.ok) return result;
        const boostedAnimal = companionMoodBonus > 0
          ? { ...result.animal, affection: Math.min(100, result.animal.affection + companionMoodBonus * 0.25) }
          : result.animal;
        boostedAnimal.mood = resolveAnimalMood(boostedAnimal);
        set({ animals: state.animals.map((item) => item.id === animalId ? boostedAnimal : item) });
        return { ...result, animal: boostedAnimal };
      },
      collectAnimalProduct: (animalId, worldPosition = null, worldMinute = 0, companionQualityChance = 0) => {
        const state = get();
        const animal = state.animals.find((item) => item.id === animalId);
        if (!animal) return { ok: false, reason: 'missing' };
        const productState = getLegacyAnimalProductState(animal, worldMinute, state.farmLevel);
        if (!productState.ready || animal.hunger < 45 || animal.health < 35) return { ok: false, reason: 'not-ready', remaining: productState.remaining };
        const baseQuality = resolveAnimalProductQuality(animal, state.farmLevel);
        const quality = Math.random() < Math.max(0, Number(companionQualityChance) || 0) ? promoteQuality(baseQuality) : baseQuality;
        const product = createFarmProductInstance({ itemId: animal.product, quality, quantity: 1, worldMinute, sourceType: 'animal', metadata: { animalId, animalName: animal.name } });
        const nextAnimal = { ...animal, productReadyAtWorldMinute: worldMinute + productState.cooldown };
        set((current) => ({
          animals: current.animals.map((item) => item.id === animalId ? nextAnimal : item),
          groundDrops: [...current.groundDrops, { id: `drop_${Date.now()}_${animalId}`, product, x: worldPosition ? worldPosition[0] + 1 : animal.x + 1, z: worldPosition ? worldPosition[2] : animal.z }],
          farmStats: { ...current.farmStats, animalProducts: current.farmStats.animalProducts + 1 },
        }));
        return { ok: true, product, animal: nextAnimal };
      },
      // 舊入口保留：等同餵食後嘗試收集，避免舊元件崩潰。
      feedAnimal: (animalId, worldPosition = null, worldMinute = 0, dayIndex = 1) => {
        const care = get().careAnimal(animalId, 'feed', { dayIndex, worldMinute });
        if (!care.ok) return care;
        return get().collectAnimalProduct(animalId, worldPosition, worldMinute);
      },
      pickupDrop: (dropId) => {
        const drop = get().groundDrops.find((item) => item.id === dropId);
        if (!drop) return null;
        set((state) => ({ groundDrops: state.groundDrops.filter((item) => item.id !== dropId) }));
        return drop;
      },
      recordShipment: (gold) => set((state) => ({ farmStats: { ...state.farmStats, shippedGold: state.farmStats.shippedGold + Math.max(0, Number(gold) || 0) } })),

      resetFarm: () => set({
        farmGrid: createFarmGrid(1, false), farmLevel: 1, selectedTool: 'smart', toolLevels: { hoe: 1, seedBag: 1, wateringCan: 1, sickle: 1, brush: 1, feed: 1, hand: 1 }, lastToolAction: null,
        craftedObjects: [], animals: initAnimals(), groundDrops: [], homeDecorOwned: ['flowerBox'], homeDecorPlaced: ['flowerBox'], homeStorage: { ...INITIAL_HOME_STORAGE }, homeInteriorTab: 'life', farmStats: { ...INITIAL_STATS }, lastSimulationWorldMinute: 480, lastSimulationDayIndex: 1, lastSimulationWeather: 'sunny', lastSimulationSummary: { wateredByRain: 0, matured: 0, withered: 0 }, pendingUpgrade: null,
      }),
    }),
    {
      name: 'mathquest3d_farm',
      version: 3,
      storage: createJSONStorage(() => encStorage),
      migrate: (persisted, version) => migrateFarmState(persisted, version),
    },
  ),
);

function promoteQuality(quality) {
  const order = ['normal', 'good', 'high', 'star'];
  return order[Math.min(order.length - 1, Math.max(0, order.indexOf(quality)) + 1)];
}

export function migrateFarmState(persisted = {}, version = 0) {
  const farmLevel = Math.max(1, Math.min(FARM_MAX_LEVEL, Number(persisted.farmLevel) || 1));
  const sourceGrid = Array.isArray(persisted.farmGrid) && persisted.farmGrid.length === 49 ? persisted.farmGrid : createFarmGrid(farmLevel);
  const legacyAnimals = Array.isArray(persisted.animals) && persisted.animals.length ? persisted.animals : initAnimals();
  const animals = ANIMAL_DEFAULTS.map((fallback, index) => normalizeFarmAnimal(legacyAnimals.find((animal) => animal.id === fallback.id) || legacyAnimals[index], { ...fallback, x: -3, z: index * 2 - 2, productReadyAtWorldMinute: 0 }));
  const fallbackWorldMinute = Number(persisted.lastSimulationWorldMinute) || 480;
  const craftedObjects = (persisted.craftedObjects || []).map((object) => {
    const processingItem = typeof object.processingItem === 'string'
      ? { itemId: object.processingItem, quality: 'normal' }
      : object.processingItem;
    return {
      ...object,
      processingItem,
      // 舊存檔只有 Date.now() finishTime 時，以目前世界時間補上三小時加工期；
      // 不允許讀檔後因缺少 finishWorldMinute 直接瞬間完成。
      finishWorldMinute: processingItem ? (Number(object.finishWorldMinute) || fallbackWorldMinute + MACHINE_DURATION_MINUTES) : 0,
      finishTime: undefined,
    };
  });
  return {
    ...persisted,
    farmLevel,
    farmGrid: sourceGrid.map((cell) => normalizeFarmCell({ ...cell, isUnlocked: isFarmCellUnlocked(cell.row, cell.col, farmLevel) }, farmLevel)),
    selectedTool: persisted.selectedTool || 'smart',
    toolLevels: { hoe: 1, seedBag: 1, wateringCan: 1, sickle: 1, brush: 1, feed: 1, hand: 1, ...(persisted.toolLevels || {}) },
    lastToolAction: null,
    craftedObjects,
    animals,
    groundDrops: (persisted.groundDrops || []).map((drop) => drop.product ? drop : { ...drop, product: drop.itemId && DB[drop.itemId] ? createFarmProductInstance({ itemId: drop.itemId, quality: drop.quality || 'normal', quantity: drop.qty || 1, sourceType: 'legacy-animal' }) : null }).filter((drop) => drop.product),
    homeStorage: { ...INITIAL_HOME_STORAGE, ...(persisted.homeStorage || {}) },
    homeInteriorTab: persisted.homeInteriorTab || 'life',
    farmStats: { ...INITIAL_STATS, ...(persisted.farmStats || {}) },
    lastSimulationWorldMinute: Number(persisted.lastSimulationWorldMinute) || 480,
    lastSimulationDayIndex: Number(persisted.lastSimulationDayIndex) || 1,
    lastSimulationWeather: persisted.lastSimulationWeather || 'sunny',
    lastSimulationSummary: persisted.lastSimulationSummary || { wateredByRain: 0, matured: 0, withered: 0 },
    pendingUpgrade: persisted.pendingUpgrade || null,
    _migratedFrom: version,
  };
}

function machineProduct(type) {
  return { cheeseMaker: 'mat_cheese', mayoMaker: 'mat_mayo', loom: 'mat_cloth' }[type] || null;
}

function neighborCellIds(x, z) {
  const col = Math.round(x / 1.2 + 3);
  const row = Math.round(z / 1.2 + 3);
  return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
    .filter(([r, c]) => r >= 0 && r < 7 && c >= 0 && c < 7)
    .map(([r, c]) => r * 7 + c);
}

export { getFarmLevelConfig };
