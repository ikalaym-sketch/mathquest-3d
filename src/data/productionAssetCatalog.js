import { PLAYER_COMBAT_ANIMATION_CLIPS } from './combatArchetypes.js';
// v0.29.1 單一 Canonical GLB Registry。
// 所有 Runtime 僅以 assetId 尋址；Registry 只保存相對 canonicalPath，不保存部署 URL。
import { REGION_STRUCTURE_CATALOG } from './physicalObjectCatalog.js';
import { REGION_ENCOUNTERS } from './regionEncounters.js';
import { REGION_ENVIRONMENT_ASSETS } from './regionEnvironmentAssetCatalog.js';
import { COMPANION_PROFILES } from './companionProfiles.js';
import { getAssetDisposition } from './assetDispositionContract.js';
import { VILLAGE_ASSET_DEFINITIONS } from './villageAssetCatalog.js';
import { FARM_EXPANSION_ASSET_DEFINITIONS } from './farmExpansionAssetCatalog.js';
import {
  CHARACTER_LIFE_ANIMATION_CLIPS,
  V031_CHARACTER_ASSET_DEFINITIONS,
  V031_COMPANION_MODULE_DEFINITIONS,
} from './characterCompanionV031Catalog.js';
import { V032_EQUIPMENT_ASSET_DEFINITIONS } from './equipmentCombatV032Catalog.js';
import { V033_REGION_CREATURE_ASSET_DEFINITIONS } from './regionCreatureV033Catalog.js';
import { V034_INTERIOR_TOWER_ASSET_DEFINITIONS } from './interiorTowerV034Catalog.js';
import { V035_EVENT_EFFECT_ASSET_DEFINITIONS } from './eventEffectV035Catalog.js';

const REGION_MATERIAL_PROFILE_BY_ID = Object.freeze({
  wind_highlands: 'wind-grass-generated',
  snow_valley: 'snow-generated',
  farm_plains: 'farm-wet-generated',
  star_village: 'village-generated',
  crystal_lake: 'crystal-generated',
  sun_canyon: 'canyon-generated',
  mushroom_grove: 'mushroom-generated',
  clockwork_ruins: 'clockwork-generated',
});

function resolveEnvironmentMaterialProfile(asset) {
  if (asset.id === 'water_lily') return 'water-generated';
  if (asset.id === 'steam_pipe_cluster') return 'clockwork-steam-generated';
  return REGION_MATERIAL_PROFILE_BY_ID[asset.regionId] || 'terrain-generated';
}

const defineAsset = (assetId, category, canonicalPath, contract = {}) => Object.freeze({
  assetId,
  category,
  canonicalPath: canonicalPath.replace(/^\/+/, ''),
  tier: contract.tier || 'gameplay',
  materialProfile: contract.materialProfile || 'vertex-color-foundation',
  lodProfile: contract.lodProfile || null,
  fallbackType: contract.fallbackType || null,
  ...contract,
  // artStatus 必須由逐筆處置契約決定，禁止呼叫端以類別預設覆蓋。
  artStatus: contract.artStatus === 'new' ? 'new' : getAssetDisposition(assetId),
});

export const CHARACTER_ASSETS = Object.freeze({
  player_child: defineAsset('character:player_child', 'character', 'models/characters/player_child.glb', {
    tier: 'hero', artStatus: 'replace',
    requiredClips: ['Idle', 'Walk', 'Run', 'Attack', 'Interact', 'Hurt', 'Defeat', ...PLAYER_COMBAT_ANIMATION_CLIPS],
    requiredNodes: ['SOCKET_head', 'SOCKET_body', 'SOCKET_hands', 'SOCKET_legs', 'SOCKET_feet', 'SOCKET_main_hand', 'SOCKET_off_hand', 'SOCKET_back', 'SOCKET_waist', 'SOCKET_face', 'SOCKET_hair', 'SOCKET_accessory', 'SOCKET_aura', 'SOCKET_costume_override', 'SOCKET_interaction_origin'],
    fallbackProfileId: 'player_child',
  }),
  npc_adult: defineAsset('character:npc_adult', 'character', 'models/characters/npc_adult.glb', {
    tier: 'hero', artStatus: 'replace', requiredClips: CHARACTER_LIFE_ANIMATION_CLIPS,
    requiredNodes: ['SOCKET_face', 'SOCKET_hair', 'SOCKET_accessory', 'SOCKET_work_tool', 'SOCKET_dialogue', 'SOCKET_interaction_origin'],
    fallbackProfileId: 'npc_adult',
  }),
  npc_child: defineAsset('character:npc_child', 'character', 'models/characters/npc_child.glb', {
    tier: 'hero', artStatus: 'replace', requiredClips: CHARACTER_LIFE_ANIMATION_CLIPS,
    requiredNodes: ['SOCKET_face', 'SOCKET_hair', 'SOCKET_accessory', 'SOCKET_work_tool', 'SOCKET_dialogue', 'SOCKET_interaction_origin'],
    fallbackProfileId: 'npc_child',
  }),
});

export const STRUCTURE_ASSETS = Object.freeze(Object.fromEntries(Object.keys(REGION_STRUCTURE_CATALOG).map((type) => [type,
  defineAsset(`structure:${type}`, 'region-structure', `models/regions/structures/${type}.glb`, {
    tier: 'hero', artStatus: 'rework', fallbackPrefabType: type,
  }),
])));

export const BRIDGE_ASSET = defineAsset('structure:canonical_bridge', 'bridge', 'models/regions/structures/canonical_bridge.glb', {
  tier: 'gameplay', artStatus: 'replace', fallbackType: 'canonical_bridge',
});

export const ENCOUNTER_ASSETS = Object.freeze(Object.fromEntries(Object.entries(REGION_ENCOUNTERS).flatMap(([regionId, encounter]) => [
  ...encounter.normal.map((def) => [def.id, defineAsset(def.modelAssetId || `encounter:${def.id}`, 'monster', `models/regions/monsters/${def.id}.glb`, {
    regionId, tier: 'gameplay', encounterTier: 'normal', artStatus: 'replace', clips: ['Idle', 'Move', 'Attack', 'Hurt', 'Defeat'],
  })]),
  [encounter.elite.id, defineAsset(encounter.elite.modelAssetId || `encounter:${encounter.elite.id}`, 'elite', `models/regions/elites/${encounter.elite.id}.glb`, {
    regionId, tier: 'hero', encounterTier: 'elite', artStatus: 'replace', clips: ['Idle', 'Move', 'Attack', 'Hurt', 'Defeat'],
  })],
  [encounter.boss.id, defineAsset(encounter.boss.modelAssetId || `encounter:${encounter.boss.id}`, 'boss', `models/regions/bosses/${encounter.boss.id}.glb`, {
    regionId, tier: 'hero', encounterTier: 'boss', artStatus: 'replace', clips: ['Idle', 'Move', 'Attack', 'Hurt', 'Defeat'],
  })],
])));

export const ENVIRONMENT_ASSETS = Object.freeze(Object.fromEntries(Object.entries(REGION_ENVIRONMENT_ASSETS).map(([id, asset]) => [id,
  defineAsset(asset.assetId || `region-environment:${id}`, 'region-environment', `models/regions/environment/${asset.regionId}/${id}.glb`, {
    ...asset,
    tier: 'modular',
    artStatus: 'rework',
    lodProfile: 'environment-standard',
    materialProfile: resolveEnvironmentMaterialProfile(asset),
  }),
])));

export const COMPANION_ASSETS = Object.freeze(Object.fromEntries(Object.values(COMPANION_PROFILES).map((profile) => {
  const speciesKey = profile.modelAssetId?.split(':').pop() || profile.id.replace('companion_', '');
  return [profile.id, defineAsset(profile.modelAssetId || `companion:${speciesKey}`, 'companion', `models/companions/${speciesKey}.glb`, {
    tier: 'hero', artStatus: 'replace',
    requiredClips: ['Idle', 'Walk', 'Happy', 'Skill', 'Sleep', 'Swim', 'Find', 'Greet'],
    requiredNodes: ['COLLIDER_Main', 'SOCKET_Interaction', 'SOCKET_Home', 'SOCKET_Skill', 'SOCKET_Find', 'SOCKET_Accessory'],
  })];
})));

// v0.31新增角色與夥伴模組。定義來源只能是characterCompanionV031Catalog，
// Registry僅保留Runtime需要的契約欄位，不把程序幾何Recipe複製進遊戲Bundle。
export const V031_CHARACTER_ASSETS = Object.freeze(Object.fromEntries(V031_CHARACTER_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, 'character', definition.canonicalPath, {
    tier: definition.tier,
    artStatus: 'new',
    materialProfile: definition.materialProfile,
    lodProfile: definition.lod?.profileId || null,
    requiredNodes: definition.requiredNodes,
    requiredClips: definition.requiredClips || [],
    assetFamily: definition.family,
    ownerId: definition.ownerId || null,
    moduleType: definition.moduleType || null,
    socketName: definition.socketName || null,
    release: 'v0.31',
  }),
])));

export const V031_COMPANION_ASSETS = Object.freeze(Object.fromEntries(V031_COMPANION_MODULE_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, 'companion', definition.canonicalPath, {
    tier: definition.tier,
    artStatus: 'new',
    materialProfile: definition.materialProfile,
    lodProfile: definition.lod?.profileId || null,
    requiredNodes: definition.requiredNodes,
    assetFamily: definition.family,
    ownerId: definition.ownerId,
    moduleType: definition.moduleType,
    release: 'v0.31',
  }),
])));

// v0.32裝備與戰鬥資產。Recipe幾何留在生產Catalog，Registry只保留Runtime契約。
export const V032_EQUIPMENT_ASSETS = Object.freeze(Object.fromEntries(V032_EQUIPMENT_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, 'equipment', definition.canonicalPath, {
    tier: definition.tier,
    artStatus: 'new',
    materialProfile: definition.materialProfile,
    lodProfile: definition.lod?.profileId || null,
    requiredNodes: definition.requiredNodes,
    assetFamily: definition.family,
    purpose: definition.purpose,
    runtimeRole: definition.runtimeRole,
    ownerId: definition.ownerId,
    slot: definition.slot || null,
    release: 'v0.32',
  }),
])));

// v0.33 森林、八區結構／環境與區域生物資產。
export const V033_REGION_CREATURE_ASSETS = Object.freeze(Object.fromEntries(V033_REGION_CREATURE_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, definition.category, definition.canonicalPath, {
    tier: definition.tier,
    artStatus: 'new',
    materialProfile: definition.materialProfile,
    lodProfile: definition.lod?.profileId || null,
    requiredNodes: definition.requiredNodes,
    requiredClips: definition.requiredClips || [],
    assetFamily: definition.family,
    purpose: definition.purpose,
    runtimeRole: definition.runtimeRole,
    regionId: definition.regionId || null,
    subareaId: definition.subareaId || null,
    role: definition.role,
    release: 'v0.33',
  }),
])));

// v0.34 室內 Modular Kit 與試煉塔組合模組。
export const V034_INTERIOR_TOWER_ASSETS = Object.freeze(Object.fromEntries(V034_INTERIOR_TOWER_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, definition.category, definition.canonicalPath, {
    tier: definition.tier,
    artStatus: 'new',
    materialProfile: definition.materialProfile,
    lodProfile: definition.lod?.profileId || null,
    requiredNodes: definition.requiredNodes,
    requiredClips: definition.requiredClips || [],
    assetFamily: definition.family,
    purpose: definition.purpose,
    runtimeRole: definition.runtimeRole,
    regionId: definition.regionId || null,
    roomId: definition.roomId || null,
    structureType: definition.structureType || null,
    themeId: definition.themeId || null,
    role: definition.role || null,
    supportId: definition.supportId || null,
    mechanism: definition.mechanism || null,
    release: 'v0.34',
  }),
])));

// v0.35 節慶、關係、生態、傳送門、機關與十二戰鬥Archetype VFX。
export const V035_EVENT_EFFECT_ASSETS = Object.freeze(Object.fromEntries(V035_EVENT_EFFECT_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, definition.category, definition.canonicalPath, {
    tier: definition.tier,
    artStatus: 'new',
    materialProfile: definition.materialProfile,
    lodProfile: definition.lod?.profileId || null,
    requiredNodes: definition.requiredNodes,
    requiredClips: definition.requiredClips || [],
    assetFamily: definition.family,
    purpose: definition.purpose,
    runtimeRole: definition.runtimeRole,
    seasonId: definition.seasonId || null,
    npcId: definition.npcId || null,
    regionId: definition.regionId || null,
    sceneId: definition.sceneId || null,
    portalType: definition.portalType || null,
    mechanismType: definition.mechanismType || null,
    baseArchetype: definition.baseArchetype || null,
    vfxProfileId: definition.vfxProfileId || null,
    role: definition.role || null,
    release: 'v0.35',
  }),
])));

const FARM_PATHS = Object.freeze({
  farmhouse: 'models/farm/farmhouse.glb', barn: 'models/farm/barn.glb', windmill: 'models/farm/windmill.glb', water_tower: 'models/farm/water_tower.glb',
  farmer: 'models/farm/farmer.glb', cow: 'models/farm/cow.glb', sheep: 'models/farm/sheep.glb', chicken: 'models/farm/chicken.glb',
  fruit_tree: 'models/farm/fruit_tree.glb', hay_bale: 'models/farm/hay_bale.glb', mailbox: 'models/farm/mailbox.glb', bridge: 'models/farm/bridge.glb',
});
export const FARM_ASSETS = Object.freeze(Object.fromEntries(Object.entries(FARM_PATHS).map(([id, canonicalPath]) => [id,
  defineAsset(`farm:${id}`, 'farm', canonicalPath, {
    tier: ['farmhouse', 'barn', 'windmill', 'water_tower'].includes(id) ? 'hero' : 'gameplay',
    artStatus: ['hay_bale', 'mailbox'].includes(id) ? 'rework' : 'replace',
    fallbackType: id,
  }),
])));

const FOREST_PATHS = Object.freeze({
  great_tree: 'models/forest/great_tree.glb', waterfall_cliff: 'models/forest/waterfall_cliff.glb', ancient_gate: 'models/forest/ancient_gate.glb',
  mossy_shrine: 'models/forest/mossy_shrine.glb', forest_bridge: 'models/forest/forest_bridge.glb', lantern_post: 'models/forest/lantern_post.glb',
  fern_cluster: 'models/forest/fern_cluster.glb', mushroom_cluster: 'models/forest/mushroom_cluster.glb', vine_arch: 'models/forest/vine_arch.glb',
  stone_totem: 'models/forest/stone_totem.glb', treasure_altar: 'models/forest/treasure_altar.glb', leaf_slime: 'models/forest/leaf_slime.glb',
  twig_goblin: 'models/forest/twig_goblin.glb', blossom_trap: 'models/forest/blossom_trap.glb', forest_guardian: 'models/forest/forest_guardian.glb',
});
export const FOREST_ASSETS = Object.freeze(Object.fromEntries(Object.entries(FOREST_PATHS).map(([id, canonicalPath]) => [id,
  defineAsset(`forest:${id}`, 'forest', canonicalPath, {
    tier: ['great_tree', 'waterfall_cliff', 'ancient_gate', 'mossy_shrine', 'forest_guardian'].includes(id) ? 'hero' : 'gameplay',
    artStatus: ['treasure_altar'].includes(id) ? 'rework' : 'replace',
    fallbackType: id,
  }),
])));

// v0.30 星光村與農莊擴充資產。所有新資產以 new 狀態進入 Canonical Registry。
export const VILLAGE_ASSETS = Object.freeze(Object.fromEntries(VILLAGE_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, 'village', definition.canonicalPath, { ...definition, artStatus: 'new', fallbackType: definition.family }),
])));

export const FARM_EXPANSION_ASSETS = Object.freeze(Object.fromEntries(FARM_EXPANSION_ASSET_DEFINITIONS.map((definition) => [definition.id,
  defineAsset(definition.assetId, 'farm', definition.canonicalPath, { ...definition, artStatus: 'new', fallbackType: definition.family }),
])));

export const CANONICAL_ASSET_REGISTRY = Object.freeze(Object.fromEntries([
  ...Object.values(CHARACTER_ASSETS),
  ...Object.values(STRUCTURE_ASSETS),
  BRIDGE_ASSET,
  ...Object.values(ENCOUNTER_ASSETS),
  ...Object.values(ENVIRONMENT_ASSETS),
  ...Object.values(COMPANION_ASSETS),
  ...Object.values(V031_CHARACTER_ASSETS),
  ...Object.values(V031_COMPANION_ASSETS),
  ...Object.values(V032_EQUIPMENT_ASSETS),
  ...Object.values(V033_REGION_CREATURE_ASSETS),
  ...Object.values(V034_INTERIOR_TOWER_ASSETS),
  ...Object.values(V035_EVENT_EFFECT_ASSETS),
  ...Object.values(FARM_ASSETS),
  ...Object.values(FOREST_ASSETS),
  ...Object.values(VILLAGE_ASSETS),
  ...Object.values(FARM_EXPANSION_ASSETS),
].map((asset) => [asset.assetId, asset])));

export const CANONICAL_ASSET_COUNT = Object.keys(CANONICAL_ASSET_REGISTRY).length;

export const PRODUCTION_ASSET_CATALOG = Object.freeze({
  characters: CHARACTER_ASSETS,
  structures: STRUCTURE_ASSETS,
  bridge: BRIDGE_ASSET,
  encounters: ENCOUNTER_ASSETS,
  environment: ENVIRONMENT_ASSETS,
  companions: COMPANION_ASSETS,
  characterV031: V031_CHARACTER_ASSETS,
  companionV031: V031_COMPANION_ASSETS,
  equipmentV032: V032_EQUIPMENT_ASSETS,
  regionCreatureV033: V033_REGION_CREATURE_ASSETS,
  interiorTowerV034: V034_INTERIOR_TOWER_ASSETS,
  eventEffectV035: V035_EVENT_EFFECT_ASSETS,
  farm: FARM_ASSETS,
  forest: FOREST_ASSETS,
  village: VILLAGE_ASSETS,
  farmExpansion: FARM_EXPANSION_ASSETS,
});

export function getCanonicalAsset(assetId) {
  return CANONICAL_ASSET_REGISTRY[assetId] || null;
}

export function getAssetsByCategory(category) {
  return Object.values(CANONICAL_ASSET_REGISTRY).filter((asset) => asset.category === category);
}
