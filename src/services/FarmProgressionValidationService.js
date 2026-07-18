import { DB } from '../data/index.js';
import { FARM_LEVEL_CONFIG, FARM_MAX_LEVEL, getFarmLevelConfig, isFarmCellUnlocked } from '../data/farmProgression.js';
import { CROP_STAGES, createFarmGrid, plantFarmCell, simulateFarmCell } from '../systems/farmSimulation.js';

export function validateFarmProgression() {
  const errors = [];
  const warnings = [];
  const levels = Object.values(FARM_LEVEL_CONFIG);
  if (levels.length !== FARM_MAX_LEVEL) errors.push(`Expected ${FARM_MAX_LEVEL} levels, received ${levels.length}.`);

  let previousCost = 0;
  for (let level = 1; level <= FARM_MAX_LEVEL; level += 1) {
    const config = getFarmLevelConfig(level);
    const unlocked = createFarmGrid(level).filter((cell) => cell.isUnlocked).length;
    if (unlocked !== config.plotCount) errors.push(`Lv${level} plot count ${unlocked} does not match ${config.plotCount}.`);
    if (level < FARM_MAX_LEVEL && (!Number.isFinite(config.upgradeCost) || config.upgradeCost <= previousCost)) errors.push(`Lv${level} upgrade cost must increase.`);
    if (level < FARM_MAX_LEVEL) previousCost = config.upgradeCost;
    if (!config.unlocks?.length) warnings.push(`Lv${level} has no visible unlocks.`);
  }

  const seed = DB.seed_01;
  if (!seed) errors.push('seed_01 is missing.');
  else {
    let cell = createFarmGrid(1).find((item) => item.row === 3 && item.col === 3);
    cell = plantFarmCell(cell, seed.id, 480);
    const mature = simulateFarmCell({ cell, level: 1, worldMinute: 720, weather: 'lightRain', seed }).cell;
    if (![CROP_STAGES.GROWING, CROP_STAGES.MATURE].includes(mature.stage)) errors.push(`Crop simulation did not advance: ${mature.stage}.`);
    const protectedCrop = simulateFarmCell({ ...({ cell: { ...cell, moisture: 0.05 } }), level: 5, worldMinute: 5000, weather: 'sunny', seed }).cell;
    if (protectedCrop.stage === CROP_STAGES.WITHERED) errors.push('Lv5 climate protection failed.');
  }

  for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
    if (isFarmCellUnlocked(row, col, 1) && !isFarmCellUnlocked(row, col, 5)) errors.push(`Unlock regression at ${row},${col}.`);
  }

  return { ok: errors.length === 0 && warnings.length === 0, errors, warnings, counts: { levels: levels.length, maxPlots: getFarmLevelConfig(5).plotCount } };
}
