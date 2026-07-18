// v0.30 星光村／農莊共用程序幾何 Builder。
// 所有幾何都由 family 與用途決定輪廓；LOD 透過減少結構零件與曲面分段實際降低三角形，不以縮放模型冒充減面。
import * as THREE from 'three';
import { enforceLodBudgets } from '../lod/lodBudgetEnforcer.mjs';

const MATERIAL_CACHE = new Map();

export function createVillageFarmAssetScene(definition) {
  const scene = new THREE.Scene();
  scene.name = `${definition.id}_scene`;

  const root = new THREE.Group();
  root.name = definition.id;
  root.userData = {
    assetId: definition.assetId,
    purpose: definition.purpose,
    silhouette: definition.silhouette,
    proportion: definition.proportion,
    lodContract: 'LOD0/LOD1/LOD2',
  };
  scene.add(root);

  const palette = createPalette(definition);
  const lod0 = buildLodGroup(definition, palette, 0);
  const lod1 = buildLodGroup(definition, palette, 1);
  const lod2 = buildLodGroup(definition, palette, 2);
  lod0.visible = true;
  lod1.visible = false;
  lod2.visible = false;
  root.add(lod0, lod1, lod2);

  addContractNodes(root, definition);
  enforceLodBudgets(scene, [1, 0.53, 0.2]);
  return scene;
}

function buildLodGroup(definition, palette, lod) {
  const group = new THREE.Group();
  group.name = `LOD${lod}`;
  group.userData = { lod, generatedBy: 'villageFarmGeometryBuilder' };

  const family = definition.family || 'generic';
  if (family.startsWith('building_')) buildBuilding(group, definition, palette, lod);
  else if (family.startsWith('module_')) buildBuildingModule(group, family, palette, lod);
  else if (family.startsWith('tool_')) buildTool(group, family, palette, lod);
  else if (family.startsWith('crop_')) buildCrop(group, definition, family, palette, lod);
  else if (family === 'landmark_tree') buildLandmarkTree(group, palette, lod);
  else if (family === 'landmark_fountain') buildFountain(group, palette, lod);
  else if (['tower', 'silo'].includes(family)) buildTower(group, family, palette, lod);
  else if (['bridge'].includes(family)) buildBridge(group, palette, lod);
  else if (['greenhouse'].includes(family)) buildGreenhouse(group, palette, lod);
  else if (['animal_facility', 'tool_shed'].includes(family)) buildShed(group, definition, palette, lod);
  else if (['processing_machine', 'irrigation', 'collector', 'dryer'].includes(family)) buildMachine(group, definition, palette, lod);
  else if (['cart', 'picnic', 'play_set', 'stage'].includes(family)) buildWideProp(group, definition, palette, lod);
  else buildProp(group, definition, palette, lod);

  group.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  return group;
}

function buildBuilding(group, definition, palette, lod) {
  const civic = definition.family === 'building_civic';
  const learning = definition.family === 'building_learning';
  const workshop = definition.family === 'building_workshop';
  const width = civic ? 7.6 : learning ? 7.1 : 6.2;
  const depth = civic ? 5.8 : 5.0;
  const height = civic ? 4.7 : 3.8;

  addBox(group, `${definition.id}_body`, [width, height, depth], palette.wall, [0, height / 2, 0]);
  addBox(group, `${definition.id}_foundation`, [width + 0.45, 0.35, depth + 0.45], palette.stone, [0, 0.18, 0]);
  addRoof(group, `${definition.id}_roof`, width + 0.65, depth + 0.65, height + 0.65, palette.roof, lod);

  if (lod <= 1) {
    addBox(group, 'door', [1.25, 2.25, 0.22], palette.wood, [0, 1.12, depth / 2 + 0.12]);
    addBox(group, 'door_frame_top', [1.55, 0.18, 0.24], palette.trim, [0, 2.3, depth / 2 + 0.13]);
    for (const x of [-width * 0.28, width * 0.28]) {
      addBox(group, `window_${x < 0 ? 'left' : 'right'}`, [1.25, 1.25, 0.18], palette.glass, [x, 2.25, depth / 2 + 0.11]);
      if (lod === 0) {
        addBox(group, `window_bar_v_${x}`, [0.08, 1.25, 0.21], palette.trim, [x, 2.25, depth / 2 + 0.12]);
        addBox(group, `window_bar_h_${x}`, [1.25, 0.08, 0.21], palette.trim, [x, 2.25, depth / 2 + 0.12]);
      }
    }
  }

  if (lod === 0) {
    addBox(group, 'sign', [2.5, 0.72, 0.18], palette.sign, [0, 3.25, depth / 2 + 0.2]);
    addBox(group, 'porch', [3.4, 0.22, 1.5], palette.wood, [0, 0.18, depth / 2 + 0.65]);
    for (const x of [-1.45, 1.45]) addCylinder(group, `porch_post_${x}`, 0.14, 0.16, 2.7, 8, palette.wood, [x, 1.45, depth / 2 + 1.12]);
    addBox(group, 'porch_beam', [3.3, 0.2, 0.2], palette.wood, [0, 2.75, depth / 2 + 1.12]);
    addCylinder(group, 'chimney', 0.32, 0.38, 1.75, 8, palette.stone, [width * 0.28, height + 1.15, -depth * 0.15]);
    if (workshop) {
      addBox(group, 'workshop_side_awning', [2.3, 0.22, 2.0], palette.roof, [-width / 2 - 0.75, 2.25, 0], [0, 0, -0.18]);
      addCylinder(group, 'workshop_stack', 0.25, 0.33, 2.2, 8, palette.metal, [width / 2 - 0.65, height + 0.95, 0]);
    }
    if (civic || learning) {
      addCylinder(group, 'clock_or_emblem', 0.7, 0.7, 0.18, 16, palette.accent, [0, height + 1.45, depth / 2 + 0.08], [Math.PI / 2, 0, 0]);
    }
  }
}

function addRoof(group, name, width, depth, y, color, lod) {
  const segments = lod === 0 ? 4 : 3;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.72, 2.3, segments), material(color));
  roof.name = name;
  roof.position.set(0, y, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  group.add(roof);
}

function buildBuildingModule(group, family, palette, lod) {
  if (family === 'module_roof') {
    addRoof(group, 'roof_module', 4.2, 3.6, 1.2, palette.roof, lod);
    // LOD0加入真正屋脊與瓦條，讓LOD2可維持20%預算而不受最小六頂點限制扭曲。
    if (lod === 0) {
      addBox(group, 'roof_ridge', [4.25, 0.12, 0.16], palette.trim, [0, 2.32, 0], [0, Math.PI / 4, 0]);
      for (const z of [-1.05, -0.35, 0.35, 1.05]) {
        addBox(group, `roof_tile_${z}`, [3.7, 0.06, 0.08], palette.trim, [0, 1.55 - Math.abs(z) * 0.18, z], [0, Math.PI / 4, 0]);
      }
    }
  } else if (family === 'module_wall') {
    addBox(group, 'wall', [3.4, 2.8, 0.28], palette.wall, [0, 1.4, 0]);
    if (lod < 2) for (const x of [-1.2, 1.2]) addBox(group, `beam_${x}`, [0.18, 2.8, 0.32], palette.wood, [x, 1.4, 0]);
  } else if (family === 'module_door') {
    addBox(group, 'door', [1.5, 2.5, 0.2], palette.wood, [0, 1.25, 0]);
    if (lod < 2) for (const x of [-0.85, 0.85]) addBox(group, `frame_${x}`, [0.16, 2.8, 0.24], palette.trim, [x, 1.4, 0]);
  } else if (family === 'module_window') {
    addBox(group, 'window', [1.8, 1.5, 0.16], palette.glass, [0, 0.75, 0]);
    if (lod < 2) {
      addBox(group, 'frame_v', [0.12, 1.7, 0.22], palette.trim, [0, 0.75, 0]);
      addBox(group, 'frame_h', [2.0, 0.12, 0.22], palette.trim, [0, 0.75, 0]);
    }
  } else if (family === 'module_chimney') {
    addCylinder(group, 'chimney', 0.42, 0.5, 2.8, lod === 0 ? 10 : 6, palette.stone, [0, 1.4, 0]);
    if (lod < 2) addBox(group, 'cap', [1.05, 0.22, 1.05], palette.trim, [0, 2.82, 0]);
  } else {
    addBox(group, 'sign_board', [2.4, 0.85, 0.18], palette.sign, [0, 1.7, 0]);
    if (lod < 2) for (const x of [-1, 1]) addCylinder(group, `post_${x}`, 0.1, 0.12, 2.2, 6, palette.wood, [x, 1.1, 0]);
  }
}

function buildTool(group, family, palette, lod) {
  const handleLength = family === 'tool_fishing_rod' ? 2.8 : 2.1;
  addCylinder(group, 'handle', 0.07, 0.09, handleLength, lod === 0 ? 10 : 6, palette.wood, [0, handleLength / 2, 0], [0, 0, -0.15]);
  if (family === 'tool_watering_can') {
    addCylinder(group, 'can_body', 0.38, 0.42, 0.65, lod === 0 ? 12 : 8, palette.metal, [0.38, 0.45, 0], [0, 0, Math.PI / 2]);
    if (lod < 2) addCylinder(group, 'spout', 0.08, 0.16, 0.9, 8, palette.metal, [0.78, 0.45, 0], [0, 0, Math.PI / 2]);
  } else if (family === 'tool_seed_bag') {
    addSphere(group, 'bag', 0.5, lod === 0 ? 12 : 8, 6, palette.cloth, [0.25, 0.45, 0], [1, 1.15, 0.7]);
  } else if (family === 'tool_fishing_rod') {
    if (lod < 2) addTorus(group, 'reel', 0.22, 0.07, 8, lod === 0 ? 16 : 10, palette.metal, [0.1, 0.65, 0]);
  } else {
    const headColor = family === 'tool_sickle' ? palette.metal : palette.darkMetal;
    if (family === 'tool_sickle') addTorus(group, 'blade', 0.42, 0.08, 6, lod === 0 ? 18 : 10, headColor, [0.26, handleLength - 0.08, 0], [0, 0, 0], Math.PI * 1.35);
    else if (family === 'tool_hoe') addBox(group, 'head', [0.78, 0.12, 0.32], headColor, [0.2, handleLength - 0.02, 0], [0, 0, 0.15]);
    else if (family === 'tool_hammer') addBox(group, 'head', [0.75, 0.3, 0.32], headColor, [0.18, handleLength - 0.03, 0]);
    else if (family === 'tool_axe') addBox(group, 'head', [0.55, 0.75, 0.18], headColor, [0.18, handleLength - 0.08, 0], [0, 0, -0.25]);
    else addBox(group, 'head', [0.82, 0.14, 0.3], headColor, [0.2, handleLength - 0.03, 0]);
    if (lod === 0) addBox(group, 'grip_wrap', [0.18, 0.55, 0.18], palette.cloth, [-0.08, 0.45, 0], [0, 0, -0.15]);
  }
}

function buildCrop(group, definition, family, palette, lod) {
  const stage = family.replace('crop_', '');
  if (stage === 'seed') {
    addSphere(group, 'seed', 0.12, lod === 0 ? 10 : 6, 5, palette.seed, [0, 0.12, 0], [1, 0.65, 1]);
    return;
  }
  const stems = stage === 'sprout' ? (lod === 0 ? 2 : 1) : stage === 'growing' ? (lod === 0 ? 5 : lod === 1 ? 3 : 1) : (lod === 0 ? 7 : lod === 1 ? 4 : 2);
  for (let i = 0; i < stems; i += 1) {
    const angle = (i / Math.max(1, stems)) * Math.PI * 2;
    const radius = stage === 'sprout' ? 0.07 : 0.18;
    addCylinder(group, `stem_${i}`, 0.025, 0.04, stage === 'sprout' ? 0.35 : stage === 'growing' ? 0.65 : 0.85, lod === 0 ? 7 : 5, palette.leaf, [Math.cos(angle) * radius, 0.34, Math.sin(angle) * radius], [0.08 * Math.sin(angle), 0, 0.1 * Math.cos(angle)]);
  }
  if (stage === 'mature') {
    const fruitCount = lod === 0 ? 5 : lod === 1 ? 3 : 1;
    for (let i = 0; i < fruitCount; i += 1) {
      const angle = (i / fruitCount) * Math.PI * 2;
      addSphere(group, `produce_${i}`, 0.18 + (i % 2) * 0.04, lod === 0 ? 10 : 6, 6, palette.produce, [Math.cos(angle) * 0.25, 0.55 + (i % 2) * 0.22, Math.sin(angle) * 0.25]);
    }
  }
}

function buildLandmarkTree(group, palette, lod) {
  addCylinder(group, 'trunk', 0.55, 0.85, 6.2, lod === 0 ? 12 : 7, palette.wood, [0, 3.1, 0]);
  const crownCount = lod === 0 ? 11 : lod === 1 ? 6 : 2;
  for (let i = 0; i < crownCount; i += 1) {
    const angle = (i / crownCount) * Math.PI * 2;
    addSphere(group, `crown_${i}`, 1.45, lod === 0 ? 12 : 7, lod === 0 ? 8 : 5, i % 3 === 0 ? palette.accent : palette.leaf, [Math.cos(angle) * 1.25, 5.3 + (i % 3) * 0.45, Math.sin(angle) * 1.25], [1, 0.9, 1]);
  }
}

function buildFountain(group, palette, lod) {
  addCylinder(group, 'basin', 2.2, 2.45, 0.55, lod === 0 ? 20 : lod === 1 ? 12 : 8, palette.stone, [0, 0.28, 0]);
  addCylinder(group, 'pillar', 0.32, 0.45, 2.1, lod === 0 ? 12 : 8, palette.trim, [0, 1.35, 0]);
  if (lod < 2) addCylinder(group, 'upper_bowl', 0.95, 1.1, 0.35, lod === 0 ? 18 : 10, palette.stone, [0, 2.35, 0]);
  if (lod === 0) for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    addSphere(group, `water_orb_${i}`, 0.18, 8, 6, palette.glass, [Math.cos(angle) * 0.75, 2.55, Math.sin(angle) * 0.75]);
  }
}

function buildTower(group, family, palette, lod) {
  addCylinder(group, 'tower_body', family === 'silo' ? 1.7 : 1.9, family === 'silo' ? 2.0 : 2.3, family === 'silo' ? 6 : 8, lod === 0 ? 14 : lod === 1 ? 9 : 6, family === 'silo' ? palette.metal : palette.stone, [0, family === 'silo' ? 3 : 4, 0]);
  addRoof(group, 'tower_roof', family === 'silo' ? 4.0 : 4.6, family === 'silo' ? 4.0 : 4.6, family === 'silo' ? 6.6 : 8.6, palette.roof, lod);
  if (lod < 2) for (const y of [2.0, 4.0, 6.0]) addBox(group, `window_${y}`, [0.8, 0.9, 0.16], palette.glass, [0, y, 2.02]);
  if (lod === 0 && family !== 'silo') addCylinder(group, 'clock', 0.9, 0.9, 0.16, 20, palette.accent, [0, 6.7, 2.28], [Math.PI / 2, 0, 0]);
}

function buildBridge(group, palette, lod) {
  const planks = lod === 0 ? 14 : lod === 1 ? 8 : 3;
  for (let i = 0; i < planks; i += 1) addBox(group, `plank_${i}`, [4.2, 0.18, 0.55], i % 2 ? palette.wood : palette.trim, [0, 0.35 + Math.sin((i / Math.max(1, planks - 1)) * Math.PI) * 0.65, -3.5 + i * (7 / Math.max(1, planks - 1))]);
  if (lod < 2) for (const side of [-1, 1]) {
    addBox(group, `rail_${side}`, [0.12, 0.12, 7.6], palette.darkWood, [side * 2.0, 1.25, 0]);
    if (lod === 0) for (let i = 0; i < 5; i += 1) addBox(group, `post_${side}_${i}`, [0.15, 1.25, 0.15], palette.darkWood, [side * 2.0, 0.78, -3.4 + i * 1.7]);
  }
}

function buildGreenhouse(group, palette, lod) {
  addBox(group, 'base', [6.2, 0.35, 4.2], palette.stone, [0, 0.18, 0]);
  addBox(group, 'glass_body', [5.7, 3.0, 3.8], palette.glass, [0, 1.7, 0]);
  addRoof(group, 'glass_roof', 6.0, 4.0, 3.9, palette.glass, lod);
  if (lod < 2) {
    for (const x of [-2.6, 0, 2.6]) addBox(group, `frame_${x}`, [0.12, 3.3, 4.0], palette.metal, [x, 1.7, 0]);
    if (lod === 0) for (const z of [-1.8, 0, 1.8]) addBox(group, `cross_${z}`, [5.8, 0.12, 0.12], palette.metal, [0, 2.2, z]);
  }
}

function buildShed(group, definition, palette, lod) {
  const width = definition.family === 'animal_facility' ? 5.0 : 4.2;
  addBox(group, 'shed_body', [width, 2.8, 3.8], palette.wall, [0, 1.4, 0]);
  addRoof(group, 'shed_roof', width + 0.5, 4.2, 3.2, palette.roof, lod);
  addBox(group, 'opening', [1.6, 2.0, 0.2], palette.darkWood, [0, 1.0, 2.0]);
  if (lod < 2) for (const x of [-width * 0.4, width * 0.4]) addCylinder(group, `post_${x}`, 0.13, 0.17, 2.8, 7, palette.wood, [x, 1.4, 2.15]);
  if (lod === 0) {
    addBox(group, 'side_fence', [2.4, 1.1, 0.16], palette.wood, [width / 2 + 1.1, 0.55, 0]);
    addBox(group, 'name_board', [2.0, 0.55, 0.16], palette.sign, [0, 2.55, 2.08]);
  }
}

function buildMachine(group, definition, palette, lod) {
  addBox(group, 'machine_body', [1.8, 1.8, 1.5], palette.metal, [0, 0.9, 0]);
  addCylinder(group, 'machine_core', 0.48, 0.58, 1.7, lod === 0 ? 14 : lod === 1 ? 9 : 6, palette.accent, [0, 1.9, 0], [Math.PI / 2, 0, 0]);
  if (lod < 2) {
    addBox(group, 'input_hopper', [1.15, 0.8, 1.0], palette.wood, [-0.7, 2.35, 0]);
    addBox(group, 'output_tray', [1.35, 0.18, 0.9], palette.trim, [0.9, 0.75, 0]);
  }
  if (lod === 0) {
    addTorus(group, 'wheel', 0.55, 0.11, 8, 18, palette.darkMetal, [0, 1.65, 0.83], [0, Math.PI / 2, 0]);
    for (let i = 0; i < 4; i += 1) addBox(group, `control_${i}`, [0.16, 0.16, 0.08], i % 2 ? palette.accent : palette.glass, [-0.55 + i * 0.36, 1.1, 0.79]);
  }
}

function buildWideProp(group, definition, palette, lod) {
  addBox(group, 'platform', [3.8, 0.28, 2.4], palette.wood, [0, 0.14, 0]);
  const posts = lod === 0 ? 4 : lod === 1 ? 2 : 0;
  for (let i = 0; i < posts; i += 1) {
    const x = i % 2 ? 1.6 : -1.6;
    const z = i < 2 ? -0.9 : 0.9;
    addCylinder(group, `post_${i}`, 0.1, 0.13, 2.2, 7, palette.darkWood, [x, 1.1, z]);
  }
  if (lod < 2) addBox(group, 'top', [3.4, 0.22, 1.5], palette.accent, [0, 2.2, 0]);
  if (lod === 0) {
    addBox(group, 'detail_a', [0.7, 0.7, 0.7], palette.trim, [-0.8, 0.65, 0]);
    addBox(group, 'detail_b', [0.7, 0.7, 0.7], palette.sign, [0.8, 0.65, 0]);
  }
}

function buildProp(group, definition, palette, lod) {
  const family = definition.family;
  if (['lamp', 'signpost', 'banner', 'birdhouse', 'mailbox', 'dummy', 'telescope', 'music', 'easel'].includes(family)) {
    addCylinder(group, 'post', 0.1, 0.14, 2.3, lod === 0 ? 9 : 6, palette.wood, [0, 1.15, 0]);
    addBox(group, 'head', family === 'banner' ? [1.2, 1.6, 0.08] : [0.85, 0.7, 0.5], family === 'lamp' ? palette.glass : palette.accent, [0, 2.25, 0]);
    if (lod < 2) addBox(group, 'base', [0.8, 0.2, 0.8], palette.stone, [0, 0.1, 0]);
    if (lod === 0) addTorus(group, 'detail_ring', 0.34, 0.06, 7, 14, palette.trim, [0, 1.75, 0], [Math.PI / 2, 0, 0]);
    return;
  }
  if (['barrel', 'well', 'basket', 'pottery', 'scale', 'compost', 'bee_hive'].includes(family)) {
    addCylinder(group, 'body', 0.62, 0.72, 1.15, lod === 0 ? 12 : lod === 1 ? 8 : 5, palette.wood, [0, 0.58, 0]);
    if (lod < 2) for (const y of [0.25, 0.9]) addTorus(group, `ring_${y}`, 0.64, 0.05, 6, lod === 0 ? 14 : 8, palette.metal, [0, y, 0], [Math.PI / 2, 0, 0]);
    if (lod === 0) addBox(group, 'lid', [1.05, 0.12, 1.05], palette.trim, [0, 1.18, 0]);
    return;
  }
  if (['fence', 'fence_gate', 'trough', 'ladder', 'laundry'].includes(family)) {
    addBox(group, 'rail_a', [3.0, 0.16, 0.16], palette.wood, [0, 0.75, 0]);
    if (lod < 2) addBox(group, 'rail_b', [3.0, 0.16, 0.16], palette.wood, [0, 1.25, 0]);
    const postCount = lod === 0 ? 3 : lod === 1 ? 2 : 1;
    for (let i = 0; i < postCount; i += 1) addBox(group, `post_${i}`, [0.18, 1.6, 0.18], palette.darkWood, [-1.4 + i * (2.8 / Math.max(1, postCount - 1)), 0.8, 0]);
    if (lod === 0 && family === 'laundry') addBox(group, 'cloth', [1.1, 0.85, 0.06], palette.cloth, [0.45, 1.55, 0]);
    return;
  }

  // 一般家具、箱櫃、爐具與展示道具採主體＋功能零件組合。
  addBox(group, 'body', [1.5, family === 'chair' ? 0.55 : 1.1, 1.1], palette.wood, [0, family === 'chair' ? 0.55 : 0.55, 0]);
  if (lod < 2) {
    addBox(group, 'upper', [1.3, 0.65, 0.42], palette.accent, [0, 1.35, -0.28]);
    addBox(group, 'functional_surface', [1.75, 0.14, 1.25], palette.trim, [0, 1.12, 0]);
  }
  if (lod === 0) {
    for (const x of [-0.58, 0.58]) for (const z of [-0.38, 0.38]) addBox(group, `leg_${x}_${z}`, [0.14, 0.7, 0.14], palette.darkWood, [x, 0.35, z]);
    addBox(group, 'accent_panel', [0.7, 0.35, 0.08], palette.sign, [0, 0.62, 0.58]);
  }
}

function addContractNodes(root, definition) {
  const collider = new THREE.Object3D();
  collider.name = 'COLLIDER_Main';
  collider.userData = { shape: definition.tier === 'hero' ? 'compound-cuboid' : 'cuboid', family: definition.family };
  root.add(collider);

  const sockets = ['Interaction'];
  if (definition.tier === 'hero') sockets.push('Entrance', 'Event', 'InteriorOrigin');
  if (definition.group === 'tools') sockets.push('Grip', 'Trail');
  if (definition.group === 'crops') sockets.push('Harvest', 'VFX');
  if (definition.group === 'processing') sockets.push('Input', 'Output', 'Worker');
  for (const socketId of sockets) {
    const socket = new THREE.Object3D();
    socket.name = `SOCKET_${socketId}`;
    socket.position.set(0, socketId === 'Entrance' ? 0 : 1, socketId === 'Entrance' ? 2.8 : 0);
    socket.userData = { socketType: socketId.toLowerCase(), assetId: definition.assetId };
    root.add(socket);
  }
}

function createPalette(definition) {
  const seed = hashString(definition.assetId);
  const hue = (seed % 360) / 360;
  const accent = new THREE.Color().setHSL(hue, definition.group === 'crops' ? 0.62 : 0.48, 0.58);
  const second = new THREE.Color().setHSL((hue + 0.12) % 1, 0.42, 0.72);
  return {
    wall: definition.assetId.startsWith('village:') ? '#e9c986' : '#c79a63',
    roof: `#${new THREE.Color().setHSL((hue + 0.92) % 1, 0.48, 0.43).getHexString()}`,
    wood: '#9a6843', darkWood: '#5d3c2b', stone: '#9b9b91', trim: '#e7d49f', sign: `#${second.getHexString()}`,
    glass: '#86d8e6', metal: '#9aa7ae', darkMetal: '#58646b', cloth: '#d88fac', accent: `#${accent.getHexString()}`,
    leaf: definition.assetId.includes('wheat') || definition.assetId.includes('corn') ? '#78a94e' : '#55a85c',
    seed: '#5a3b24', produce: definition.assetId.includes('tomato') || definition.assetId.includes('strawberry') ? '#dc4c4c' : definition.assetId.includes('pumpkin') || definition.assetId.includes('carrot') ? '#e88b32' : '#e6cf55',
  };
}

function material(color) {
  const key = new THREE.Color(color).getHexString();
  if (!MATERIAL_CACHE.has(key)) MATERIAL_CACHE.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: key.includes('9aa7') ? 0.28 : 0.02 }));
  return MATERIAL_CACHE.get(key);
}

function addBox(group, name, size, color, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  mesh.name = name; mesh.position.fromArray(position); mesh.rotation.fromArray(rotation); group.add(mesh); return mesh;
}
function addCylinder(group, name, top, bottom, height, segments, color, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, Math.max(3, segments)), material(color));
  mesh.name = name; mesh.position.fromArray(position); mesh.rotation.fromArray(rotation); group.add(mesh); return mesh;
}
function addSphere(group, name, radius, widthSegments, heightSegments, color, position = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, Math.max(5, widthSegments), Math.max(4, heightSegments)), material(color));
  mesh.name = name; mesh.position.fromArray(position); mesh.scale.fromArray(scale); group.add(mesh); return mesh;
}
function addTorus(group, name, radius, tube, radialSegments, tubularSegments, color, position = [0, 0, 0], rotation = [0, 0, 0], arc = Math.PI * 2) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, Math.max(4, radialSegments), Math.max(6, tubularSegments), arc), material(color));
  mesh.name = name; mesh.position.fromArray(position); mesh.rotation.fromArray(rotation); group.add(mesh); return mesh;
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
