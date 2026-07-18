import fs from 'node:fs';
import { validateTerrainTraversalFoundation } from '../src/services/TerrainTraversalValidationService.js';

const report = validateTerrainTraversalFoundation();
const terrainSource = fs.readFileSync(new URL('../src/components/World/RegionProductionKit.jsx', import.meta.url), 'utf8');
const traversalSource = fs.readFileSync(new URL('../src/components/World/RegionTraversalLayer.jsx', import.meta.url), 'utf8');
const waterSource = fs.readFileSync(new URL('../src/components/World/RegionWaterSurface.jsx', import.meta.url), 'utf8');
const playerSource = fs.readFileSync(new URL('../src/components/3D/Player.jsx', import.meta.url), 'utf8');
const monsterSource = fs.readFileSync(new URL('../src/components/Entities/Monsters.jsx', import.meta.url), 'utf8');
const bossSource = fs.readFileSync(new URL('../src/components/Entities/Boss.jsx', import.meta.url), 'utf8');

const destructiveChecks = [
  ['RegionProductionTerrain no longer mounts BaseTerrain', !terrainSource.includes('<BaseTerrain layout={layout}')],
  ['Traversal layer does not create one full-map CuboidCollider', !traversalSource.includes('args={[width / 2, 0.35, depth / 2]}')],
  ['Water uses sensors and only explicit wade/ice floor colliders', waterSource.includes('sensor') && waterSource.includes('isShallow &&') && waterSource.includes('isIce &&')],
  ['Ravine has dedicated non-water rendering', traversalSource.includes('function RavineBody')],
  ['Player uses sampled traversal height for grounded', playerSource.includes('sampleTraversalSurface') && playerSource.includes('lastSafePosition')],
  ['Monster movement uses shared traversal projection', monsterSource.includes('projectTraversalStep')],
  ['Boss movement uses shared traversal projection', bossSource.includes('projectTraversalStep')],
  ['Road routing uses safe polyline pathfinding', fs.readFileSync(new URL('../src/services/TraversalSurfaceService.js', import.meta.url), 'utf8').includes('resolveRoadPolyline')],
].map(([name, ok]) => ({ name, ok }));

const failedChecks = destructiveChecks.filter((item) => !item.ok);
const finalReport = {
  generatedAt: new Date().toISOString(),
  ...report,
  destructiveChecks,
  failureCount: report.errors.length + failedChecks.length,
  ok: report.ok && failedChecks.length === 0,
};
console.log(JSON.stringify(finalReport, null, 2));
if (!finalReport.ok) process.exitCode = 1;
