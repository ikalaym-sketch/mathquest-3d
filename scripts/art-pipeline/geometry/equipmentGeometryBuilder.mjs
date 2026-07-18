// v0.32 Equipment & Combat 共用Geometry Builder。
// Domain Recipe只能描述Primitive、Socket與色盤；材質、驗證、匯出皆沿用Canonical Pipeline。
import * as THREE from 'three';
import { normalizeAssetRecipe } from '../recipes/assetRecipeSchema.mjs';
import { buildPrimitiveGeometry } from './geometryBuilder.mjs';
import { resolvePipelineMaterial } from '../material/materialResolver.mjs';

export function buildEquipmentAssetScene(definition) {
  const recipe = normalizeAssetRecipe(definition);
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.name = definition.runtimeRole?.startsWith('combat-') ? 'VFXRoot' : 'AttachmentRoot';
  root.userData = {
    assetId: recipe.assetId,
    ownerId: definition.ownerId,
    purpose: recipe.purpose,
    runtimeRole: definition.runtimeRole,
    silhouette: recipe.silhouette,
    proportion: recipe.proportion,
    recipeContract: 'MathQuestAssetRecipeV1',
  };
  scene.add(root);

  for (const part of recipe.geometry) {
    const materialProfile = definition.materialProfile === 'equipment-effect-generated' ? 'standard' : 'toon';
    const mesh = new THREE.Mesh(buildPrimitiveGeometry(part), resolvePipelineMaterial({
      profileId: materialProfile,
      color: part.color || recipe.palette?.[0] || '#cccccc',
      roughness: definition.materialProfile === 'equipment-metal-generated' ? 0.48 : 0.82,
      metalness: definition.materialProfile === 'equipment-metal-generated' ? 0.62 : 0.03,
    }));
    mesh.name = part.name || `${recipe.family}_part`;
    mesh.position.fromArray(part.position || [0, 0, 0]);
    mesh.rotation.fromArray(part.rotation || [0, 0, 0]);
    mesh.scale.fromArray(part.scale || [1, 1, 1]);
    mesh.castShadow = definition.runtimeRole !== 'combat-impact-layer';
    mesh.receiveShadow = definition.runtimeRole === 'equipment-attachment';
    root.add(mesh);
  }

  for (const socketDefinition of recipe.sockets) {
    const socket = new THREE.Object3D();
    socket.name = socketDefinition.name;
    socket.position.fromArray(socketDefinition.position || [0, 0, 0]);
    socket.rotation.fromArray(socketDefinition.rotation || [0, 0, 0]);
    socket.userData = { runtimeOnly: true, ownerId: definition.ownerId };
    root.add(socket);
  }

  return scene;
}
