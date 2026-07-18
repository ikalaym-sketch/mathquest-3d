// v0.29 美術治理唯一契約。
// 800 個 GLB 是整體 Canonical 目標，不代表同時載入；各版本只能依本表增加或重製資產。
export const ART_TARGET_VERSION = 'v0.35';
export const CANONICAL_GLB_TARGET = 800;
export const CANONICAL_GLB_HARD_LIMIT = 800;

export const GLB_TARGET_DISTRIBUTION = Object.freeze({
  characters: { target: 80, release: 'v0.31', description: '玩家、居民體型、髮型、服裝與職業附件' },
  companions: { target: 32, release: 'v0.31', description: '八隻夥伴本體、住所、技能與服飾附件' },
  equipment: { target: 140, release: 'v0.32', description: '武器、防具、副手、飾品與農具' },
  village: { target: 80, release: 'v0.30', description: '村莊建築、工坊、商店與生活道具' },
  farm: { target: 80, release: 'v0.30', description: '農場設施、作物、動物與加工設備' },
  forest: { target: 45, release: 'v0.33', description: '森林遺跡、樹種、地標與自然物件' },
  regions: { target: 120, release: 'v0.33', description: '八區結構、橋梁與環境模組' },
  creatures: { target: 72, release: 'v0.33', description: '一般怪、精英、Boss 與變體部件' },
  interiors: { target: 60, release: 'v0.34', description: '八區室內 Modular Kit' },
  tower: { target: 36, release: 'v0.34', description: '十種試煉塔主題模組' },
  events: { target: 35, release: 'v0.35', description: '節慶、關係事件與生態物件' },
  effects: { target: 20, release: 'v0.35', description: '傳送門、機關、技能與 VFX Mesh' },
});

export const ASSET_TIER_BUDGETS = Object.freeze({
  heroCharacter: { triangles: [15000, 25000], materials: 5, textureSize: 2048, lod: 'character-hero' },
  resident: { triangles: [8000, 15000], materials: 4, textureSize: 1024, lod: 'character-standard' },
  companion: { triangles: [4000, 8000], materials: 3, textureSize: 1024, lod: 'character-standard' },
  normalMonster: { triangles: [3000, 8000], materials: 3, textureSize: 1024, lod: 'creature-standard' },
  boss: { triangles: [15000, 35000], materials: 6, textureSize: 2048, lod: 'boss-hero' },
  heroBuilding: { triangles: [10000, 30000], materials: 4, textureSize: 1024, lod: 'building-hero' },
  mediumProp: { triangles: [500, 5000], materials: 2, textureSize: 1024, lod: 'environment-standard' },
  smallProp: { triangles: [100, 1000], materials: 1, textureSize: 512, lod: 'environment-light' },
});

export const LOD_PROFILES = Object.freeze({
  'character-hero': { lod0: 1, lod1: [0.5, 0.65], lod2: [0.2, 0.3], distances: [0, 18, 38] },
  'character-standard': { lod0: 1, lod1: [0.45, 0.6], lod2: [0.18, 0.28], distances: [0, 16, 34] },
  'creature-standard': { lod0: 1, lod1: [0.45, 0.6], lod2: [0.15, 0.25], distances: [0, 18, 40] },
  'boss-hero': { lod0: 1, lod1: [0.55, 0.7], lod2: [0.25, 0.35], distances: [0, 24, 50] },
  'building-hero': { lod0: 1, lod1: [0.5, 0.65], lod2: [0.18, 0.3], distances: [0, 35, 70] },
  'environment-standard': { lod0: 1, lod1: [0.45, 0.6], lod2: [0.15, 0.25], distances: [0, 22, 48] },
  'environment-light': { lod0: 1, lod1: [0.4, 0.55], lod2: [0.12, 0.22], distances: [0, 18, 38] },
});

export const MATERIAL_LIMIT_BY_TIER = Object.freeze({
  hero: 6,
  gameplay: 3,
  modular: 2,
  ambient: 1,
  effect: 2,
});

export const TEXTURE_ATLAS_PROFILES = Object.freeze({
  player: { id: 'atlas_player', maxSize: 2048, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  residents: { id: 'atlas_residents', maxSize: 2048, channels: ['baseColor', 'normal', 'orm', 'mask'] },
  companions: { id: 'atlas_companions', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'mask'] },
  equipmentMetal: { id: 'atlas_equipment_metal', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive'] },
  equipmentCloth: { id: 'atlas_equipment_cloth', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'mask'] },
  village: { id: 'atlas_village', maxSize: 2048, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  farm: { id: 'atlas_farm', maxSize: 2048, channels: ['baseColor', 'normal', 'orm', 'mask'] },
  cropAnimal: { id: 'atlas_crop_animal', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'mask'] },
  forest: { id: 'atlas_forest', maxSize: 2048, channels: ['baseColor', 'normal', 'orm', 'mask'] },
  wind: { id: 'atlas_wind', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  snow: { id: 'atlas_snow', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  crystal: { id: 'atlas_crystal', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  canyon: { id: 'atlas_canyon', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  mushroom: { id: 'atlas_mushroom', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  clockwork: { id: 'atlas_clockwork', maxSize: 1024, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
  interiorFestivalTower: { id: 'atlas_interior_festival_tower', maxSize: 2048, channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'] },
});

export const SHADER_PROFILE_IDS = Object.freeze([
  'terrainBlend', 'grassWind', 'waterSurface', 'snowAccumulation', 'wetSurface',
  'crystalPulse', 'mushroomSpore', 'steamFlow', 'hologramPanel', 'equipmentEnchant',
  'hitFlash', 'bossWeakPoint', 'dissolveEffect', 'festivalLight',
]);

export const DEVICE_SCENE_BUDGETS = Object.freeze({
  mobileMedium: { loadedGlb: [40, 70], drawCalls: [120, 180], triangles: [150000, 250000], textureMemoryMb: [80, 140], dynamicLights: 2 },
  tablet: { loadedGlb: [60, 100], drawCalls: [160, 240], triangles: [250000, 500000], textureMemoryMb: [140, 260], dynamicLights: 4 },
  desktopHigh: { loadedGlb: [100, 160], drawCalls: [250, 350], triangles: [500000, 900000], textureMemoryMb: [250, 450], dynamicLights: 6 },
});

export function getTargetGlbTotal() {
  return Object.values(GLB_TARGET_DISTRIBUTION).reduce((sum, profile) => sum + profile.target, 0);
}
