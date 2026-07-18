// v0.35 Event, Ecology & VFX 唯一生產 Catalog。
// 精確新增 55 GLB：節慶12、關係記憶10、生態13、傳送門4、機關4、十二戰鬥Archetype VFX 12。
import { BASE_COMBAT_ARCHETYPE_IDS } from './combatArchetypes.js';
import { VILLAGE_RESIDENT_IDS } from './villageResidentProfiles.js';

const SEASON_PROFILES = Object.freeze([
  ['spring', ['#76c96b', '#f5c2d7', '#fff1a2']],
  ['summer', ['#54c8d8', '#efb15c', '#82d06c']],
  ['autumn', ['#df8244', '#f3c85c', '#9d5638']],
  ['winter', ['#8ed8e8', '#f2fbff', '#7b78c9']],
]);
const FESTIVAL_ROLES = Object.freeze(['stage', 'market_booth', 'lantern_gate']);

export const V035_FESTIVAL_DEFINITIONS = Object.freeze(SEASON_PROFILES.flatMap(([seasonId, palette], seasonIndex) => FESTIVAL_ROLES.map((role, roleIndex) => definition({
  id: `event_v035_festival_${seasonId}_${role}`,
  assetId: `event:festival:${seasonId}:${role}`,
  category: 'event',
  canonicalPath: `models/events/festivals/${seasonId}/${role}.glb`,
  purpose: 'festival-prop',
  family: `${seasonId}-${role}`,
  seasonId,
  role,
  palette,
  geometry: festivalGeometry(role, seasonIndex, roleIndex, palette),
  tier: role === 'stage' ? 'hero' : 'modular',
  materialProfile: 'event-festival-generated',
}))));

export const V035_RELATIONSHIP_DEFINITIONS = Object.freeze(VILLAGE_RESIDENT_IDS.map((npcId, index) => definition({
  id: `event_v035_relationship_${npcId}`,
  assetId: `event:relationship:${npcId}`,
  category: 'event',
  canonicalPath: `models/events/relationships/${npcId}_memory.glb`,
  purpose: 'relationship-memory',
  family: `memory-${npcId}`,
  npcId,
  palette: relationshipPalette(index),
  geometry: relationshipGeometry(npcId, index, relationshipPalette(index)),
  tier: 'gameplay',
  materialProfile: 'event-generated',
})));

const REGION_ECOLOGY_SEEDS = Object.freeze([
  ['wind_highlands', 'sky_seed_garden', 'floating'],
  ['snow_valley', 'frostflower_nest', 'crystal-flora'],
  ['farm_plains', 'pollinator_orchard', 'pollinator'],
  ['star_village', 'starlight_bird_roost', 'roost'],
  ['crystal_lake', 'prism_reed_habitat', 'reed'],
  ['sun_canyon', 'oasis_lizard_shelter', 'shelter'],
  ['mushroom_grove', 'spore_moth_garden', 'mushroom'],
  ['clockwork_ruins', 'clockwork_moss_terrarium', 'mechanical'],
]);
const VILLAGE_ECOLOGY_SEEDS = Object.freeze([
  ['butterfly_garden', 'pollinator'], ['bird_bath', 'roost'], ['firefly_grove', 'floating'], ['bee_hotel', 'shelter'], ['pond_nest', 'reed'],
]);

export const V035_REGION_ECOLOGY_DEFINITIONS = Object.freeze(REGION_ECOLOGY_SEEDS.map(([regionId, id, family], index) => definition({
  id: `event_v035_ecology_${id}`,
  assetId: `event:ecology:${regionId}`,
  category: 'event',
  canonicalPath: `models/events/ecology/regions/${regionId}/${id}.glb`,
  purpose: 'region-ecology-prop',
  family,
  ecologyId: id,
  regionId,
  palette: ecologyPalette(index),
  geometry: ecologyGeometry(family, index, ecologyPalette(index)),
  tier: 'modular',
  materialProfile: regionMaterialProfile(regionId),
})));

export const V035_VILLAGE_ECOLOGY_DEFINITIONS = Object.freeze(VILLAGE_ECOLOGY_SEEDS.map(([id, family], index) => definition({
  id: `event_v035_ecology_village_${id}`,
  assetId: `event:ecology:village:${id}`,
  category: 'event',
  canonicalPath: `models/events/ecology/village/${id}.glb`,
  purpose: 'village-ecology-prop',
  family,
  ecologyId: id,
  sceneId: 'village',
  palette: ecologyPalette(index + 8),
  geometry: ecologyGeometry(family, index + 8, ecologyPalette(index + 8)),
  tier: 'modular',
  materialProfile: 'terrain-generated',
})));

export const V035_EVENT_DEFINITIONS = Object.freeze([
  ...V035_FESTIVAL_DEFINITIONS,
  ...V035_RELATIONSHIP_DEFINITIONS,
  ...V035_REGION_ECOLOGY_DEFINITIONS,
  ...V035_VILLAGE_ECOLOGY_DEFINITIONS,
]);

const PORTAL_TYPES = Object.freeze(['village', 'farm', 'region', 'trial']);
export const V035_PORTAL_EFFECT_DEFINITIONS = Object.freeze(PORTAL_TYPES.map((portalType, index) => definition({
  id: `effect_v035_portal_${portalType}`,
  assetId: `effect:portal:${portalType}`,
  category: 'effect',
  canonicalPath: `models/effects/portals/${portalType}.glb`,
  purpose: 'portal-vfx',
  family: `portal-${portalType}`,
  portalType,
  palette: effectPalette(index),
  geometry: portalGeometry(index, effectPalette(index)),
  tier: 'effect',
  materialProfile: 'portal-generated',
})));

const MECHANISM_TYPES = Object.freeze(['rune', 'gear', 'crystal', 'festival']);
export const V035_MECHANISM_EFFECT_DEFINITIONS = Object.freeze(MECHANISM_TYPES.map((mechanismType, index) => definition({
  id: `effect_v035_mechanism_${mechanismType}`,
  assetId: `effect:mechanism:${mechanismType}`,
  category: 'effect',
  canonicalPath: `models/effects/mechanisms/${mechanismType}.glb`,
  purpose: 'mechanism-vfx',
  family: `mechanism-${mechanismType}`,
  mechanismType,
  palette: effectPalette(index + 4),
  geometry: mechanismGeometry(mechanismType, index, effectPalette(index + 4)),
  tier: 'effect',
  materialProfile: 'vfx-generated',
})));

export const V035_COMBAT_EFFECT_DEFINITIONS = Object.freeze(BASE_COMBAT_ARCHETYPE_IDS.map((baseArchetype, index) => definition({
  id: `effect_v035_combat_${baseArchetype}`,
  assetId: `effect:combat:${baseArchetype}`,
  category: 'effect',
  canonicalPath: `models/effects/combat/${baseArchetype}.glb`,
  purpose: 'combat-vfx',
  family: `combat-${baseArchetype}`,
  baseArchetype,
  vfxProfileId: `vfx:${baseArchetype}`,
  palette: effectPalette(index + 8),
  geometry: combatEffectGeometry(baseArchetype, index, effectPalette(index + 8)),
  tier: 'effect',
  materialProfile: 'vfx-generated',
})));

export const V035_EFFECT_DEFINITIONS = Object.freeze([
  ...V035_PORTAL_EFFECT_DEFINITIONS,
  ...V035_MECHANISM_EFFECT_DEFINITIONS,
  ...V035_COMBAT_EFFECT_DEFINITIONS,
]);

export const V035_EVENT_EFFECT_ASSET_DEFINITIONS = Object.freeze([...V035_EVENT_DEFINITIONS, ...V035_EFFECT_DEFINITIONS]);
export const V035_ALLOCATION = Object.freeze({
  festivals: 12, relationships: 10, regionEcology: 8, villageEcology: 5, events: 35,
  portals: 4, mechanisms: 4, combatVfx: 12, effects: 20, total: 55,
  canonicalBefore: 745, canonicalAfter: 800,
});

const FESTIVAL_BY_SEASON = Object.freeze(Object.groupBy
  ? Object.groupBy(V035_FESTIVAL_DEFINITIONS, (item) => item.seasonId)
  : V035_FESTIVAL_DEFINITIONS.reduce((result, item) => ({ ...result, [item.seasonId]: [...(result[item.seasonId] || []), item] }), {}));
const RELATIONSHIP_BY_NPC = Object.freeze(Object.fromEntries(V035_RELATIONSHIP_DEFINITIONS.map((item) => [item.npcId, item])));
const REGION_ECOLOGY_BY_ID = Object.freeze(Object.fromEntries(V035_REGION_ECOLOGY_DEFINITIONS.map((item) => [item.regionId, item])));
const PORTAL_BY_TYPE = Object.freeze(Object.fromEntries(V035_PORTAL_EFFECT_DEFINITIONS.map((item) => [item.portalType, item])));
const COMBAT_BY_ARCHETYPE = Object.freeze(Object.fromEntries(V035_COMBAT_EFFECT_DEFINITIONS.map((item) => [item.baseArchetype, item])));

export function getFestivalAssetDefinitions(seasonId) { return FESTIVAL_BY_SEASON[seasonId] || []; }
export function getVillageEcologyDefinitions() { return V035_VILLAGE_ECOLOGY_DEFINITIONS; }
export function getRegionEcologyDefinition(regionId) { return REGION_ECOLOGY_BY_ID[regionId] || null; }
export function getRelationshipMemoryDefinitions(relations = {}) {
  return VILLAGE_RESIDENT_IDS.filter((npcId) => {
    const relation = relations[npcId];
    return (Number(relation?.affinity) || 0) >= 20 || (relation?.completedEventIds || []).length > 0;
  }).map((npcId) => RELATIONSHIP_BY_NPC[npcId]).filter(Boolean);
}
export function getPortalEffectAssetId(portalType = 'region') { return PORTAL_BY_TYPE[portalType]?.assetId || PORTAL_BY_TYPE.region.assetId; }
export function getMechanismEffectDefinition(regionId) {
  const index = ['wind_highlands', 'snow_valley', 'farm_plains', 'star_village', 'crystal_lake', 'sun_canyon', 'mushroom_grove', 'clockwork_ruins'].indexOf(regionId);
  return V035_MECHANISM_EFFECT_DEFINITIONS[Math.max(0, index) % V035_MECHANISM_EFFECT_DEFINITIONS.length];
}
export function resolveV035CombatEffectAssetId(value) {
  const id = String(value || '').replace(/^vfx:/, '');
  return COMBAT_BY_ARCHETYPE[id]?.assetId || null;
}

function definition(input) {
  return Object.freeze({
    ...input,
    artStatus: 'new',
    runtimeRole: input.category === 'event' ? 'world-event-layer' : 'runtime-effect-layer',
    silhouette: `${input.family}:${input.purpose}`,
    proportion: input.category === 'effect' ? 'effect-volume:1' : 'world-prop:1',
    lodProfile: input.tier === 'hero' ? 'building-hero' : 'environment-standard',
    lod: Object.freeze({ profileId: input.tier === 'hero' ? 'building-hero' : 'environment-standard', ratios: [1, 0.52, 0.2] }),
    requiredNodes: Object.freeze(['AssetRoot', 'LOD0', 'LOD1', 'LOD2', 'COLLIDER_Main', 'SOCKET_Effect']),
    requiredClips: Object.freeze([]),
    sockets: Object.freeze([{ name: 'SOCKET_Effect', position: [0, 1.2, 0] }]),
  });
}

function festivalGeometry(role, seasonIndex, roleIndex, palette) {
  const [primary, accent, glow] = palette;
  const parts = [];
  if (role === 'stage') {
    add(parts, 'stage_base', 'cylinder', [3.4, 3.7, 0.55, 8 + seasonIndex], [0, 0.28, 0], primary);
    add(parts, 'stage_backdrop', 'box', [5.8, 3.2, 0.35], [0, 1.9, -2.35], accent);
    for (let i = 0; i < 5; i += 1) add(parts, `stage_emblem_${i}`, 'icosahedron', [0.32 + i * 0.04, 0], [(i - 2) * 1.0, 2.1 + (i % 2) * 0.55, -2.05], i % 2 ? glow : primary);
  } else if (role === 'market_booth') {
    add(parts, 'booth_counter', 'box', [3.4, 1.0, 1.5], [0, 0.5, 0], primary);
    for (const side of [-1, 1]) add(parts, `booth_post_${side}`, 'cylinder', [0.1, 0.14, 3.1, 8], [side * 1.5, 1.55, 0], accent);
    add(parts, 'booth_canopy', 'cone', [2.35, 1.4, 4 + seasonIndex], [0, 3.05, 0], glow, [1, 0.7, 1], [0, Math.PI / 4 + roleIndex, 0]);
  } else {
    for (const side of [-1, 1]) add(parts, `gate_post_${side}`, 'cylinder', [0.22, 0.32, 4.2, 9], [side * 1.9, 2.1, 0], primary);
    add(parts, 'gate_arch', 'torus', [1.9, 0.25, 9, 24, Math.PI], [0, 4.0, 0], accent);
    for (const side of [-1, 1]) add(parts, `gate_lantern_${side}`, 'icosahedron', [0.45, 1], [side * 1.25, 3.2, 0], glow, [1, 1.3, 1]);
  }
  return parts;
}

function relationshipGeometry(npcId, index, palette) {
  const [primary, accent, dark] = palette;
  const parts = [];
  add(parts, 'memory_pedestal', 'cylinder', [0.9, 1.2, 0.65, 7 + index % 5], [0, 0.33, 0], dark);
  add(parts, `memory_symbol_${npcId}`, index % 3 === 0 ? 'icosahedron' : index % 3 === 1 ? 'torus' : 'cone', index % 3 === 0 ? [0.7, 1] : index % 3 === 1 ? [0.75, 0.16, 8, 20] : [0.65, 1.5, 7], [0, 1.25, 0], primary, [1, 1.15, 1], [Math.PI / 2, index * 0.31, 0]);
  for (let i = 0; i < 3; i += 1) add(parts, `memory_star_${i}`, 'icosahedron', [0.18, 0], [Math.cos(i * 2.1) * 1.15, 1.3 + i * 0.38, Math.sin(i * 2.1) * 1.15], accent);
  return parts;
}

function ecologyGeometry(family, index, palette) {
  const [primary, accent, dark] = palette;
  const parts = [];
  add(parts, 'habitat_base', family === 'reed' ? 'cylinder' : 'box', family === 'reed' ? [1.5, 1.8, 0.22, 12] : [3.2, 0.22, 2.4], [0, 0.11, 0], dark);
  if (family === 'floating') for (let i = 0; i < 7; i += 1) add(parts, `seed_${i}`, 'icosahedron', [0.18 + i % 3 * 0.05, 0], [Math.cos(i * 1.7) * 1.25, 0.55 + i % 4 * 0.45, Math.sin(i * 1.7) * 1.25], i % 2 ? primary : accent);
  else if (family === 'crystal-flora' || family === 'mushroom') for (let i = 0; i < 6; i += 1) { add(parts, `stem_${i}`, 'cylinder', [0.05, 0.1, 0.8 + i % 3 * 0.35, 7], [(i % 3 - 1) * 0.7, 0.5, (Math.floor(i / 3) - 0.5) * 0.8], dark); add(parts, `bloom_${i}`, family === 'mushroom' ? 'sphere' : 'icosahedron', family === 'mushroom' ? [0.42, 10, 7] : [0.35, 1], [(i % 3 - 1) * 0.7, 1.0 + i % 3 * 0.35, (Math.floor(i / 3) - 0.5) * 0.8], i % 2 ? primary : accent, family === 'mushroom' ? [1, 0.35, 1] : [1, 1.5, 1]); }
  else if (family === 'pollinator') for (let i = 0; i < 6; i += 1) { add(parts, `flower_${i}`, 'icosahedron', [0.3, 0], [(i % 3 - 1) * 0.9, 0.55 + i % 2 * 0.3, (Math.floor(i / 3) - 0.5) * 1.0], i % 2 ? primary : accent); add(parts, `pollinator_${i}`, 'sphere', [0.12, 8, 6], [Math.cos(i) * 1.5, 1.2 + i % 3 * 0.3, Math.sin(i) * 1.1], dark); }
  else if (family === 'mechanical') { add(parts, 'terrarium', 'cylinder', [1.4, 1.4, 2.2, 12], [0, 1.1, 0], dark); for (let i = 0; i < 3; i += 1) add(parts, `gear_${i}`, 'torus', [0.5 + i * 0.16, 0.1, 8, 18], [0, 0.7 + i * 0.55, 0.75], i % 2 ? primary : accent, [1, 1, 1], [Math.PI / 2, 0, i * 0.4]); }
  else { for (const side of [-1, 1]) add(parts, `habitat_post_${side}`, 'cylinder', [0.12, 0.18, 2.0 + index % 3 * 0.25, 8], [side * 0.9, 1.0, 0], dark); add(parts, 'habitat_bowl', family === 'reed' ? 'torus' : 'box', family === 'reed' ? [1.0, 0.18, 8, 20] : [2.4, 1.3, 1.3], [0, 1.1, 0], primary); add(parts, 'habitat_marker', 'icosahedron', [0.38, 1], [0, 2.15, 0], accent); }
  return parts;
}

function portalGeometry(index, palette) {
  const [primary, accent, glow] = palette;
  const parts = [];
  for (let ring = 0; ring < 3; ring += 1) add(parts, `portal_ring_${ring}`, 'torus', [1.1 + ring * 0.22, 0.1 + ring * 0.035, 8, 24], [0, 1.5, 0], ring % 2 ? accent : primary, [1, 1 + ring * 0.08, 1], [Math.PI / 2, index * 0.25, ring * 0.35]);
  add(parts, 'portal_core', 'cylinder', [0.92, 0.92, 0.08, 24], [0, 1.5, 0], glow, [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 4; i += 1) add(parts, `portal_orbit_${i}`, 'icosahedron', [0.16, 0], [Math.cos(i * Math.PI / 2) * 1.45, 1.5 + Math.sin(i * Math.PI / 2) * 1.45, 0], accent);
  return parts;
}

function mechanismGeometry(type, index, palette) {
  const [primary, accent, glow] = palette;
  const parts = [];
  add(parts, `${type}_base`, 'cylinder', [1.25, 1.5, 0.28, 8 + index], [0, 0.14, 0], primary);
  add(parts, `${type}_focus`, type === 'gear' ? 'torus' : type === 'crystal' ? 'icosahedron' : type === 'festival' ? 'sphere' : 'cone', type === 'gear' ? [0.85, 0.18, 9, 20] : type === 'crystal' ? [0.8, 1] : type === 'festival' ? [0.65, 12, 8] : [0.72, 1.6, 7], [0, 1.1, 0], accent, [1, type === 'crystal' ? 1.6 : 1, 1], [type === 'gear' ? Math.PI / 2 : 0, index * 0.4, 0]);
  for (let i = 0; i < 4; i += 1) add(parts, `${type}_pulse_${i}`, 'icosahedron', [0.16 + i * 0.02, 0], [Math.cos(i * Math.PI / 2) * 1.2, 0.75 + i % 2 * 0.55, Math.sin(i * Math.PI / 2) * 1.2], glow);
  return parts;
}

function combatEffectGeometry(archetype, index, palette) {
  const [primary, accent, glow] = palette;
  const parts = [];
  const ranged = ['bow', 'crossbow', 'arcane_staff', 'grimoire', 'thrown'].includes(archetype);
  if (ranged) {
    add(parts, `${archetype}_trail`, archetype === 'grimoire' ? 'torus' : 'cone', archetype === 'grimoire' ? [0.85, 0.12, 8, 20] : [0.24 + index % 3 * 0.05, 2.2, 7], [0, 0.65, 0], primary, [1, 1, 1], archetype === 'grimoire' ? [Math.PI / 2, 0, 0] : [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 4; i += 1) add(parts, `${archetype}_spark_${i}`, 'icosahedron', [0.13 + i * 0.02, 0], [Math.cos(i * 1.6) * 0.75, 0.5 + i * 0.25, Math.sin(i * 1.6) * 0.75], i % 2 ? accent : glow);
  } else {
    add(parts, `${archetype}_arc`, 'torus', [1.15 + index % 3 * 0.14, 0.16, 8, 22, Math.PI * (1.1 + index % 2 * 0.25)], [0, 0.9, 0], primary, [1.25, 1, 0.55], [Math.PI / 2, index * 0.21, 0]);
    add(parts, `${archetype}_impact`, index % 2 ? 'icosahedron' : 'sphere', index % 2 ? [0.55, 1] : [0.52, 10, 8], [0, 0.65, 0], accent, [1, 0.7, 1]);
    for (let i = 0; i < 3; i += 1) add(parts, `${archetype}_shard_${i}`, 'cone', [0.12, 0.75, 6], [(i - 1) * 0.55, 0.45, 0], glow, [1, 1, 1], [0, 0, (i - 1) * 0.45]);
  }
  return parts;
}

function relationshipPalette(index) { return effectPalette(index + 12); }
function ecologyPalette(index) { const palettes = [['#69a85b', '#b4d873', '#5b4a3a'], ['#68c8ca', '#d7f4e5', '#526d6c'], ['#d26cac', '#8fcf77', '#604a66'], ['#d6a24c', '#879790', '#4b5254']]; return palettes[index % palettes.length]; }
function effectPalette(index) { const palettes = [['#55c8e8', '#f3dc69', '#eafcff'], ['#72d17c', '#5bc2d5', '#edfff0'], ['#b57aef', '#ef87c4', '#f9eaff'], ['#ed8a4a', '#f3c75d', '#fff0c7']]; return palettes[index % palettes.length]; }
function regionMaterialProfile(regionId) { return ({ wind_highlands: 'wind-grass-generated', snow_valley: 'snow-generated', farm_plains: 'farm-wet-generated', star_village: 'village-generated', crystal_lake: 'crystal-generated', sun_canyon: 'canyon-generated', mushroom_grove: 'mushroom-generated', clockwork_ruins: 'clockwork-generated' })[regionId] || 'terrain-generated'; }
function add(parts, name, shape, args, position, color, scale = [1, 1, 1], rotation = [0, 0, 0]) { parts.push(Object.freeze({ name, shape, args, position, color, scale, rotation })); }
