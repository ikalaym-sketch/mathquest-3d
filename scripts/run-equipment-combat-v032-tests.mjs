// v0.32 Equipment & Combat 永久驗收。
// 本測試會隨切片持續擴充；配額、Definition、Registry、GLB與Runtime必須共同通過。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARMORS, DB, WEAPONS } from '../src/data/index.js';
import {
  BASE_COMBAT_ARCHETYPE_IDS,
  BASE_COMBAT_ARCHETYPES,
  PLAYER_COMBAT_ANIMATION_CLIPS,
} from '../src/data/combatArchetypes.js';
import {
  V032_ARMOR_COMPLETION_DEFINITIONS,
  V032_EQUIPMENT_ALLOCATION,
  V032_EQUIPMENT_ASSET_COUNT,
  V032_EQUIPMENT_ASSET_DEFINITIONS,
  V032_EQUIPMENT_INVENTORY_DEFINITIONS,
  V032_OFFHAND_DEFINITIONS,
} from '../src/data/equipmentCombatV032Catalog.js';
import {
  CANONICAL_ASSET_COUNT,
  CANONICAL_ASSET_REGISTRY,
  getCanonicalAsset,
} from '../src/data/productionAssetCatalog.js';
import { MATERIAL_RUNTIME_PROFILES } from '../src/services/MaterialProfileService.js';
import { getCombatProfile } from '../src/utils/combatProfile.js';
import { registerEnemy } from '../src/input/combat.js';
import {
  combatVisualState,
  executeWeaponCombat,
  resetCombatVisualStateForTests,
  updateCombatVisualState,
} from '../src/services/CombatExecutionService.js';
import { getEquipmentLoadoutAssetIds, MAX_PLAYER_EQUIPMENT_RESIDENT_ASSETS } from '../src/services/EquipmentAssetService.js';
import { createEquipmentInstance } from '../src/services/EquipmentInstanceService.js';
import { validateEquipRequest } from '../src/services/EquipmentRuntimeService.js';
import { getVillageShopStock } from '../src/services/VillageEconomyService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const cases = [];

await check('v032_exact_equipment_allocation', async () => {
  if (V032_EQUIPMENT_ASSET_COUNT !== 140) throw new Error(`裝備資產應140，實際${V032_EQUIPMENT_ASSET_COUNT}`);
  const byPurpose = countBy(V032_EQUIPMENT_ASSET_DEFINITIONS, 'purpose');
  const expected = {
    'equippable-weapon': 20,
    'combat-delivery': 20,
    'combat-impact': 20,
    'equippable-armor': 60,
    'equippable-offhand': 20,
  };
  for (const [purpose, count] of Object.entries(expected)) {
    if (byPurpose[purpose] !== count) throw new Error(`${purpose}應${count}，實際${byPurpose[purpose] || 0}`);
  }
  if (Object.values(V032_EQUIPMENT_ALLOCATION).filter(Number.isFinite).slice(0, 6).reduce((sum, value) => sum + value, 0) !== 140) {
    throw new Error('配額分項未加總為140。');
  }
  const ids = V032_EQUIPMENT_ASSET_DEFINITIONS.map((definition) => definition.assetId);
  const paths = V032_EQUIPMENT_ASSET_DEFINITIONS.map((definition) => definition.canonicalPath);
  if (new Set(ids).size !== 140 || new Set(paths).size !== 140) throw new Error('assetId或canonicalPath不唯一。');
  return { canonicalBefore: 383, netNew: 140, canonicalAfter: 523, byPurpose };
});

await check('twenty_items_to_twelve_base_archetypes', async () => {
  if (WEAPONS.length !== 20 || BASE_COMBAT_ARCHETYPE_IDS.length !== 12) throw new Error('20→12基礎數量契約錯誤。');
  const used = new Set();
  for (const weapon of WEAPONS) {
    const base = BASE_COMBAT_ARCHETYPES[weapon.baseArchetype];
    if (!base) throw new Error(`${weapon.id}未映射基礎Archetype。`);
    used.add(weapon.baseArchetype);
    for (const key of ['visualAssetId', 'deliveryAssetId', 'impactAssetId', 'hitProfileId', 'projectileProfileId', 'vfxProfileId', 'audioProfileId', 'cooldownProfileId']) {
      if (!weapon[key]) throw new Error(`${weapon.id}缺少${key}。`);
    }
    if (!weapon.attackContract?.execution?.shape || !Number.isFinite(weapon.attackContract.execution.cooldownMultiplier)) {
      throw new Error(`${weapon.id}沒有可執行Hit/Cooldown契約。`);
    }
  }
  if (used.size !== 12) throw new Error(`20件武器只覆蓋${used.size}/12種基礎Archetype。`);
  if (new Set(PLAYER_COMBAT_ANIMATION_CLIPS).size !== PLAYER_COMBAT_ANIMATION_CLIPS.length) throw new Error('玩家戰鬥Clip名稱重複。');
  return { weaponItems: WEAPONS.length, baseArchetypes: used.size, combatClips: PLAYER_COMBAT_ANIMATION_CLIPS.length };
});

await check('eight_slot_definition_coverage', async () => {
  if (ARMORS.length !== 40 || V032_ARMOR_COMPLETION_DEFINITIONS.length !== 20 || V032_OFFHAND_DEFINITIONS.length !== 20) {
    throw new Error('核心護甲、補全部位或副手數量錯誤。');
  }
  const slots = new Set(V032_EQUIPMENT_INVENTORY_DEFINITIONS.map((item) => item.equipSlot || item.slot));
  for (const slot of ['head', 'body', 'hands', 'legs', 'feet', 'mainHand', 'offHand', 'accessory']) {
    if (!slots.has(slot)) throw new Error(`裝備Definition未覆蓋${slot}。`);
  }
  for (const item of [...V032_ARMOR_COMPLETION_DEFINITIONS, ...V032_OFFHAND_DEFINITIONS]) {
    if (DB[item.id] !== item) throw new Error(`${item.id}未進入正式DB。`);
  }
  return { inventoryDefinitions: V032_EQUIPMENT_INVENTORY_DEFINITIONS.length, slots: [...slots].sort() };
});

await check('registry_and_physical_glb_contracts', async () => {
  if (CANONICAL_ASSET_COUNT < 523) throw new Error(`Canonical不得低於v0.32基線523，實際${CANONICAL_ASSET_COUNT}。`);
  const equipmentAssets = Object.values(CANONICAL_ASSET_REGISTRY).filter((asset) => asset.category === 'equipment');
  if (equipmentAssets.length !== 140) throw new Error(`Registry裝備應140，實際${equipmentAssets.length}。`);
  let bytes = 0;
  let materials = 0;
  for (const definition of V032_EQUIPMENT_ASSET_DEFINITIONS) {
    const asset = getCanonicalAsset(definition.assetId);
    if (!asset || asset.release !== 'v0.32') throw new Error(`${definition.assetId}未進入v0.32 Registry。`);
    const buffer = await fs.readFile(path.join(root, 'public', asset.canonicalPath));
    if (buffer.length < 256 || buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${asset.assetId}不是有效GLB。`);
    const json = parseGlbJson(buffer);
    const nodes = new Set((json.nodes || []).map((node) => node.name));
    for (const nodeName of asset.requiredNodes || []) if (!nodes.has(nodeName)) throw new Error(`${asset.assetId}缺少${nodeName}。`);
    if ((json.materials || []).length > 1) throw new Error(`${asset.assetId}優化後仍有${json.materials.length}個材質。`);
    if ((json.images || []).length || (json.textures || []).length) throw new Error(`${asset.assetId}不應內嵌Texture。`);
    bytes += buffer.length;
    materials += (json.materials || []).length;
  }
  return { canonical: CANONICAL_ASSET_COUNT, equipmentAssets: equipmentAssets.length, physicalGlb: 140, bytes, materials };
});

await check('equipment_material_and_atlas_contracts', async () => {
  for (const id of ['equipment-metal-generated', 'equipment-cloth-generated', 'equipment-effect-generated']) {
    if (!MATERIAL_RUNTIME_PROFILES[id]) throw new Error(`Material Profile未註冊：${id}`);
  }
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/textures/atlases/atlas-manifest.json'), 'utf8'));
  const atlasIds = new Set(manifest.atlases.map((atlas) => atlas.atlasId));
  for (const id of ['atlas_equipment_metal', 'atlas_equipment_cloth']) if (!atlasIds.has(id)) throw new Error(`缺少${id}。`);
  const channelPairs = manifest.atlases.reduce((sum, atlas) => sum + atlas.files.length, 0);
  if (manifest.atlases.length < 8 || channelPairs < 34) throw new Error('Runtime Atlas低於v0.32基線。');
  for (const atlas of manifest.atlases.filter((entry) => entry.atlasId.startsWith('atlas_equipment_'))) {
    for (const file of atlas.files) {
      await fs.access(path.join(root, 'public', file.png.path));
      await fs.access(path.join(root, 'public', file.ktx2.path));
    }
  }
  return { release: manifest.release, atlases: manifest.atlases.length, channelPairs };
});

await check('combat_execution_projectile_and_hit_profiles', async () => {
  resetCombatVisualStateForTests();
  let rangedDamage = 0;
  const rangedTarget = fakeEnemy('ranged-target', { x: 0, y: 0, z: 4 }, (damage, options) => {
    rangedDamage += damage;
    if (!options.audioProfileId) throw new Error('投射物命中未傳遞Audio Profile。');
  });
  const releaseRanged = registerEnemy(rangedTarget);
  const rangedProfile = getCombatProfile('wpn_r_01');
  const rangedResult = executeWeaponCombat({
    profile: rangedProfile,
    origin: { x: 0, y: 0, z: 0 },
    yaw: 0,
    lockedApi: rangedTarget,
    damageFactory: () => ({ dmg: 17, crit: false }),
    now: 100,
  });
  if (rangedResult.delivery !== 'projectile' || rangedDamage !== 0 || combatVisualState.deliveries.length !== 1) throw new Error('遠程攻擊未延後至投射物抵達。');
  updateCombatVisualState(5000);
  releaseRanged();
  if (rangedDamage !== 17 || combatVisualState.deliveries.length !== 0 || combatVisualState.impacts.length !== 1) throw new Error('投射物抵達後未同步傷害與Impact GLB。');

  resetCombatVisualStateForTests();
  let meleeDamage = 0;
  const meleeTarget = fakeEnemy('melee-target', { x: 0, y: 0, z: 1 }, (damage) => { meleeDamage += damage; });
  const releaseMelee = registerEnemy(meleeTarget);
  const meleeProfile = getCombatProfile('wpn_m_01');
  const meleeResult = executeWeaponCombat({
    profile: meleeProfile,
    origin: { x: 0, y: 0, z: 0 },
    yaw: 0,
    lockedApi: meleeTarget,
    damageFactory: () => ({ dmg: 13, crit: false }),
    now: 200,
  });
  releaseMelee();
  if (meleeResult.delivery !== 'melee' || meleeResult.immediateHits !== 1 || meleeDamage !== 13) throw new Error('近戰扇形Hit Profile沒有立即結算。');
  return { rangedDelayedDamage: rangedDamage, projectileImpactGlb: true, meleeArcDamage: meleeDamage };
});

await check('equipment_loadout_residency_and_slot_rules', async () => {
  const definitionIds = {
    head: 'arm_leather_head', body: 'arm_leather_body', hands: 'arm_leather_hands', legs: 'arm_leather_legs',
    feet: 'arm_leather_feet', mainHand: 'wpn_m_01', offHand: V032_OFFHAND_DEFINITIONS[0].id, accessory: 'arm_leather_accessory',
  };
  const equipmentInstances = {};
  const equipped = {};
  for (const [slot, definitionId] of Object.entries(definitionIds)) {
    const instance = createEquipmentInstance(definitionId, { instanceId: `test_${slot}` });
    equipmentInstances[instance.instanceId] = instance;
    equipped[slot] = instance.instanceId;
  }
  const residentAssets = getEquipmentLoadoutAssetIds(equipped, equipmentInstances);
  if (residentAssets.length !== MAX_PLAYER_EQUIPMENT_RESIDENT_ASSETS) throw new Error(`八欄滿裝＋Delivery/Impact應${MAX_PLAYER_EQUIPMENT_RESIDENT_ASSETS}個駐留資產，實際${residentAssets.length}。`);
  for (const assetId of residentAssets) if (!getCanonicalAsset(assetId)) throw new Error(`Loadout指向未登錄資產：${assetId}`);

  const twoHand = createEquipmentInstance('wpn_m_03', { instanceId: 'test_two_hand' });
  const inventory = { equipment: [...Object.keys(equipmentInstances), twoHand.instanceId] };
  const locked = validateEquipRequest({
    inventory,
    equipmentInstances: { ...equipmentInstances, [twoHand.instanceId]: twoHand },
    equipped: { ...equipped, mainHand: twoHand.instanceId, offHand: null },
    slot: 'offHand',
    itemId: equipped.offHand,
  });
  if (locked.ok || locked.reason !== 'main-hand-locks-offhand') throw new Error('雙手武器未鎖定副手。');
  return { fullLoadoutAssets: residentAssets.length, mobileLimit: 70, twoHandLock: true, dualVisualMirror: true };
});

await check('equipment_acquisition_and_animation_runtime_wiring', async () => {
  const v032Ids = new Set([...V032_ARMOR_COMPLETION_DEFINITIONS, ...V032_OFFHAND_DEFINITIONS].map((item) => item.id));
  const available = new Set();
  for (let dayIndex = 1; dayIndex <= 12; dayIndex += 1) {
    const stock = getVillageShopStock({ economy: {}, dayIndex, unlockedBlueprints: ['v032'] });
    stock.forEach((item) => { if (v032Ids.has(item.id)) available.add(item.id); });
  }
  if (available.size !== 40) throw new Error(`市場輪替僅能取得${available.size}/40個新增裝備Definition。`);

  const playerAsset = getCanonicalAsset('character:player_child');
  const playerGlb = parseGlbJson(await fs.readFile(path.join(root, 'public', playerAsset.canonicalPath)));
  const clips = new Set((playerGlb.animations || []).map((animation) => animation.name));
  for (const clip of PLAYER_COMBAT_ANIMATION_CLIPS) if (!clips.has(clip)) throw new Error(`玩家GLB缺少${clip}。`);

  const sourceFiles = [
    'src/components/3D/Player.jsx',
    'src/components/3D/CombatFX.jsx',
    'src/components/3D/EquipmentAttachmentLayer.jsx',
    'src/components/Entities/Monsters.jsx',
    'src/audio/sfx.js',
  ];
  const sources = (await Promise.all(sourceFiles.map((file) => fs.readFile(path.join(root, file), 'utf8')))).join('\n');
  for (const token of ['executeWeaponCombat', 'combatVisualState.deliveries', 'offHandRef', 'weaponImpact', 'weaponAttack']) {
    if (!sources.includes(token)) throw new Error(`Runtime來源未接線：${token}`);
  }
  return { shopDefinitions: available.size, playerCombatClips: PLAYER_COMBAT_ANIMATION_CLIPS.length, sourceContracts: sourceFiles.length };
});

const report = { generatedAt: new Date().toISOString(), version: '0.32.0-equipment-combat', ok: errors.length === 0, caseCount: cases.length, cases, errors };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function check(id, run) {
  try { cases.push({ id, status: 'PASSED', result: await run() }); }
  catch (error) { const message = error?.message || String(error); errors.push(`${id}: ${message}`); cases.push({ id, status: 'FAILED', error: message }); }
}

function countBy(items, key) {
  return items.reduce((result, item) => ({ ...result, [item[key]]: (result[item[key]] || 0) + 1 }), {});
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

function fakeEnemy(id, position, onTakeHit) {
  return {
    id,
    alive: () => true,
    getPos: () => ({ ...position }),
    takeHit: onTakeHit,
  };
}

export { root };
