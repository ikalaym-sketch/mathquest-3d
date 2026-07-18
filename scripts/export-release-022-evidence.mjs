// v0.22.0 deterministic 工程證據匯出：只輸出 Canonical 資料矩陣，不放執行時間戳。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOSS_PROFILE_REGION_IDS, ELITE_COMBAT_PROFILES, getBossCombatProfile } from '../src/data/combatEncounterProfiles.js';
import { getAllTrialFloorConfigs } from '../src/data/trialTower.js';
import { getTrialRoomScenario } from '../src/data/trialTowerRooms.js';
import { STORY_CHAPTERS, STORY_QUESTS } from '../src/data/storyContent.js';
import { UI_DEFAULTS, UI_OPTION_VALUES } from '../src/data/uiSystem.js';
import { validateRelease022Content } from '../src/services/Release022ValidationService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
fs.mkdirSync(docs, { recursive: true });
const csv = (rows) => `${rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')}\n`;

const combatRows = [['region_id', 'boss_phase_id', 'phase_label', 'threshold', 'movement', 'skill_id', 'skill_kind', 'telegraph_ms', 'damage', 'elite_label', 'barrier_hits', 'pulse_damage', 'pulse_radius', 'pulse_every', 'enrage_threshold']];
BOSS_PROFILE_REGION_IDS.forEach((regionId) => {
  const boss = getBossCombatProfile({ id: `${regionId}_boss`, regionId });
  const elite = ELITE_COMBAT_PROFILES[regionId];
  boss.phases.forEach((phase) => phase.skills.forEach((skill) => combatRows.push([regionId, phase.id, phase.label, phase.threshold, phase.movement, skill.id, skill.kind, skill.telegraphMs, skill.damage, elite.label, elite.barrierHits, elite.pulseDamage, elite.pulseRadius, elite.pulseEvery, elite.enrageThreshold])));
});
fs.writeFileSync(path.join(docs, 'COMBAT_BOSS_ELITE_MATRIX.csv'), csv(combatRows));

const towerRows = [['floor', 'tier', 'theme_id', 'room_type', 'room_name', 'interaction', 'enemy_count', 'skill_id', 'boss_id', 'reward_gold']];
getAllTrialFloorConfigs().forEach((floor) => {
  const scenario = getTrialRoomScenario(floor);
  towerRows.push([floor.floor, floor.tier + 1, floor.theme.id, floor.roomType, floor.room.name, scenario.interaction, floor.enemyCount, floor.skillId, floor.boss?.id || '', floor.rewardGold]);
});
fs.writeFileSync(path.join(docs, 'TRIAL_TOWER_100_FLOOR_MATRIX.csv'), csv(towerRows));

const questRows = [['chapter_order', 'chapter_id', 'region_id', 'chapter_title', 'unlocks_region_id', 'quest_id', 'quest_title', 'objective_type', 'target_id', 'tier', 'reward_gold', 'learning_focus']];
STORY_CHAPTERS.forEach((chapter) => STORY_QUESTS.filter((quest) => quest.chapterId === chapter.id).forEach((quest) => questRows.push([chapter.order, chapter.id, chapter.regionId, chapter.title, chapter.unlocksRegionId || '', quest.id, quest.title, quest.objective.type, quest.objective.targetId, quest.objective.tier || '', quest.rewardGold, quest.learningFocus])));
fs.writeFileSync(path.join(docs, 'STORY_QUEST_MATRIX.csv'), csv(questRows));

const optionRows = [['setting_key', 'default_value', 'allowed_values_or_type']];
Object.entries(UI_DEFAULTS).forEach(([key, value]) => optionRows.push([key, value, UI_OPTION_VALUES[key]?.join('|') || 'boolean']));
fs.writeFileSync(path.join(docs, 'UI_ACCESSIBILITY_MATRIX.csv'), csv(optionRows));
fs.writeFileSync(path.join(docs, 'RELEASE_022_VALIDATION.json'), `${JSON.stringify(validateRelease022Content(), null, 2)}\n`);
console.log(JSON.stringify({ combatRows: combatRows.length - 1, towerRows: towerRows.length - 1, questRows: questRows.length - 1, uiRows: optionRows.length - 1 }));
