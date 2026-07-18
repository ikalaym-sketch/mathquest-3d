import { getAllTrialFloorConfigs, TRIAL_TOWER_MAX_FLOOR, TOWER_THEMES } from '../data/trialTower.js';
import { SKILL_BY_ID } from '../data/skillGraph.js';

export function validateTrialTower() {
  const errors = [];
  const warnings = [];
  const floors = getAllTrialFloorConfigs();
  if (floors.length !== TRIAL_TOWER_MAX_FLOOR) errors.push(`Expected ${TRIAL_TOWER_MAX_FLOOR} floors, got ${floors.length}`);
  if (TOWER_THEMES.length !== 10) errors.push(`Expected 10 themes, got ${TOWER_THEMES.length}`);
  const ids = new Set();
  floors.forEach((config, index) => {
    if (config.floor !== index + 1) errors.push(`Floor sequence mismatch at ${index + 1}`);
    if (!config.roomType || !config.room) errors.push(`Floor ${config.floor}: missing room archetype`);
    if (!SKILL_BY_ID[config.skillId]) errors.push(`Floor ${config.floor}: invalid skill ${config.skillId}`);
    if (!config.theme?.id) errors.push(`Floor ${config.floor}: missing theme`);
    if (config.isMilestone && !config.boss) errors.push(`Floor ${config.floor}: milestone missing boss`);
    if (config.boss) {
      if (ids.has(config.boss.id)) errors.push(`Duplicate boss ${config.boss.id}`);
      ids.add(config.boss.id);
    }
  });
  const milestoneCount = floors.filter((floor) => floor.isMilestone).length;
  if (milestoneCount !== 10) errors.push(`Expected 10 milestones, got ${milestoneCount}`);
  return { ok: errors.length === 0, errors, warnings, counts: { floors: floors.length, themes: TOWER_THEMES.length, bosses: ids.size, milestones: milestoneCount } };
}
