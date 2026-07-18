// v0.34 精確新增 96 個 Interior／Trial Tower GLB。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V034_INTERIOR_TOWER_ASSET_DEFINITIONS } from '../src/data/interiorTowerV034Catalog.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { buildInteriorTowerAssetScene } from './art-pipeline/geometry/interiorTowerGeometryBuilder.mjs';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = [];

for (const definition of V034_INTERIOR_TOWER_ASSET_DEFINITIONS) {
  const asset = getCanonicalAsset(definition.assetId);
  if (!asset) throw new Error(`v0.34資產未註冊：${definition.assetId}`);
  const { scene, animations } = buildInteriorTowerAssetScene(definition);
  const target = path.join(root, 'public', asset.canonicalPath);
  const result = await exportCanonicalGlb({ scene, animations, target, asset, onlyVisible: false });
  generated.push({ assetId: asset.assetId, category: asset.category, path: relative(target), bytes: result.bytes });
}

console.log(JSON.stringify({
  scope: 'interiors-v034',
  generatedCount: generated.length,
  interiorCount: generated.filter((item) => item.category === 'interior').length,
  towerCount: generated.filter((item) => item.category === 'trial-tower').length,
  totalBytes: generated.reduce((sum, item) => sum + item.bytes, 0),
}, null, 2));

function relative(target) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}
