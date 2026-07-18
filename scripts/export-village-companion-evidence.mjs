// v0.28 顯式證據匯出；只在封裝前執行一次，測試指令維持純讀取。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVillageCompanionContent } from '../src/services/VillageCompanionValidationService.js';
import { VILLAGE_RESIDENT_PROFILES } from '../src/data/villageResidentProfiles.js';
import { COMPANION_PROFILES } from '../src/data/companionProfiles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs'); const manifests = path.join(root, 'public', 'manifests');
await fs.mkdir(docs, { recursive: true }); await fs.mkdir(manifests, { recursive: true });
const validation = { generatedAt: new Date().toISOString(), version: '0.28.0', ...validateVillageCompanionContent() };
await fs.writeFile(path.join(docs, 'VILLAGE_COMPANION_VALIDATION.json'), JSON.stringify(validation, null, 2) + '\n');

const residentRows = [['NPC_ID','Name','Role','Dialogue_Count','Event_Count','Loved_Gifts','Liked_Gifts','Closed_Weekdays','Home','Work','Rain']];
for (const profile of Object.values(VILLAGE_RESIDENT_PROFILES)) {
  const dialogueCount = Object.values(profile.dialogue.weatherLines).flat().length + Object.values(profile.dialogue.segmentLines).flat().length + Object.values(profile.dialogue.seasonLines).flat().length + profile.dialogue.relationLines.length + Object.values(profile.weeklyNotes).length;
  residentRows.push([profile.id, profile.name, profile.role, dialogueCount, profile.events.length, profile.giftPreferences.loved.join('|'), profile.giftPreferences.liked.join('|'), profile.closedWeekdays.join('|'), profile.homePosition.join('|'), profile.workPosition.join('|'), profile.rainPosition.join('|')]);
}
await fs.writeFile(path.join(docs, 'VILLAGE_RESIDENT_MATRIX.csv'), toCsv(residentRows));

const companionRows = [['Companion_ID','Name','Species','Starter','Model_Asset_ID','Acquisition','Life_Skill','Exploration_Skill','Learning_Skill','Battle_Skill','Modifiers','Required_Clips']];
for (const profile of Object.values(COMPANION_PROFILES)) companionRows.push([
  profile.id, profile.name, profile.species, profile.starter, profile.modelAssetId, JSON.stringify(profile.acquisition), profile.skills.life, profile.skills.exploration, profile.skills.learning, profile.skills.battle, JSON.stringify(profile.modifiers), 'Idle|Walk|Happy|Skill|Sleep|Swim|Find|Greet',
]);
await fs.writeFile(path.join(docs, 'COMPANION_RUNTIME_MATRIX.csv'), toCsv(companionRows));
await fs.writeFile(path.join(manifests, 'companion-production-manifest.json'), JSON.stringify({
  version: '0.28.0', contract: 'MathQuestCompanionV1', companionCount: Object.keys(COMPANION_PROFILES).length,
  requiredNodes: ['CompanionRoot','BodyPivot','HeadPivot','TailPivot','COLLIDER_Main','SOCKET_Interaction','SOCKET_Home','SOCKET_Skill','SOCKET_Find'],
  requiredClips: ['Idle','Walk','Happy','Skill','Sleep','Swim','Find','Greet'],
  companions: Object.values(COMPANION_PROFILES).map((profile) => ({ id: profile.id, name: profile.name, species: profile.species, modelAssetId: profile.modelAssetId, acquisition: profile.acquisition })),
}, null, 2) + '\n');
console.log(JSON.stringify({ ok: validation.ok, residents: residentRows.length - 1, companions: companionRows.length - 1 }, null, 2));

function toCsv(rows) { return rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\n') + '\n'; }
