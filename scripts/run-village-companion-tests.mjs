// v0.28 階段 C/D 驗證：資料／狀態機、8 個 GLB、Runtime 接線與 Canonical 分離。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVillageCompanionContent } from '../src/services/VillageCompanionValidationService.js';
import { COMPANION_PROFILES } from '../src/data/companionProfiles.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = validateVillageCompanionContent();
const requiredNodes = ['CompanionRoot', 'BodyPivot', 'HeadPivot', 'TailPivot', 'COLLIDER_Main', 'SOCKET_Interaction', 'SOCKET_Home', 'SOCKET_Skill', 'SOCKET_Find'];
const requiredClips = ['Idle', 'Walk', 'Happy', 'Skill', 'Sleep', 'Swim', 'Find', 'Greet'];
const assets = [];
for (const profile of Object.values(COMPANION_PROFILES)) {
  const descriptor = getCanonicalAsset(profile.modelAssetId);
  const relative = descriptor ? `public/${descriptor.canonicalPath}` : null;
  const file = relative ? path.join(root, relative) : null;
  if (!file || !fs.existsSync(file)) { result.errors.push(`${profile.id}: GLB 缺檔`); continue; }
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'glTF') { result.errors.push(`${profile.id}: GLB Header 錯誤`); continue; }
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').replace(/\0+$/u, ''));
  const nodeNames = new Set((json.nodes || []).map((node) => node.name));
  const clips = new Map((json.animations || []).map((clip) => [clip.name, clip.channels?.length || 0]));
  requiredNodes.forEach((name) => { if (!nodeNames.has(name)) result.errors.push(`${profile.id}: 缺少節點 ${name}`); });
  requiredClips.forEach((name) => { if (!clips.has(name) || clips.get(name) < 1) result.errors.push(`${profile.id}: 動畫 ${name} 無有效 Channel`); });
  assets.push({ id: profile.id, file: relative, bytes: buffer.length, nodes: json.nodes?.length || 0, clips: [...clips.keys()] });
}

const sources = Object.fromEntries([
  'src/components/3D/FairyCompanion.jsx', 'src/components/3D/CompanionActor.jsx', 'src/components/Farm/CompanionHomeActors.jsx',
  'src/components/UI/CompanionRosterPanel.jsx', 'src/components/UI/StarterCompanionPanel.jsx', 'src/components/UI/ShopPanel.jsx',
  'src/components/UI/AnimalCarePanel.jsx', 'src/components/UI/MachinePanel.jsx', 'src/components/UI/SeedPickerPanel.jsx',
  'src/components/Story/NPCDialoguePanel.jsx', 'src/store/useStore.js', 'src/systems/regionLoot.js',
].map((relative) => [relative, fs.readFileSync(path.join(root, relative), 'utf8')]));
const sourceRequirements = [
  ['GLB Runtime', sources['src/components/3D/FairyCompanion.jsx'].includes('CompanionActor') && sources['src/components/3D/CompanionActor.jsx'].includes('AnimatedProductionModel') && sources['src/components/3D/CompanionActor.jsx'].includes('assetId={profile.modelAssetId}')],
  ['夥伴休息區', sources['src/components/Farm/CompanionHomeActors.jsx'].includes('ownedIds')],
  ['三選一', sources['src/components/UI/StarterCompanionPanel.jsx'].includes('STARTER_COMPANION_IDS')],
  ['動態商店', sources['src/components/UI/ShopPanel.jsx'].includes('getVillageShopStock')],
  ['動物能力', sources['src/components/UI/AnimalCarePanel.jsx'].includes('animalQualityBonus')],
  ['加工能力', sources['src/components/UI/MachinePanel.jsx'].includes('processingMinutesReduction')],
  ['種子能力', sources['src/components/UI/SeedPickerPanel.jsx'].includes('seedRefundChance')],
  ['素材能力', sources['src/systems/regionLoot.js'].includes('materialDropBonus')],
  ['舊 Pet 停止 Canonical Runtime', !sources['src/components/3D/FairyCompanion.jsx'].includes('equipped.pet') && sources['src/store/useStore.js'].includes('companionState: normalizeCompanionState') && !sources['src/store/useStore.js'].includes('equipped.pet =')],
];
for (const [label, ok] of sourceRequirements) if (!ok) result.errors.push(`${label}: Runtime 接線缺失`);
result.ok = result.errors.length === 0;
result.assetCount = assets.length;
result.assets = assets;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
