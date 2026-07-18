// v0.29.1 全自動美術生產唯一入口。
// 依 scope 呼叫正式領域 Recipe Adapter；所有 Adapter 共用 Export／Validation／Material／LOD 契約。
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scope = process.argv.find((arg) => arg.startsWith('--scope='))?.split('=')[1] || 'all';
const scripts = {
  production: 'scripts/generate-production-assets.mjs',
  environment: 'scripts/generate-region-environment-assets.mjs',
  companions: 'scripts/generate-companion-assets.mjs',
  village: 'scripts/generate-village-assets.mjs',
  farm: 'scripts/generate-farm-expansion-assets.mjs',
  equipment: 'scripts/generate-equipment-combat-assets.mjs',
  regionsV033: 'scripts/generate-region-creature-v033-assets.mjs',
  interiorsV034: 'scripts/generate-interior-tower-v034-assets.mjs',
  eventsV035: 'scripts/generate-event-effect-v035-assets.mjs',
};
const selected = scope === 'all' ? Object.values(scripts) : [scripts[scope]].filter(Boolean);
if (!selected.length) throw new Error(`未知 Art Pipeline scope：${scope}`);

const results = [];
for (const script of selected) results.push(await run(script));
if (results.every((item) => item.code === 0)) results.push(await run(`scripts/art-pipeline/optimize-canonical-assets.mjs`, [`--scope=${scope}`]));
console.log(JSON.stringify({ scope, stages: results, ok: results.every((item) => item.code === 0) }, null, 2));
if (results.some((item) => item.code !== 0)) process.exitCode = 1;

function run(script, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, script), ...args], { cwd: root, stdio: 'inherit' });
    child.on('exit', (code) => resolve({ script, code: code ?? 1 }));
  });
}
