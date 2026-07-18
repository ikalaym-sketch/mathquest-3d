// v0.32 Equipment & Combat 唯一資產與裝備定義來源。
// 140 GLB = 20武器本體 + 20攻擊載體 + 20命中特效 + 40既有護甲 + 20足部/飾品 + 20副手。
import { ARMORS, ARMOR_SET_META } from './armors.js';
import { WEAPONS_MELEE } from './weaponsMelee.js';
import { WEAPONS_RANGED } from './weaponsRanged.js';

const WEAPONS = Object.freeze([...WEAPONS_MELEE, ...WEAPONS_RANGED]);
const CLOTH_SET_KEYS = new Set(['leather', 'scholar', 'ninja', 'farmer', 'mage']);

export const V032_ARMOR_COMPLETION_DEFINITIONS = Object.freeze(ARMOR_SET_META.flatMap((set, setIndex) => [
  Object.freeze({
    id: `arm_${set.key}_feet`,
    name: `${set.name} Boots`,
    nameZh: `${set.nameZh}足具`,
    type: 'armor',
    slot: 'feet',
    equipSlot: 'feet',
    archetype: `${set.key}_feet`,
    visualAssetId: `equipment:armor:${set.key}_feet`,
    visualSocket: 'SOCKET_feet',
    hideBodyNodes: ['foot_l', 'foot_r'],
    setKey: set.key,
    rarity: set.rarity,
    color: set.color,
    stats: { def: Math.max(1, Math.round(set.baseDef * 0.15)) },
    description: `${set.desc}（足具部位；核心四件套之外的防禦擴充。）`,
    completionIndex: setIndex,
  }),
  Object.freeze({
    id: `arm_${set.key}_accessory`,
    name: `${set.name} Emblem`,
    nameZh: `${set.nameZh}徽記`,
    type: 'armor',
    slot: 'accessory',
    equipSlot: 'accessory',
    archetype: `${set.key}_accessory`,
    visualAssetId: `equipment:armor:${set.key}_accessory`,
    visualSocket: 'SOCKET_accessory',
    hideBodyNodes: [],
    setKey: set.key,
    rarity: set.rarity,
    color: set.color,
    stats: { def: Math.max(1, Math.round(set.baseDef * 0.05)) },
    description: `${set.desc}（飾品部位；核心四件套之外的防禦擴充。）`,
    completionIndex: setIndex,
  }),
]));

const OFFHAND_SEEDS = Object.freeze([
  ['oak_buckler', 'Oak Buckler', '橡木圓盾', 'shield', '#8f633f', 'Green'],
  ['star_guard', 'Star Guard', '星輝護盾', 'shield', '#d9bb62', 'Blue'],
  ['thorn_aegis', 'Thorn Aegis', '棘藤壁盾', 'shield', '#66864e', 'Blue'],
  ['frost_mirror', 'Frost Mirror', '霜鏡盾', 'shield', '#88bed0', 'Orange'],
  ['ember_ward', 'Ember Ward', '熾火護盾', 'shield', '#c55738', 'Orange'],
  ['moon_tome', 'Moon Tome', '月相副典', 'focus', '#796aaa', 'Blue'],
  ['sun_tome', 'Sun Tome', '日耀副典', 'focus', '#e0ad45', 'Orange'],
  ['wind_chime', 'Wind Chime', '風語鈴', 'focus', '#6cb6b0', 'Green'],
  ['crystal_focus', 'Crystal Focus', '稜晶法器', 'focus', '#8e7fc9', 'Blue'],
  ['void_focus', 'Void Focus', '虛空法器', 'focus', '#4b345f', 'Orange'],
  ['hunter_quiver', 'Hunter Quiver', '獵手箭袋', 'quiver', '#72523a', 'Green'],
  ['storm_quiver', 'Storm Quiver', '風暴箭袋', 'quiver', '#4e7898', 'Blue'],
  ['bolt_case', 'Bolt Case', '弩矢匣', 'quiver', '#636b70', 'Blue'],
  ['herbal_satchel', 'Herbal Satchel', '藥草腰囊', 'satchel', '#72884d', 'Green'],
  ['alchemist_satchel', 'Alchemist Satchel', '鍊金腰囊', 'satchel', '#9b5c6d', 'Blue'],
  ['duelist_parry', 'Duelist Parry Dagger', '決鬥格擋刃', 'parry', '#aeb7bd', 'Blue'],
  ['royal_parry', 'Royal Parry Dagger', '王家格擋刃', 'parry', '#d2b769', 'Orange'],
  ['spirit_lantern', 'Spirit Lantern', '靈息提燈', 'lantern', '#76b7b7', 'Blue'],
  ['festival_lantern', 'Festival Lantern', '慶典提燈', 'lantern', '#dc7056', 'Green'],
  ['guardian_totem', 'Guardian Totem', '守護圖騰', 'totem', '#9d7651', 'Orange'],
]);

export const V032_OFFHAND_DEFINITIONS = Object.freeze(OFFHAND_SEEDS.map(([key, name, nameZh, family, color, rarity], index) => Object.freeze({
  id: `off_${String(index + 1).padStart(2, '0')}_${key}`,
  name,
  nameZh,
  type: 'offhand',
  equipSlot: 'offHand',
  slot: 'offHand',
  archetype: family,
  visualAssetId: `equipment:offhand:${key}`,
  visualSocket: 'SOCKET_off_hand',
  handedness: 'one',
  rarity,
  color,
  stats: { def: 2 + Math.floor(index / 3), guard: 0.02 + (index % 5) * 0.01 },
  description: `${nameZh}使用共用副手防禦契約；雙手與雙持主武器會鎖定此欄。`,
})));

export const V032_EQUIPMENT_INVENTORY_DEFINITIONS = Object.freeze([
  ...WEAPONS,
  ...ARMORS,
  ...V032_ARMOR_COMPLETION_DEFINITIONS,
  ...V032_OFFHAND_DEFINITIONS,
]);

const weaponAssets = WEAPONS.flatMap((weapon, index) => [
  assetRecipe({
    id: `weapon_${weapon.id}`,
    assetId: weapon.visualAssetId,
    canonicalPath: `models/equipment/weapons/${weapon.id}.glb`,
    purpose: 'equippable-weapon',
    family: 'weapon',
    runtimeRole: 'equipment-attachment',
    ownerId: weapon.id,
    slot: 'mainHand',
    materialProfile: 'equipment-metal-generated',
    silhouette: weapon.archetype,
    proportion: `${weapon.stats?.range || 1}:${weapon.handedness}`,
    palette: weaponPalette(weapon, index),
    geometry: weaponGeometry(weapon, index),
    sockets: [socket('SOCKET_TrailOrigin', [0, 0.5, 0]), socket('SOCKET_ImpactOrigin', [0, 0.72, 0])],
    requiredNodes: ['AttachmentRoot', 'SOCKET_TrailOrigin', 'SOCKET_ImpactOrigin'],
  }),
  assetRecipe({
    id: `delivery_${weapon.id}`,
    assetId: weapon.deliveryAssetId,
    canonicalPath: `models/equipment/delivery/${weapon.id}.glb`,
    purpose: 'combat-delivery',
    family: 'combat-delivery',
    runtimeRole: 'combat-delivery-layer',
    ownerId: weapon.id,
    materialProfile: 'equipment-effect-generated',
    silhouette: weapon.attackContract.execution.shape,
    proportion: `${weapon.attackContract.execution.areaScale}:${weapon.attackContract.execution.projectileSpeed}`,
    palette: effectPalette(weapon, index),
    geometry: deliveryGeometry(weapon, index),
    requiredNodes: ['VFXRoot'],
  }),
  assetRecipe({
    id: `impact_${weapon.id}`,
    assetId: weapon.impactAssetId,
    canonicalPath: `models/equipment/impact/${weapon.id}.glb`,
    purpose: 'combat-impact',
    family: 'combat-impact',
    runtimeRole: 'combat-impact-layer',
    ownerId: weapon.id,
    materialProfile: 'equipment-effect-generated',
    silhouette: `${weapon.baseArchetype}-impact`,
    proportion: `${weapon.attackContract.execution.maxTargets}:${weapon.attackContract.execution.areaScale}`,
    palette: effectPalette(weapon, index + 3),
    geometry: impactGeometry(weapon, index),
    requiredNodes: ['VFXRoot'],
  }),
]);

const armorAssets = [...ARMORS, ...V032_ARMOR_COMPLETION_DEFINITIONS].map((item, index) => assetRecipe({
  id: `armor_${item.id}`,
  assetId: item.visualAssetId,
  canonicalPath: `models/equipment/armor/${item.setKey}/${item.equipSlot}.glb`,
  purpose: 'equippable-armor',
  family: `armor-${item.equipSlot}`,
  runtimeRole: 'equipment-attachment',
  ownerId: item.id,
  slot: item.equipSlot,
  materialProfile: CLOTH_SET_KEYS.has(item.setKey) ? 'equipment-cloth-generated' : 'equipment-metal-generated',
  silhouette: `${item.setKey}-${item.equipSlot}`,
  proportion: `${1 + (index % 5) * 0.05}:${1 + (index % 3) * 0.04}`,
  palette: [item.color, accentColor(index)],
  geometry: armorGeometry(item, index),
  requiredNodes: ['AttachmentRoot'],
}));

const offhandAssets = V032_OFFHAND_DEFINITIONS.map((item, index) => assetRecipe({
  id: `offhand_${item.id}`,
  assetId: item.visualAssetId,
  canonicalPath: `models/equipment/offhand/${item.id}.glb`,
  purpose: 'equippable-offhand',
  family: `offhand-${item.archetype}`,
  runtimeRole: 'equipment-attachment',
  ownerId: item.id,
  slot: 'offHand',
  materialProfile: ['satchel', 'quiver'].includes(item.archetype) ? 'equipment-cloth-generated' : 'equipment-metal-generated',
  silhouette: `${item.archetype}-${index + 1}`,
  proportion: `${0.75 + (index % 4) * 0.1}:${0.85 + (index % 3) * 0.08}`,
  palette: [item.color, accentColor(index + 5)],
  geometry: offhandGeometry(item, index),
  requiredNodes: ['AttachmentRoot'],
}));

export const V032_EQUIPMENT_ASSET_DEFINITIONS = Object.freeze([
  ...weaponAssets,
  ...armorAssets,
  ...offhandAssets,
]);

export const V032_EQUIPMENT_ALLOCATION = Object.freeze({
  weapon: 20,
  delivery: 20,
  impact: 20,
  armorCore: 40,
  armorCompletion: 20,
  offHand: 20,
  total: 140,
  canonicalBefore: 383,
  canonicalAfter: 523,
});

export const V032_EQUIPMENT_ASSET_COUNT = V032_EQUIPMENT_ASSET_DEFINITIONS.length;

export function getV032EquipmentRuntimeAssetIds() {
  return V032_EQUIPMENT_ASSET_DEFINITIONS.map((definition) => definition.assetId);
}

function assetRecipe(input) {
  return Object.freeze({
    category: 'equipment',
    tier: input.family.includes('impact') || input.family.includes('delivery') ? 'effect' : 'modular',
    artStatus: 'new',
    // 玩家身上與短生命週期VFX皆為近距小物件；不虛報不存在的LOD節點。
    lod: { profileId: null, ratios: [1, 1, 1] },
    ...input,
    geometry: Object.freeze(input.geometry),
    sockets: Object.freeze(input.sockets || []),
    requiredNodes: Object.freeze(input.requiredNodes || ['AttachmentRoot']),
  });
}

function socket(name, position) {
  return Object.freeze({ name, position });
}

function weaponGeometry(weapon, index) {
  const [primary, accent] = weaponPalette(weapon, index);
  const handle = part('grip', 'cylinder', [0.045, 0.055, 0.42, 8], [0, -0.24, 0], [0, 0, -0.08], [1, 1, 1], '#68482f');
  const archetype = weapon.archetype;
  if (['bow', 'crossbow'].includes(archetype)) return [
    part('bow_limb', 'torus', [0.38 + index * 0.002, 0.045, 8, 20, Math.PI], [0.12, 0.08, 0], [0, Math.PI / 2, Math.PI / 2], [1, 1, 1], primary),
    part('bow_stock', 'box', archetype === 'crossbow' ? [0.1, 0.72, 0.12] : [0.06, 0.58, 0.08], [0, -0.08, 0], [0, 0, 0], [1, 1, 1], accent),
  ];
  if (['staff', 'lance', 'blowgun', 'scythe'].includes(archetype)) return [
    part('shaft', 'cylinder', [0.035, 0.05, archetype === 'lance' ? 1.55 : 1.25, 8], [0, 0.12, 0], [0, 0, -0.08], [1, 1, 1], '#6e4b31'),
    part('head', archetype === 'scythe' ? 'torus' : archetype === 'staff' ? 'icosahedron' : 'cone', archetype === 'scythe' ? [0.33, 0.055, 7, 18, Math.PI] : archetype === 'staff' ? [0.16, 1] : [0.13, 0.48, 8], [0, 0.78, 0], [0, 0, archetype === 'scythe' ? Math.PI / 2 : 0], [1, 1, 0.7], primary),
  ];
  if (['grimoire'].includes(archetype)) return [
    part('book', 'box', [0.42, 0.52, 0.11], [0, 0.05, 0], [0.1, 0.25, 0], [1, 1, 1], primary),
    part('sigil', 'torus', [0.11, 0.025, 7, 16], [0, 0.05, 0.07], [Math.PI / 2, 0, 0], [1, 1, 0.35], accent),
  ];
  if (['orb'].includes(archetype)) return [part('orb', 'icosahedron', [0.21, 1], [0, 0.08, 0], [0, 0, 0], [1, 1, 1], primary), part('orb_ring', 'torus', [0.27, 0.03, 7, 18], [0, 0.08, 0], [Math.PI / 2, 0.2, 0], [1, 1, 1], accent)];
  if (['boomerang', 'throwing_knives', 'shuriken', 'throwing_axe'].includes(archetype)) return [
    part('thrown_core', archetype === 'boomerang' ? 'torus' : 'icosahedron', archetype === 'boomerang' ? [0.28, 0.055, 6, 14, Math.PI * 1.25] : [0.22, 0], [0, 0.05, 0], [0, 0, index * 0.2], [1.1, 0.7, 0.35], primary),
    part('thrown_edge', 'cone', [0.08, 0.32, 6], [0.18, 0.16, 0], [0, 0, -0.65], [1, 1, 0.5], accent),
  ];
  if (['gauntlets'].includes(archetype)) return [part('gauntlet', 'box', [0.28, 0.3, 0.34], [0, 0, 0.06], [0.1, 0.1, 0], [1, 1, 1], primary), part('knuckle', 'cylinder', [0.12, 0.14, 0.3, 8], [0, 0.08, 0.2], [Math.PI / 2, 0, 0], [1.1, 1, 1], accent)];
  if (['warhammer', 'greataxe'].includes(archetype)) return [handle, part('heavy_head', archetype === 'warhammer' ? 'box' : 'cone', archetype === 'warhammer' ? [0.5, 0.24, 0.24] : [0.3, 0.62, 6], [0, 0.32, 0], [0, 0, archetype === 'greataxe' ? Math.PI / 2 : 0], [1, 1, 0.8], primary)];
  const bladeLength = archetype === 'greatsword' ? 1.08 : archetype.includes('dual') ? 0.56 : 0.78;
  return [
    handle,
    part('guard', 'box', [0.34, 0.07, 0.09], [0, -0.02, 0], [0, 0, 0], [1, 1, 1], accent),
    part('blade', 'box', [archetype === 'rapier' ? 0.055 : 0.11, bladeLength, 0.075], [0, bladeLength * 0.5, 0], [0, 0, 0], [1, 1, 1], primary),
    part('tip', 'cone', [archetype === 'rapier' ? 0.045 : 0.075, 0.22, 6], [0, bladeLength + 0.11, 0], [0, 0, 0], [1, 1, 0.7], accent),
  ];
}

function deliveryGeometry(weapon, index) {
  const [primary, accent] = effectPalette(weapon, index);
  const execution = weapon.attackContract.execution;
  if (execution.projectileSpeed > 0) return [
    part('projectile_core', ['bow', 'crossbow'].includes(weapon.baseArchetype) ? 'cylinder' : 'icosahedron', ['bow', 'crossbow'].includes(weapon.baseArchetype) ? [0.035, 0.055, 0.72, 7] : [0.15 + (index % 3) * 0.02, 1], [0, 0, 0], ['bow', 'crossbow'].includes(weapon.baseArchetype) ? [Math.PI / 2, 0, 0] : [0, 0, 0], [1, 1, 1], primary),
    part('projectile_trail', 'cone', [0.1 + (index % 4) * 0.015, 0.5, 7], [0, 0, -0.35], [Math.PI / 2, 0, 0], [1, 1, 0.55], accent),
  ];
  return [
    part('attack_arc', 'torus', [0.48 + execution.areaScale * 0.08, 0.055 + (index % 3) * 0.01, 7, 20, Math.PI * (1.05 + (index % 3) * 0.14)], [0, 0, 0], [Math.PI / 2, 0, index * 0.17], [1, 0.65 + execution.areaScale * 0.12, 1], primary),
    part('attack_core', 'icosahedron', [0.09 + (index % 4) * 0.012, 0], [0, 0, 0], [0, 0, 0], [1, 1, 0.45], accent),
  ];
}

function impactGeometry(weapon, index) {
  const [primary, accent] = effectPalette(weapon, index + 3);
  return [
    part('impact_core', 'icosahedron', [0.18 + weapon.attackContract.execution.areaScale * 0.035, 1], [0, 0.2, 0], [0, index * 0.21, 0], [1, 0.8, 1], primary),
    part('impact_ring', 'torus', [0.3 + (index % 5) * 0.035, 0.04, 7, 18], [0, 0.06, 0], [Math.PI / 2, 0, index * 0.14], [1, 1, 1], accent),
    part('impact_ray', 'cone', [0.08, 0.42 + (index % 3) * 0.08, 6], [0.22, 0.28, 0], [0, 0, -0.58], [1, 1, 0.6], primary),
  ];
}

function armorGeometry(item, index) {
  const primary = item.color;
  const accent = accentColor(index);
  if (item.equipSlot === 'head') return [part('helmet', 'cylinder', [0.28, 0.34, 0.28, 10], [0, 0.03, 0], [0, index * 0.08, 0], [1, 1, 1], primary), part('crest', index % 2 ? 'cone' : 'box', index % 2 ? [0.09, 0.32, 7] : [0.08, 0.32, 0.2], [0, 0.28, -0.04], [0, 0, 0], [1, 1, 1], accent)];
  if (item.equipSlot === 'body') return [part('chest', index % 2 ? 'box' : 'cylinder', index % 2 ? [0.62, 0.76, 0.38] : [0.32, 0.38, 0.76, 12], [0, -0.03, 0], [0, 0, 0], [1, 1, 1], primary), part('chest_emblem', 'icosahedron', [0.1, 0], [0.18, 0.13, 0.22], [0, 0, 0], [1, 1, 0.45], accent)];
  if (item.equipSlot === 'hands') return [-1, 1].flatMap((side) => [part(`gauntlet_${side}`, 'box', [0.2, 0.34, 0.24], [side * 0.46, -0.04, 0], [0, 0, side * 0.08], [1, 1, 1], primary), part(`cuff_${side}`, 'torus', [0.12, 0.035, 7, 14], [side * 0.46, 0.13, 0], [Math.PI / 2, 0, 0], [1, 1, 1], accent)]);
  if (item.equipSlot === 'legs') return [-1, 1].map((side) => part(`greave_${side}`, 'cylinder', [0.13, 0.16, 0.58, 8], [side * 0.18, -0.08, 0], [0, 0, side * 0.05], [1, 1, 1], side > 0 ? primary : accent));
  if (item.equipSlot === 'feet') return [-1, 1].map((side) => part(`boot_${side}`, 'box', [0.25, 0.18, 0.4], [side * 0.18, 0, 0.08], [0, side * 0.06, 0], [1, 1, 1], side > 0 ? primary : accent));
  return [part('emblem', index % 2 ? 'icosahedron' : 'torus', index % 2 ? [0.12, 1] : [0.14, 0.035, 7, 16], [0, 0, 0], [Math.PI / 2, 0, index * 0.1], [1, 1, 0.55], primary), part('emblem_ribbon', 'box', [0.08, 0.36, 0.045], [0, -0.2, 0], [0, 0, index % 2 ? 0.25 : -0.25], [1, 1, 1], accent)];
}

function offhandGeometry(item, index) {
  const primary = item.color;
  const accent = accentColor(index + 5);
  if (item.archetype === 'shield') return [part('shield', index % 2 ? 'cylinder' : 'box', index % 2 ? [0.34, 0.36, 0.09, 12] : [0.56, 0.68, 0.1], [0, 0, 0], [Math.PI / 2, 0, index * 0.08], [1, 1, 1], primary), part('shield_boss', 'icosahedron', [0.12, 0], [0, 0, 0.08], [0, 0, 0], [1, 1, 0.5], accent)];
  if (item.archetype === 'focus') return [part('focus_core', 'icosahedron', [0.16 + (index % 3) * 0.02, 1], [0, 0, 0], [0, index * 0.15, 0], [1, 1, 1], primary), part('focus_ring', 'torus', [0.25, 0.03, 7, 18], [0, 0, 0], [Math.PI / 2, 0, index * 0.12], [1, 1, 1], accent)];
  if (item.archetype === 'quiver') return [part('quiver', 'cylinder', [0.13, 0.18, 0.65, 8], [0, 0, 0], [0.15, 0, -0.15], [1, 1, 1], primary), ...Array.from({ length: 3 }, (_, arrow) => part(`bolt_${arrow}`, 'cylinder', [0.018, 0.022, 0.75, 6], [(arrow - 1) * 0.06, 0.15, 0], [0.08, 0, -0.1 + arrow * 0.1], [1, 1, 1], accent))];
  if (item.archetype === 'satchel') return [part('satchel', 'box', [0.46, 0.38, 0.2], [0, 0, 0], [0, 0, index * 0.04], [1, 1, 1], primary), part('strap', 'torus', [0.24, 0.028, 7, 18, Math.PI], [0, 0.24, 0], [0, 0, 0], [1, 1.2, 1], accent)];
  if (item.archetype === 'parry') return [part('parry_grip', 'cylinder', [0.04, 0.05, 0.3, 7], [0, -0.18, 0], [0, 0, -0.35], [1, 1, 1], '#68482f'), part('parry_blade', 'box', [0.07, 0.54, 0.06], [0, 0.22, 0], [0, 0, -0.35], [1, 1, 1], primary), part('parry_guard', 'box', [0.28, 0.06, 0.08], [0, -0.02, 0], [0, 0, -0.35], [1, 1, 1], accent)];
  if (item.archetype === 'lantern') return [part('lantern_frame', 'box', [0.3, 0.42, 0.3], [0, 0, 0], [0, index * 0.08, 0], [1, 1, 1], primary), part('lantern_light', 'icosahedron', [0.13, 1], [0, 0, 0], [0, 0, 0], [1, 1.3, 1], accent), part('lantern_handle', 'torus', [0.17, 0.025, 7, 16, Math.PI], [0, 0.25, 0], [0, 0, 0], [1, 1, 1], primary)];
  return [part('totem_body', 'cylinder', [0.16, 0.2, 0.52, 8], [0, 0, 0], [0, index * 0.08, 0], [1, 1, 1], primary), part('totem_face', 'icosahedron', [0.12, 0], [0, 0.18, 0.16], [0, 0, 0], [1, 1, 0.45], accent)];
}

function weaponPalette(weapon, index) {
  const rarity = weapon.rarity === 'Orange' ? '#d89037' : weapon.rarity === 'Blue' ? '#5592c7' : '#8a9770';
  return [rarity, accentColor(index)];
}

function effectPalette(weapon, index) {
  if (weapon.stats?.element === 'fire') return ['#ff7848', '#ffd36a'];
  if (weapon.stats?.poison) return ['#7fc85a', '#d4f173'];
  if (weapon.type === 'ranged') return [accentColor(index), '#8fe5ed'];
  return ['#e8d7a7', accentColor(index)];
}

function accentColor(index) {
  return ['#d6b85d', '#72a6c7', '#b26f72', '#70a36a', '#8d72bb', '#d17b47'][index % 6];
}

function part(name, shape, args, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#cccccc') {
  return Object.freeze({ name, shape, args, position, rotation, scale, color });
}
