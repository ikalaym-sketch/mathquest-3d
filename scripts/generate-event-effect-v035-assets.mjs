// v0.35 精確新增 55 個 Event／Ecology／VFX GLB。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V035_EVENT_EFFECT_ASSET_DEFINITIONS } from '../src/data/eventEffectV035Catalog.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { buildEventEffectAssetScene } from './art-pipeline/geometry/eventEffectGeometryBuilder.mjs';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = [];
for (const definition of V035_EVENT_EFFECT_ASSET_DEFINITIONS) {
  const asset = getCanonicalAsset(definition.assetId);
  if (!asset) throw new Error(`v0.35資產未註冊：${definition.assetId}`);
  const { scene, animations } = buildEventEffectAssetScene(definition);
  const target = path.join(root, 'public', asset.canonicalPath);
  const result = await exportCanonicalGlb({ scene, animations, target, asset, onlyVisible: false });
  generated.push({ assetId: asset.assetId, category: asset.category, path: relative(target), bytes: result.bytes });
}

console.log(JSON.stringify({
  scope: 'events-v035',
  generatedCount: generated.length,
  eventCount: generated.filter((item) => item.category === 'event').length,
  effectCount: generated.filter((item) => item.category === 'effect').length,
  totalBytes: generated.reduce((sum, item) => sum + item.bytes, 0),
}, null, 2));

function relative(target) { return path.relative(root, target).replaceAll(path.sep, '/'); }
