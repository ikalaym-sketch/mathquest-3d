// v0.30 星光村80個 Canonical GLB 生成器。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VILLAGE_ASSET_DEFINITIONS } from '../src/data/villageAssetCatalog.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { createVillageFarmAssetScene } from './art-pipeline/geometry/villageFarmGeometryBuilder.mjs';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
for (const definition of VILLAGE_ASSET_DEFINITIONS) {
  const asset = getCanonicalAsset(definition.assetId);
  if (!asset) throw new Error(`星光村資產未註冊：${definition.assetId}`);
  const scene = createVillageFarmAssetScene(definition);
  const target = path.join(root, 'public', asset.canonicalPath);
  const result = await exportCanonicalGlb({ scene, target, asset, onlyVisible: false });
  results.push({ assetId: definition.assetId, target: path.relative(root, target).replaceAll('\\', '/'), bytes: result.bytes });
}
console.log(JSON.stringify({ scope: 'village', generatedCount: results.length, results }, null, 2));
