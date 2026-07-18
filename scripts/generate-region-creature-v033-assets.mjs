// v0.33 精確新增 126 個 Region／Forest／Creature GLB，並重製既有 40 個遭遇角色。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V033_REGION_CREATURE_ASSET_DEFINITIONS } from '../src/data/regionCreatureV033Catalog.js';
import { REGION_ENCOUNTERS } from '../src/data/regionEncounters.js';
import { getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { buildEncounterActorScene, buildRegionCreatureAssetScene } from './art-pipeline/geometry/regionCreatureGeometryBuilder.mjs';
import { exportCanonicalGlb } from './art-pipeline/export/glbExporter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const created = [];
const reworked = [];

for (const definition of V033_REGION_CREATURE_ASSET_DEFINITIONS) {
  const asset = requireAsset(definition.assetId);
  const { scene, animations } = buildRegionCreatureAssetScene(definition);
  const target = path.join(root, 'public', asset.canonicalPath);
  const result = await exportCanonicalGlb({ scene, animations, target, asset, onlyVisible: false });
  created.push({ assetId: asset.assetId, path: relative(target), bytes: result.bytes });
}

for (const encounter of Object.values(REGION_ENCOUNTERS)) {
  for (const definition of encounter.normal) await rebuildEncounter(definition, 'normal');
  await rebuildEncounter(encounter.elite, 'elite');
  await rebuildEncounter(encounter.boss, 'boss');
}

console.log(JSON.stringify({
  scope: 'regions-v033',
  generatedNewCount: created.length,
  reworkedEncounterCount: reworked.length,
  totalWritten: created.length + reworked.length,
  newBytes: created.reduce((sum, item) => sum + item.bytes, 0),
}, null, 2));

async function rebuildEncounter(definition, tier) {
  const asset = requireAsset(definition.modelAssetId || `encounter:${definition.id}`);
  const { scene, animations } = buildEncounterActorScene(definition, tier);
  const target = path.join(root, 'public', asset.canonicalPath);
  const result = await exportCanonicalGlb({ scene, animations, target, asset, onlyVisible: false });
  reworked.push({ assetId: asset.assetId, path: relative(target), bytes: result.bytes });
}

function requireAsset(assetId) {
  const asset = getCanonicalAsset(assetId);
  if (!asset) throw new Error(`v0.33資產未註冊：${assetId}`);
  return asset;
}

function relative(target) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}
