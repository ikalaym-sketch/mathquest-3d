// v0.31 Characters & Companions 唯一資產定義。
// 本檔只描述可重建的Recipe與Runtime映射；實際GLB仍必須經Canonical Pipeline、Exporter與Validator輸出。
import { VILLAGE_RESIDENT_IDS } from './villageResidentProfiles.js';
import { COMPANION_PROFILES } from './companionProfiles.js';

export const CHARACTER_LIFE_ANIMATION_CLIPS = Object.freeze([
  'Idle', 'Walk', 'Run', 'Interact', 'Talk', 'Work', 'Celebrate', 'Gift', 'Sit', 'Sleep', 'Hurt', 'Defeat',
]);

const HUMANOID_REQUIRED_NODES = Object.freeze([
  'ActorRoot', 'RigRoot', 'Pelvis', 'Spine', 'Head',
  'SOCKET_face', 'SOCKET_hair', 'SOCKET_accessory', 'SOCKET_work_tool', 'SOCKET_dialogue', 'SOCKET_interaction_origin',
]);

export const HUMANOID_BODY_VARIANT_DEFINITIONS = Object.freeze([
  body('adult_slim', 'npc_adult', [0.9, 1.03, 0.92], '修長成人'),
  body('adult_sturdy', 'npc_adult', [1.12, 1.01, 1.08], '結實成人'),
  body('elder_slim', 'npc_adult', [0.94, 0.96, 0.96], '修長長者'),
  body('elder_sturdy', 'npc_adult', [1.08, 0.94, 1.08], '穩重長者'),
  body('teen', 'npc_child', [0.82, 0.84, 0.82], '少年體型'),
]);

const RESIDENT_BODY_VARIANT_BY_ID = Object.freeze({
  chief: 'elder_slim',
  merchant: 'adult_slim',
  blacksmith: 'adult_sturdy',
  carpenter: 'adult_slim',
  child_01: 'teen',
  child_02: 'teen',
  traveler_01: 'elder_sturdy',
  resident_01: 'adult_sturdy',
  resident_02: 'adult_slim',
  vendor_helper: 'teen',
});

const RESIDENT_PALETTES = Object.freeze([
  ['#f0caa7', '#d8c38e', '#70534a', '#7b6eb2'], ['#dca77f', '#e7c16f', '#6d4032', '#4f8ba1'],
  ['#b97855', '#c6ccd5', '#303942', '#7a4f3a'], ['#edc39d', '#e0ad63', '#754c32', '#4e8c68'],
  ['#f1cbaa', '#f1d079', '#6e4838', '#72a865'], ['#d9a77e', '#e8b75c', '#2f405d', '#d36956'],
  ['#b97d58', '#91b6d7', '#57443b', '#7b688e'], ['#f2c9a5', '#dda064', '#80513d', '#c56d68'],
  ['#84543d', '#8bc27b', '#4b3028', '#67a6a1'], ['#d9a77e', '#9ec5df', '#3b465a', '#c49a58'],
]);

export const V031_RESIDENT_MODULE_DEFINITIONS = Object.freeze(VILLAGE_RESIDENT_IDS.flatMap((residentId, index) => {
  const [skin, accent, hair, outfit] = RESIDENT_PALETTES[index % RESIDENT_PALETTES.length];
  return [
    moduleAsset('resident', residentId, 'face', index, skin, accent, 'residents-generated', 'SOCKET_face'),
    moduleAsset('resident', residentId, 'hair', index, hair, accent, 'residents-generated', 'SOCKET_hair'),
    moduleAsset('resident', residentId, 'outfit', index, outfit, accent, 'residents-generated', 'SOCKET_costume_override'),
    moduleAsset('resident', residentId, 'role', index, accent, outfit, 'residents-generated', 'SOCKET_work_tool'),
  ];
}));

export const PLAYER_HAIR_OPTIONS = Object.freeze([
  option('short', '短髮', '🧑'), option('bob', '圓短髮', '👩'), option('spiky', '星芒髮', '🧑‍🎤'), option('twin', '雙束髮', '👧'),
  option('braid', '編辮髮', '🪢'), option('ponytail', '高馬尾', '🎀'), option('wavy', '波浪髮', '🌊'), option('bun', '星團髮', '🟣'),
  option('mohawk', '勇氣冠', '🔥'), option('curly', '捲雲髮', '☁️'), option('sideTail', '側束髮', '✨'), option('capCut', '探險帽髮', '🧢'),
]);

export const PLAYER_FACE_OPTIONS = Object.freeze([
  option('smile', '開朗', '😊'), option('brave', '勇敢', '😄'), option('calm', '沉穩', '🙂'), option('curious', '好奇', '🤩'),
  option('focused', '專注', '🧐'), option('joyful', '雀躍', '😆'), option('kind', '溫柔', '☺️'), option('determined', '堅定', '😤'),
]);

export const PLAYER_OUTFIT_OPTIONS = Object.freeze([
  option('adventurer', '冒險裝', '🧭'), option('scholar', '學習裝', '📘'), option('scout', '斥候裝', '🌿'), option('gardener', '園藝裝', '🌱'),
  option('craftsperson', '工匠裝', '🛠️'), option('explorer', '遠行裝', '🎒'), option('stargazer', '觀星裝', '🔭'), option('festival', '慶典裝', '🎉'),
]);

export const PLAYER_ACCESSORY_OPTIONS = Object.freeze([
  option('none', '無', '✨'), option('starPin', '星星髮夾', '⭐'), option('leafPin', '葉片髮夾', '🍃'),
  option('glasses', '圓框眼鏡', '👓'), option('scarf', '旅途領巾', '🧣'),
]);

const PLAYER_APPEARANCE_GROUPS = Object.freeze([
  ['hair', PLAYER_HAIR_OPTIONS, 'SOCKET_hair', '#704c38', '#e0b569'],
  ['face', PLAYER_FACE_OPTIONS, 'SOCKET_face', '#f0c9a5', '#553b35'],
  ['outfit', PLAYER_OUTFIT_OPTIONS, 'SOCKET_costume_override', '#4f83c5', '#f0cf70'],
]);

export const V031_PLAYER_MODULE_DEFINITIONS = Object.freeze([
  ...PLAYER_APPEARANCE_GROUPS.flatMap(
    ([moduleType, options, socketName, primary, secondary]) => options.map((item, index) => (
      moduleAsset('player', item.id, moduleType, index, primary, secondary, 'player-generated', socketName)
    )),
  ),
  ...PLAYER_ACCESSORY_OPTIONS.filter((item) => item.id !== 'none').map((item, index) => (
    moduleAsset('player', item.id, 'accessory', index, '#f2cf70', '#5b7d91', 'player-generated', playerAccessorySocket(item.id))
  )),
]);

export const V031_CHARACTER_MODULE_DEFINITIONS = Object.freeze([
  ...V031_RESIDENT_MODULE_DEFINITIONS,
  ...V031_PLAYER_MODULE_DEFINITIONS,
]);

export const V031_CHARACTER_ASSET_DEFINITIONS = Object.freeze([
  ...HUMANOID_BODY_VARIANT_DEFINITIONS,
  ...V031_CHARACTER_MODULE_DEFINITIONS,
]);

const residentModuleByKey = new Map(V031_RESIDENT_MODULE_DEFINITIONS.map((definition) => [`${definition.ownerId}:${definition.moduleType}`, definition]));
const bodyAssetById = new Map(HUMANOID_BODY_VARIANT_DEFINITIONS.map((definition) => [definition.id, definition.assetId]));

export const RESIDENT_CHARACTER_VISUAL_PROFILES = Object.freeze(Object.fromEntries(VILLAGE_RESIDENT_IDS.map((residentId) => {
  const bodyVariantId = RESIDENT_BODY_VARIANT_BY_ID[residentId];
  return [residentId, Object.freeze({
    residentId,
    bodyAssetId: bodyAssetById.get(bodyVariantId),
    physicalProfileId: bodyVariantId === 'teen' ? 'npc_child' : 'npc_adult',
    faceAssetId: residentModuleByKey.get(`${residentId}:face`)?.assetId,
    hairAssetId: residentModuleByKey.get(`${residentId}:hair`)?.assetId,
    outfitAssetId: residentModuleByKey.get(`${residentId}:outfit`)?.assetId,
    roleAssetId: residentModuleByKey.get(`${residentId}:role`)?.assetId,
    hiddenBodyNodes: ['hair', 'pelvis', 'torso', 'trim'],
  })];
})));

const playerModuleByKey = new Map(V031_PLAYER_MODULE_DEFINITIONS.map((definition) => [`${definition.moduleType}:${definition.ownerId}`, definition]));

export function resolvePlayerAppearanceAssets(profile = {}) {
  const hairId = PLAYER_HAIR_OPTIONS.some((item) => item.id === profile.hairStyle) ? profile.hairStyle : 'short';
  const faceId = PLAYER_FACE_OPTIONS.some((item) => item.id === profile.face) ? profile.face : 'smile';
  const outfitId = PLAYER_OUTFIT_OPTIONS.some((item) => item.id === profile.outfitStyle) ? profile.outfitStyle : 'adventurer';
  const accessoryId = PLAYER_ACCESSORY_OPTIONS.some((item) => item.id === profile.accessory) ? profile.accessory : 'none';
  const accessory = playerModuleByKey.get(`accessory:${accessoryId}`) || null;
  return {
    hairAssetId: playerModuleByKey.get(`hair:${hairId}`)?.assetId || null,
    faceAssetId: playerModuleByKey.get(`face:${faceId}`)?.assetId || null,
    outfitAssetId: playerModuleByKey.get(`outfit:${outfitId}`)?.assetId || null,
    accessoryAssetId: accessory?.assetId || null,
    accessorySocket: accessory?.socketName || null,
    hiddenBodyNodes: ['hair', 'pelvis', 'torso', 'trim'],
  };
}

const companionEntries = Object.values(COMPANION_PROFILES).map((profile, index) => {
  const speciesKey = profile.modelAssetId.split(':').pop();
  return { profile, speciesKey, index };
});

export const V031_COMPANION_MODULE_DEFINITIONS = Object.freeze(companionEntries.flatMap(({ profile, speciesKey, index }) => [
  companionModule(profile, speciesKey, 'home', index, 'companions-generated'),
  companionModule(profile, speciesKey, 'skill', index, 'companions-generated'),
  companionModule(profile, speciesKey, 'wearable', index, 'companions-generated'),
]));

const companionModuleByKey = new Map(V031_COMPANION_MODULE_DEFINITIONS.map((definition) => [`${definition.ownerId}:${definition.moduleType}`, definition]));
export const COMPANION_V031_VISUAL_PROFILES = Object.freeze(Object.fromEntries(companionEntries.map(({ profile }) => [profile.id, Object.freeze({
  companionId: profile.id,
  homeAssetId: companionModuleByKey.get(`${profile.id}:home`).assetId,
  skillAssetId: companionModuleByKey.get(`${profile.id}:skill`).assetId,
  wearableAssetId: companionModuleByKey.get(`${profile.id}:wearable`).assetId,
})])));

export const V031_CHARACTER_ASSET_COUNT = V031_CHARACTER_ASSET_DEFINITIONS.length;
export const V031_COMPANION_ASSET_COUNT = V031_COMPANION_MODULE_DEFINITIONS.length;

function body(id, physicalProfileId, scale, silhouette) {
  return Object.freeze({
    id,
    assetId: `character:body:${id}`,
    category: 'character',
    purpose: 'shared-humanoid-rig',
    silhouette,
    proportion: scale.join('x'),
    materialProfile: 'residents-generated',
    canonicalPath: `models/characters/bodies/${id}.glb`,
    family: 'humanoid-body',
    tier: 'hero',
    physicalProfileId,
    scale,
    geometry: [part('rig_contract', 'box', [0.4, 1.6, 0.3])],
    requiredNodes: HUMANOID_REQUIRED_NODES,
    requiredClips: CHARACTER_LIFE_ANIMATION_CLIPS,
    lod: { profileId: 'character-standard', ratios: [1, 0.55, 0.24] },
  });
}

function moduleAsset(ownerType, ownerId, moduleType, index, primary, secondary, materialProfile, socketName) {
  const scope = ownerType === 'resident' ? `residents/${ownerId}` : `player/${moduleType}`;
  return Object.freeze({
    id: `${ownerType}_${ownerId}_${moduleType}`,
    assetId: `character:${ownerType}:${ownerId}:${moduleType}`,
    category: 'character',
    purpose: `${ownerType}-${moduleType}`,
    silhouette: `${moduleType}-${index + 1}`,
    proportion: `${1 + (index % 4) * 0.08}:${1 + (index % 3) * 0.06}`,
    materialProfile,
    canonicalPath: `models/characters/${scope}/${ownerId}_${moduleType}.glb`,
    family: `${ownerType}-${moduleType}`,
    tier: moduleType === 'outfit' ? 'gameplay' : 'modular',
    ownerType,
    ownerId,
    moduleType,
    socketName,
    palette: [primary, secondary],
    geometry: moduleGeometry(moduleType, index, primary, secondary, ownerType),
    requiredNodes: ['AttachmentRoot'],
    lod: { profileId: 'character-standard', ratios: [1, 0.55, 0.24] },
  });
}

function companionModule(profile, speciesKey, moduleType, index, materialProfile) {
  return Object.freeze({
    id: `companion_${speciesKey}_${moduleType}`,
    assetId: `companion:${speciesKey}:${moduleType}`,
    category: 'companion',
    purpose: `companion-${moduleType}`,
    silhouette: `${speciesKey}-${moduleType}`,
    proportion: `${0.75 + index * 0.04}:${0.6 + (index % 3) * 0.08}`,
    materialProfile,
    canonicalPath: `models/companions/modules/${speciesKey}/${moduleType}.glb`,
    family: `companion-${moduleType}`,
    tier: moduleType === 'home' ? 'gameplay' : 'modular',
    ownerId: profile.id,
    moduleType,
    palette: [profile.color, profile.accent],
    geometry: companionGeometry(moduleType, index, profile.color, profile.accent),
    requiredNodes: moduleType === 'home' ? ['AssetRoot', 'COLLIDER_Main', 'SOCKET_Companion'] : ['AssetRoot'],
    lod: { profileId: 'character-standard', ratios: [1, 0.55, 0.24] },
  });
}

function moduleGeometry(moduleType, index, primary, secondary, ownerType) {
  const variation = index % 4;
  if (moduleType === 'face') return [
    part('eye_l', 'sphere', [0.035 + variation * 0.004, 8, 6], [-0.11, 0.05, 0], null, [1, 1 + (index % 2) * 0.25, 0.45], secondary),
    part('eye_r', 'sphere', [0.035 + variation * 0.004, 8, 6], [0.11, 0.05, 0], null, [1, 1 + ((index + 1) % 2) * 0.25, 0.45], secondary),
    part('mouth', 'torus', [0.07 + variation * 0.008, 0.012, 6, 12, Math.PI], [0, -0.075, 0], [0, 0, index % 2 ? Math.PI : 0], [1, 0.65, 0.5], '#a45252'),
  ];
  if (moduleType === 'hair') return [
    part('hair_cap', 'sphere', [0.35, 14, 10], [0, 0.02, -0.02], null, [1 + variation * 0.04, 0.55 + (index % 3) * 0.12, 1], primary),
    ...Array.from({ length: 1 + (index % 4) }, (_, partIndex) => part(
      `hair_detail_${partIndex + 1}`,
      index % 2 ? 'sphere' : 'cone',
      index % 2 ? [0.11 + partIndex * 0.01, 9, 7] : [0.09 + partIndex * 0.01, 0.26 + variation * 0.04, 7],
      [(-0.24 + partIndex * 0.16), 0.18 + (partIndex % 2) * 0.09, -0.03],
      [0, 0, -0.35 + partIndex * 0.18],
      [1, 1, 1],
      partIndex % 2 ? secondary : primary,
    )),
  ];
  if (moduleType === 'outfit') return [
    part('outfit_torso', index % 2 ? 'box' : 'cylinder', index % 2 ? [0.58 + variation * 0.04, 0.72, 0.38] : [0.31, 0.39 + variation * 0.02, 0.76, 12], [0, -0.08, 0], null, [1, 1, 1], primary),
    part('outfit_trim', 'box', [0.48 + variation * 0.03, 0.12, 0.08], [0, 0.05, 0.24], [0, 0, (index % 3 - 1) * 0.12], [1, 1, 1], secondary),
    part('outfit_badge', 'icosahedron', [0.075 + variation * 0.008, 0], [0.18 - variation * 0.04, 0.18, 0.25], null, [1, 1, 0.45], secondary),
  ];
  if (moduleType === 'accessory') return index === 2 ? [
    part('glasses_l', 'torus', [0.105, 0.018, 6, 14], [-0.115, 0.05, 0], [0, 0, 0], [1, 1, 1], secondary),
    part('glasses_r', 'torus', [0.105, 0.018, 6, 14], [0.115, 0.05, 0], [0, 0, 0], [1, 1, 1], secondary),
  ] : [part(
    'appearance_accessory',
    index === 3 ? 'torus' : 'icosahedron',
    index === 3 ? [0.24, 0.035, 7, 16] : [0.09 + variation * 0.015, 0],
    index === 3 ? [0, 0.48, -0.34] : [0.22, -0.02, 0.1],
    [Math.PI / 2, 0, 0],
    [1, 1, 0.55],
    index % 2 ? secondary : primary,
  )];
  const toolShapes = ['box', 'cylinder', 'cone', 'torus'];
  return [
    part('role_handle', 'cylinder', [0.035, 0.045, 0.58 + variation * 0.08, 7], [0, -0.16, 0], [0, 0, -0.2 + variation * 0.12], [1, 1, 1], '#765238'),
    part('role_symbol', toolShapes[index % toolShapes.length], toolShapes[index % toolShapes.length] === 'box' ? [0.26, 0.18, 0.12] : toolShapes[index % toolShapes.length] === 'cylinder' ? [0.12, 0.15, 0.2, 8] : toolShapes[index % toolShapes.length] === 'cone' ? [0.14, 0.28, 7] : [0.13, 0.035, 7, 14], [0, 0.18, 0], null, [1, 1, 1], ownerType === 'resident' ? secondary : primary),
  ];
}

function companionGeometry(moduleType, index, primary, secondary) {
  const variation = index % 4;
  if (moduleType === 'home') return [
    part('home_base', index % 2 ? 'box' : 'cylinder', index % 2 ? [1.05, 0.18, 0.8] : [0.48, 0.6, 0.18, 12], [0, 0.09, 0], null, [1 + variation * 0.06, 1, 1], primary),
    part('home_cushion', 'sphere', [0.42 + variation * 0.025, 12, 8], [0, 0.2, 0], null, [1.15, 0.28, 0.9], secondary),
    part('home_marker', index % 3 ? 'cone' : 'icosahedron', index % 3 ? [0.12, 0.36, 7] : [0.14, 0], [0.42, 0.35, -0.22], null, [1, 1, 1], secondary),
  ];
  if (moduleType === 'skill') return [
    part('skill_core', index % 2 ? 'icosahedron' : 'sphere', index % 2 ? [0.18 + variation * 0.02, 1] : [0.2 + variation * 0.02, 12, 8], [0, 0, 0], null, [1, 1, 1], secondary),
    part('skill_ring', 'torus', [0.28 + variation * 0.025, 0.035, 7, 18], [0, 0, 0], [Math.PI / 2, 0, index * 0.18], [1, 1, 1], primary),
  ];
  return [
    part('wearable_band', 'torus', [0.27 + variation * 0.012, 0.045, 7, 18], [0, 0, 0], [Math.PI / 2, 0, 0], [1, 0.72, 1], secondary),
    part('wearable_charm', index % 2 ? 'icosahedron' : 'cone', index % 2 ? [0.09 + variation * 0.01, 0] : [0.08, 0.18 + variation * 0.03, 7], [0, -0.2, 0.18], null, [1, 1, 0.7], primary),
  ];
}

function option(id, label, icon) {
  return Object.freeze({ id, label, icon });
}

function playerAccessorySocket(id) {
  if (id === 'glasses') return 'SOCKET_face';
  if (id === 'scarf') return 'SOCKET_accessory';
  return 'SOCKET_hair';
}

function part(name, shape, args, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#cccccc') {
  return Object.freeze({ name, shape, args, position: position || [0, 0, 0], rotation: rotation || [0, 0, 0], scale: scale || [1, 1, 1], color });
}
