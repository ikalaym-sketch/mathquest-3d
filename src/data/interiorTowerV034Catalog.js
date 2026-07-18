// v0.34 Interior & Trial Tower 唯一生產 Catalog。
// 精確新增 96 GLB：32 個用途可辨識室內殼、28 個室內支援模組、30 個主題塔模組、6 個共用機關。
import { REGION_PRODUCTION_LAYOUTS } from './regionProductionLayouts.js';
import { TOWER_THEMES, getAllTrialFloorConfigs } from './trialTower.js';

const ROOM_SOCKET_NAMES = Object.freeze(['SNAP_N', 'SNAP_E', 'SNAP_S', 'SNAP_W', 'SOCKET_Interaction']);
const ROOM_PALETTE_BY_REGION = Object.freeze(Object.fromEntries(Object.values(REGION_PRODUCTION_LAYOUTS).map((layout) => [
  layout.id,
  Object.freeze([layout.palette.patch, layout.palette.accent, layout.palette.path]),
])));

export const V034_INTERIOR_ROOM_DEFINITIONS = Object.freeze(Object.values(REGION_PRODUCTION_LAYOUTS).flatMap((layout) =>
  layout.structures.map((structure, index) => makeDefinition({
    id: `interior_v034_${layout.id}_${structure.id}`,
    assetId: `interior:${layout.id}:${structure.id}`,
    category: 'interior',
    canonicalPath: `models/interiors/regions/${layout.id}/${structure.id}.glb`,
    purpose: 'interior-room-shell',
    family: structure.type,
    regionId: layout.id,
    roomId: structure.id,
    structureType: structure.type,
    palette: ROOM_PALETTE_BY_REGION[layout.id],
    geometry: buildRoomShellGeometry(structure.type, ROOM_PALETTE_BY_REGION[layout.id], index),
    tier: 'modular',
    materialProfile: 'interior-generated',
  })),
));

const INTERIOR_SUPPORT_SEEDS = Object.freeze([
  ['table', 'table'], ['seat', 'seat'], ['shelf', 'shelf'], ['cabinet', 'cabinet'],
  ['workbench', 'workbench'], ['rug', 'rug'], ['lamp', 'lamp'], ['display', 'display'],
  ['bed', 'bed'], ['anvil', 'anvil'], ['furnace', 'furnace'], ['telescope', 'telescope'],
  ['altar', 'altar'], ['storage', 'storage'], ['map_table', 'map'], ['lesson_board', 'board'],
  ['apiary', 'apiary'], ['dock_console', 'dock'], ['gear_console', 'gear'], ['story_shelf', 'story'],
  ['wardrobe', 'wardrobe'], ['feed_bin', 'bin'], ['hay_stack', 'hay'], ['tool_rack', 'rack'],
  ['counter', 'counter'], ['bookcase', 'bookcase'], ['rest_bench', 'bench'], ['portal_frame', 'portal'],
]);

export const V034_INTERIOR_SUPPORT_DEFINITIONS = Object.freeze(INTERIOR_SUPPORT_SEEDS.map(([id, family], index) => makeDefinition({
  id: `interior_v034_support_${id}`,
  assetId: `interior-support:${id}`,
  category: 'interior',
  canonicalPath: `models/interiors/shared/${id}.glb`,
  purpose: 'interior-support-module',
  family,
  supportId: id,
  palette: ['#c99d65', '#f0ce78', '#5f4b42'],
  geometry: buildInteriorSupportGeometry(family, index),
  tier: 'modular',
  materialProfile: 'interior-generated',
})));

const TOWER_THEME_PALETTES = Object.freeze(Object.fromEntries(TOWER_THEMES.map((entry) => [entry.id, Object.freeze([entry.floor, entry.accent, entry.sky])])));
const TOWER_THEME_ROLES = Object.freeze(['foundation', 'boundary', 'landmark']);

export const V034_TOWER_THEME_DEFINITIONS = Object.freeze(TOWER_THEMES.flatMap((theme, themeIndex) => TOWER_THEME_ROLES.map((role, roleIndex) => makeDefinition({
  id: `tower_v034_${theme.id}_${role}`,
  assetId: `trial-tower:${theme.id}:${role}`,
  category: 'trial-tower',
  canonicalPath: `models/trial-tower/themes/${theme.id}/${role}.glb`,
  purpose: 'trial-tower-theme-module',
  family: `${theme.id}-${role}`,
  themeId: theme.id,
  role,
  palette: TOWER_THEME_PALETTES[theme.id],
  geometry: buildTowerThemeGeometry(role, themeIndex, roleIndex, TOWER_THEME_PALETTES[theme.id]),
  tier: role === 'landmark' ? 'hero' : 'modular',
  materialProfile: 'tower-generated',
}))));

const TOWER_MECHANISM_SEEDS = Object.freeze([
  ['rune_node', 'rune'],
  ['signal_beacon', 'beacon'],
  ['treasure_cache', 'treasure'],
  ['rest_shrine', 'rest'],
  ['boss_dais', 'boss'],
  ['hazard_pylon', 'hazard'],
]);

export const V034_TOWER_MECHANISM_DEFINITIONS = Object.freeze(TOWER_MECHANISM_SEEDS.map(([id, mechanism], index) => makeDefinition({
  id: `tower_v034_mechanism_${id}`,
  assetId: `trial-tower:mechanism:${id}`,
  category: 'trial-tower',
  canonicalPath: `models/trial-tower/mechanisms/${id}.glb`,
  purpose: 'trial-tower-mechanism',
  family: mechanism,
  mechanism,
  palette: ['#7ecfe6', '#ffe17a', '#6657a8'],
  geometry: buildTowerMechanismGeometry(mechanism, index),
  tier: mechanism === 'boss' ? 'hero' : 'gameplay',
  materialProfile: 'tower-generated',
})));

export const V034_INTERIOR_TOWER_ASSET_DEFINITIONS = Object.freeze([
  ...V034_INTERIOR_ROOM_DEFINITIONS,
  ...V034_INTERIOR_SUPPORT_DEFINITIONS,
  ...V034_TOWER_THEME_DEFINITIONS,
  ...V034_TOWER_MECHANISM_DEFINITIONS,
]);

export const V034_ALLOCATION = Object.freeze({
  interiorRooms: 32,
  interiorSupport: 28,
  interiorTotal: 60,
  towerThemes: 30,
  towerMechanisms: 6,
  towerTotal: 36,
  total: 96,
  canonicalBefore: 649,
  canonicalAfter: 745,
});

const SUPPORT_BY_INTERACTION = Object.freeze({
  rest: 'rest_bench', storyShelf: 'story_shelf', workbench: 'workbench', telescope: 'telescope',
  lessonBoard: 'lesson_board', altar: 'altar', storage: 'storage', mapTable: 'map_table',
  forge: 'furnace', gearConsole: 'gear_console',
});
const SUPPORT_BY_ID = Object.freeze(Object.fromEntries(V034_INTERIOR_SUPPORT_DEFINITIONS.map((item) => [item.supportId, item])));
const ROOM_BY_KEY = Object.freeze(Object.fromEntries(V034_INTERIOR_ROOM_DEFINITIONS.map((item) => [`${item.regionId}:${item.roomId}`, item])));
const TOWER_BY_KEY = Object.freeze(Object.fromEntries(V034_TOWER_THEME_DEFINITIONS.map((item) => [`${item.themeId}:${item.role}`, item])));
const MECHANISM_BY_ID = Object.freeze(Object.fromEntries(V034_TOWER_MECHANISM_DEFINITIONS.map((item) => [item.mechanism, item])));

export function getInteriorRoomDefinition(regionId, roomId) {
  return ROOM_BY_KEY[`${regionId}:${roomId}`] || null;
}

export function getInteriorSupportDefinitions(interior) {
  const requested = (interior?.interactions || []).map((item) => SUPPORT_BY_INTERACTION[item.kind]).filter(Boolean);
  const fallback = interior?.furnitureTheme === 'home' ? ['bed', 'wardrobe', 'lamp'] : ['table', 'shelf', 'lamp'];
  return [...new Set([...requested, ...fallback])].slice(0, 4).map((id) => SUPPORT_BY_ID[id]).filter(Boolean);
}

export function getTrialTowerDefinitionsForConfig(config) {
  if (!config?.theme?.id) return [];
  const mechanism = mechanismForRoomType(config.roomType);
  return [
    ...TOWER_THEME_ROLES.map((role) => TOWER_BY_KEY[`${config.theme.id}:${role}`]),
    MECHANISM_BY_ID[mechanism],
  ].filter(Boolean);
}

export const V034_TOWER_FLOOR_ASSET_MAP = Object.freeze(Object.fromEntries(getAllTrialFloorConfigs().map((config) => [
  config.floor,
  Object.freeze(getTrialTowerDefinitionsForConfig(config).map((item) => item.assetId)),
])));

function mechanismForRoomType(roomType) {
  if (roomType === 'boss') return 'boss';
  if (roomType === 'treasure') return 'treasure';
  if (roomType === 'rest') return 'rest';
  if (roomType === 'trap' || roomType === 'endurance') return 'hazard';
  if (roomType === 'escort') return 'beacon';
  return 'rune';
}

function makeDefinition(input) {
  return Object.freeze({
    ...input,
    artStatus: 'new',
    runtimeRole: input.category === 'interior' ? 'interior-pocket-kit' : 'trial-tower-composition',
    silhouette: `${input.family}:${input.purpose}`,
    proportion: input.category === 'interior' ? '13.2:5.4:11.4' : 'arena-module:18',
    lodProfile: input.tier === 'hero' ? 'building-hero' : 'environment-standard',
    lod: Object.freeze({ profileId: input.tier === 'hero' ? 'building-hero' : 'environment-standard', ratios: [1, 0.52, 0.2] }),
    requiredNodes: Object.freeze(['AssetRoot', 'LOD0', 'LOD1', 'LOD2', 'COLLIDER_Main', ...ROOM_SOCKET_NAMES]),
    requiredClips: Object.freeze([]),
    sockets: Object.freeze([
      { name: 'SNAP_N', position: [0, 0, -5.7] }, { name: 'SNAP_E', position: [6.6, 0, 0] },
      { name: 'SNAP_S', position: [0, 0, 5.7] }, { name: 'SNAP_W', position: [-6.6, 0, 0] },
      { name: 'SOCKET_Interaction', position: [0, 0.1, 0] },
    ].map((item) => Object.freeze(item))),
  });
}

function buildRoomShellGeometry(family, palette, index) {
  const [base, accent, dark] = palette;
  const parts = [];
  add(parts, 'floor', 'box', [13.2, 0.3, 11.4], [0, -0.15, 0], base);
  add(parts, 'wall_north', 'box', [13.2, 5.4, 0.35], [0, 2.7, -5.7], dark);
  add(parts, 'wall_west', 'box', [0.35, 5.4, 11.4], [-6.6, 2.7, 0], dark);
  add(parts, 'wall_east', 'box', [0.35, 5.4, 11.4], [6.6, 2.7, 0], dark);
  add(parts, 'wall_south_left', 'box', [5.5, 5.4, 0.35], [-3.85, 2.7, 5.7], dark);
  add(parts, 'wall_south_right', 'box', [5.5, 5.4, 0.35], [3.85, 2.7, 5.7], dark);
  for (let beam = -2; beam <= 2; beam += 1) add(parts, `ceiling_beam_${beam}`, 'box', [0.18, 0.22, 11.1], [beam * 2.5, 5.25, 0], beam % 2 ? accent : base);
  const motifShape = family.includes('clock') || family.includes('gear') ? 'torus' : family.includes('shrine') || family.includes('sanctuary') ? 'icosahedron' : 'box';
  add(parts, `purpose_${family}`, motifShape, motifShape === 'torus' ? [0.9, 0.18, 8, 20] : motifShape === 'icosahedron' ? [0.8, 1] : [2.4, 1.1, 0.2], [0, 3.2, -5.45], accent, [1, 1, motifShape === 'box' ? 1 : 0.45], [Math.PI / 2, index * 0.13, 0]);
  return parts;
}

function buildInteriorSupportGeometry(family, index) {
  const parts = [];
  const primary = index % 2 ? '#b77b4e' : '#d1a263';
  const accent = index % 3 ? '#f1ce75' : '#75c8d7';
  const dark = '#5a4740';
  if (['table', 'workbench', 'counter', 'map', 'anvil'].includes(family)) {
    add(parts, `${family}_top`, family === 'anvil' ? 'box' : 'box', [2.2, 0.25, 1.15], [0, 0.9, 0], family === 'anvil' ? '#66717a' : primary);
    for (const side of [-1, 1]) add(parts, `${family}_leg_${side}`, 'box', [0.22, 0.9, 0.22], [side * 0.8, 0.43, 0], dark);
  } else if (['shelf', 'bookcase', 'story', 'wardrobe', 'rack', 'board'].includes(family)) {
    add(parts, `${family}_body`, 'box', [2.1, 2.5, 0.55], [0, 1.25, 0], dark);
    for (let row = 0; row < 4; row += 1) add(parts, `${family}_row_${row}`, 'box', [1.75, 0.25, 0.62], [0, 0.4 + row * 0.58, 0.08], row % 2 ? primary : accent);
  } else if (['lamp', 'telescope', 'altar', 'gear', 'portal'].includes(family)) {
    add(parts, `${family}_stand`, 'cylinder', [0.18, 0.32, 2.0, 9], [0, 1, 0], dark);
    add(parts, `${family}_focus`, family === 'gear' || family === 'portal' ? 'torus' : family === 'telescope' ? 'cone' : 'icosahedron', family === 'gear' || family === 'portal' ? [0.75, 0.14, 8, 20] : family === 'telescope' ? [0.32, 1.25, 8] : [0.48, 1], [0, 2.15, 0], accent, [1, 1, 1], family === 'telescope' ? [Math.PI / 2, 0, 0] : [Math.PI / 2, 0, 0]);
  } else if (['bed', 'bench', 'seat', 'rug', 'hay'].includes(family)) {
    add(parts, `${family}_base`, 'box', family === 'rug' ? [3.2, 0.08, 2.2] : family === 'bed' ? [2.0, 0.55, 2.8] : [1.8, 0.6, 0.9], [0, family === 'rug' ? 0.04 : 0.3, 0], primary);
    if (family === 'bed') add(parts, 'bed_pillow', 'box', [1.55, 0.22, 0.65], [0, 0.67, -0.85], accent);
  } else {
    add(parts, `${family}_base`, 'box', [1.8, 1.2, 1.25], [0, 0.6, 0], primary);
    add(parts, `${family}_detail`, index % 2 ? 'cylinder' : 'icosahedron', index % 2 ? [0.45, 0.55, 1.0, 9] : [0.5, 1], [0, 1.45, 0], accent);
  }
  return parts;
}

function buildTowerThemeGeometry(role, themeIndex, roleIndex, palette) {
  const [base, accent, sky] = palette;
  const parts = [];
  const sides = 6 + (themeIndex % 5);
  if (role === 'foundation') {
    add(parts, 'foundation_inlay', 'cylinder', [4.8, 5.3, 0.22, sides], [0, 0.11, 0], base);
    for (let i = 0; i < sides; i += 1) add(parts, `foundation_rune_${i}`, 'box', [0.22, 0.12, 1.2], [Math.cos(i / sides * Math.PI * 2) * 3.6, 0.28, Math.sin(i / sides * Math.PI * 2) * 3.6], accent, [1, 1, 1], [0, -i / sides * Math.PI * 2, 0]);
  } else if (role === 'boundary') {
    for (let i = 0; i < 4; i += 1) {
      const angle = i * Math.PI / 2 + themeIndex * 0.07;
      add(parts, `boundary_${i}`, themeIndex % 3 === 0 ? 'cylinder' : themeIndex % 3 === 1 ? 'box' : 'icosahedron', themeIndex % 3 === 0 ? [0.4, 0.65, 3.4, sides] : themeIndex % 3 === 1 ? [0.85, 3.4, 0.85] : [0.85, 1], [Math.cos(angle) * 8.5, 1.7, Math.sin(angle) * 8.5], i % 2 ? accent : sky, [1, themeIndex % 3 === 2 ? 1.8 : 1, 1]);
    }
  } else {
    add(parts, `landmark_core_${themeIndex}`, themeIndex % 4 === 0 ? 'icosahedron' : themeIndex % 4 === 1 ? 'torus' : themeIndex % 4 === 2 ? 'cone' : 'cylinder', themeIndex % 4 === 0 ? [1.2, 1] : themeIndex % 4 === 1 ? [1.3, 0.28, 10, 24] : themeIndex % 4 === 2 ? [1.25, 3.6, sides] : [0.9, 1.2, 3.6, sides], [0, 2, 0], accent, [1, 1 + roleIndex * 0.1, 1]);
    for (let i = 0; i < 3; i += 1) add(parts, `landmark_orbit_${i}`, 'icosahedron', [0.32 + i * 0.08, 0], [Math.cos(i * 2.1) * 2.2, 1.3 + i * 0.7, Math.sin(i * 2.1) * 2.2], i % 2 ? base : sky);
  }
  return parts;
}

function buildTowerMechanismGeometry(mechanism, index) {
  const parts = [];
  const colors = ['#7ecfe6', '#ffe17a', '#7a68ba'];
  add(parts, `${mechanism}_base`, 'cylinder', [1.15, 1.4, 0.42, 8 + index], [0, 0.21, 0], colors[2]);
  if (mechanism === 'rune') for (let i = 0; i < 3; i += 1) add(parts, `rune_${i}`, 'icosahedron', [0.34, 1], [(i - 1) * 0.8, 0.8 + (i % 2) * 0.35, 0], colors[i]);
  else if (mechanism === 'beacon') { add(parts, 'beacon_mast', 'cylinder', [0.12, 0.22, 2.8, 8], [0, 1.6, 0], colors[0]); add(parts, 'beacon_light', 'icosahedron', [0.55, 1], [0, 3.1, 0], colors[1]); }
  else if (mechanism === 'treasure') { add(parts, 'treasure_box', 'box', [1.8, 1.0, 1.25], [0, 0.85, 0], '#b77c43'); add(parts, 'treasure_lock', 'icosahedron', [0.25, 0], [0, 0.95, 0.68], colors[1]); }
  else if (mechanism === 'rest') { add(parts, 'rest_crystal', 'icosahedron', [0.95, 1], [0, 1.35, 0], colors[0], [1, 1.7, 1]); add(parts, 'rest_halo', 'torus', [1.2, 0.13, 8, 22], [0, 1.35, 0], colors[1], [1, 1, 1], [Math.PI / 2, 0, 0]); }
  else if (mechanism === 'boss') { add(parts, 'boss_throne', 'box', [2.2, 2.5, 1.2], [0, 1.55, -0.2], colors[2]); add(parts, 'boss_crown', 'torus', [0.9, 0.2, 8, 18, Math.PI], [0, 3.0, 0], colors[1]); }
  else for (let i = 0; i < 4; i += 1) add(parts, `hazard_spike_${i}`, 'cone', [0.28, 1.7, 7], [Math.cos(i * Math.PI / 2) * 0.75, 1.0, Math.sin(i * Math.PI / 2) * 0.75], i % 2 ? colors[0] : colors[1]);
  return parts;
}

function add(parts, name, shape, args, position, color, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  parts.push(Object.freeze({ name, shape, args, position, color, scale, rotation }));
}
