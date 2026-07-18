import { validateRegionGameplayProduction } from '../src/services/RegionGameplayValidationService.js';
import { applyRegionEventSignal, createRegionEventRun } from '../src/services/RegionGameplayService.js';
import { REGION_GAMEPLAY_PROFILES } from '../src/data/regionGameplayProfiles.js';
import { rollMonsterLoot } from '../src/systems/regionLoot.js';
import { createDailyRiftConfig } from '../src/data/dailyRift.js';

const validation = validateRegionGameplayProduction();
const errors = [...validation.errors];
const warnings = [...validation.warnings];
let testedEvents = 0;
let testedSteps = 0;

// 逐條 Dry Run 24 個事件，確保每一步都只能由正確 Signal 推進。
for (const profile of Object.values(REGION_GAMEPLAY_PROFILES)) {
  for (const eventDefinition of profile.events) {
    let run = createRegionEventRun(eventDefinition);
    const firstStep = eventDefinition.steps[0];
    const wrongResult = applyRegionEventSignal(run, eventDefinition, { type: 'defeat', targetId: '__wrong__', tier: 'boss', amount: 99 });
    if (wrongResult.changed) errors.push(`${profile.regionId}:${eventDefinition.id}: accepted an out-of-order signal.`);
    for (const eventStep of eventDefinition.steps) {
      const signal = createSignal(eventStep);
      const result = applyRegionEventSignal(run, eventDefinition, signal);
      if (!result.changed) errors.push(`${profile.regionId}:${eventDefinition.id}:${eventStep.id}: valid signal was rejected.`);
      run = result.run;
      testedSteps += 1;
    }
    if (run.status !== 'completed') errors.push(`${profile.regionId}:${eventDefinition.id}: event did not complete.`);
    testedEvents += 1;
  }
}

// 三種敵人階級的區域素材數量必須符合 1/2/4，並保留基礎素材掉落契約。
const lootByTier = {};
for (const [tier, expected] of Object.entries({ normal: 1, elite: 2, boss: 4 })) {
  const loot = rollMonsterLoot({ tier, regionMaterialId: 'mat_wind_feather' }, () => 1);
  const regionalDrop = loot.find((item) => item.itemId === 'mat_wind_feather');
  lootByTier[tier] = regionalDrop?.count || 0;
  if (regionalDrop?.count !== expected) errors.push(`${tier}: regional loot count must be ${expected}.`);
}

const riftA = createDailyRiftConfig('2026-07-14');
const riftB = createDailyRiftConfig('2026-07-14');
if (JSON.stringify(riftA) !== JSON.stringify(riftB)) errors.push('Daily Rift changed for the same day key.');
if (riftA.monsters.length !== 6) errors.push('Daily Rift must generate 6 monsters.');
if (riftA.monsters.some((item) => item.def.grantLoot !== false || item.def.rewardGold !== 0)) errors.push('Daily Rift normal monsters must not provide repeatable farm rewards.');
if (new Set(riftA.monsters.map((item) => `${item.spawn.x}:${item.spawn.z}`)).size !== 6) errors.push('Daily Rift generated duplicate spawn coordinates.');

const report = {
  generatedAt: new Date().toISOString(),
  ok: errors.length === 0 && warnings.length === 0,
  summary: { ...validation.summary, testedEvents, testedSteps },
  errors,
  warnings,
  stateMachine: { allEventsCompleted: testedEvents === 24, outOfOrderRejected: errors.every((item) => !item.includes('out-of-order')) },
  lootByTier,
  dailyRift: { dayKey: riftA.dayKey, monsterCount: riftA.monsters.length, deterministic: JSON.stringify(riftA) === JSON.stringify(riftB) },
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

function createSignal(eventStep) {
  if (eventStep.type === 'defeat') return { type: 'defeat', targetId: eventStep.targetId, tier: eventStep.targetId, amount: eventStep.target };
  return { type: eventStep.type, targetId: eventStep.targetId, amount: eventStep.target };
}
