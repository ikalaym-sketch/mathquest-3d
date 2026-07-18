// v0.33 區域、森林、生物與既有遭遇角色共用 Geometry Builder。
// 新資產走 Recipe Schema；既有 40 隻敵人以區域形態重製，Boss 不得只換色。
import * as THREE from 'three';
import { normalizeAssetRecipe } from '../recipes/assetRecipeSchema.mjs';
import { buildPrimitiveGeometry } from './geometryBuilder.mjs';
import { resolvePipelineMaterial } from '../material/materialResolver.mjs';
import { enforceLodBudgets } from '../lod/lodBudgetEnforcer.mjs';

export function buildRegionCreatureAssetScene(definition) {
  const recipe = normalizeAssetRecipe(definition);
  const scene = new THREE.Scene();
  scene.name = `${definition.id}_scene`;
  const creature = recipe.category === 'creature';
  const root = new THREE.Group();
  root.name = creature ? 'ActorRoot' : 'AssetRoot';
  root.userData = {
    assetId: recipe.assetId,
    purpose: recipe.purpose,
    silhouette: recipe.silhouette,
    proportion: recipe.proportion,
    recipeContract: 'MathQuestAssetRecipeV1',
  };
  scene.add(root);

  const lodParent = creature ? new THREE.Group() : root;
  if (creature) {
    lodParent.name = 'Body';
    root.add(lodParent);
  }
  const lod0 = createRecipeLod(recipe, 'LOD0');
  const lod1 = createRecipeLod(recipe, 'LOD1');
  const lod2 = createRecipeLod(recipe, 'LOD2');
  lod0.visible = true;
  lod1.visible = false;
  lod2.visible = false;
  lodParent.add(lod0, lod1, lod2);

  if (creature) {
    const socket = new THREE.Object3D();
    socket.name = 'SOCKET_Effect';
    socket.position.set(0, 1.25, 0);
    root.add(socket);
  } else {
    const collider = new THREE.Object3D();
    collider.name = 'COLLIDER_Main';
    collider.userData = { shape: 'box', runtimeOnly: true, solid: recipe.role !== 'ground-decal' };
    root.add(collider);
    const story = new THREE.Object3D();
    story.name = 'SOCKET_Story';
    story.position.set(0, recipe.tier === 'hero' ? 2.2 : 1.1, 0);
    root.add(story);
  }
  enforceLodBudgets(scene, recipe.lod.ratios);
  return { scene, animations: creature ? createAmbientCreatureAnimations() : [] };
}

function createRecipeLod(recipe, name) {
  const group = new THREE.Group();
  group.name = name;
  group.userData = { lod: Number(name.slice(-1)), source: 'regionCreatureGeometryBuilder' };
  for (const part of recipe.geometry) {
    const material = resolvePipelineMaterial({
      profileId: 'toon',
      color: part.color || recipe.palette?.[0] || '#cccccc',
      roughness: recipe.category === 'creature' ? 0.86 : 0.91,
      metalness: recipe.regionId === 'clockwork_ruins' ? 0.28 : 0.02,
    });
    const mesh = new THREE.Mesh(buildPrimitiveGeometry(part), material);
    mesh.name = part.name;
    mesh.position.fromArray(part.position || [0, 0, 0]);
    mesh.rotation.fromArray(part.rotation || [0, 0, 0]);
    mesh.scale.fromArray(part.scale || [1, 1, 1]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

function createAmbientCreatureAnimations() {
  return [
    new THREE.AnimationClip('Idle', 2.2, [
      new THREE.VectorKeyframeTrack('Body.position', [0, 1.1, 2.2], [0, 0, 0, 0, 0.1, 0, 0, 0, 0]),
      quaternionTrack('Body', 'y', [0, 1.1, 2.2], [-0.08, 0.08, -0.08]),
    ]),
    new THREE.AnimationClip('Move', 0.8, [
      new THREE.VectorKeyframeTrack('Body.position', [0, 0.2, 0.4, 0.6, 0.8], [0, 0, 0, 0, 0.13, 0.05, 0, 0, 0.1, 0, 0.13, 0.05, 0, 0, 0]),
      quaternionTrack('Body', 'z', [0, 0.2, 0.4, 0.6, 0.8], [0, 0.1, 0, -0.1, 0]),
    ]),
  ];
}

export function buildEncounterActorScene(definition, tier) {
  const scene = new THREE.Scene();
  const actor = new THREE.Group();
  actor.name = 'ActorRoot';
  actor.userData = { assetType: 'encounter_actor', actorId: definition.id, tier, silhouetteRevision: 'v0.33' };
  scene.add(actor);
  const body = new THREE.Group();
  body.name = 'Body';
  actor.add(body);
  const attackPivot = new THREE.Group();
  attackPivot.name = 'AttackPivot';
  body.add(attackPivot);

  const regionKey = definition.id.split('_')[0];
  const palette = {
    primary: definition.color,
    accent: mixColor(definition.color, '#ffffff', 0.28),
    dark: mixColor(definition.color, '#18202c', 0.5),
  };
  if (tier === 'boss') buildBossSilhouette(body, attackPivot, regionKey, palette);
  else buildEncounterSilhouette(body, attackPivot, definition, tier, regionKey, palette);

  // Boss保留專屬命名幾何，同時提供既有命中／特效系統使用的通用Head錨點。
  if (!actor.getObjectByName('Head')) {
    const headAnchor = new THREE.Object3D();
    headAnchor.name = 'Head';
    headAnchor.position.set(0, regionKey === 'mushroom' ? 3.2 : regionKey === 'clockwork' ? 3.7 : 2.35, regionKey === 'crystal' || regionKey === 'canyon' ? 1.35 : 0.75);
    body.add(headAnchor);
  }

  const effectSocket = new THREE.Object3D();
  effectSocket.name = 'SOCKET_HitEffect';
  effectSocket.position.set(0, tier === 'boss' ? 2.1 : 1.1, 0);
  actor.add(effectSocket);
  return { scene, animations: createEncounterAnimations(tier) };
}

function buildEncounterSilhouette(body, attackPivot, definition, tier, regionKey, palette) {
  const scale = tier === 'elite' ? 1.22 : 0.92;
  const shape = definition.behavior === 'hop' ? 'sphere'
    : definition.behavior === 'kite' ? 'cone'
      : ['tank', 'shield'].includes(definition.behavior) ? 'box'
        : definition.behavior === 'weeping' ? 'icosahedron' : 'icosahedron';
  addPrimitive(body, 'CoreBody', shape, shape === 'sphere' ? [0.65, 12, 9] : shape === 'cone' ? [0.62, 1.35, 8] : shape === 'box' ? [1.05, 1.25, 0.85] : [0.72, 1], [0, 0.72, 0], [scale, scale, scale], palette.primary);
  addPrimitive(body, 'Head', 'sphere', [0.32, 10, 8], [0, 1.5, 0.18], [scale, scale, scale], palette.accent);
  addRegionMotif(body, attackPivot, regionKey, palette, tier);
  if (definition.behavior === 'burrow') for (const side of [-1, 1]) addPrimitive(attackPivot, `Claw_${side}`, 'cone', [0.18, 0.95, 6], [side * 0.78, 0.5, 0.1], [1, 1, 1], palette.dark, [0, 0, side * -0.7]);
  if (definition.behavior === 'kite') for (const side of [-1, 1]) addPrimitive(body, `Wing_${side}`, 'cone', [0.42, 1.2, 5], [side * 0.78, 0.95, -0.1], [1, 1, 0.45], palette.accent, [0, 0, side * -1.02]);
}

function addRegionMotif(body, attackPivot, regionKey, palette, tier) {
  const prefix = `MOTIF_${regionKey}`;
  if (regionKey === 'wind') {
    addPrimitive(body, `${prefix}_tail`, 'cone', [0.25, 1.15, 6], [0, 0.75, -0.72], [1, 1, 0.6], palette.accent, [Math.PI / 2, 0, 0]);
  } else if (regionKey === 'snow') {
    for (const side of [-1, 1]) addPrimitive(attackPivot, `${prefix}_antler_${side}`, 'torus', [0.32, 0.07, 6, 12, Math.PI], [side * 0.28, 1.82, 0.1], [1, 1, 0.55], palette.dark, [0, side * 0.25, side * 0.2]);
  } else if (regionKey === 'farm') {
    addPrimitive(body, `${prefix}_sprout`, 'cone', [0.3, 0.75, 7], [0, 1.95, 0], [1, 1, 0.55], palette.accent);
  } else if (regionKey === 'star') {
    addPrimitive(body, `${prefix}_halo`, 'torus', [0.52, 0.09, 7, 16], [0, 1.7, 0], [1, 1, 1], palette.accent, [Math.PI / 2, 0, 0]);
  } else if (regionKey === 'crystal') {
    for (const side of [-1, 1]) addPrimitive(body, `${prefix}_prism_${side}`, 'icosahedron', [0.28, 0], [side * 0.66, 1.0, -0.1], [0.65, 1.5, 0.65], palette.accent, [0, 0, side * 0.4]);
  } else if (regionKey === 'canyon') {
    for (const side of [-1, 1]) addPrimitive(attackPivot, `${prefix}_pincer_${side}`, 'cone', [0.2, 0.85, 6], [side * 0.62, 0.68, 0.45], [1, 1, 1], palette.dark, [Math.PI / 2, 0, side * 0.35]);
  } else if (regionKey === 'mushroom') {
    addPrimitive(body, `${prefix}_cap`, 'sphere', [0.75, 12, 8], [0, 1.82, 0], [1, 0.35, 1], palette.accent);
  } else {
    addPrimitive(body, `${prefix}_gear`, 'torus', [0.52, 0.14, 8, 16], [0, 0.9, -0.48], [1, 1, 1], palette.dark, [Math.PI / 2, 0, 0]);
  }
  if (tier === 'elite') addPrimitive(body, `ELITE_${regionKey}_crest`, 'icosahedron', [0.28, 1], [0, 2.2, 0], [1, 1.4, 0.6], palette.accent);
}

function buildBossSilhouette(body, attackPivot, regionKey, palette) {
  if (regionKey === 'wind') {
    addPrimitive(body, 'BOSS_wind_roc_body', 'icosahedron', [1.05, 1], [0, 1.6, 0], [1.2, 0.8, 1.45], palette.primary);
    addPrimitive(body, 'BOSS_wind_roc_head', 'sphere', [0.52, 12, 9], [0, 2.35, 0.72], [1, 1, 1], palette.accent);
    addPrimitive(attackPivot, 'BOSS_wind_roc_beak', 'cone', [0.23, 0.9, 6], [0, 2.28, 1.22], [1, 1, 1], palette.dark, [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) addPrimitive(body, `BOSS_wind_roc_wing_${side}`, 'cone', [1.25, 3.8, 6], [side * 1.85, 1.55, -0.15], [1, 1, 0.28], palette.accent, [0, 0, side * -1.08]);
  } else if (regionKey === 'snow') {
    addPrimitive(body, 'BOSS_snow_stag_body', 'icosahedron', [1.0, 1], [0, 1.45, 0], [1.2, 0.85, 1.7], palette.primary);
    addPrimitive(body, 'BOSS_snow_stag_head', 'sphere', [0.55, 12, 9], [0, 2.25, 1.05], [0.9, 1.1, 1], palette.accent);
    for (const side of [-1, 1]) {
      addPrimitive(body, `BOSS_snow_stag_leg_${side}_front`, 'cylinder', [0.14, 0.2, 1.5, 8], [side * 0.55, 0.55, 0.68], [1, 1, 1], palette.dark);
      addPrimitive(body, `BOSS_snow_stag_leg_${side}_rear`, 'cylinder', [0.14, 0.2, 1.5, 8], [side * 0.55, 0.55, -0.68], [1, 1, 1], palette.dark);
      addPrimitive(attackPivot, `BOSS_snow_stag_antler_${side}`, 'torus', [0.72, 0.11, 7, 18, Math.PI], [side * 0.48, 3.0, 1.05], [1, 1.25, 0.6], palette.accent, [0, side * 0.32, side * 0.2]);
    }
  } else if (regionKey === 'farm') {
    addPrimitive(body, 'BOSS_farm_boar_body', 'sphere', [1.15, 14, 10], [0, 1.35, 0], [1.25, 0.88, 1.65], palette.primary);
    addPrimitive(body, 'BOSS_farm_boar_snout', 'cylinder', [0.5, 0.62, 0.7, 10], [0, 1.45, 1.45], [1, 1, 1], palette.accent, [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) addPrimitive(attackPivot, `BOSS_farm_boar_tusk_${side}`, 'torus', [0.38, 0.08, 6, 14, Math.PI], [side * 0.5, 1.3, 1.72], [1, 1, 0.7], '#f5e2b8', [0, side * 0.2, side * 0.35]);
  } else if (regionKey === 'star') {
    addPrimitive(body, 'BOSS_star_comet_body', 'icosahedron', [1.05, 1], [0, 1.45, 0], [1.25, 0.9, 1.55], palette.primary);
    addPrimitive(body, 'BOSS_star_comet_head', 'sphere', [0.62, 14, 10], [0, 2.2, 1.0], [1, 1, 1], palette.accent);
    addPrimitive(body, 'BOSS_star_comet_mane', 'torus', [0.82, 0.23, 10, 22], [0, 2.2, 0.78], [1, 1, 0.72], palette.dark, [Math.PI / 2, 0, 0]);
    addPrimitive(body, 'BOSS_star_comet_tail', 'torus', [1.15, 0.16, 8, 20, Math.PI * 1.25], [0.85, 1.5, -1.25], [1, 1, 1], palette.accent, [0, 0.5, 0.2]);
  } else if (regionKey === 'crystal') {
    for (let i = 0; i < 7; i += 1) addPrimitive(body, `BOSS_crystal_leviathan_segment_${i}`, 'icosahedron', [0.75 - i * 0.055, 1], [Math.sin(i * 0.55) * 0.7, 1.4 + Math.sin(i * 0.8) * 0.35, -1.9 + i * 0.62], [1, 0.78, 1.25], i % 2 ? palette.primary : palette.accent, [0, i * 0.15, 0]);
    addPrimitive(attackPivot, 'BOSS_crystal_leviathan_jaw', 'cone', [0.42, 1.15, 7], [0, 1.25, 2.35], [1, 1, 0.8], palette.dark, [Math.PI / 2, 0, 0]);
  } else if (regionKey === 'canyon') {
    for (let i = 0; i < 8; i += 1) addPrimitive(body, `BOSS_canyon_sandwyrm_segment_${i}`, 'cylinder', [0.62 - i * 0.035, 0.72 - i * 0.035, 0.72, 9], [Math.sin(i * 0.65) * 0.52, 0.65 + i * 0.3, -1.8 + i * 0.5], [1, 1, 1], i % 2 ? palette.primary : palette.dark, [0.25, 0, -Math.sin(i) * 0.25]);
    for (const side of [-1, 1]) addPrimitive(attackPivot, `BOSS_canyon_sandwyrm_jaw_${side}`, 'cone', [0.26, 1.25, 6], [side * 0.38, 3.0, 2.0], [1, 1, 1], palette.accent, [Math.PI / 2, 0, side * 0.28]);
  } else if (regionKey === 'mushroom') {
    addPrimitive(body, 'BOSS_mushroom_mooncap_stalk', 'cylinder', [0.72, 1.05, 3.2, 12], [0, 1.6, 0], [1, 1, 1], palette.accent);
    addPrimitive(body, 'BOSS_mushroom_mooncap_cap', 'sphere', [1.75, 16, 10], [0, 3.35, 0], [1, 0.38, 1], palette.primary);
    for (const side of [-1, 1]) addPrimitive(attackPivot, `BOSS_mushroom_mooncap_arm_${side}`, 'torus', [0.85, 0.16, 7, 18, Math.PI], [side * 1.05, 1.8, 0], [1, 1, 0.6], palette.dark, [0, side * 0.4, side * 0.65]);
  } else {
    addPrimitive(body, 'BOSS_clockwork_colossus_torso', 'box', [2.4, 3.0, 1.8], [0, 1.75, 0], [1, 1, 1], palette.dark);
    addPrimitive(body, 'BOSS_clockwork_colossus_gear', 'torus', [1.0, 0.26, 10, 24], [0, 2.0, 0.95], [1, 1, 1], palette.primary, [Math.PI / 2, 0, 0]);
    addPrimitive(body, 'BOSS_clockwork_colossus_head', 'box', [1.25, 0.95, 1.0], [0, 3.75, 0], [1, 1, 1], palette.accent);
    for (const side of [-1, 1]) {
      addPrimitive(attackPivot, `BOSS_clockwork_colossus_arm_${side}`, 'cylinder', [0.28, 0.38, 2.4, 9], [side * 1.65, 2.0, 0], [1, 1, 1], palette.primary, [0, 0, side * 0.25]);
      addPrimitive(body, `BOSS_clockwork_colossus_leg_${side}`, 'box', [0.65, 1.8, 0.75], [side * 0.65, 0.6, 0], [1, 1, 1], palette.dark);
    }
  }
}

function createEncounterAnimations(tier) {
  const amplitude = tier === 'boss' ? 0.16 : 0.1;
  return [
    new THREE.AnimationClip('Idle', 2, [new THREE.VectorKeyframeTrack('Body.position', [0, 1, 2], [0, 0, 0, 0, amplitude, 0, 0, 0, 0])]),
    new THREE.AnimationClip('Move', 0.8, [quaternionTrack('Body', 'z', [0, 0.2, 0.4, 0.6, 0.8], [0, 0.1, 0, -0.1, 0])]),
    new THREE.AnimationClip('Attack', 0.65, [quaternionTrack('AttackPivot', 'x', [0, 0.22, 0.42, 0.65], [0, -0.85, 0.35, 0])]),
    new THREE.AnimationClip('Hurt', 0.35, [quaternionTrack('Body', 'y', [0, 0.1, 0.22, 0.35], [0, 0.4, -0.25, 0])]),
    new THREE.AnimationClip('Defeat', 0.9, [
      quaternionTrack('ActorRoot', 'z', [0, 0.55, 0.9], [0, 1.35, 1.57]),
      new THREE.VectorKeyframeTrack('ActorRoot.scale', [0, 0.55, 0.9], [1, 1, 1, 1.12, 0.75, 1.12, 0.05, 0.05, 0.05]),
    ]),
  ];
}

function addPrimitive(parent, name, shape, args, position, scale, color, rotation = [0, 0, 0]) {
  const geometry = buildPrimitiveGeometry({ shape, args });
  const mesh = new THREE.Mesh(geometry, resolvePipelineMaterial({ profileId: 'toon', color, roughness: 0.86, metalness: name.includes('clockwork') ? 0.3 : 0.02 }));
  mesh.name = name;
  mesh.position.fromArray(position);
  mesh.scale.fromArray(scale);
  mesh.rotation.fromArray(rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function quaternionTrack(nodeName, axis, times, values) {
  const output = values.flatMap((value) => {
    const euler = new THREE.Euler(axis === 'x' ? value : 0, axis === 'y' ? value : 0, axis === 'z' ? value : 0);
    const q = new THREE.Quaternion().setFromEuler(euler);
    return [q.x, q.y, q.z, q.w];
  });
  return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, output);
}

function mixColor(a, b, ratio) {
  const first = new THREE.Color(a);
  first.lerp(new THREE.Color(b), ratio);
  return `#${first.getHexString()}`;
}
