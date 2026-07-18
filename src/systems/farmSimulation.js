import { getFarmLevelConfig, isFarmCellUnlocked } from '../data/farmProgression.js';

export const CROP_STAGES = Object.freeze({
  EMPTY: 'empty',
  PREPARED: 'prepared',
  SEEDED: 'seeded',
  SPROUT: 'sprout',
  GROWING: 'growing',
  MATURE: 'mature',
  WITHERED: 'withered',
});

const RAIN_WEATHERS = new Set(['lightRain']);
const DRY_WEATHERS = new Set(['sunny', 'breeze']);

export function createFarmGrid(level = 1, prepared = true) {
  const grid = [];
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const id = row * 7 + col;
      const isUnlocked = isFarmCellUnlocked(row, col, level);
      grid.push(createFarmCell({ id, row, col, isUnlocked, isPrepared: isUnlocked && prepared }));
    }
  }
  return grid;
}

export function createFarmCell(overrides = {}) {
  return {
    id: overrides.id ?? 0,
    row: overrides.row ?? 0,
    col: overrides.col ?? 0,
    isUnlocked: Boolean(overrides.isUnlocked),
    isPrepared: Boolean(overrides.isPrepared),
    currentSeedId: null,
    plantedAt: 0,
    plantedWorldMinute: null,
    wateredAt: 0,
    moisture: 0.32,
    growthRatio: 0,
    stage: overrides.isUnlocked && overrides.isPrepared ? CROP_STAGES.PREPARED : CROP_STAGES.EMPTY,
    isWatered: false,
    isReady: false,
    isWithered: false,
    ...overrides,
  };
}

export function normalizeFarmCell(cell, level = 1) {
  const unlocked = isFarmCellUnlocked(cell.row, cell.col, level);
  const currentSeedId = cell.currentSeedId || null;
  const legacyPrepared = cell.isPrepared ?? (cell.stage === CROP_STAGES.PREPARED || Boolean(currentSeedId));
  const isPrepared = unlocked && Boolean(legacyPrepared);
  const stage = currentSeedId
    ? (cell.isWithered ? CROP_STAGES.WITHERED : cell.isReady ? CROP_STAGES.MATURE : cell.stage || CROP_STAGES.SEEDED)
    : (isPrepared ? CROP_STAGES.PREPARED : CROP_STAGES.EMPTY);
  return createFarmCell({
    ...cell,
    isUnlocked: unlocked,
    isPrepared,
    currentSeedId,
    plantedWorldMinute: Number.isFinite(cell.plantedWorldMinute) ? cell.plantedWorldMinute : null,
    moisture: clamp(Number.isFinite(cell.moisture) ? cell.moisture : (cell.isWatered ? 0.9 : 0.32), 0, 1),
    growthRatio: clamp(Number(cell.growthRatio) || 0, 0, 1.75),
    stage,
    isReady: stage === CROP_STAGES.MATURE,
    isWithered: stage === CROP_STAGES.WITHERED,
  });
}

export function getSeedGrowthMinutes(seed) {
  if (!seed) return 120;
  // 舊資料以毫秒定義；轉為遊戲分鐘後約 1.5～10.5 遊戲小時。
  return Math.max(90, Math.round((Number(seed.growthDuration) || 60000) / 1000 * 1.5));
}

export function simulateFarmGrid({ grid, level, worldMinute, weather, seedById }) {
  const config = getFarmLevelConfig(level);
  let wateredByRain = 0;
  let matured = 0;
  let withered = 0;
  const nextGrid = grid.map((rawCell) => {
    const result = simulateFarmCell({
      cell: normalizeFarmCell(rawCell, level),
      level,
      worldMinute,
      weather,
      seed: seedById[rawCell.currentSeedId],
    });
    if (result.rainApplied) wateredByRain += 1;
    if (result.cell.stage === CROP_STAGES.MATURE) matured += 1;
    if (result.cell.stage === CROP_STAGES.WITHERED) withered += 1;
    return result.cell;
  });
  return { grid: nextGrid, summary: { wateredByRain, matured, withered, moistureFloor: config.moistureFloor } };
}

export function simulateFarmCell({ cell, level, worldMinute, weather, seed }) {
  const config = getFarmLevelConfig(level);
  if (!cell.isUnlocked || !cell.currentSeedId || !seed) {
    return { cell: normalizeFarmCell(cell, level), rainApplied: false };
  }

  const currentMinute = Number.isFinite(worldMinute) ? worldMinute : 0;
  const plantedMinute = Number.isFinite(cell.plantedWorldMinute)
    ? cell.plantedWorldMinute
    : Math.max(0, currentMinute - estimateLegacyElapsedMinutes(cell, seed));
  const elapsed = Math.max(0, currentMinute - plantedMinute);
  let moisture = clamp(cell.moisture ?? 0.32, 0, 1);
  const rainApplied = RAIN_WEATHERS.has(weather) && moisture < 0.94;

  const retentionActive = Number(cell.waterRetentionUntilWorldMinute) > currentMinute;
  if (RAIN_WEATHERS.has(weather)) moisture = Math.max(moisture, 0.94);
  else if (retentionActive) moisture = Math.max(moisture, 0.72);
  else if (DRY_WEATHERS.has(weather)) moisture -= 0.012;
  else moisture -= 0.006;
  moisture = clamp(Math.max(config.moistureFloor, moisture), 0, 1);

  const moistureGrowthFactor = moisture >= 0.7 ? 1 : moisture >= 0.4 ? 0.86 : moisture >= 0.18 ? 0.62 : 0.34;
  const baseNeed = getSeedGrowthMinutes(seed) * config.growthMultiplier;
  const effectiveRatio = clamp((elapsed * moistureGrowthFactor) / baseNeed, 0, 1.75);
  let stage = resolveCropStage(effectiveRatio);
  const protectedFromWither = config.unlocks.includes('climateProtection');
  const witherAt = 1.48;
  if (!protectedFromWither && effectiveRatio >= witherAt && moisture < 0.28) stage = CROP_STAGES.WITHERED;

  return {
    rainApplied,
    cell: {
      ...cell,
      plantedWorldMinute: plantedMinute,
      moisture,
      growthRatio: effectiveRatio,
      stage,
      isWatered: moisture >= 0.62,
      isReady: stage === CROP_STAGES.MATURE,
      isWithered: stage === CROP_STAGES.WITHERED,
    },
  };
}

export function resolveCropStage(ratio) {
  if (ratio >= 1) return CROP_STAGES.MATURE;
  if (ratio >= 0.58) return CROP_STAGES.GROWING;
  if (ratio >= 0.22) return CROP_STAGES.SPROUT;
  return CROP_STAGES.SEEDED;
}

export function waterFarmCell(cell, worldMinute, retentionMinutes = 0) {
  if (!cell?.isUnlocked || !cell.currentSeedId || cell.isWithered) return cell;
  return {
    ...cell,
    wateredAt: Date.now(),
    lastWateredWorldMinute: Number.isFinite(worldMinute) ? worldMinute : null,
    moisture: 1,
    isWatered: true,
    waterRetentionUntilWorldMinute: Number.isFinite(worldMinute) ? worldMinute + Math.max(0, Number(retentionMinutes) || 0) : null,
  };
}

export function prepareFarmCell(cell) {
  if (!cell?.isUnlocked || cell.currentSeedId || cell.isPrepared) return cell;
  return {
    ...cell,
    isPrepared: true,
    stage: CROP_STAGES.PREPARED,
    moisture: Math.max(0.28, Number(cell.moisture) || 0),
  };
}

export function plantFarmCell(cell, seedId, worldMinute) {
  if (!cell?.isUnlocked || !cell.isPrepared || cell.currentSeedId || !seedId) return cell;
  return {
    ...cell,
    currentSeedId: seedId,
    plantedAt: Date.now(),
    plantedWorldMinute: Number.isFinite(worldMinute) ? worldMinute : null,
    wateredAt: 0,
    moisture: 0.38,
    growthRatio: 0,
    stage: CROP_STAGES.SEEDED,
    isWatered: false,
    isReady: false,
    isWithered: false,
  };
}

export function calculateHarvestOutcome(cell, seed, level, mathCorrect, equipmentYieldBonus = 0) {
  if (!cell || cell.stage !== CROP_STAGES.MATURE || !seed) return null;
  const config = getFarmLevelConfig(level);
  const moistureQuality = cell.moisture >= 0.78 ? 2 : cell.moisture >= 0.48 ? 1 : 0;
  const mathBonus = mathCorrect ? 1 : 0;
  const levelBonus = config.yieldBonus >= 0.4 ? 2 : config.yieldBonus >= 0.15 ? 1 : 0;
  const equipmentBonus = Math.random() < Math.max(0, Number(equipmentYieldBonus) || 0) ? 1 : 0;
  const qty = 1 + mathBonus + levelBonus + equipmentBonus;
  const qualityScore = moistureQuality + (mathCorrect ? 1 : 0) + (level >= 5 ? 1 : 0);
  const quality = qualityScore >= 4 ? 'star' : qualityScore >= 3 ? 'high' : qualityScore >= 2 ? 'good' : 'normal';
  return {
    seedId: cell.currentSeedId,
    crop: seed.crop,
    qty,
    quality,
    unitValue: Math.round((seed.sellPrice || 10) * (1 + config.yieldBonus) * ({ normal: 1, good: 1.2, high: 1.5, star: 2 }[quality] || 1)),
  };
}

export function getAnimalProductState(animal, worldMinute, level) {
  const currentMinute = Number.isFinite(worldMinute) ? worldMinute : 0;
  const baseCooldown = 300; // 5 個遊戲小時
  const multiplier = level >= 5 ? 0.65 : level >= 4 ? 0.78 : level >= 3 ? 0.9 : 1;
  const cooldown = Math.round(baseCooldown * multiplier);
  const readyAt = Number(animal.productReadyAtWorldMinute) || 0;
  return { ready: currentMinute >= readyAt, readyAt, cooldown, remaining: Math.max(0, readyAt - currentMinute) };
}

export function feedFarmAnimal(animal, worldMinute, level) {
  const state = getAnimalProductState(animal, worldMinute, level);
  if (!state.ready) return { ok: false, reason: 'cooldown', remaining: state.remaining, animal };
  const currentMinute = Number.isFinite(worldMinute) ? worldMinute : 0;
  const nextAnimal = {
    ...animal,
    lastFedAt: Date.now(),
    lastFedWorldMinute: currentMinute,
    productReadyAtWorldMinute: currentMinute + state.cooldown,
    mood: level >= 4 ? 'happy' : 'content',
  };
  return { ok: true, itemId: animal.product, animal: nextAnimal, cooldown: state.cooldown };
}

function estimateLegacyElapsedMinutes(cell, seed) {
  if (!cell.plantedAt) return 0;
  const elapsedMs = Math.max(0, Date.now() - cell.plantedAt);
  const legacyRatio = elapsedMs / Math.max(1, Number(seed.growthDuration) || 60000);
  return legacyRatio * getSeedGrowthMinutes(seed);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
