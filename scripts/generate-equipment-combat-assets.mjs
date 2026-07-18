// v0.32 140個 Equipment & Combat Canonical GLB 生成器。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V032_EQUIPMENT_ASSET_DEFINITIONS } from '../src/data/equipmentCombatV032Catalog.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { buildEquipmentAssetScene } from './art-pipeline/geometry/equipmentGeometryBuilder.mjs';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

for (const definition of V032_EQUIPMENT_ASSET_DEFINITIONS) {
  const asset = getCanonicalAsset(definition.assetId);
  if (!asset) throw new Error(`裝備資產未註冊：${definition.assetId}`);
  const scene = buildEquipmentAssetScene(definition);
  const target = path.join(root, 'public', asset.canonicalPath);
  const result = await exportCanonicalGlb({ scene, target, asset, onlyVisible: false });
  results.push({ assetId: definition.assetId, target: path.relative(root, target).replaceAll('\\', '/'), bytes: result.bytes });
}

console.log(JSON.stringify({ scope: 'equipment', generatedCount: results.length, totalBytes: results.reduce((sum, item) => sum + item.bytes, 0), results }, null, 2));
