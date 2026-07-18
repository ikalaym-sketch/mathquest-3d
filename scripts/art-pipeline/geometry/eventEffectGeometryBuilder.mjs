// v0.35 Event／Ecology／VFX 共用 Geometry Builder。
import * as THREE from 'three';
import { normalizeAssetRecipe } from '../recipes/assetRecipeSchema.mjs';
import { buildPrimitiveGeometry } from './geometryBuilder.mjs';
import { resolvePipelineMaterial } from '../material/materialResolver.mjs';
import { enforceLodBudgets } from '../lod/lodBudgetEnforcer.mjs';

export function buildEventEffectAssetScene(definition) {
  const recipe = normalizeAssetRecipe(definition);
  const scene = new THREE.Scene();
  scene.name = `${definition.id}_scene`;
  const root = new THREE.Group();
  root.name = 'AssetRoot';
  root.userData = {
    assetId: recipe.assetId,
    purpose: recipe.purpose,
    family: recipe.family,
    recipeContract: 'MathQuestAssetRecipeV1',
    effectContract: recipe.category === 'effect' ? 'MathQuestRuntimeEffectV1' : null,
  };
  scene.add(root);

  for (const lodName of ['LOD0', 'LOD1', 'LOD2']) {
    const group = new THREE.Group();
    group.name = lodName;
    group.userData = { lod: Number(lodName.slice(-1)), source: 'eventEffectGeometryBuilder' };
    for (const part of recipe.geometry) {
      const material = resolvePipelineMaterial({
        profileId: 'toon',
        color: part.color || recipe.palette?.[0] || '#ffffff',
        roughness: recipe.category === 'effect' ? 0.38 : 0.84,
        metalness: recipe.family?.includes('gear') ? 0.32 : 0.02,
      });
      const mesh = new THREE.Mesh(buildPrimitiveGeometry(part), material);
      mesh.name = part.name;
      mesh.position.fromArray(part.position || [0, 0, 0]);
      mesh.rotation.fromArray(part.rotation || [0, 0, 0]);
      mesh.scale.fromArray(part.scale || [1, 1, 1]);
      mesh.castShadow = recipe.category !== 'effect';
      mesh.receiveShadow = recipe.category !== 'effect';
      group.add(mesh);
    }
    group.visible = lodName === 'LOD0';
    root.add(group);
  }

  const collider = new THREE.Object3D();
  collider.name = 'COLLIDER_Main';
  collider.userData = { shape: 'box', runtimeOnly: true, solid: false, visualOnly: true };
  root.add(collider);
  for (const socketRecipe of recipe.sockets) {
    const socket = new THREE.Object3D();
    socket.name = socketRecipe.name;
    socket.position.fromArray(socketRecipe.position || [0, 0, 0]);
    socket.userData = { effectSocket: true };
    root.add(socket);
  }
  root.userData.lodResult = enforceLodBudgets(scene, recipe.lod.ratios);
  return { scene, animations: [] };
}
