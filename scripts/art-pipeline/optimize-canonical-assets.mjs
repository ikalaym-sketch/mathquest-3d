// v0.29.1 Canonical GLB 正式優化入口。
// 依 scope 對 Registry 內現有 GLB 執行可重複的 Material Consolidation，保留節點、骨架與動畫契約。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CANONICAL_ASSET_REGISTRY } from '../../src/data/productionAssetCatalog.js';
import { exportCanonicalGlb } from './export/glbExporter.mjs';
import { consolidateVertexColorMaterials } from './optimization/vertexColorMaterialConsolidator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scope = process.argv.find((arg) => arg.startsWith('--scope='))?.split('=')[1] || 'all';
const categories = categoriesForScope(scope);
const assets = Object.values(CANONICAL_ASSET_REGISTRY).filter((asset) => !categories || categories.has(asset.category));
const results = [];

for (const asset of assets) {
  const target = path.join(root, 'public', asset.canonicalPath);
  const source = await fs.readFile(target);
  const arrayBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(arrayBuffer, '', resolve, reject));
  const exportScene = gltf.scene.isScene ? gltf.scene : wrapAsScene(gltf.scene);
  const optimization = consolidateVertexColorMaterials(exportScene);
  if (optimization.optimized) {
    await exportCanonicalGlb({ scene: exportScene, animations: gltf.animations || [], target, asset, onlyVisible: false });
  }
  results.push({ assetId: asset.assetId, ...optimization });
}

const summary = results.reduce((output, result) => {
  output.processed += 1;
  output.optimized += result.optimized ? 1 : 0;
  output.skipped += result.optimized ? 0 : 1;
  output.beforeMaterials += result.beforeMaterials || 0;
  output.afterMaterials += result.afterMaterials || 0;
  output.reasons[result.reason] = (output.reasons[result.reason] || 0) + 1;
  return output;
}, { scope, processed: 0, optimized: 0, skipped: 0, beforeMaterials: 0, afterMaterials: 0, reasons: {} });

console.log(JSON.stringify(summary, null, 2));

function categoriesForScope(value) {
  if (value === 'all') return null;
  if (value === 'production') return new Set(['character', 'region-structure', 'bridge', 'monster', 'elite', 'boss']);
  if (value === 'environment') return new Set(['region-environment']);
  if (value === 'companions') return new Set(['companion']);
  if (value === 'village') return new Set(['village']);
  if (value === 'farm') return new Set(['farm']);
  if (value === 'equipment') return new Set(['equipment']);
  if (value === 'regionsV033') return new Set(['forest', 'region-structure', 'bridge', 'region-environment', 'creature', 'monster', 'elite', 'boss']);
  if (value === 'interiorsV034') return new Set(['interior', 'trial-tower']);
  if (value === 'eventsV035') return new Set(['event', 'effect']);
  throw new Error(`未知 Optimizer scope：${value}`);
}

function wrapAsScene(root) {
  const scene = new THREE.Scene();
  scene.name = 'CanonicalScene';
  scene.add(root);
  return scene;
}
