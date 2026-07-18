// v0.24~v0.26 合併測試：純讀取，不改寫工程證據，確保乾淨解壓後 Hash 穩定。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnvironmentLifeContent } from '../src/services/EnvironmentLifeValidationService.js';
import { REGION_ENVIRONMENT_ASSETS } from '../src/data/regionEnvironmentAssetCatalog.js';
import { CANONICAL_ASSET_COUNT, getCanonicalAsset } from '../src/data/productionAssetCatalog.js';
import { REGION_PRODUCTION_LAYOUTS } from '../src/data/regionProductionLayouts.js';
import { WATER_STATE, classifyWaterState, computeWaterMotion, findWaterExitCandidates } from '../src/services/WaterTraversalService.js';
import { getWaterEnvironmentProfile } from '../src/data/waterEnvironmentProfiles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = validateEnvironmentLifeContent();
const errors = [...result.errors];
const warnings = [...result.warnings];
const assets = [];
const allGlbFiles = listFiles(path.join(root, 'public', 'models')).filter((file) => file.endsWith('.glb'));
const invalidGlbFiles = [];

for (const asset of Object.values(REGION_ENVIRONMENT_ASSETS)) {
  const descriptor = getCanonicalAsset(asset.assetId);
  const filepath = descriptor ? path.join(root, 'public', descriptor.canonicalPath) : null;
  if (!filepath || !fs.existsSync(filepath)) {
    errors.push(`${asset.regionId}/${asset.id}: GLB 不存在。`);
    continue;
  }
  const buffer = fs.readFileSync(filepath);
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') {
    errors.push(`${asset.id}: GLB Header 無效。`);
    continue;
  }
  const json = parseGlbJson(buffer);
  const names = new Set((json.nodes || []).map((node) => node.name || ''));
  for (const nodeName of asset.requiredNodes) {
    if (!names.has(nodeName)) errors.push(`${asset.id}: 缺少節點 ${nodeName}。`);
  }
  const primitiveCount = (json.meshes || []).reduce((sum, mesh) => sum + (mesh.primitives?.length || 0), 0);
  const materialCount = json.materials?.length || 0;
  if (primitiveCount < 3) errors.push(`${asset.id}: 三層 LOD 的 Mesh Primitive 不足。`);
  if (buffer.length > 180_000) warnings.push(`${asset.id}: GLB 超過 180 KB，需確認手機預算。`);
  if (materialCount > 16) warnings.push(`${asset.id}: Material ${materialCount} 超過建議上限 16。`);
  assets.push({ id: asset.id, regionId: asset.regionId, bytes: buffer.length, nodes: json.nodes?.length || 0, meshes: json.meshes?.length || 0, materials: materialCount, primitiveCount });
}


for (const filepath of allGlbFiles) {
  const buffer = fs.readFileSync(filepath);
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') {
    invalidGlbFiles.push(path.relative(root, filepath));
  }
}
const expectedProjectGlbCount = CANONICAL_ASSET_COUNT; // 直接跟隨唯一Canonical Registry，禁止測試保留舊版本硬編數量。
if (allGlbFiles.length !== expectedProjectGlbCount) errors.push(`全工程 GLB 應為 ${expectedProjectGlbCount}，實際 ${allGlbFiles.length}。`);
if (invalidGlbFiles.length) errors.push(`全工程存在 ${invalidGlbFiles.length} 個無效 GLB Header。`);

const sourceChecks = [
  ['Player 具 Wade/Swim/Ice/Hazard/Ravine 狀態', source('src/components/3D/Player.jsx').includes('WATER_STATE.SWIM') && source('src/components/3D/Player.jsx').includes('WATER_STATE.RAVINE')],
  ['深水具氧氣與安全上岸', source('src/components/3D/Player.jsx').includes('oxygenRef') && source('src/components/3D/Player.jsx').includes('findNearestWaterExit')],
  ['水域使用 Sensor Collider', source('src/components/World/RegionWaterSurface.jsx').includes('sensor')],
  ['生活 NPC 使用 Kinematic RigidBody', source('src/components/World/RegionLifeLayer.jsx').includes('kinematicPosition')],
  ['室內使用獨立 Pocket Runtime', source('src/components/World/RegionInteriorLayer.jsx').includes('InteriorPocket')],
  ['環境 GLB 使用 LOD Runtime', source('src/components/3D/LodEnvironmentModel.jsx').includes("getObjectByName('LOD0')")],
  ['水下覆蓋層已接入 App', source('src/App.jsx').includes('UnderwaterOverlay') && source('src/components/UI/UnderwaterOverlay.jsx').includes('isUnderwater')],
  ['冰面具穩定度與安全救援', source('src/components/3D/Player.jsx').includes('iceStress') && source('src/components/3D/Player.jsx').includes('breakAfterSeconds')],
  ['區域環境音依場景切換', source('src/components/UI/AudioController.jsx').includes('startRegionAmbience') && source('src/audio/regionAmbience.js').includes('REGION_MUSIC_THEME')],
].map(([name, ok]) => ({ name, ok }));
for (const check of sourceChecks) if (!check.ok) errors.push(`Source check failed: ${check.name}`);

const destructiveChecks = [];
for (const layout of Object.values(REGION_PRODUCTION_LAYOUTS)) {
  for (const water of layout.waters || []) {
    const profile = getWaterEnvironmentProfile(water);
    const surfaceY = water.surfaceY ?? 0.13;
    const center = { x: water.center[0], y: surfaceY - 0.45, z: water.center[1] };
    const context = classifyWaterState(layout, center, WATER_STATE.GROUND);
    const expectedState = profile.mode === 'swim'
      ? WATER_STATE.SWIM
      : profile.mode === 'wade'
        ? WATER_STATE.WADE
        : profile.mode;
    destructiveChecks.push({
      name: `${layout.id}/${water.id} 狀態分類`,
      ok: context.state === expectedState,
      actual: context.state,
      expected: expectedState,
    });
    if (profile.swimAllowed) {
      const exits = findWaterExitCandidates(layout, water, center, 100);
      destructiveChecks.push({ name: `${layout.id}/${water.id} 至少兩個安全上岸點`, ok: exits.length >= 2, exitCount: exits.length });
      const motion = computeWaterMotion({ state: WATER_STATE.SWIM, profile, input: { x: 1, y: 1 }, yaw: 0.4, verticalVelocity: -2, delta: 1 / 60, jumpQueued: true });
      destructiveChecks.push({
        name: `${layout.id}/${water.id} 游泳動力限制`,
        ok: motion.gravityScale < 0.2 && motion.velocity.y > 0 && Number.isFinite(motion.velocity.x) && Number.isFinite(motion.velocity.z),
      });
    }
    if (profile.mode === 'ice') {
      const motion = computeWaterMotion({ state: WATER_STATE.ICE, profile, input: { x: 1, y: 0 }, yaw: 0, verticalVelocity: 0, delta: 1 / 60, jumpQueued: false });
      destructiveChecks.push({ name: `${layout.id}/${water.id} 冰面牽引力`, ok: motion.traction > 0 && motion.traction < 1 && profile.breakAfterSeconds > 0 });
    }
    if (profile.mode === 'hazard') destructiveChecks.push({ name: `${layout.id}/${water.id} 危險液體具傷害與快速救援`, ok: profile.damagePerSecond > 0 && profile.rescueDelay <= 2 });
    if (profile.mode === 'ravine') destructiveChecks.push({ name: `${layout.id}/${water.id} 裂縫禁止游泳`, ok: !profile.swimAllowed && profile.rescueDelay <= 2 });
  }
}
const sampleLayout = Object.values(REGION_PRODUCTION_LAYOUTS)[0];
const clearPoint = { x: sampleLayout.spawn[0], y: sampleLayout.spawn[1], z: sampleLayout.spawn[2] };
destructiveChecks.push({
  name: '離開水域後只產生一次 Exit 狀態',
  ok: classifyWaterState(sampleLayout, clearPoint, WATER_STATE.SWIM).state === WATER_STATE.EXIT
    && classifyWaterState(sampleLayout, clearPoint, WATER_STATE.EXIT).state === WATER_STATE.GROUND,
});
for (const check of destructiveChecks) if (!check.ok) errors.push(`Destructive check failed: ${check.name}`);

const totalBytes = assets.reduce((sum, item) => sum + item.bytes, 0);
const report = {
  generatedAt: new Date().toISOString(),
  version: '0.30.0',
  ok: errors.length === 0,
  content: result.summary,
  glbAssets: { count: assets.length, totalProjectCount: allGlbFiles.length, invalidProjectHeaders: invalidGlbFiles, totalBytes, averageBytes: assets.length ? Math.round(totalBytes / assets.length) : 0, files: assets },
  sourceChecks,
  destructiveChecks,
  failureCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

function source(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filepath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filepath) : [filepath];
  });
}
function parseGlbJson(buffer) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) return JSON.parse(chunk.toString('utf8').trim());
    offset += 8 + length;
  }
  throw new Error('GLB JSON chunk not found');
}
