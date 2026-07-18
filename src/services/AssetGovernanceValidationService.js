// v0.35 資產治理契約驗證器。
// Registry、800 GLB 藍圖、既有 134 筆處置、裝備／動畫 Schema、Atlas／Shader 及材質 Profile 必須同時成立。
import { CANONICAL_ASSET_COUNT, CANONICAL_ASSET_REGISTRY, CHARACTER_ASSETS } from '../data/productionAssetCatalog.js';
import {
  CANONICAL_GLB_TARGET,
  GLB_TARGET_DISTRIBUTION,
  MATERIAL_LIMIT_BY_TIER,
  SHADER_PROFILE_IDS,
  TEXTURE_ATLAS_PROFILES,
  getTargetGlbTotal,
} from '../data/artGovernanceProfiles.js';
import { APPEARANCE_SLOT_IDS, EQUIPMENT_SLOT_IDS } from '../data/equipmentSchema.js';
import { ASSET_DISPOSITION_TARGETS, summarizeAssetDisposition } from '../data/assetDispositionContract.js';
import { BASE_COMBAT_ARCHETYPE_IDS, BASE_COMBAT_ARCHETYPES } from '../data/combatArchetypes.js';
import { WEAPONS_MELEE } from '../data/weaponsMelee.js';
import { WEAPONS_RANGED } from '../data/weaponsRanged.js';
import { PLAYER_EQUIPMENT_SOCKET_IDS } from '../data/characterPhysicalProfiles.js';
import { MATERIAL_RUNTIME_PROFILES } from './MaterialProfileService.js';
import { createInitialEquipmentState, migrateEquipmentState } from './EquipmentInstanceService.js';
import { resolveCharacterAnimationState } from './AnimationStateService.js';

export function validateAssetGovernanceContracts() {
  const errors = [];
  const warnings = [];
  const assets = Object.values(CANONICAL_ASSET_REGISTRY);
  const paths = new Set();

  if (CANONICAL_ASSET_COUNT !== 800) errors.push(`v0.35 應有 800 個 Canonical GLB，實際 ${CANONICAL_ASSET_COUNT}。`);
  if (getTargetGlbTotal() !== CANONICAL_GLB_TARGET) errors.push(`800 GLB 分配加總錯誤：${getTargetGlbTotal()}。`);
  if (Object.keys(GLB_TARGET_DISTRIBUTION).length !== 12) errors.push('800 GLB 分配類別必須固定為 12 類。');
  if (EQUIPMENT_SLOT_IDS.length !== 8) errors.push(`正式穿戴欄應為 8，實際 ${EQUIPMENT_SLOT_IDS.length}。`);
  if (APPEARANCE_SLOT_IDS.length !== 6) errors.push(`外觀覆蓋欄應為 6，實際 ${APPEARANCE_SLOT_IDS.length}。`);
  if (Object.keys(TEXTURE_ATLAS_PROFILES).length !== 16) errors.push(`Texture Atlas Profile 必須為 16 組，實際 ${Object.keys(TEXTURE_ATLAS_PROFILES).length}。`);
  if (SHADER_PROFILE_IDS.length !== 14) errors.push(`Shader Library Profile 必須為 14 種，實際 ${SHADER_PROFILE_IDS.length}。`);
  if (BASE_COMBAT_ARCHETYPE_IDS.length !== 12) errors.push(`基礎戰鬥 Archetype 必須為 12 種，實際 ${BASE_COMBAT_ARCHETYPE_IDS.length}。`);

  const legacyAssets = assets.filter((asset) => asset.artStatus !== 'new');
  const disposition = summarizeAssetDisposition(legacyAssets.map((asset) => asset.assetId));
  for (const [status, expected] of Object.entries(ASSET_DISPOSITION_TARGETS)) {
    if (disposition[status] !== expected) errors.push(`既有資產處置 ${status} 應為 ${expected}，實際 ${disposition[status]}。`);
  }

  const categoryCounts = Object.groupBy
    ? Object.fromEntries(Object.entries(Object.groupBy(assets, (asset) => asset.category)).map(([category, entries]) => [category, entries.length]))
    : assets.reduce((output, asset) => ({ ...output, [asset.category]: (output[asset.category] || 0) + 1 }), {});
  if (categoryCounts.character !== GLB_TARGET_DISTRIBUTION.characters.target) errors.push(`角色GLB應為80，實際${categoryCounts.character || 0}。`);
  if (categoryCounts.companion !== GLB_TARGET_DISTRIBUTION.companions.target) errors.push(`夥伴GLB應為32，實際${categoryCounts.companion || 0}。`);
  if (categoryCounts.equipment !== GLB_TARGET_DISTRIBUTION.equipment.target) errors.push(`裝備GLB應為140，實際${categoryCounts.equipment || 0}。`);
  if (categoryCounts.forest !== GLB_TARGET_DISTRIBUTION.forest.target) errors.push(`森林GLB應為45，實際${categoryCounts.forest || 0}。`);
  const regionCount = (categoryCounts['region-structure'] || 0) + (categoryCounts.bridge || 0) + (categoryCounts['region-environment'] || 0);
  if (regionCount !== GLB_TARGET_DISTRIBUTION.regions.target) errors.push(`區域結構／環境GLB應為120，實際${regionCount}。`);
  const creatureCount = (categoryCounts.monster || 0) + (categoryCounts.elite || 0) + (categoryCounts.boss || 0) + (categoryCounts.creature || 0);
  if (creatureCount !== GLB_TARGET_DISTRIBUTION.creatures.target) errors.push(`生物／怪物GLB應為72，實際${creatureCount}。`);
  if (categoryCounts.interior !== GLB_TARGET_DISTRIBUTION.interiors.target) errors.push(`室內GLB應為60，實際${categoryCounts.interior || 0}。`);
  if (categoryCounts['trial-tower'] !== GLB_TARGET_DISTRIBUTION.tower.target) errors.push(`試煉塔GLB應為36，實際${categoryCounts['trial-tower'] || 0}。`);
  if (categoryCounts.event !== GLB_TARGET_DISTRIBUTION.events.target) errors.push(`事件／生態GLB應為35，實際${categoryCounts.event || 0}。`);
  if (categoryCounts.effect !== GLB_TARGET_DISTRIBUTION.effects.target) errors.push(`傳送門／機關／VFX GLB應為20，實際${categoryCounts.effect || 0}。`);

  for (const asset of assets) {
    if (!asset.assetId || !asset.category || !asset.canonicalPath) errors.push(`Registry 資產缺少必要欄位：${asset.assetId || asset.canonicalPath || 'unknown'}。`);
    if (Object.prototype.hasOwnProperty.call(asset, 'url')) errors.push(`${asset.assetId}: Registry 禁止保存部署 URL。`);
    if (!asset.canonicalPath.endsWith('.glb')) errors.push(`${asset.assetId}: canonicalPath 不是 GLB。`);
    if (asset.canonicalPath.startsWith('/')) errors.push(`${asset.assetId}: canonicalPath 不得以 / 開頭。`);
    if (paths.has(asset.canonicalPath)) errors.push(`重複 Canonical path：${asset.canonicalPath}。`);
    paths.add(asset.canonicalPath);
    if (!['keep', 'rework', 'replace', 'new', 'fallback-only', 'retire'].includes(asset.artStatus)) errors.push(`${asset.assetId}: artStatus 無效。`);
    if (!MATERIAL_LIMIT_BY_TIER[asset.tier]) warnings.push(`${asset.assetId}: tier ${asset.tier} 尚未配置 Material 上限。`);
    if (!MATERIAL_RUNTIME_PROFILES[asset.materialProfile]) errors.push(`${asset.assetId}: Material Profile ${asset.materialProfile} 未註冊。`);
  }

  validatePlayerSocketContract(errors);
  validateCombatArchetypes(errors);
  validateAnimationContract(errors);
  validateEquipmentMigration(errors);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      canonicalAssets: CANONICAL_ASSET_COUNT,
      targetAssets: CANONICAL_GLB_TARGET,
      plannedNetNewAssets: CANONICAL_GLB_TARGET - CANONICAL_ASSET_COUNT,
      disposition,
      newAssets: assets.filter((asset) => asset.artStatus === 'new').length,
      equipmentSlots: EQUIPMENT_SLOT_IDS.length,
      appearanceSlots: APPEARANCE_SLOT_IDS.length,
      playerSockets: PLAYER_EQUIPMENT_SOCKET_IDS.length,
      combatArchetypes: BASE_COMBAT_ARCHETYPE_IDS.length,
      atlasProfiles: Object.keys(TEXTURE_ATLAS_PROFILES).length,
      shaderProfiles: SHADER_PROFILE_IDS.length,
      materialProfiles: Object.keys(MATERIAL_RUNTIME_PROFILES).length,
    },
  };
}

function validatePlayerSocketContract(errors) {
  const requiredNodes = new Set(CHARACTER_ASSETS.player_child.requiredNodes || []);
  for (const socketId of PLAYER_EQUIPMENT_SOCKET_IDS) {
    const nodeName = `SOCKET_${socketId}`;
    if (!requiredNodes.has(nodeName)) errors.push(`玩家 GLB 契約缺少 ${nodeName}。`);
  }
}

function validateCombatArchetypes(errors) {
  const weapons = [...WEAPONS_MELEE, ...WEAPONS_RANGED];
  const usedBaseArchetypes = new Set();
  for (const weapon of weapons) {
    if (!BASE_COMBAT_ARCHETYPES[weapon.baseArchetype]) errors.push(`${weapon.id}: baseArchetype ${weapon.baseArchetype} 未註冊。`);
    if (!weapon.animationSet) errors.push(`${weapon.id}: 缺少 animationSet。`);
    if (!weapon.attackContract?.deliveryMode) errors.push(`${weapon.id}: 缺少 attackContract。`);
    for (const key of ['deliveryAssetId', 'impactAssetId', 'hitProfileId', 'projectileProfileId', 'vfxProfileId', 'audioProfileId', 'cooldownProfileId']) {
      if (!weapon[key]) errors.push(`${weapon.id}: 缺少 ${key}。`);
    }
    if (!weapon.attackContract?.execution?.shape) errors.push(`${weapon.id}: 缺少可執行 Hit Profile。`);
    usedBaseArchetypes.add(weapon.baseArchetype);
  }
  for (const archetypeId of BASE_COMBAT_ARCHETYPE_IDS) {
    if (!usedBaseArchetypes.has(archetypeId)) errors.push(`基礎戰鬥 Archetype ${archetypeId} 沒有任何正式武器映射。`);
  }
}

function validateAnimationContract(errors) {
  const spear = WEAPONS_MELEE.find((weapon) => weapon.baseArchetype === 'polearm');
  const state = resolveCharacterAnimationState({ locomotionState: 'walk', actionState: 'Attack', comboIndex: 2 }, spear);
  if (state.requestedClip !== 'Polearm_Attack02') errors.push(`長槍 Combo 2 應要求 Polearm_Attack02，實際 ${state.requestedClip}。`);
  if (!state.clipCandidates.includes('Attack') || !state.clipCandidates.includes('Walk')) errors.push('動畫候選清單缺少 Generic Attack 或 locomotion fallback。');
  const farmState = resolveCharacterAnimationState({ locomotionState: 'idle', actionState: 'Interact', toolAction: 'hoe' }, spear);
  if (farmState.requestedClip !== 'Hoe') errors.push(`農具 Hoe 應要求 Hoe Clip，實際 ${farmState.requestedClip}。`);
}

function validateEquipmentMigration(errors) {
  const initial = createInitialEquipmentState();
  const instanceIds = initial.inventoryEquipment;
  if (new Set(instanceIds).size !== instanceIds.length) errors.push('初始裝備 instanceId 發生重複。');
  if (!initial.equipped.mainHand || initial.equipped.weapon) errors.push('初始裝備未使用 mainHand，或仍殘留 weapon 欄。');
  if (Object.prototype.hasOwnProperty.call(initial.equipped, 'pet')) errors.push('正式 equipped 仍含 pet 欄。');

  const migrated = migrateEquipmentState({
    inventory: { weapons: ['wpn_m_01', 'wpn_m_01'], armors: ['arm_leather_body'] },
    equipped: { weapon: 'wpn_m_01', body: 'arm_leather_body', pet: 'pet_01' },
    equipmentLevels: { wpn_m_01: true },
    weaponAffixes: { wpn_m_01: [{ type: 'atk', label: 'ATK', value: 0.2 }] },
  });
  const swords = migrated.inventory.equipment.map((id) => migrated.equipmentInstances[id]).filter((instance) => instance.definitionId === 'wpn_m_01');
  if (swords.length !== 2) errors.push(`舊存檔兩把同款武器遷移後應保留 2 件，實際 ${swords.length}。`);
  if (!migrated.equipped.mainHand || migrated.equipped.pet) errors.push('舊 weapon／pet 欄位遷移失敗。');
  if (!swords.every((instance) => instance.level === 5 && instance.affixes.length === 1)) errors.push('舊裝備等級或詞綴未寫入實例。');
}
