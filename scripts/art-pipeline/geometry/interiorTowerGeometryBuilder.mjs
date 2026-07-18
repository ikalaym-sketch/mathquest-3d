// v0.34 室內與試煉塔共用 Geometry Builder；所有模組遵守相同 Snap／Collider／LOD 契約。
import * as THREE from 'three';
import { normalizeAssetRecipe } from '../recipes/assetRecipeSchema.mjs';
import { buildPrimitiveGeometry } from './geometryBuilder.mjs';
import { resolvePipelineMaterial } from '../material/materialResolver.mjs';
import { enforceLodBudgets } from '../lod/lodBudgetEnforcer.mjs';

export function buildInteriorTowerAssetScene(definition) {
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
    modularContract: 'MathQuestModularSocketV1',
  };
  scene.add(root);

  for (const lodName of ['LOD0', 'LOD1', 'LOD2']) {
    const group = new THREE.Group();
    group.name = lodName;
    group.userData = { lod: Number(lodName.slice(-1)), source: 'interiorTowerGeometryBuilder' };
    for (const part of recipe.geometry) {
      const material = resolvePipelineMaterial({
        profileId: 'toon',
        color: part.color || recipe.palette?.[0] || '#cccccc',
        roughness: recipe.category === 'trial-tower' ? 0.72 : 0.88,
        metalness: recipe.family?.includes('gear') || recipe.family?.includes('foundry') ? 0.24 : 0.03,
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
    group.visible = lodName === 'LOD0';
    root.add(group);
  }

  const collider = new THREE.Object3D();
  collider.name = 'COLLIDER_Main';
  collider.userData = {
    shape: 'box',
    runtimeOnly: true,
    solid: true,
    collisionOwnedBy: recipe.category === 'interior' ? 'InteriorPocket' : 'TrialTowerArena',
  };
  root.add(collider);
  for (const socketRecipe of recipe.sockets) {
    const socket = new THREE.Object3D();
    socket.name = socketRecipe.name;
    socket.position.fromArray(socketRecipe.position || [0, 0, 0]);
    socket.rotation.fromArray(socketRecipe.rotation || [0, 0, 0]);
    socket.userData = { modularSocket: true };
    root.add(socket);
  }

  const lodResult = enforceLodBudgets(scene, recipe.lod.ratios);
  root.userData.lodResult = lodResult;
  return { scene, animations: [] };
}
