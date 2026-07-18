// v0.30 星光村與農場擴充永久回歸測試。
// 驗證Canonical數量、實體GLB、場景接線、分包上限、KTX2、真實LOD與12種武器動畫契約。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  CANONICAL_ASSET_COUNT,
  CANONICAL_ASSET_REGISTRY,
  VILLAGE_ASSETS,
  FARM_ASSETS,
  FARM_EXPANSION_ASSETS,
} from '../src/data/productionAssetCatalog.js';
import { PLAYER_COMBAT_ANIMATION_CLIPS } from '../src/data/combatArchetypes.js';
import { getVillageBundleContract, getVillageRuntimeReachableAssetIds, VILLAGE_BUILDING_ASSET_BY_LAYOUT_ID } from '../src/services/VillageAssetService.js';
import { getFarmBundleContract, getFarmRuntimeReachableAssetIds, resolveCropModelAssetId, resolveFarmToolModelAssetId } from '../src/services/FarmAssetService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const cases = [];
await check('canonical_asset_allocation', async () => {
  const registry = Object.values(CANONICAL_ASSET_REGISTRY);
  const newAssets = registry.filter((asset) => asset.artStatus === 'new').length;
  if (CANONICAL_ASSET_COUNT < 282) throw new Error(`Canonical不得低於v0.30基線282，實際${CANONICAL_ASSET_COUNT}`);
  if (Object.keys(VILLAGE_ASSETS).length !== 80) throw new Error('星光村GLB不是80。');
  if (Object.keys(FARM_ASSETS).length + Object.keys(FARM_EXPANSION_ASSETS).length !== 80) throw new Error('農場GLB不是80。');
  if (newAssets < 148) throw new Error(`相對v0.29的累積新資產不得低於v0.30基線148，實際${newAssets}`);
  return { canonical: CANONICAL_ASSET_COUNT, village: 80, farm: 80, cumulativeNewAssets: newAssets };
});
await check('canonical_files_exist', async () => {
  let bytes = 0;
  for (const asset of Object.values(CANONICAL_ASSET_REGISTRY)) {
    const stat = await fs.stat(path.join(root, 'public', asset.canonicalPath));
    if (stat.size < 256) throw new Error(`${asset.assetId} GLB異常過小。`);
    bytes += stat.size;
  }
  return { files: CANONICAL_ASSET_COUNT, bytes };
});
await check('scene_runtime_wiring', async () => {
  const villageSource = await fs.readFile(path.join(root, 'src/components/Scenes/VillageScene.jsx'), 'utf8');
  const farmSource = await fs.readFile(path.join(root, 'src/components/Farm/FarmScene.jsx'), 'utf8');
  const modelSource = await fs.readFile(path.join(root, 'src/components/3D/Model.jsx'), 'utf8');
  const playerAvatarSource = await fs.readFile(path.join(root, 'src/components/3D/PlayerAvatar.jsx'), 'utf8');
  if (!villageSource.includes('VillageProductionAssetLayer')) throw new Error('村莊正式GLB層未接入場景。');
  if (!farmSource.includes('FarmProductionAssetLayer')) throw new Error('農場設施GLB層未接入場景。');
  if (!farmSource.includes('resolveCropModelAssetId')) throw new Error('作物階段仍未接Canonical GLB。');
  if (!modelSource.includes("getObjectByName('LOD0')") || !modelSource.includes('activeLodRef')) throw new Error('通用Model尚未依Registry執行LOD切換。');
  if (!playerAvatarSource.includes('resolveFarmToolModelAssetId')) throw new Error('玩家農具尚未接正式Canonical GLB。');
  if (Object.values(VILLAGE_BUILDING_ASSET_BY_LAYOUT_ID).filter(Boolean).length !== 11) throw new Error('11棟村莊建築映射不完整。');
  for (let seed = 1; seed <= 10; seed += 1) {
    for (const stage of ['seeded', 'sprout', 'growing', 'mature']) {
      if (!resolveCropModelAssetId(`seed_${String(seed).padStart(2, '0')}`, stage)) throw new Error(`seed_${seed}/${stage}沒有模型映射。`);
    }
  }
  const formalToolIds = ['hoe', 'wateringCan', 'seedBag', 'sickle', 'axe', 'pickaxe', 'hammer', 'fishingRod'];
  if (formalToolIds.some((toolId) => !resolveFarmToolModelAssetId(toolId))) throw new Error('八件正式農具映射不完整。');
  return { villageBuildings: 11, seedStageMappings: 40, formalFarmTools: formalToolIds.length, genericModelLodSwitch: true };
});
await check('mobile_bundle_limits', async () => {
  const village = getVillageBundleContract();
  const farm = getFarmBundleContract();
  if (village.maxSimultaneousAssets > 70) throw new Error(`村莊分包超過手機70：${village.maxSimultaneousAssets}`);
  if (farm.maxSimultaneousAssets > 70) throw new Error(`農場分包超過手機70：${farm.maxSimultaneousAssets}`);
  return { village, farm };
});
await check('village_farm_assets_are_runtime_reachable', async () => {
  const villageReachable = new Set(getVillageRuntimeReachableAssetIds());
  const farmReachable = new Set(getFarmRuntimeReachableAssetIds());
  const missingVillage = Object.values(VILLAGE_ASSETS).filter((asset) => !villageReachable.has(asset.assetId));
  const missingFarm = [...Object.values(FARM_ASSETS), ...Object.values(FARM_EXPANSION_ASSETS)]
    .filter((asset) => !farmReachable.has(asset.assetId));
  if (missingVillage.length) throw new Error(`村莊資產未進入場景或分包：${missingVillage.map((asset) => asset.assetId).join(', ')}`);
  if (missingFarm.length) throw new Error(`農場資產未進入場景、工具或作物映射：${missingFarm.map((asset) => asset.assetId).join(', ')}`);
  return { villageReachable: villageReachable.size, farmReachable: farmReachable.size };
});
await check('player_weapon_animation_contract', async () => {
  const asset = CANONICAL_ASSET_REGISTRY['character:player_child'];
  const gltf = await parseGlb(path.join(root, 'public', asset.canonicalPath));
  const names = new Set(gltf.animations.map((clip) => clip.name));
  const missing = PLAYER_COMBAT_ANIMATION_CLIPS.filter((name) => !names.has(name));
  if (missing.length) throw new Error(`缺少武器動畫：${missing.join(', ')}`);
  return { required: PLAYER_COMBAT_ANIMATION_CLIPS.length, actualClips: names.size };
});
await check('runtime_atlas_files', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/textures/atlases/atlas-manifest.json'), 'utf8'));
  let pairs = 0;
  for (const atlas of manifest.atlases) for (const file of atlas.files) {
    const ktx = await fs.readFile(path.join(root, 'public', file.ktx2.path));
    if (ktx.subarray(0, 12).toString('hex') !== 'ab4b5458203230bb0d0a1a0a') throw new Error(`${file.ktx2.path}簽章錯誤。`);
    await fs.stat(path.join(root, 'public', file.png.path));
    pairs += 1;
  }
  return { atlases: manifest.atlases.length, channelPairs: pairs };
});

const report = { generatedAt: new Date().toISOString(), version: '0.32.0-village-farm-regression', ok: errors.length === 0, cases, errors };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function check(id, run) {
  try { cases.push({ id, status: 'PASSED', result: await run() }); }
  catch (error) { const message = error?.message || String(error); errors.push(`${id}: ${message}`); cases.push({ id, status: 'FAILED', error: message }); }
}
async function parseGlb(filePath) {
  const source = await fs.readFile(filePath);
  const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  return new Promise((resolve, reject) => new GLTFLoader().parse(buffer, '', resolve, reject));
}
