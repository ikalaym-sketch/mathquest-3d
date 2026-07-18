import assert from 'node:assert/strict';
import { DB } from '../src/data/index.js';
import { FARM_MAX_LEVEL, getFarmLevelConfig } from '../src/data/farmProgression.js';
import {
  CROP_STAGES,
  createFarmGrid,
  feedFarmAnimal,
  getAnimalProductState,
  plantFarmCell,
  simulateFarmCell,
  simulateFarmGrid,
  waterFarmCell,
} from '../src/systems/farmSimulation.js';
import { useStore } from '../src/store/useStore.js';
import { useFarmStore } from '../src/store/farmStore.js';

const cases = [];
function test(id, run) {
  try { run(); cases.push({ id, status: 'PASSED' }); }
  catch (error) { cases.push({ id, status: 'FAILED', error: String(error) }); }
}

test('farm_levels_1_to_5', () => {
  assert.equal(FARM_MAX_LEVEL, 5);
  assert.deepEqual([1, 2, 3, 4, 5].map((level) => getFarmLevelConfig(level).plotCount), [9, 25, 49, 49, 49]);
});

test('crop_world_time_and_rain', () => {
  const seed = DB.seed_01;
  let cell = createFarmGrid(1).find((item) => item.row === 3 && item.col === 3);
  cell = plantFarmCell(cell, seed.id, 480);
  cell = waterFarmCell(cell, 490);
  const wet = simulateFarmCell({ cell, level: 1, worldMinute: 520, weather: 'lightRain', seed }).cell;
  assert.ok(wet.moisture >= 0.94);
  const mature = simulateFarmCell({ cell: wet, level: 1, worldMinute: 720, weather: 'cloudy', seed }).cell;
  assert.ok([CROP_STAGES.GROWING, CROP_STAGES.MATURE].includes(mature.stage));
});

test('farm_level_5_climate_protection', () => {
  const seed = DB.seed_01;
  let cell = createFarmGrid(5)[24];
  cell = plantFarmCell(cell, seed.id, 10);
  cell = { ...cell, moisture: 0.01 };
  const next = simulateFarmCell({ cell, level: 5, worldMinute: 5000, weather: 'sunny', seed }).cell;
  assert.notEqual(next.stage, CROP_STAGES.WITHERED);
  assert.ok(next.moisture >= getFarmLevelConfig(5).moistureFloor);
});

test('rain_only_counts_newly_watered_cells', () => {
  const seed = DB.seed_01;
  let grid = createFarmGrid(1);
  grid[24] = plantFarmCell(grid[24], seed.id, 100);
  const first = simulateFarmGrid({ grid, level: 1, worldMinute: 120, weather: 'lightRain', seedById: DB });
  const second = simulateFarmGrid({ grid: first.grid, level: 1, worldMinute: 125, weather: 'lightRain', seedById: DB });
  assert.equal(first.summary.wateredByRain, 1);
  assert.equal(second.summary.wateredByRain, 0);
});

test('animal_product_cooldown', () => {
  const animal = { id: 'cow', product: 'mat_milk', productReadyAtWorldMinute: 0 };
  const fed = feedFarmAnimal(animal, 500, 4);
  assert.equal(fed.ok, true);
  const cooldown = getAnimalProductState(fed.animal, 501, 4);
  assert.equal(cooldown.ready, false);
  assert.ok(cooldown.remaining > 0);
});

test('rest_until_next_morning', () => {
  useStore.setState({ worldClock: { ...useStore.getState().worldClock, totalMinutes: 1200, minutes: 1200 }, playerState: { ...useStore.getState().playerState, hp: 5, mp: 2, stamina: 1 } });
  useStore.getState().restUntilMorning();
  const state = useStore.getState();
  assert.equal(state.worldClock.totalMinutes, 1860);
  assert.equal(state.worldClock.timeText, '07:00');
  assert.equal(state.playerState.hp, state.playerState.maxHp);
});

test('farm_store_upgrade_migration_path', () => {
  useFarmStore.getState().resetFarm();
  for (let level = 2; level <= 5; level += 1) assert.equal(useFarmStore.getState().expandFarm(level), true);
  const state = useFarmStore.getState();
  assert.equal(state.farmLevel, 5);
  assert.equal(state.farmGrid.filter((cell) => cell.isUnlocked).length, 49);
});

const report = { generatedAt: new Date().toISOString(), ok: cases.every((item) => item.status === 'PASSED'), cases };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
