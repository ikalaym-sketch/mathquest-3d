// v0.31 Characters & Companions 永久驗收。
// 驗證101個新增GLB、共用Rig、玩家/居民/夥伴Runtime映射、動畫狀態與手機細節配額。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_ASSET_COUNT,
  CANONICAL_ASSET_REGISTRY,
  getCanonicalAsset,
} from '../src/data/productionAssetCatalog.js';
import { COMPANION_PROFILES } from '../src/data/companionProfiles.js';
import {
  CHARACTER_LIFE_ANIMATION_CLIPS,
  COMPANION_V031_VISUAL_PROFILES,
  HUMANOID_BODY_VARIANT_DEFINITIONS,
  PLAYER_ACCESSORY_OPTIONS,
  PLAYER_FACE_OPTIONS,
  PLAYER_HAIR_OPTIONS,
  PLAYER_OUTFIT_OPTIONS,
  RESIDENT_CHARACTER_VISUAL_PROFILES,
  V031_CHARACTER_ASSET_DEFINITIONS,
  V031_COMPANION_MODULE_DEFINITIONS,
  resolvePlayerAppearanceAssets,
} from '../src/data/characterCompanionV031Catalog.js';
import { VILLAGE_RESIDENT_IDS } from '../src/data/villageResidentProfiles.js';
import {
  MAX_DETAILED_CHARACTER_ACTORS,
  getCharacterCompanionRuntimeAssetIds,
  getCharacterDetailBudgetSnapshot,
  rebalanceCharacterDetailBudget,
  registerCharacterDetailCandidate,
  resetCharacterDetailBudgetForTests,
  resolveResidentAnimation,
  updateCharacterDetailCandidate,
} from '../src/services/CharacterCompanionVisualService.js';
import { resolveCharacterAnimationState } from '../src/services/AnimationStateService.js';
import { getVillageBundleContract } from '../src/services/VillageAssetService.js';
import { migrateMainSaveState } from '../src/store/useStore.js';
import { MAX_PLAYER_EQUIPMENT_RESIDENT_ASSETS } from '../src/services/EquipmentAssetService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const cases = [];

await check('v031_exact_asset_allocation', async () => {
  const assets = Object.values(CANONICAL_ASSET_REGISTRY);
  const byCategory = countBy(assets, 'category');
  if (CANONICAL_ASSET_COUNT < 383) throw new Error(`Canonical不得低於v0.31基線383，實際${CANONICAL_ASSET_COUNT}`);
  if (byCategory.character !== 80) throw new Error(`角色應80，實際${byCategory.character}`);
  if (byCategory.companion !== 32) throw new Error(`夥伴應32，實際${byCategory.companion}`);
  if (V031_CHARACTER_ASSET_DEFINITIONS.length !== 77) throw new Error('v0.31角色淨新增不是77。');
  if (V031_COMPANION_MODULE_DEFINITIONS.length !== 24) throw new Error('v0.31夥伴淨新增不是24。');
  if (assets.filter((asset) => asset.artStatus === 'new').length < 249) throw new Error('相對v0.29累積新增不得低於v0.31基線249。');
  return { canonical: CANONICAL_ASSET_COUNT, character: 80, companion: 32, v031New: 101 };
});

await check('v031_physical_glb_contracts', async () => {
  let bytes = 0;
  for (const definition of [...V031_CHARACTER_ASSET_DEFINITIONS, ...V031_COMPANION_MODULE_DEFINITIONS]) {
    const asset = getCanonicalAsset(definition.assetId);
    if (!asset) throw new Error(`${definition.assetId}未登錄。`);
    const buffer = await fs.readFile(path.join(root, 'public', asset.canonicalPath));
    if (buffer.length < 256 || buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${definition.assetId}不是有效GLB。`);
    const json = parseGlbJson(buffer);
    const nodeNames = new Set((json.nodes || []).map((node) => node.name));
    for (const name of asset.requiredNodes || []) if (!nodeNames.has(name)) throw new Error(`${definition.assetId}缺少節點${name}。`);
    bytes += buffer.length;
  }
  return { files: 101, bytes };
});

await check('shared_humanoid_rig_and_life_clips', async () => {
  const jointContracts = [];
  for (const definition of HUMANOID_BODY_VARIANT_DEFINITIONS) {
    const asset = getCanonicalAsset(definition.assetId);
    const json = parseGlbJson(await fs.readFile(path.join(root, 'public', asset.canonicalPath)));
    if ((json.skins || []).length !== 1) throw new Error(`${definition.assetId}必須只有一套共用Skin。`);
    const names = (json.nodes || []).map((node) => node.name || '');
    const joints = json.skins[0].joints.map((index) => names[index]);
    const clips = new Set((json.animations || []).map((animation) => animation.name));
    for (const clip of CHARACTER_LIFE_ANIMATION_CLIPS) if (!clips.has(clip)) throw new Error(`${definition.assetId}缺少${clip}。`);
    jointContracts.push(joints.join('|'));
  }
  if (new Set(jointContracts).size !== 1) throw new Error('五種體型未共用同一骨架節點契約。');
  return { bodyVariants: 5, sharedRig: true, lifeClips: CHARACTER_LIFE_ANIMATION_CLIPS.length };
});

await check('resident_and_player_runtime_mappings', async () => {
  if (VILLAGE_RESIDENT_IDS.length !== 10) throw new Error('正式居民不是10位。');
  const residentAssets = new Set();
  for (const id of VILLAGE_RESIDENT_IDS) {
    const visual = RESIDENT_CHARACTER_VISUAL_PROFILES[id];
    if (!visual) throw new Error(`${id}沒有視覺Profile。`);
    for (const key of ['bodyAssetId', 'faceAssetId', 'hairAssetId', 'outfitAssetId', 'roleAssetId']) {
      if (!getCanonicalAsset(visual[key])) throw new Error(`${id}/${key}未指向Canonical資產。`);
      residentAssets.add(visual[key]);
    }
  }
  const counts = [PLAYER_HAIR_OPTIONS.length, PLAYER_FACE_OPTIONS.length, PLAYER_OUTFIT_OPTIONS.length, PLAYER_ACCESSORY_OPTIONS.length];
  if (counts.join(',') !== '12,8,8,5') throw new Error(`玩家選項數錯誤：${counts.join(',')}`);
  const playerAssets = new Set();
  for (const option of PLAYER_HAIR_OPTIONS) addResolved(playerAssets, resolvePlayerAppearanceAssets({ hairStyle: option.id }));
  for (const option of PLAYER_FACE_OPTIONS) addResolved(playerAssets, resolvePlayerAppearanceAssets({ face: option.id }));
  for (const option of PLAYER_OUTFIT_OPTIONS) addResolved(playerAssets, resolvePlayerAppearanceAssets({ outfitStyle: option.id }));
  for (const option of PLAYER_ACCESSORY_OPTIONS) addResolved(playerAssets, resolvePlayerAppearanceAssets({ accessory: option.id }));
  if (playerAssets.size !== 32) throw new Error(`玩家32個模組僅映射到${playerAssets.size}個。`);
  const migrated = migrateMainSaveState({ characterProfile: { created: true, hairStyle: 'short', face: 'smile', accessory: 'none' } });
  if (migrated.characterProfile.outfitStyle !== 'adventurer') throw new Error('舊存檔未補入outfitStyle。');
  return { residents: 10, residentMappedAssets: residentAssets.size, playerMappedAssets: playerAssets.size, saveCompatible: true };
});

await check('companion_modules_and_unique_gaits', async () => {
  const mapped = new Set();
  const gaitDurations = new Set();
  for (const profile of Object.values(COMPANION_PROFILES)) {
    const visual = COMPANION_V031_VISUAL_PROFILES[profile.id];
    if (!visual) throw new Error(`${profile.id}沒有v0.31視覺Profile。`);
    for (const key of ['homeAssetId', 'skillAssetId', 'wearableAssetId']) {
      if (!getCanonicalAsset(visual[key])) throw new Error(`${profile.id}/${key}未登錄。`);
      mapped.add(visual[key]);
    }
    const base = getCanonicalAsset(profile.modelAssetId);
    const json = parseGlbJson(await fs.readFile(path.join(root, 'public', base.canonicalPath)));
    const rootNode = (json.nodes || []).find((node) => node.name === 'CompanionRoot');
    const sockets = new Set((json.nodes || []).map((node) => node.name));
    if (!sockets.has('SOCKET_Accessory') || !sockets.has('SOCKET_Skill')) throw new Error(`${profile.id}缺少模組Socket。`);
    const gait = rootNode?.extras?.gaitDuration;
    if (!Number.isFinite(gait)) throw new Error(`${profile.id}缺少步態週期。`);
    gaitDurations.add(gait);
  }
  if (mapped.size !== 24) throw new Error(`夥伴模組只映射${mapped.size}/24。`);
  if (gaitDurations.size !== 8) throw new Error(`夥伴獨立步態只有${gaitDurations.size}/8。`);
  return { companions: 8, mappedModules: 24, uniqueWalkCycles: 8 };
});

await check('runtime_reachability_and_source_wiring', async () => {
  const reachable = new Set(getCharacterCompanionRuntimeAssetIds());
  const expected = [...V031_CHARACTER_ASSET_DEFINITIONS, ...V031_COMPANION_MODULE_DEFINITIONS].map((definition) => definition.assetId);
  const missing = expected.filter((assetId) => !reachable.has(assetId));
  if (missing.length) throw new Error(`Runtime映射缺少：${missing.join(', ')}`);
  const sources = await Promise.all([
    'src/components/3D/PlayerAvatar.jsx',
    'src/components/3D/CharacterActorRig.jsx',
    'src/components/3D/CompanionActor.jsx',
    'src/components/Farm/CompanionHomeActors.jsx',
    'src/components/NPC/VillageNPCs.jsx',
    'src/components/NPC/VillageLifeNPCs.jsx',
    'src/components/3D/Player.jsx',
  ].map((relative) => fs.readFile(path.join(root, relative), 'utf8')));
  const joined = sources.join('\n');
  for (const token of ['resolvePlayerAppearanceAssets', 'appearanceProfileId', 'wearableAssetId', 'skillAssetId', 'homeAssetId', 'ProximityCharacterActor', 'triggerCompanionSkill']) {
    if (!joined.includes(token)) throw new Error(`Runtime來源未接線：${token}`);
  }
  const glasses = resolvePlayerAppearanceAssets({ accessory: 'glasses' });
  const scarf = resolvePlayerAppearanceAssets({ accessory: 'scarf' });
  if (glasses.accessorySocket !== 'SOCKET_face' || scarf.accessorySocket !== 'SOCKET_accessory') throw new Error('玩家配件Socket策略錯誤。');
  return { reachableAssets: reachable.size, sourceContracts: 7, accessorySockets: true };
});

await check('animation_state_runtime_contract', async () => {
  const expectations = [
    ['Talk', true], ['Work', true], ['Sit', true], ['Sleep', true], ['Gift', false], ['Celebrate', false],
  ];
  for (const [actionState, shouldLoop] of expectations) {
    const state = resolveCharacterAnimationState({ locomotionState: 'idle', actionState });
    if (state.requestedClip !== actionState || state.loop !== shouldLoop) throw new Error(`${actionState}狀態解析錯誤。`);
  }
  const moving = resolveResidentAnimation({ isMoving: true, scheduleState: 'working' });
  const working = resolveResidentAnimation({ isMoving: false, scheduleState: 'working' });
  const sleeping = resolveResidentAnimation({ isMoving: false, scheduleState: 'resting', timeSegment: 'night' });
  if (moving.locomotionState !== 'walk' || working.actionState !== 'Work' || sleeping.actionState !== 'Sleep') throw new Error('居民作息未轉成正式動畫狀態。');
  return { actions: expectations.length, scheduleStates: 3 };
});

await check('mobile_character_detail_budget', async () => {
  resetCharacterDetailBudgetForTests();
  const releases = VILLAGE_RESIDENT_IDS.map((id) => registerCharacterDetailCandidate(id, () => {}));
  VILLAGE_RESIDENT_IDS.forEach((id, index) => updateCharacterDetailCandidate(id, index + 1, 100));
  rebalanceCharacterDetailBudget(100);
  const snapshot = getCharacterDetailBudgetSnapshot();
  releases.forEach((release) => release());
  if (snapshot.selectedActorIds.length !== MAX_DETAILED_CHARACTER_ACTORS) throw new Error('細節角色配額未受限制。');
  const estimatedPeakAssets = getVillageBundleContract().maxSimultaneousAssets
    + MAX_DETAILED_CHARACTER_ACTORS * 5
    + 5 // 玩家身體 + 髮型 + 臉 + 服裝 + 配件
    + 2 // 同行夥伴身體 + 穿戴
    + MAX_PLAYER_EQUIPMENT_RESIDENT_ASSETS; // 八欄裝備 + Delivery + Impact
  if (estimatedPeakAssets > 70) throw new Error(`村莊角色估算峰值${estimatedPeakAssets}超過70。`);
  return { detailedResidents: MAX_DETAILED_CHARACTER_ACTORS, estimatedPeakAssets, mobileLimit: 70 };
});

await check('v031_runtime_atlases', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/textures/atlases/atlas-manifest.json'), 'utf8'));
  const atlasIds = new Set(manifest.atlases.map((atlas) => atlas.atlasId));
  for (const id of ['atlas_player', 'atlas_residents', 'atlas_companions']) if (!atlasIds.has(id)) throw new Error(`缺少${id}。`);
  const pairs = manifest.atlases.reduce((total, atlas) => total + atlas.files.length, 0);
  if (manifest.atlases.length < 6 || pairs < 26) throw new Error('Runtime Atlas低於v0.31基線。');
  return { release: manifest.release, atlases: manifest.atlases.length, channelPairs: pairs };
});

const report = { generatedAt: new Date().toISOString(), version: '0.31.0-characters-companions', ok: errors.length === 0, caseCount: cases.length, cases, errors };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function check(id, run) {
  try { cases.push({ id, status: 'PASSED', result: await run() }); }
  catch (error) { const message = error?.message || String(error); errors.push(`${id}: ${message}`); cases.push({ id, status: 'FAILED', error: message }); }
}

function parseGlbJson(buffer) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString('utf8').trim());
    offset += 8 + length;
  }
  throw new Error('GLB缺少JSON Chunk。');
}

function addResolved(target, resolved) {
  for (const key of ['hairAssetId', 'faceAssetId', 'outfitAssetId', 'accessoryAssetId']) if (resolved[key]) target.add(resolved[key]);
}

function countBy(items, key) {
  return items.reduce((result, item) => ({ ...result, [item[key]]: (result[item[key]] || 0) + 1 }), {});
}
