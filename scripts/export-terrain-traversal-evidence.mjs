import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGION_PRODUCTION_LAYOUTS } from '../src/data/regionProductionLayouts.js';
import { validateTerrainTraversalFoundation } from '../src/services/TerrainTraversalValidationService.js';
import { getWaterBehavior, resolveBridgeGeometry } from '../src/services/TraversalSurfaceService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const manifestDir = path.join(root, 'public', 'manifests');
fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(manifestDir, { recursive: true });

const generatedAt = new Date().toISOString();
const validation = { generatedAt, ...validateTerrainTraversalFoundation() };
if (!validation.ok) {
  console.error(JSON.stringify(validation, null, 2));
  process.exit(1);
}

const regions = Object.values(REGION_PRODUCTION_LAYOUTS).map((layout) => {
  const validationRow = validation.regionReports.find((item) => item.regionId === layout.id);
  return {
    regionId: layout.id,
    label: layout.label,
    subareas: layout.subareas.length,
    roads: layout.roads.length,
    roadRuns: validationRow?.roadRuns || 0,
    waters: layout.waters.map((water) => ({
      id: water.id,
      kind: water.kind,
      behavior: getWaterBehavior(water),
      center: water.center,
      size: water.size,
      rotation: water.rotation || 0,
    })),
    bridges: layout.bridges.map((bridge) => {
      const resolved = resolveBridgeGeometry(layout, bridge);
      return {
        id: bridge.id,
        waterId: bridge.waterId,
        width: bridge.width,
        resolvedLength: Number(resolved.resolvedLength.toFixed(2)),
        deckY: Number(resolved.deckY.toFixed(2)),
        start: resolved.start.map((value) => Number(value.toFixed(2))),
        end: resolved.end.map((value) => Number(value.toFixed(2))),
      };
    }),
    structures: layout.structures.length,
    baseRectangles: validationRow?.baseRectangles || 0,
    terraceRectangles: validationRow?.terraceRectangles || 0,
    status: validationRow?.ok ? 'PASS' : 'FAIL',
  };
});

const manifest = {
  schemaVersion: 1,
  release: '0.23.0',
  generatedAt,
  canonicalSource: 'src/data/regionProductionLayouts.js',
  runtimeModules: [
    'src/services/TraversalSurfaceService.js',
    'src/components/World/RegionTraversalLayer.jsx',
    'src/services/TerrainTraversalValidationService.js',
  ],
  scope: {
    regions: validation.regions,
    subareas: validation.subareas,
    roads: validation.roads,
    roadRuns: validation.roadRuns,
    waters: validation.waters,
    bridges: validation.bridges,
    structures: validation.structures,
    encounterSpawns: validation.encounterSpawns,
  },
  constraints: {
    maxRoadSlopeDegrees: 18,
    measuredMaxRoadSlopeDegrees: validation.maxRoadSlopeDegrees,
    fullMapColliderAllowed: false,
    hiddenWaterFloorAllowed: false,
    bridgeRequiredAcrossHazards: true,
    swimmingImplemented: false,
  },
  regions,
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const headers = [
  'Region_ID', 'Region_Label', 'Subareas', 'Roads', 'Road_Runs', 'Waters',
  'Water_Behaviors', 'Bridges', 'Structures', 'Base_Rectangles',
  'Terrace_Rectangles', 'Max_Road_Slope_Degrees', 'Status',
];
const rows = regions.map((region) => [
  region.regionId,
  region.label,
  region.subareas,
  region.roads,
  region.roadRuns,
  region.waters.length,
  [...new Set(region.waters.map((water) => water.behavior))].join('|'),
  region.bridges.length,
  region.structures,
  region.baseRectangles,
  region.terraceRectangles,
  validation.maxRoadSlopeDegrees,
  region.status,
]);
const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';

fs.writeFileSync(path.join(docsDir, 'TERRAIN_TRAVERSAL_VALIDATION.json'), `${JSON.stringify(validation, null, 2)}\n`);
fs.writeFileSync(path.join(docsDir, 'TERRAIN_TRAVERSAL_MATRIX.csv'), csv);
fs.writeFileSync(path.join(manifestDir, 'terrain-traversal-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, validation: 'docs/TERRAIN_TRAVERSAL_VALIDATION.json', matrix: 'docs/TERRAIN_TRAVERSAL_MATRIX.csv', manifest: 'public/manifests/terrain-traversal-manifest.json' }, null, 2));
