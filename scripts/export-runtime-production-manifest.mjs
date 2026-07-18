// 匯出正式 Runtime 資產與區域遭遇清單，供部署檢查與外部資產團隊對照。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTION_ASSET_CATALOG } from '../src/data/productionAssetCatalog.js';
import { REGION_ENCOUNTERS } from '../src/data/regionEncounters.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestDir = path.join(root, 'public', 'manifests');
const docsDir = path.join(root, 'docs');
fs.mkdirSync(manifestDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const manifest = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  assets: PRODUCTION_ASSET_CATALOG,
  encounters: REGION_ENCOUNTERS,
};
fs.writeFileSync(path.join(manifestDir, 'runtime-production-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const rows = [['Region_ID', 'Tier', 'Actor_ID', 'Name', 'Behavior', 'HP', 'ATK', 'Weakness', 'Model_Asset_ID', 'Spawn_Count']];
for (const encounter of Object.values(REGION_ENCOUNTERS)) {
  for (const actor of encounter.normal) rows.push([encounter.regionId, 'normal', actor.id, actor.name, actor.behavior, actor.hp, actor.atk, actor.weak, actor.modelAssetId, encounter.normalSpawns.length]);
  rows.push([encounter.regionId, 'elite', encounter.elite.id, encounter.elite.name, encounter.elite.behavior, encounter.elite.hp, encounter.elite.atk, encounter.elite.weak, encounter.elite.modelAssetId, 1]);
  rows.push([encounter.regionId, 'boss', encounter.boss.id, encounter.boss.name, 'boss', encounter.boss.hp, encounter.boss.atk, '', encounter.boss.modelAssetId, 1]);
}
fs.writeFileSync(path.join(docsDir, 'REGION_ENCOUNTER_MATRIX.csv'), `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);

console.log(JSON.stringify({ manifest: 'public/manifests/runtime-production-manifest.json', matrix: 'docs/REGION_ENCOUNTER_MATRIX.csv', rows: rows.length - 1 }, null, 2));

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
