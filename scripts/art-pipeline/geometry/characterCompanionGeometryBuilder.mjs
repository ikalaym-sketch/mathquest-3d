// v0.31 角色外觀與夥伴模組共用Geometry Builder。
// 每筆輸入先通過Asset Recipe Schema，再由唯一Primitive與Material解析器建場景，禁止Domain Adapter自行分叉規格。
import * as THREE from 'three';
import { normalizeAssetRecipe } from '../recipes/assetRecipeSchema.mjs';
import { buildPrimitiveGeometry } from './geometryBuilder.mjs';
import { resolvePipelineMaterial } from '../material/materialResolver.mjs';

export function buildCharacterCompanionModuleScene(definition) {
  const recipe = normalizeAssetRecipe(definition);
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.name = definition.category === 'character' ? 'AttachmentRoot' : 'AssetRoot';
  root.userData = {
    assetId: recipe.assetId,
    purpose: recipe.purpose,
    silhouette: recipe.silhouette,
    proportion: recipe.proportion,
    recipeContract: 'MathQuestAssetRecipeV1',
  };
  scene.add(root);

  for (const part of recipe.geometry) {
    const mesh = new THREE.Mesh(buildPrimitiveGeometry(part), resolvePipelineMaterial({
      profileId: 'toon',
      color: part.color || recipe.palette?.[0] || '#cccccc',
      roughness: 0.9,
      metalness: recipe.moduleType === 'skill' ? 0.08 : 0,
    }));
    mesh.name = part.name || `${recipe.family}_part`;
    mesh.position.fromArray(part.position || [0, 0, 0]);
    mesh.rotation.fromArray(part.rotation || [0, 0, 0]);
    mesh.scale.fromArray(part.scale || [1, 1, 1]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  if (definition.moduleType === 'home') {
    const collider = new THREE.Object3D();
    collider.name = 'COLLIDER_Main';
    collider.position.set(0, 0.18, 0);
    collider.userData = { shape: 'box', size: [1.2, 0.36, 0.95], runtimeOnly: true };
    root.add(collider);
    const socket = new THREE.Object3D();
    socket.name = 'SOCKET_Companion';
    socket.position.set(0, 0.25, 0);
    root.add(socket);
  }

  if (definition.moduleType === 'skill') {
    const socket = new THREE.Object3D();
    socket.name = 'SOCKET_VFX';
    socket.position.set(0, 0.25, 0);
    root.add(socket);
  }
  return scene;
}
