// 依 Canonical 資料目錄產生可直接載入的低多邊形 GLB。
// 這些檔案是 Runtime 生產資產，不取代後續委製美術；檔名與節點契約保持固定。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { REGION_STRUCTURE_CATALOG } from '../src/data/physicalObjectCatalog.js';
import { REGION_ENCOUNTERS } from '../src/data/regionEncounters.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { BASE_COMBAT_ARCHETYPES, BASE_COMBAT_ARCHETYPE_IDS } from '../src/data/combatArchetypes.js';
import {
  HUMANOID_BODY_VARIANT_DEFINITIONS,
  V031_CHARACTER_MODULE_DEFINITIONS,
} from '../src/data/characterCompanionV031Catalog.js';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';
import { normalizeAssetRecipe } from './art-pipeline/recipes/assetRecipeSchema.mjs';
import { buildCharacterCompanionModuleScene } from './art-pipeline/geometry/characterCompanionGeometryBuilder.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelRoot = path.join(root, 'public', 'models');

await fs.mkdir(path.join(modelRoot, 'regions', 'structures'), { recursive: true });
await fs.mkdir(path.join(modelRoot, 'regions', 'monsters'), { recursive: true });
await fs.mkdir(path.join(modelRoot, 'regions', 'elites'), { recursive: true });
await fs.mkdir(path.join(modelRoot, 'regions', 'bosses'), { recursive: true });
await fs.mkdir(path.join(modelRoot, 'characters'), { recursive: true });

const generated = [];
for (const [type, prefab] of Object.entries(REGION_STRUCTURE_CATALOG)) {
  const scene = createStructureScene(type, prefab);
  const asset = requireAsset(`structure:${type}`);
  const target = path.join(root, 'public', asset.canonicalPath);
  await exportGlb(scene, [], target, asset);
  generated.push(relative(target));
}

const bridgeScene = createBridgeScene();
const bridgeAsset = requireAsset('structure:canonical_bridge');
const bridgeTarget = path.join(root, 'public', bridgeAsset.canonicalPath);
await exportGlb(bridgeScene, [], bridgeTarget, bridgeAsset);
generated.push(relative(bridgeTarget));

for (const [profileId, scale] of [['player_child', 0.9], ['npc_adult', 1], ['npc_child', 0.78]]) {
  const { scene, animations } = createCharacterScene(profileId, scale);
  const asset = requireAsset(`character:${profileId}`);
  const target = path.join(root, 'public', asset.canonicalPath);
  await exportGlb(scene, animations, target, asset);
  generated.push(relative(target));
}

for (const definition of HUMANOID_BODY_VARIANT_DEFINITIONS) {
  normalizeAssetRecipe(definition);
  const { scene, animations } = createCharacterScene(definition.physicalProfileId, definition.scale, definition.id);
  const asset = requireAsset(definition.assetId);
  const target = path.join(root, 'public', asset.canonicalPath);
  await exportGlb(scene, animations, target, asset);
  generated.push(relative(target));
}

for (const definition of V031_CHARACTER_MODULE_DEFINITIONS) {
  const scene = buildCharacterCompanionModuleScene(definition);
  const asset = requireAsset(definition.assetId);
  const target = path.join(root, 'public', asset.canonicalPath);
  await exportGlb(scene, [], target, asset);
  generated.push(relative(target));
}

for (const encounter of Object.values(REGION_ENCOUNTERS)) {
  for (const def of encounter.normal) {
    const { scene, animations } = createEnemyScene(def, 'normal');
    const asset = requireAsset(def.modelAssetId || `encounter:${def.id}`);
    const target = path.join(root, 'public', asset.canonicalPath);
    await exportGlb(scene, animations, target, asset);
    generated.push(relative(target));
  }
  {
    const { scene, animations } = createEnemyScene(encounter.elite, 'elite');
    const asset = requireAsset(encounter.elite.modelAssetId || `encounter:${encounter.elite.id}`);
    const target = path.join(root, 'public', asset.canonicalPath);
    await exportGlb(scene, animations, target, asset);
    generated.push(relative(target));
  }
  {
    const { scene, animations } = createEnemyScene(encounter.boss, 'boss');
    const asset = requireAsset(encounter.boss.modelAssetId || `encounter:${encounter.boss.id}`);
    const target = path.join(root, 'public', asset.canonicalPath);
    await exportGlb(scene, animations, target, asset);
    generated.push(relative(target));
  }
}

console.log(JSON.stringify({ generatedCount: generated.length, files: generated }, null, 2));

function createStructureScene(type, prefab) {
  const scene = new THREE.Scene();
  scene.name = `${type}_scene`;
  const rootGroup = new THREE.Group();
  rootGroup.name = type;
  rootGroup.userData = { assetType: 'region_structure', prefabType: type };
  scene.add(rootGroup);

  for (const part of prefab.parts) {
    const geometry = geometryFromPart(part);
    const color = prefab.palette?.[part.colorSlot] || prefab.palette?.base || '#cccccc';
    const mesh = new THREE.Mesh(geometry, toonMaterial(color));
    mesh.name = part.id;
    mesh.position.fromArray(part.position || [0, 0, 0]);
    mesh.rotation.fromArray(part.rotation || [0, 0, 0]);
    if (part.scale && part.shape !== 'box' && part.shape !== undefined) mesh.scale.fromArray(part.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
  }
  for (const collider of prefab.colliders) {
    const node = new THREE.Object3D();
    node.name = `COLLIDER_${collider.id}`;
    node.position.fromArray(collider.position || [0, 0, 0]);
    node.rotation.fromArray(collider.rotation || [0, 0, 0]);
    node.userData = { ...collider, runtimeOnly: true };
    rootGroup.add(node);
  }
  for (const socket of prefab.sockets) {
    const node = new THREE.Object3D();
    node.name = `SOCKET_${socket.id}`;
    node.position.fromArray(socket.position || [0, 0, 0]);
    node.userData = { socketType: socket.type, socketId: socket.id };
    rootGroup.add(node);
  }
  return scene;
}

function createBridgeScene() {
  const scene = new THREE.Scene();
  const rootGroup = new THREE.Group();
  rootGroup.name = 'canonical_bridge';
  scene.add(rootGroup);
  const wood = toonMaterial('#a9784b');
  const darkWood = toonMaterial('#6c4d34');
  for (let index = 0; index < 12; index += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 0.78), index % 2 ? wood : darkWood);
    plank.name = `plank_${index + 1}`;
    plank.position.set(0, 0, -4.3 + index * 0.78);
    rootGroup.add(plank);
  }
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 9.5), darkWood);
    rail.name = side < 0 ? 'rail_left' : 'rail_right';
    rail.position.set(side * 2.2, 0.82, 0);
    rootGroup.add(rail);
    for (let index = 0; index < 6; index += 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), darkWood);
      post.name = `${rail.name}_post_${index + 1}`;
      post.position.set(side * 2.2, 0.45, -4.5 + index * 1.8);
      rootGroup.add(post);
    }
  }
  for (const id of ['entry_a', 'entry_b']) {
    const socket = new THREE.Object3D();
    socket.name = `SOCKET_${id}`;
    socket.position.set(0, 0, id === 'entry_a' ? -5 : 5);
    rootGroup.add(socket);
  }
  return scene;
}

function createCharacterScene(profileId, scale, variantId = profileId) {
  const scene = new THREE.Scene();
  const actorRoot = new THREE.Group();
  actorRoot.name = 'ActorRoot';
  actorRoot.userData = { assetType: 'skinned_character', profileId, variantId, rigContract: 'MathQuestHumanoidV1' };
  if (Array.isArray(scale)) actorRoot.scale.fromArray(scale);
  else actorRoot.scale.setScalar(scale);
  scene.add(actorRoot);

  const bones = createHumanoidBones();
  actorRoot.add(bones.root);
  const palette = profileId === 'player_child'
    ? { skin: '#f1c9a7', outfit: '#4b8bd7', trim: '#f5ce65', hair: '#52392f' }
    : profileId === 'npc_child'
      ? { skin: '#efcaa6', outfit: '#72b76a', trim: '#f2d080', hair: '#694331' }
      : { skin: '#e9c49f', outfit: '#9c6dc4', trim: '#e7c25f', hair: '#49362f' };

  attachRigidBodyParts(bones.map, palette);
  const skinnedMesh = createContractSkinnedMesh(bones.list, palette.outfit);
  skinnedMesh.name = 'SkinnedBodyContract';
  bones.map.Pelvis.add(skinnedMesh);
  skinnedMesh.bind(new THREE.Skeleton(bones.list));

  for (const [socketId, parentName, position] of [
    ['head', 'Head', [0, 0.4, 0]],
    ['body', 'Spine', [0, 0, 0]],
    ['hands', 'Spine', [0, -0.36, 0]],
    ['legs', 'Pelvis', [0, -0.4, 0]],
    ['feet', 'RigRoot', [0, 0.08, 0]],
    ['main_hand', 'HandR', [0, -0.02, 0.08]],
    ['off_hand', 'HandL', [0, -0.02, 0.08]],
    ['back', 'Spine', [0, 0.05, -0.3]],
    ['waist', 'Pelvis', [0, 0.08, 0]],
    ['face', 'Head', [0, 0, 0.34]],
    ['hair', 'Head', [0, 0.34, 0]],
    ['accessory', 'Spine', [0, -0.05, 0.34]],
    ['aura', 'RigRoot', [0, 0.05, 0]],
    ['costume_override', 'Spine', [0, -0.1, 0]],
    ['fairy', 'Spine', [-0.75, 0.5, -0.15]],
    ['dialogue', 'Head', [0, 0.7, 0]],
    ['interaction_origin', 'Spine', [0, -0.25, 0.45]],
    ['work_tool', 'HandR', [0, -0.02, 0.08]],
  ]) {
    const socket = new THREE.Object3D();
    socket.name = `SOCKET_${socketId}`;
    socket.position.fromArray(position);
    bones.map[parentName].add(socket);
  }

  return { scene, animations: createCharacterAnimations(bones.map, profileId) };
}

function createHumanoidBones() {
  const map = {};
  const make = (name, position, parent = null) => {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.fromArray(position);
    map[name] = bone;
    if (parent) parent.add(bone);
    return bone;
  };
  const root = make('RigRoot', [0, 0, 0]);
  const pelvis = make('Pelvis', [0, 0.72, 0], root);
  const spine = make('Spine', [0, 0.46, 0], pelvis);
  const neck = make('Neck', [0, 0.43, 0], spine);
  make('Head', [0, 0.26, 0], neck);
  const shoulderL = make('UpperArmL', [-0.43, 0.25, 0], spine);
  const lowerArmL = make('LowerArmL', [0, -0.47, 0], shoulderL);
  make('HandL', [0, -0.45, 0], lowerArmL);
  const shoulderR = make('UpperArmR', [0.43, 0.25, 0], spine);
  const lowerArmR = make('LowerArmR', [0, -0.47, 0], shoulderR);
  make('HandR', [0, -0.45, 0], lowerArmR);
  const upperLegL = make('UpperLegL', [-0.18, -0.5, 0], pelvis);
  const lowerLegL = make('LowerLegL', [0, -0.47, 0], upperLegL);
  make('FootL', [0, -0.39, 0.08], lowerLegL);
  const upperLegR = make('UpperLegR', [0.18, -0.5, 0], pelvis);
  const lowerLegR = make('LowerLegR', [0, -0.47, 0], upperLegR);
  make('FootR', [0, -0.39, 0.08], lowerLegR);
  return { root, map, list: Object.values(map) };
}

function attachRigidBodyParts(bones, palette) {
  addPart(bones.Pelvis, 'pelvis', new THREE.BoxGeometry(0.48, 0.28, 0.34), palette.outfit, [0, 0, 0]);
  addPart(bones.Spine, 'torso', new THREE.CylinderGeometry(0.3, 0.37, 0.78, 12), palette.outfit, [0, 0, 0]);
  addPart(bones.Neck, 'neck', new THREE.CylinderGeometry(0.12, 0.13, 0.16, 8), palette.skin, [0, 0, 0]);
  addPart(bones.Head, 'head', new THREE.SphereGeometry(0.34, 16, 12), palette.skin, [0, 0, 0]);
  addPart(bones.Head, 'hair', new THREE.SphereGeometry(0.35, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), palette.hair, [0, 0.14, -0.02]);
  for (const side of ['L', 'R']) {
    addPart(bones[`UpperArm${side}`], `upper_arm_${side.toLowerCase()}`, new THREE.CylinderGeometry(0.105, 0.115, 0.46, 8), palette.outfit, [0, -0.22, 0]);
    addPart(bones[`LowerArm${side}`], `lower_arm_${side.toLowerCase()}`, new THREE.CylinderGeometry(0.09, 0.1, 0.4, 8), palette.skin, [0, -0.2, 0]);
    addPart(bones[`Hand${side}`], `hand_${side.toLowerCase()}`, new THREE.SphereGeometry(0.11, 10, 8), palette.skin, [0, 0, 0]);
    addPart(bones[`UpperLeg${side}`], `upper_leg_${side.toLowerCase()}`, new THREE.CylinderGeometry(0.13, 0.14, 0.46, 8), '#37415c', [0, -0.22, 0]);
    addPart(bones[`LowerLeg${side}`], `lower_leg_${side.toLowerCase()}`, new THREE.CylinderGeometry(0.11, 0.12, 0.36, 8), '#30384d', [0, -0.18, 0]);
    addPart(bones[`Foot${side}`], `foot_${side.toLowerCase()}`, new THREE.BoxGeometry(0.24, 0.15, 0.38), '#3f3b3a', [0, 0, 0]);
  }
  addPart(bones.Spine, 'trim', new THREE.BoxGeometry(0.44, 0.13, 0.06), palette.trim, [0, 0.07, 0.31]);
}

function createContractSkinnedMesh(bones, color) {
  const geometry = new THREE.BoxGeometry(0.32, 0.6, 0.22, 1, 3, 1);
  const position = geometry.attributes.position;
  const skinIndices = [];
  const skinWeights = [];
  const pelvisIndex = bones.findIndex((bone) => bone.name === 'Pelvis');
  const spineIndex = bones.findIndex((bone) => bone.name === 'Spine');
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    const spineWeight = THREE.MathUtils.clamp((y + 0.3) / 0.6, 0, 1);
    skinIndices.push(pelvisIndex, spineIndex, 0, 0);
    skinWeights.push(1 - spineWeight, spineWeight, 0, 0);
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  const material = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.001, depthWrite: false });
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.position.set(0, 0.46, 0);
  return mesh;
}

function createCharacterAnimations(bones, profileId) {
  const clips = [];
  clips.push(new THREE.AnimationClip('Idle', 2, [
    vectorTrack('Spine.position', [0, 1, 2], [[0, 0.46, 0], [0, 0.49, 0], [0, 0.46, 0]]),
    numberTrack('Head.rotation[z]', [0, 1, 2], [0, 0.04, 0]),
  ]));
  clips.push(locomotionClip('Walk', 0.8, 0.55));
  clips.push(locomotionClip('Run', 0.55, 0.95));
  clips.push(new THREE.AnimationClip('Attack', 0.45, [
    numberTrack('UpperArmR.rotation[x]', [0, 0.15, 0.32, 0.45], [0, -1.4, -0.45, 0]),
    numberTrack('LowerArmR.rotation[x]', [0, 0.15, 0.32, 0.45], [0, -0.8, -0.2, 0]),
    numberTrack('Spine.rotation[y]', [0, 0.15, 0.32, 0.45], [0, -0.35, 0.28, 0]),
  ]));
  clips.push(new THREE.AnimationClip('Interact', 1.1, [
    numberTrack('UpperArmR.rotation[z]', [0, 0.25, 0.55, 0.85, 1.1], [0, -1.05, -0.8, -1.05, 0]),
    numberTrack('LowerArmR.rotation[x]', [0, 0.25, 0.55, 0.85, 1.1], [0, -0.65, -0.35, -0.65, 0]),
  ]));
  clips.push(new THREE.AnimationClip('Hurt', 0.38, [
    numberTrack('Spine.rotation[x]', [0, 0.12, 0.25, 0.38], [0, 0.3, -0.1, 0]),
    numberTrack('Head.rotation[x]', [0, 0.12, 0.25, 0.38], [0, -0.25, 0.08, 0]),
  ]));
  clips.push(new THREE.AnimationClip('Defeat', 1.2, [
    numberTrack('RigRoot.rotation[z]', [0, 0.65, 1.2], [0, -1.45, -1.57]),
    vectorTrack('RigRoot.position', [0, 0.65, 1.2], [[0, 0, 0], [0, 0.18, 0], [0, 0.05, 0]]),
  ]));
  clips.push(...createCharacterLifeClips());
  if (profileId === 'player_child') clips.push(...createCombatAnimationContractClips());
  return clips;
}

function createCharacterLifeClips() {
  return [
    new THREE.AnimationClip('Talk', 1.35, [
      numberTrack('Head.rotation[y]', [0, 0.34, 0.68, 1.02, 1.35], [0, 0.13, -0.08, 0.1, 0]),
      numberTrack('UpperArmR.rotation[z]', [0, 0.45, 0.9, 1.35], [0, -0.55, -0.25, 0]),
    ]),
    new THREE.AnimationClip('Work', 1.1, [
      numberTrack('UpperArmR.rotation[x]', [0, 0.28, 0.55, 0.83, 1.1], [0, -1.1, -0.35, -1.1, 0]),
      numberTrack('Spine.rotation[x]', [0, 0.55, 1.1], [0, 0.16, 0]),
    ]),
    new THREE.AnimationClip('Celebrate', 1.4, [
      numberTrack('UpperArmL.rotation[z]', [0, 0.4, 1, 1.4], [0, 1.5, 1.25, 0]),
      numberTrack('UpperArmR.rotation[z]', [0, 0.4, 1, 1.4], [0, -1.5, -1.25, 0]),
      vectorTrack('Pelvis.position', [0, 0.35, 0.7, 1.05, 1.4], [[0, 0.72, 0], [0, 0.86, 0], [0, 0.72, 0], [0, 0.82, 0], [0, 0.72, 0]]),
    ]),
    new THREE.AnimationClip('Gift', 1.15, [
      numberTrack('UpperArmL.rotation[x]', [0, 0.42, 0.82, 1.15], [0, -1.1, -0.85, 0]),
      numberTrack('UpperArmR.rotation[x]', [0, 0.42, 0.82, 1.15], [0, -1.1, -0.85, 0]),
    ]),
    new THREE.AnimationClip('Sit', 1.8, [
      vectorTrack('Pelvis.position', [0, 0.55, 1.8], [[0, 0.72, 0], [0, 0.48, 0], [0, 0.48, 0]]),
      numberTrack('UpperLegL.rotation[x]', [0, 0.55, 1.8], [0, -1.25, -1.25]),
      numberTrack('UpperLegR.rotation[x]', [0, 0.55, 1.8], [0, -1.25, -1.25]),
    ]),
    new THREE.AnimationClip('Sleep', 2.4, [
      numberTrack('RigRoot.rotation[z]', [0, 0.8, 2.4], [0, -1.42, -1.42]),
      vectorTrack('RigRoot.position', [0, 0.8, 2.4], [[0, 0, 0], [0, 0.12, 0], [0, 0.12, 0]]),
    ]),
  ];
}


function createCombatAnimationContractClips() {
  const clips = [];
  for (const archetypeId of BASE_COMBAT_ARCHETYPE_IDS) {
    const contractDef = BASE_COMBAT_ARCHETYPES[archetypeId];
    for (const clipName of contractDef.requiredClips) {
      clips.push(createCombatContractClip(contractDef.animationSet, archetypeId, clipName));
    }
  }
  return clips;
}

function createCombatContractClip(animationSet, archetypeId, clipName) {
  const comboNumber = Number(clipName.match(/Attack0([1-3])/)?.[1] || 1);
  const charged = clipName === 'ChargedAttack';
  const skill = clipName === 'Skill';
  const duration = charged ? 0.95 : skill ? 1.05 : clipName.includes('Reload') ? 1.0 : clipName.includes('Cast') ? 0.88 : clipName.includes('Catch') ? 0.72 : 0.5 + comboNumber * 0.06;
  const mid = duration * 0.42;
  const end = duration;
  const intensity = charged ? 1.25 : skill ? 1.45 : 0.85 + comboNumber * 0.14;
  const tracks = [];

  if (['one_hand_blade', 'heavy_blade', 'scythe'].includes(archetypeId)) {
    const heavy = archetypeId !== 'one_hand_blade';
    tracks.push(numberTrack('UpperArmR.rotation[z]', [0, mid, end], [0.15, -(heavy ? 1.55 : 1.15) * intensity, 0]));
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -0.7 * intensity, 0]));
    tracks.push(numberTrack('UpperArmL.rotation[z]', [0, mid, end], [0, heavy ? -0.85 * intensity : -0.25, 0]));
    tracks.push(numberTrack('Spine.rotation[y]', [0, mid, end], [0, (comboNumber % 2 ? -0.48 : 0.48) * intensity, 0]));
  } else if (archetypeId === 'dual_wield') {
    const direction = comboNumber % 2 ? 1 : -1;
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -1.15 * intensity * direction, 0]));
    tracks.push(numberTrack('UpperArmL.rotation[x]', [0, mid, end], [0, 1.15 * intensity * direction, 0]));
    tracks.push(numberTrack('Spine.rotation[y]', [0, mid, end], [0, -0.42 * direction * intensity, 0]));
  } else if (archetypeId === 'heavy_blunt') {
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -1.75 * intensity, 0.2]));
    tracks.push(numberTrack('UpperArmL.rotation[x]', [0, mid, end], [0, -1.55 * intensity, 0.15]));
    tracks.push(numberTrack('Spine.rotation[x]', [0, mid, end], [0, -0.42 * intensity, 0.2]));
  } else if (archetypeId === 'polearm') {
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -1.05 * intensity, 0]));
    tracks.push(numberTrack('UpperArmL.rotation[x]', [0, mid, end], [0, -0.75 * intensity, 0]));
    tracks.push(vectorTrack('Spine.position', [0, mid, end], [[0, 0.46, 0], [0, 0.43, 0.22 * intensity], [0, 0.46, 0]]));
  } else if (archetypeId === 'bow') {
    tracks.push(numberTrack('UpperArmL.rotation[x]', [0, mid, end], [0, -1.45, 0]));
    tracks.push(numberTrack('UpperArmR.rotation[z]', [0, mid, end], [0, 1.25 * intensity, 0]));
    tracks.push(numberTrack('LowerArmR.rotation[x]', [0, mid, end], [0, -1.0 * intensity, 0]));
  } else if (archetypeId === 'crossbow') {
    tracks.push(numberTrack('UpperArmL.rotation[x]', [0, mid, end], [0, -1.0 * intensity, 0]));
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -1.0 * intensity, 0]));
    tracks.push(numberTrack('Spine.rotation[x]', [0, mid, end], [0, 0.18, 0]));
  } else if (['arcane_staff', 'grimoire'].includes(archetypeId)) {
    const book = archetypeId === 'grimoire';
    tracks.push(numberTrack('UpperArmR.rotation[z]', [0, mid, end], [0, -1.2 * intensity, 0]));
    tracks.push(numberTrack('UpperArmL.rotation[z]', [0, mid, end], [0, book ? 1.15 * intensity : -0.65 * intensity, 0]));
    tracks.push(numberTrack('Spine.rotation[y]', [0, mid, end], [0, 0.28 * intensity, 0]));
  } else if (archetypeId === 'thrown') {
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -1.65 * intensity, 0.25]));
    tracks.push(numberTrack('Spine.rotation[y]', [0, mid, end], [0, -0.58 * intensity, 0]));
  } else {
    tracks.push(numberTrack('UpperArmR.rotation[x]', [0, mid, end], [0, -1.25 * intensity, 0]));
    tracks.push(numberTrack('UpperArmL.rotation[x]', [0, mid, end], [0, 0.8 * intensity, 0]));
    tracks.push(numberTrack('Spine.rotation[y]', [0, mid, end], [0, -0.32 * intensity, 0]));
  }

  if (clipName === 'BoomerangCatch' || clipName === 'CrossbowReload') {
    tracks.push(numberTrack('LowerArmL.rotation[x]', [0, mid, end], [0, -1.1, 0]));
  }
  if (clipName === 'HammerSmash') {
    tracks.push(vectorTrack('Pelvis.position', [0, mid, end], [[0, 0.72, 0], [0, 0.58, 0], [0, 0.72, 0]]));
  }
  return new THREE.AnimationClip(`${animationSet}_${clipName}`, duration, tracks);
}

function locomotionClip(name, duration, amplitude) {
  const middle = duration / 2;
  return new THREE.AnimationClip(name, duration, [
    numberTrack('UpperArmL.rotation[x]', [0, middle, duration], [-amplitude, amplitude, -amplitude]),
    numberTrack('UpperArmR.rotation[x]', [0, middle, duration], [amplitude, -amplitude, amplitude]),
    numberTrack('UpperLegL.rotation[x]', [0, middle, duration], [amplitude, -amplitude, amplitude]),
    numberTrack('UpperLegR.rotation[x]', [0, middle, duration], [-amplitude, amplitude, -amplitude]),
    vectorTrack('Pelvis.position', [0, duration / 4, middle, duration * 0.75, duration], [[0, 0.72, 0], [0, 0.76, 0], [0, 0.72, 0], [0, 0.76, 0], [0, 0.72, 0]]),
  ]);
}

function createEnemyScene(def, tier) {
  const scene = new THREE.Scene();
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ActorRoot';
  rootGroup.userData = { assetType: 'encounter_actor', actorId: def.id, tier };
  scene.add(rootGroup);
  const bodyPivot = new THREE.Group();
  bodyPivot.name = 'Body';
  rootGroup.add(bodyPivot);
  const attackPivot = new THREE.Group();
  attackPivot.name = 'AttackPivot';
  bodyPivot.add(attackPivot);

  const scale = tier === 'boss' ? 1.45 : tier === 'elite' ? 1.18 : 0.9;
  const material = toonMaterial(def.color);
  const secondary = toonMaterial(mixColor(def.color, '#ffffff', 0.22));
  const dark = toonMaterial(mixColor(def.color, '#18202c', 0.45));

  const mainGeometry = tier === 'boss'
    ? new THREE.DodecahedronGeometry(1.15, 0)
    : def.behavior === 'hop' ? new THREE.SphereGeometry(0.62, 14, 10)
      : def.behavior === 'kite' ? new THREE.ConeGeometry(0.58, 1.25, 8)
        : def.behavior === 'tank' || def.behavior === 'shield' ? new THREE.BoxGeometry(1, 1.25, 0.8)
          : def.behavior === 'weeping' ? new THREE.OctahedronGeometry(0.76, 0)
            : new THREE.DodecahedronGeometry(0.68, 0);
  const body = new THREE.Mesh(mainGeometry, material);
  body.name = 'CoreBody';
  body.scale.setScalar(scale);
  body.position.y = tier === 'boss' ? 1.15 : 0.65;
  body.castShadow = true;
  bodyPivot.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(tier === 'boss' ? 0.5 : 0.3, 12, 9), secondary);
  head.name = 'Head';
  head.position.set(0, tier === 'boss' ? 2.35 : 1.35, 0.15);
  head.scale.setScalar(scale);
  bodyPivot.add(head);

  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(tier === 'boss' ? 0.22 : 0.13, tier === 'boss' ? 0.9 : 0.5, 6), dark);
    horn.name = side < 0 ? 'HornL' : 'HornR';
    horn.position.set(side * (tier === 'boss' ? 0.72 : 0.38) * scale, tier === 'boss' ? 2.65 : 1.62, 0);
    horn.rotation.z = side * -0.35;
    attackPivot.add(horn);
  }

  if (def.behavior === 'kite' || tier === 'boss') {
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(tier === 'boss' ? 0.65 : 0.38, tier === 'boss' ? 1.8 : 1, 5), secondary);
      wing.name = side < 0 ? 'WingL' : 'WingR';
      wing.position.set(side * (tier === 'boss' ? 1.25 : 0.75), tier === 'boss' ? 1.35 : 0.85, -0.1);
      wing.rotation.z = side * -1.05;
      bodyPivot.add(wing);
    }
  }

  if (def.behavior === 'burrow') {
    for (const side of [-1, 1]) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.9, 6), dark);
      claw.name = side < 0 ? 'ClawL' : 'ClawR';
      claw.position.set(side * 0.78, 0.45, 0.1);
      claw.rotation.z = side * -0.7;
      attackPivot.add(claw);
    }
  }

  const clips = [
    new THREE.AnimationClip('Idle', 2, [
      vectorTrack('Body.position', [0, 1, 2], [[0, 0, 0], [0, 0.12, 0], [0, 0, 0]]),
      numberTrack('Head.rotation[y]', [0, 1, 2], [-0.08, 0.08, -0.08]),
    ]),
    new THREE.AnimationClip('Move', 0.8, [
      numberTrack('Body.rotation[z]', [0, 0.2, 0.4, 0.6, 0.8], [0, 0.1, 0, -0.1, 0]),
      vectorTrack('Body.position', [0, 0.2, 0.4, 0.6, 0.8], [[0, 0, 0], [0, 0.12, 0], [0, 0, 0], [0, 0.12, 0], [0, 0, 0]]),
    ]),
    new THREE.AnimationClip('Attack', 0.65, [
      numberTrack('AttackPivot.rotation[x]', [0, 0.22, 0.42, 0.65], [0, -0.85, 0.35, 0]),
      vectorTrack('Body.position', [0, 0.22, 0.42, 0.65], [[0, 0, 0], [0, 0, 0.45], [0, 0, -0.12], [0, 0, 0]]),
    ]),
    new THREE.AnimationClip('Hurt', 0.35, [numberTrack('Body.rotation[y]', [0, 0.1, 0.22, 0.35], [0, 0.4, -0.25, 0])]),
    new THREE.AnimationClip('Defeat', 0.9, [
      numberTrack('ActorRoot.rotation[z]', [0, 0.55, 0.9], [0, 1.35, 1.57]),
      vectorTrack('ActorRoot.scale', [0, 0.55, 0.9], [[1, 1, 1], [1.12, 0.75, 1.12], [0.05, 0.05, 0.05]]),
    ]),
  ];
  return { scene, animations: clips };
}

function geometryFromPart(part) {
  if (part.shape === 'cylinder') return new THREE.CylinderGeometry(...part.args);
  if (part.shape === 'cone') return new THREE.ConeGeometry(...part.args);
  if (part.shape === 'sphere') return new THREE.SphereGeometry(...part.args);
  if (part.shape === 'torus') return new THREE.TorusGeometry(...part.args);
  if (part.shape === 'octahedron') return new THREE.OctahedronGeometry(...part.args);
  return new THREE.BoxGeometry(...(part.scale || [1, 1, 1]));
}

function toonMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05 });
}

function addPart(parent, name, geometry, color, position) {
  const mesh = new THREE.Mesh(geometry, toonMaterial(color));
  mesh.name = name;
  mesh.position.fromArray(position);
  mesh.castShadow = true;
  parent.add(mesh);
}

function numberTrack(pathName, times, values) {
  const match = pathName.match(/^(.+)\.rotation\[([xyz])\]$/);
  if (!match) throw new Error(`Unsupported scalar animation path: ${pathName}`);
  const [, nodeName, axis] = match;
  const quaternionValues = values.flatMap((value) => {
    const euler = new THREE.Euler(
      axis === 'x' ? value : 0,
      axis === 'y' ? value : 0,
      axis === 'z' ? value : 0,
    );
    const quaternion = new THREE.Quaternion().setFromEuler(euler);
    return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
  });
  return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, quaternionValues);
}

function vectorTrack(pathName, times, vectors) {
  return new THREE.VectorKeyframeTrack(pathName, times, vectors.flat());
}

function mixColor(a, b, ratio) {
  const parse = (hex) => hex.replace('#', '').match(/.{2}/g).map((value) => Number.parseInt(value, 16));
  const first = parse(a);
  const second = parse(b);
  const rgb = first.map((value, index) => Math.round(value * (1 - ratio) + second[index] * ratio));
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

async function exportGlb(scene, animations, target, asset) {
  return exportCanonicalGlb({ scene, animations, target, asset });
}

function requireAsset(assetId) {
  const asset = getCanonicalAsset(assetId);
  if (!asset) throw new Error(`缺少 Canonical Registry：${assetId}`);
  return asset;
}

function relative(target) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}
