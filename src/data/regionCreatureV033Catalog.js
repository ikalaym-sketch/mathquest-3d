// v0.33 Regions, Forest & Creatures 唯一生產 Catalog。
// 精確新增 126 GLB：森林30、八區結構24、八區環境40、區域生物32。

export const V033_REGION_THEMES = Object.freeze([
  theme('wind_highlands', 'wind', ['#6fc7df', '#d9f3ff', '#78966b'], 'wind-grass-generated'),
  theme('snow_valley', 'snow', ['#a7e2ee', '#eefcff', '#789fb4'], 'snow-generated'),
  theme('farm_plains', 'farm', ['#d8ad4f', '#82ad55', '#8a6040'], 'farm-wet-generated'),
  theme('star_village', 'star', ['#efc44f', '#d887bd', '#667cc0'], 'village-generated'),
  theme('crystal_lake', 'crystal', ['#49d4d1', '#8ba9f3', '#a7eee0'], 'crystal-generated'),
  theme('sun_canyon', 'canyon', ['#df8244', '#edbd68', '#86513a'], 'canyon-generated'),
  theme('mushroom_grove', 'mushroom', ['#d967af', '#8e71d1', '#79ae73'], 'mushroom-generated'),
  theme('clockwork_ruins', 'clockwork', ['#c38a42', '#76847d', '#53646b'], 'clockwork-generated'),
]);

const FOREST_SEEDS = Object.freeze([
  ['whispering_grove', 'ancient_oak_cluster', 'tree'],
  ['whispering_grove', 'whisper_birch_cluster', 'tree'],
  ['whispering_grove', 'root_crossing', 'bridge'],
  ['whispering_grove', 'spirit_fern_circle', 'flora'],
  ['whispering_grove', 'glow_moss_bank', 'flora'],
  ['whispering_grove', 'seed_pedestal', 'shrine'],
  ['whispering_grove', 'owl_perch', 'totem'],
  ['whispering_grove', 'grove_rune_decal', 'decal'],
  ['waterfall_path', 'cascade_rock_stack', 'rock'],
  ['waterfall_path', 'mist_totem', 'totem'],
  ['waterfall_path', 'moss_log_bridge', 'bridge'],
  ['waterfall_path', 'river_reed_bed', 'flora'],
  ['waterfall_path', 'cliff_vine_wall', 'flora'],
  ['waterfall_path', 'waterwheel_ruin', 'machine'],
  ['waterfall_path', 'spray_crystal', 'crystal'],
  ['waterfall_path', 'waterfall_trail_marker', 'totem'],
  ['ancient_gate', 'rune_pillar_pair', 'ruin'],
  ['ancient_gate', 'broken_gate_arch', 'arch'],
  ['ancient_gate', 'sentinel_statue', 'totem'],
  ['ancient_gate', 'stone_brazier', 'shrine'],
  ['ancient_gate', 'ivy_relief_wall', 'ruin'],
  ['ancient_gate', 'gate_key_altar', 'shrine'],
  ['ancient_gate', 'relic_cache', 'crate'],
  ['mossy_shrine', 'shrine_column_ring', 'ruin'],
  ['mossy_shrine', 'moonwell', 'shrine'],
  ['mossy_shrine', 'guardian_bell', 'totem'],
  ['mossy_shrine', 'sacred_stump', 'tree'],
  ['mossy_shrine', 'spore_bloom_patch', 'flora'],
  ['mossy_shrine', 'offering_table', 'shrine'],
  ['mossy_shrine', 'deer_totem', 'totem'],
]);

const STRUCTURE_ROLES = Object.freeze(['gateway', 'sanctuary', 'watchtower']);
const ENVIRONMENT_ROLES = Object.freeze(['ground-decal', 'path-marker', 'boundary-cluster', 'story-prop', 'dynamic-focus']);

const CREATURES_BY_THEME = Object.freeze({
  wind: [['sky_fox', 'quadruped'], ['cloud_manta', 'winged'], ['gale_hare', 'hopper'], ['wind_sylph', 'elemental']],
  snow: [['frost_stag', 'antlered'], ['snow_owl', 'winged'], ['ice_mole', 'burrower'], ['aurora_sprite', 'elemental']],
  farm: [['orchard_boar', 'tusked'], ['field_hare', 'hopper'], ['harvest_crow', 'winged'], ['burrow_mole', 'burrower']],
  star: [['comet_fox', 'quadruped'], ['starling', 'winged'], ['meadow_sprout', 'plant'], ['book_wisp', 'elemental']],
  crystal: [['prism_otter', 'quadruped'], ['lake_ray', 'finned'], ['echo_shell', 'shelled'], ['crystal_sprite', 'elemental']],
  canyon: [['dune_lizard', 'quadruped'], ['sun_vulture', 'winged'], ['sand_scarab', 'insect'], ['oasis_wisp', 'elemental']],
  mushroom: [['cap_frog', 'hopper'], ['spore_moth', 'winged'], ['glow_snail', 'shelled'], ['fairy_sprite', 'elemental']],
  clockwork: [['gear_mouse', 'quadruped'], ['steam_drone', 'mechanical'], ['spring_beetle', 'insect'], ['clock_sprite', 'elemental']],
});

export const V033_FOREST_ASSET_DEFINITIONS = Object.freeze(FOREST_SEEDS.map(([subareaId, id, geometryFamily], index) => recipe({
  id: `forest_v033_${id}`,
  assetId: `forest:${id}`,
  category: 'forest',
  canonicalPath: `models/forest/expansion/${subareaId}/${id}.glb`,
  purpose: 'forest-subarea-expansion',
  family: geometryFamily,
  geometryFamily,
  subareaId,
  role: index % 3 === 0 ? 'landmark-detail' : index % 3 === 1 ? 'path-detail' : 'story-detail',
  materialProfile: 'terrain-generated',
  palette: ['#5e9f5d', '#9bc36a', '#795b43'],
  index,
})));

export const V033_REGION_STRUCTURE_DEFINITIONS = Object.freeze(V033_REGION_THEMES.flatMap((entry) => STRUCTURE_ROLES.map((role, roleIndex) => recipe({
  id: `region_v033_${entry.key}_${role}`,
  assetId: `region-structure:${entry.regionId}:${role}`,
  category: 'region-structure',
  canonicalPath: `models/regions/expansion/${entry.regionId}/structures/${role}.glb`,
  purpose: 'region-structure-module',
  family: `${entry.key}-${role}`,
  geometryFamily: role === 'gateway' ? 'arch' : role === 'sanctuary' ? 'shrine' : 'tower',
  regionId: entry.regionId,
  role,
  materialProfile: entry.materialProfile,
  palette: entry.palette,
  index: roleIndex,
  tier: role === 'sanctuary' ? 'hero' : 'modular',
  lodProfile: role === 'sanctuary' ? 'building-hero' : 'environment-standard',
}))));

export const V033_REGION_ENVIRONMENT_DEFINITIONS = Object.freeze(V033_REGION_THEMES.flatMap((entry) => ENVIRONMENT_ROLES.map((role, roleIndex) => recipe({
  id: `region_v033_${entry.key}_${role}`,
  assetId: `region-environment:${entry.regionId}:${role}`,
  category: 'region-environment',
  canonicalPath: `models/regions/expansion/${entry.regionId}/environment/${role}.glb`,
  purpose: 'region-environment-module',
  family: `${entry.key}-${role}`,
  geometryFamily: role === 'ground-decal' ? 'decal' : role === 'path-marker' ? 'totem' : role === 'boundary-cluster' ? regionGeometry(entry.key) : role === 'story-prop' ? 'crate' : dynamicGeometry(entry.key),
  regionId: entry.regionId,
  role,
  materialProfile: entry.materialProfile,
  palette: entry.palette,
  index: roleIndex + 4,
}))));

export const V033_CREATURE_DEFINITIONS = Object.freeze(V033_REGION_THEMES.flatMap((entry) => CREATURES_BY_THEME[entry.key].map(([species, morphology], speciesIndex) => recipe({
  id: `creature_v033_${species}`,
  assetId: `creature:${entry.regionId}:${species}`,
  category: 'creature',
  canonicalPath: `models/regions/creatures/${entry.regionId}/${species}.glb`,
  purpose: 'region-ambient-creature',
  family: species,
  geometryFamily: 'creature',
  morphology,
  regionId: entry.regionId,
  role: 'ambient-creature',
  materialProfile: entry.materialProfile,
  palette: entry.palette,
  index: speciesIndex,
  tier: 'gameplay',
  lodProfile: 'creature-standard',
  requiredNodes: ['ActorRoot', 'Body', 'LOD0', 'LOD1', 'LOD2', 'SOCKET_Effect'],
  requiredClips: ['Idle', 'Move'],
}))));

export const V033_REGION_CREATURE_ASSET_DEFINITIONS = Object.freeze([
  ...V033_FOREST_ASSET_DEFINITIONS,
  ...V033_REGION_STRUCTURE_DEFINITIONS,
  ...V033_REGION_ENVIRONMENT_DEFINITIONS,
  ...V033_CREATURE_DEFINITIONS,
]);

export const V033_ALLOCATION = Object.freeze({
  forest: 30,
  regionStructures: 24,
  regionEnvironment: 40,
  creatures: 32,
  total: 126,
  canonicalBefore: 523,
  canonicalAfter: 649,
});

export const V033_REGION_DYNAMIC_EFFECT_PROFILES = Object.freeze(Object.fromEntries(V033_REGION_THEMES.map((entry, regionIndex) => [entry.regionId, Object.freeze([
  Object.freeze({ id: `${entry.key}_ambient`, kind: regionIndex % 2 ? 'orbit' : 'particles', color: entry.palette[0], shaderProfile: entry.materialProfile }),
  Object.freeze({ id: `${entry.key}_surface`, kind: regionIndex % 3 ? 'ring' : 'ripple', color: entry.palette[1], shaderProfile: 'terrainBlend' }),
  Object.freeze({ id: `${entry.key}_landmark`, kind: regionIndex % 2 ? 'beam' : 'pulse', color: entry.palette[2], shaderProfile: entry.materialProfile }),
])])));

export function getV033ForestAssetsForSubarea(subareaId) {
  return V033_FOREST_ASSET_DEFINITIONS.filter((definition) => definition.subareaId === subareaId);
}

export function getV033RegionAssets(regionId) {
  return V033_REGION_CREATURE_ASSET_DEFINITIONS.filter((definition) => definition.regionId === regionId);
}

function theme(regionId, key, palette, materialProfile) {
  return Object.freeze({ regionId, key, palette: Object.freeze(palette), materialProfile });
}

function recipe(input) {
  const creature = input.geometryFamily === 'creature';
  const geometry = creature ? creatureGeometry(input.morphology, input.palette, input.index) : worldGeometry(input.geometryFamily, input.palette, input.index);
  return Object.freeze({
    tier: input.tier || 'modular',
    artStatus: 'new',
    runtimeRole: creature ? 'ambient-creature-layer' : 'region-expansion-layer',
    silhouette: `${input.family}:${input.geometryFamily}:${input.index}`,
    proportion: `${1 + (input.index % 4) * 0.13}:${0.8 + (input.index % 3) * 0.17}`,
    lod: Object.freeze({ profileId: input.lodProfile || 'environment-standard', ratios: [1, 0.53, 0.2] }),
    requiredNodes: input.requiredNodes || ['LOD0', 'LOD1', 'LOD2', 'COLLIDER_Main', 'SOCKET_Story'],
    requiredClips: input.requiredClips || [],
    sockets: creature ? [Object.freeze({ name: 'SOCKET_Effect', position: [0, 1.1, 0] })] : [Object.freeze({ name: 'SOCKET_Story', position: [0, 1, 0] })],
    ...input,
    geometry: Object.freeze(geometry),
  });
}

function worldGeometry(family, palette, index) {
  const [primary, accent, dark] = palette;
  const parts = [];
  const add = (name, shape, args, position, scale = [1, 1, 1], color = primary, rotation = [0, 0, 0]) => parts.push(Object.freeze({ name, shape, args, position, scale, color, rotation }));
  if (family === 'tree') {
    add('trunk', 'cylinder', [0.35, 0.62, 4.2 + index % 3, 10], [0, 2.1, 0], [1, 1, 1], dark);
    for (let i = 0; i < 6; i += 1) add(`crown_${i}`, 'icosahedron', [0.9 + (i % 2) * 0.2, 1], [Math.cos(i) * 1.05, 4 + (i % 3) * 0.55, Math.sin(i) * 1.05], [1.25, 0.85, 1.1], i % 2 ? primary : accent);
  } else if (family === 'arch' || family === 'ruin') {
    for (const side of [-1, 1]) add(`pillar_${side}`, 'box', [0.55, 3.8 + index * 0.12, 0.65], [side * 1.55, 1.9, 0], [1, 1, 1], dark);
    add('arch', 'torus', [1.55, 0.3, 8, 24, Math.PI], [0, 3.65, 0], [1, 1.1, 1], primary);
    add('keystone', 'icosahedron', [0.38, 0], [0, 4.25, 0], [1, 1, 0.65], accent);
  } else if (family === 'shrine') {
    add('base', 'cylinder', [1.7, 2.0, 0.5, 10], [0, 0.25, 0], [1, 1, 1], dark);
    add('altar', 'box', [2.1, 1.2, 1.25], [0, 0.95, 0], [1, 1, 1], primary);
    add('emblem', index % 2 ? 'icosahedron' : 'torus', index % 2 ? [0.48, 1] : [0.55, 0.12, 8, 20], [0, 1.8, 0.3], [1, 1, 0.55], accent, [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) add(`candle_${side}`, 'cylinder', [0.08, 0.1, 0.75, 7], [side * 0.72, 1.65, 0.15], [1, 1, 1], accent);
  } else if (family === 'tower') {
    add('tower_body', index % 2 ? 'cylinder' : 'box', index % 2 ? [1.15, 1.35, 5.6, 10] : [2.3, 5.6, 2.3], [0, 2.8, 0], [1, 1, 1], dark);
    add('tower_crown', 'cone', [1.7, 1.8, 7], [0, 6.1, 0], [1, 1, 1], primary);
    for (let i = 0; i < 4; i += 1) add(`window_${i}`, 'icosahedron', [0.24, 0], [0, 1.6 + i * 1.05, 1.18], [1, 1, 0.35], accent);
  } else if (family === 'bridge') {
    for (let i = 0; i < 9; i += 1) add(`plank_${i}`, 'box', [3.4, 0.18, 0.55], [0, 0.25 + Math.sin(i / 8 * Math.PI) * 0.42, -2.2 + i * 0.55], [1, 1, 1], i % 2 ? primary : dark);
    for (const side of [-1, 1]) add(`rail_${side}`, 'box', [0.12, 0.12, 5.2], [side * 1.6, 1.1, 0], [1, 1, 1], dark);
  } else if (family === 'flora') {
    for (let i = 0; i < 8; i += 1) add(`stem_${i}`, 'cylinder', [0.035, 0.06, 0.75 + (i % 3) * 0.22, 6], [(i % 4 - 1.5) * 0.32, 0.45, (Math.floor(i / 4) - 0.5) * 0.45], [1, 1, 1], dark, [0, 0, (i - 3) * 0.04]);
    for (let i = 0; i < 5; i += 1) add(`bloom_${i}`, 'icosahedron', [0.18 + (i % 2) * 0.05, 0], [(i - 2) * 0.35, 0.9 + (i % 3) * 0.18, (i % 2 - 0.5) * 0.4], [1, 0.55, 1], i % 2 ? primary : accent);
  } else if (family === 'machine') {
    add('frame', 'box', [2.4, 2.2, 1.5], [0, 1.1, 0], [1, 1, 1], dark);
    add('wheel', 'torus', [0.9, 0.2, 10, 24], [0, 1.4, 0.82], [1, 1, 1], primary);
    for (let i = 0; i < 6; i += 1) add(`paddle_${i}`, 'box', [0.22, 1.6, 0.18], [Math.sin(i) * 0.65, 1.4 + Math.cos(i) * 0.65, 0.88], [1, 1, 1], accent, [0, 0, i]);
  } else if (family === 'crystal' || family === 'rock') {
    for (let i = 0; i < 7; i += 1) add(`${family}_${i}`, family === 'crystal' ? 'icosahedron' : 'icosahedron', [0.42 + (i % 3) * 0.15, family === 'crystal' ? 1 : 0], [Math.cos(i * 1.7) * 0.82, 0.45 + (i % 3) * 0.3, Math.sin(i * 1.7) * 0.82], [0.75, 1 + (i % 2) * 0.65, 0.75], i % 2 ? primary : dark, [i * 0.13, i * 0.24, 0]);
  } else if (family === 'decal') {
    add('decal_plate', 'cylinder', [1.45, 1.45, 0.06, 18], [0, 0.03, 0], [1, 1, 1], primary);
    for (let i = 0; i < 5; i += 1) add(`rune_${i}`, 'box', [0.14, 0.08, 0.75], [Math.cos(i * 1.25) * 0.7, 0.08, Math.sin(i * 1.25) * 0.7], [1, 1, 1], accent, [0, i * 1.25, 0]);
  } else if (family === 'crate') {
    for (let i = 0; i < 5; i += 1) add(`crate_${i}`, 'box', [0.9 + (i % 2) * 0.2, 0.7, 0.8], [(i % 3 - 1) * 0.78, 0.35 + Math.floor(i / 3) * 0.65, (i % 2) * 0.45], [1, 1, 1], i % 2 ? primary : dark, [0, i * 0.16, 0]);
  } else {
    add('totem_body', 'cylinder', [0.42, 0.62, 2.7, 8], [0, 1.35, 0], [1, 1, 1], dark);
    add('totem_head', 'icosahedron', [0.62, 1], [0, 2.95, 0], [1, 1.15, 0.72], primary);
    for (const side of [-1, 1]) add(`wing_${side}`, 'cone', [0.35, 1.25, 6], [side * 0.72, 2.35, 0], [1, 1, 0.45], accent, [0, 0, side * 0.65]);
  }
  return parts;
}

function creatureGeometry(morphology, palette, index) {
  const [primary, accent, dark] = palette;
  const parts = [];
  const add = (name, shape, args, position, scale = [1, 1, 1], color = primary, rotation = [0, 0, 0]) => parts.push(Object.freeze({ name, shape, args, position, scale, color, rotation }));
  const elongated = ['quadruped', 'antlered', 'tusked', 'burrower'].includes(morphology);
  add('body_core', morphology === 'mechanical' ? 'box' : morphology === 'elemental' ? 'icosahedron' : morphology === 'shelled' ? 'sphere' : 'icosahedron', morphology === 'mechanical' ? [1.25, 0.9, 1.45] : morphology === 'shelled' ? [0.8, 12, 8] : [0.75, morphology === 'elemental' ? 1 : 0], [0, 0.9, 0], elongated ? [1.25, 0.78, 1.55] : [1, 1, 1], primary);
  add('head_core', morphology === 'mechanical' ? 'box' : 'sphere', morphology === 'mechanical' ? [0.65, 0.55, 0.6] : [0.4, 10, 8], [0, 1.35, 0.82], [1, 1, 1], accent);
  if (['winged', 'finned', 'mechanical'].includes(morphology)) for (const side of [-1, 1]) add(`wing_${side}`, 'cone', [0.7 + index * 0.05, 1.8, 5], [side * 1.05, 1.05, 0], [1, 1, 0.35], accent, [0, 0, side * 1.05]);
  if (['quadruped', 'antlered', 'tusked', 'burrower'].includes(morphology)) for (const side of [-1, 1]) for (const front of [-1, 1]) add(`leg_${side}_${front}`, 'cylinder', [0.1, 0.14, 0.75, 7], [side * 0.48, 0.38, front * 0.45], [1, 1, 1], dark);
  if (morphology === 'antlered') for (const side of [-1, 1]) add(`antler_${side}`, 'torus', [0.48, 0.08, 6, 14, Math.PI], [side * 0.38, 1.9, 0.82], [1, 1, 0.55], dark, [0, side * 0.35, side * 0.2]);
  if (morphology === 'tusked') for (const side of [-1, 1]) add(`tusk_${side}`, 'cone', [0.1, 0.65, 7], [side * 0.28, 1.18, 1.25], [1, 1, 1], accent, [Math.PI / 2, 0, side * 0.18]);
  if (morphology === 'hopper' || morphology === 'plant') for (const side of [-1, 1]) add(`spring_${side}`, 'cylinder', [0.12, 0.2, 0.8, 7], [side * 0.4, 0.35, -0.2], [1, 1, 1], dark, [side * 0.15, 0, side * 0.25]);
  if (morphology === 'insect') for (let i = 0; i < 6; i += 1) add(`leg_${i}`, 'cylinder', [0.04, 0.06, 0.85, 6], [(i % 2 ? 1 : -1) * 0.58, 0.62, (Math.floor(i / 2) - 1) * 0.42], [1, 1, 1], dark, [0, 0, (i % 2 ? -1 : 1) * 0.8]);
  if (morphology === 'shelled') add('shell_ring', 'torus', [0.78, 0.2, 9, 20], [0, 1, -0.15], [1, 1, 0.72], dark, [Math.PI / 2, 0, 0]);
  if (morphology === 'elemental') for (let i = 0; i < 4; i += 1) add(`orb_${i}`, 'icosahedron', [0.16 + i * 0.03, 0], [Math.cos(i * 1.57) * 0.8, 0.9 + (i % 2) * 0.4, Math.sin(i * 1.57) * 0.8], [1, 1, 1], i % 2 ? accent : dark);
  return parts;
}

function regionGeometry(key) {
  if (['wind', 'farm', 'star'].includes(key)) return 'tree';
  if (['snow', 'crystal', 'canyon'].includes(key)) return 'rock';
  if (key === 'mushroom') return 'flora';
  return 'machine';
}

function dynamicGeometry(key) {
  if (['crystal', 'snow'].includes(key)) return 'crystal';
  if (['clockwork'].includes(key)) return 'machine';
  if (['mushroom', 'farm'].includes(key)) return 'flora';
  return 'totem';
}
