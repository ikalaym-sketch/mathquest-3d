// v0.28 產生 8 隻守護夥伴低多邊形工程 GLB。
// 每個資產保持固定節點、Collider、Socket 與 8 組動畫契約，供後續委製模型無痛替換。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { COMPANION_PROFILES } from '../src/data/companionProfiles.js';
import { V031_COMPANION_MODULE_DEFINITIONS } from '../src/data/characterCompanionV031Catalog.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';
import { buildCharacterCompanionModuleScene } from './art-pipeline/geometry/characterCompanionGeometryBuilder.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
for (const [index, profile] of Object.values(COMPANION_PROFILES).entries()) {
  const scene = createCompanionScene(profile, index);
  const animations = createAnimations(profile, index);
  const asset = getCanonicalAsset(profile.modelAssetId);
  if (!asset) throw new Error(`夥伴缺少 Canonical Registry：${profile.id}`);
  const target = path.join(root, 'public', asset.canonicalPath);
  await exportCanonicalGlb({ scene, animations, target, asset });
  files.push(path.relative(root, target).replaceAll('\\', '/'));
}

for (const definition of V031_COMPANION_MODULE_DEFINITIONS) {
  const scene = buildCharacterCompanionModuleScene(definition);
  const asset = getCanonicalAsset(definition.assetId);
  if (!asset) throw new Error(`夥伴模組缺少Canonical Registry：${definition.assetId}`);
  const target = path.join(root, 'public', asset.canonicalPath);
  await exportCanonicalGlb({ scene, animations: [], target, asset });
  files.push(path.relative(root, target).replaceAll('\\', '/'));
}
console.log(JSON.stringify({ generated: files.length, files }, null, 2));

function createCompanionScene(profile, index) {
  const scene = new THREE.Scene();
  const actor = new THREE.Group(); actor.name = 'CompanionRoot'; actor.userData = { assetType: 'guardian_companion', companionId: profile.id, gaitDuration: gaitDuration(index), contract: 'MathQuestCompanionV2' }; scene.add(actor);
  const bodyPivot = new THREE.Group(); bodyPivot.name = 'BodyPivot'; actor.add(bodyPivot);
  const headPivot = new THREE.Group(); headPivot.name = 'HeadPivot'; headPivot.position.set(0, 0.63, 0.38); bodyPivot.add(headPivot);
  const tailPivot = new THREE.Group(); tailPivot.name = 'TailPivot'; tailPivot.position.set(0, 0.35, -0.52); bodyPivot.add(tailPivot);
  const main = toon(profile.color); const accent = toon(profile.accent); const dark = toon(mix(profile.color, '#1e2830', .45));

  const body = new THREE.Mesh(new THREE.SphereGeometry(.48, 12, 9), main); body.name = 'Body'; body.scale.set(1, .82, 1.15); body.position.y = .48; body.castShadow = true; bodyPivot.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.37, 12, 9), main); head.name = 'Head'; head.castShadow = true; headPivot.add(head);
  addFace(headPivot, dark, accent, profile.species);
  addEars(headPivot, main, accent, profile.species);
  addTail(tailPivot, main, accent, profile.species);
  addLegs(bodyPivot, main, profile.species);
  addSpeciesDetail(bodyPivot, headPivot, profile, dark, accent);

  const collider = new THREE.Object3D(); collider.name = 'COLLIDER_Main'; collider.position.set(0, .45, 0); collider.userData = { shape: 'capsule', radius: .36, halfHeight: .42 }; actor.add(collider);
  for (const [name, position] of [['Interaction', [0, .85, .65]], ['Home', [0, 0, 0]], ['Skill', [0, .65, .25]], ['Find', [0, .45, .8]], ['Accessory', [0, .72, .28]]]) {
    const socket = new THREE.Object3D(); socket.name = `SOCKET_${name}`; socket.position.fromArray(position); actor.add(socket);
  }
  return scene;
}

function addFace(root, dark, accent, species) {
  for (const side of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), dark); eye.name = side < 0 ? 'EyeL' : 'EyeR'; eye.position.set(side * .13, .05, .34); root.add(eye); }
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 7), accent); muzzle.name = 'Muzzle'; muzzle.scale.set(1.25, .72, .65); muzzle.position.set(0, -.08, .31); root.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), dark); nose.name = 'Nose'; nose.position.set(0, -.04, .43); root.add(nose);
  if (species === '狸貓' || species === '小熊貓') {
    for (const side of [-1, 1]) { const mask = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), dark); mask.name = side < 0 ? 'FaceMaskL' : 'FaceMaskR'; mask.scale.set(1.45, .72, .25); mask.position.set(side * .13, .04, .345); root.add(mask); }
  }
}
function addEars(root, main, accent, species) {
  const long = species === '小兔子'; const round = ['小水獺', '小熊貓', '狸貓'].includes(species);
  for (const side of [-1, 1]) {
    const geometry = round ? new THREE.SphereGeometry(.14, 8, 6) : new THREE.ConeGeometry(long ? .12 : .16, long ? .58 : .34, 7);
    const ear = new THREE.Mesh(geometry, main); ear.name = side < 0 ? 'EarL' : 'EarR'; ear.position.set(side * .23, long ? .36 : .28, -.02); ear.rotation.z = side * (long ? -.08 : -.22); root.add(ear);
    if (long) { const inner = new THREE.Mesh(new THREE.ConeGeometry(.055, .4, 7), accent); inner.position.set(side * .23, .36, .1); inner.rotation.z = side * -.08; root.add(inner); }
  }
}
function addTail(root, main, accent, species) {
  const fluffy = ['狸貓', '小狐狸', '小松鼠', '小熊貓'].includes(species);
  const geometry = fluffy ? new THREE.SphereGeometry(.22, 10, 7) : new THREE.CylinderGeometry(.1, .18, .55, 8);
  const tail = new THREE.Mesh(geometry, main); tail.name = 'Tail'; tail.scale.set(fluffy ? 1 : 1, fluffy ? 2.4 : 1, fluffy ? 1 : 1); tail.rotation.x = fluffy ? -.72 : 1.15; tail.position.set(0, fluffy ? .12 : -.1, -.18); root.add(tail);
  if (species === '狸貓' || species === '小熊貓') { const stripe = new THREE.Mesh(new THREE.TorusGeometry(.14, .045, 6, 12), accent); stripe.name = 'TailStripe'; stripe.rotation.x = Math.PI / 2; stripe.position.set(0, .15, -.27); root.add(stripe); }
}
function addLegs(root, material, species) {
  const short = species === '星星小雞';
  for (const x of [-.27, .27]) for (const z of [-.25, .25]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, short ? .18 : .28, 7), material); leg.name = `Leg_${x < 0 ? 'L' : 'R'}_${z < 0 ? 'B' : 'F'}`; leg.position.set(x, short ? .12 : .17, z); root.add(leg); }
}
function addSpeciesDetail(body, head, profile, dark, accent) {
  if (profile.species === '星星小雞') { const beak = new THREE.Mesh(new THREE.ConeGeometry(.07, .18, 6), accent); beak.name = 'Beak'; beak.rotation.x = Math.PI / 2; beak.position.set(0, -.08, .47); head.add(beak); }
  if (profile.species === '小水獺') { const belly = new THREE.Mesh(new THREE.SphereGeometry(.27, 10, 7), accent); belly.name = 'Belly'; belly.scale.set(1, 1.15, .25); belly.position.set(0, .45, .44); body.add(belly); }
  if (profile.species === '小松鼠') { const acorn = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), dark); acorn.name = 'AcornCharm'; acorn.position.set(.35, .55, .32); body.add(acorn); }
}

function createAnimations(profile, index) {
  const axisX = new THREE.Vector3(1, 0, 0);
  const axisY = new THREE.Vector3(0, 1, 0);
  const axisZ = new THREE.Vector3(0, 0, 1);
  const walkDuration = gaitDuration(index);
  const halfWalk = walkDuration / 2;
  const quarterWalk = walkDuration / 4;
  const bounce = 0.04 + (index % 4) * 0.012;
  const tailSweep = 0.22 + index * 0.045;
  return [
    clip('Idle', 1.8 + index * 0.11, [vector('BodyPivot.position', [0,(1.8 + index * 0.11) / 2,1.8 + index * 0.11], [[0,0,0],[0,.025 + index * .004,0],[0,0,0]]), quaternion('TailPivot.quaternion', [0,(1.8 + index * 0.11) / 2,1.8 + index * 0.11], axisZ, [-.12-index*.012,.12+index*.012,-.12-index*.012])]),
    clip('Walk', walkDuration, [vector('BodyPivot.position', [0,quarterWalk,halfWalk,quarterWalk*3,walkDuration], [[0,0,0],[0,bounce,0],[0,0,0],[0,bounce,0],[0,0,0]]), quaternion('BodyPivot.quaternion', [0,halfWalk,walkDuration], axisZ, [-.025-index*.004,.025+index*.004,-.025-index*.004]), quaternion('TailPivot.quaternion', [0,halfWalk,walkDuration], axisY, [-tailSweep,tailSweep,-tailSweep])]),
    clip('Happy', 1.2, [vector('BodyPivot.position', [0,.25,.5,.75,1.2], [[0,0,0],[0,.22,0],[0,0,0],[0,.18,0],[0,0,0]]), quaternion('HeadPivot.quaternion', [0,.3,.6,.9,1.2], axisZ, [0,.18,-.18,.18,0])]),
    clip('Skill', 1, [quaternion('BodyPivot.quaternion', [0,.25,.5,.75,1], axisY, [0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2]), vector('BodyPivot.position', [0,.5,1], [[0,0,0],[0,.3,0],[0,0,0]])]),
    clip('Sleep', 2.4, [quaternion('BodyPivot.quaternion', [0,1,2.4], axisZ, [0,-1.15,-1.15]), vector('BodyPivot.position', [0,1,2.4], [[0,0,0],[0,-.18,0],[0,-.18,0]])]),
    clip('Swim', 1, [quaternion('BodyPivot.quaternion', [0,.5,1], axisX, [-.15,.1,-.15]), quaternion('TailPivot.quaternion', [0,.25,.5,.75,1], axisY, [-.55,.55,-.55,.55,-.55]), vector('BodyPivot.position', [0,.5,1], [[0,0,0],[0,.04,.08],[0,0,.16]])]),
    clip('Find', 1.4, [quaternion('HeadPivot.quaternion', [0,.35,.7,1.05,1.4], axisY, [0,-.5,.5,-.5,0]), vector('HeadPivot.position', [0,.7,1.4], [[0,.63,.38],[0,.48,.4],[0,.63,.38]])]),
    clip('Greet', 1.4, [quaternion('HeadPivot.quaternion', [0,.35,.7,1.05,1.4], axisZ, [0,.25,-.2,.25,0]), quaternion('TailPivot.quaternion', [0,.35,.7,1.05,1.4], axisY, [0,.6,-.6,.6,0]), vector('BodyPivot.position', [0,.7,1.4], [[0,0,0],[0,.08,0],[0,0,0]])]),
  ];
}
function gaitDuration(index) { return Number((0.68 + index * 0.07).toFixed(2)); }
function clip(name, duration, tracks) { return new THREE.AnimationClip(name, duration, tracks); }
function vector(name, times, values) { return new THREE.VectorKeyframeTrack(name, times, values.flat()); }
function quaternion(name, times, axis, angles) {
  const values = [];
  for (const angle of angles) values.push(...new THREE.Quaternion().setFromAxisAngle(axis, angle).toArray());
  return new THREE.QuaternionKeyframeTrack(name, times, values);
}
function toon(color) { return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true }); }
function mix(a,b,r){ const ca=new THREE.Color(a), cb=new THREE.Color(b); ca.lerp(cb,r); return `#${ca.getHexString()}`; }
