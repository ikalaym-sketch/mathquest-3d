// v0.20-v0.22 合併內容 Manifest：輸出 deterministic JSON，不寫入時間戳，確保重建後 Hash 一致。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOSS_PROFILE_REGION_IDS, ELITE_COMBAT_PROFILES, getBossCombatProfile } from '../src/data/combatEncounterProfiles.js';
import { TRIAL_ARENA_THEMES, TRIAL_ROOM_VARIANTS } from '../src/data/trialTowerRooms.js';
import { STORY_CHAPTERS, STORY_QUESTS } from '../src/data/storyContent.js';
import { NPC_STORY_PROFILES } from '../src/data/npcStoryProfiles.js';
import { UI_DEFAULTS, UI_OPTION_VALUES } from '../src/data/uiSystem.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/manifests/release-content-manifest.json');
const manifest = {
  schema: 'mathquest.release-content.v1',
  version: '0.22.0',
  combat: {
    regionBossProfiles: BOSS_PROFILE_REGION_IDS.map((regionId) => {
      const profile = getBossCombatProfile({ id: `${regionId}_boss`, regionId });
      return { regionId, phaseIds: profile.phases.map((phase) => phase.id), skillIds: profile.phases.flatMap((phase) => phase.skills.map((skill) => skill.id)), seal: profile.seal };
    }),
    eliteProfiles: Object.entries(ELITE_COMBAT_PROFILES).map(([regionId, profile]) => ({ regionId, ...profile })),
  },
  trialTower: {
    arenaThemes: TRIAL_ARENA_THEMES.map((theme) => ({ id: theme.id, baseShape: theme.baseShape, obstacleCount: theme.obstacles.length })),
    roomTypes: Object.keys(TRIAL_ROOM_VARIANTS),
    floorCount: 100,
  },
  ui: { defaults: UI_DEFAULTS, optionValues: UI_OPTION_VALUES },
  story: {
    chapters: STORY_CHAPTERS,
    questCount: STORY_QUESTS.length,
    questIds: STORY_QUESTS.map((quest) => quest.id),
    npcProfileIds: Object.keys(NPC_STORY_PROFILES),
  },
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(output);
