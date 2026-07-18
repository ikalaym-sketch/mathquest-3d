// v0.23 地形與通行強制驗證器。
// 驗證資料配置、道路尋路、橋梁連岸、建築 footprint、遭遇出生點與安全坡度。
import { REGION_PRODUCTION_LAYOUTS } from '../data/regionProductionLayouts.js';
import { REGION_ENCOUNTERS } from '../data/regionEncounters.js';
import { REGION_STRUCTURE_CATALOG } from '../data/physicalObjectCatalog.js';
import {
  buildRoadRuns,
  buildWalkableRectangles,
  getBridgeAtPoint,
  getWaterAtPoint,
  localToWorld2D,
  sampleTraversalSurface,
  validateTraversalLayout,
} from './TraversalSurfaceService.js';

function sampleLine(from, to, count = 80) {
  return Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count;
    return {
      x: from[0] + (to[0] - from[0]) * t,
      z: from[2] + (to[2] - from[2]) * t,
    };
  });
}

function structureFootprintSamples(instance, footprint) {
  const scale = Number(instance.scale) || 1;
  const halfWidth = footprint[0] * scale / 2;
  const halfDepth = footprint[1] * scale / 2;
  const result = [];
  for (const x of [-halfWidth, -halfWidth / 2, 0, halfWidth / 2, halfWidth]) {
    for (const z of [-halfDepth, -halfDepth / 2, 0, halfDepth / 2, halfDepth]) {
      result.push(localToWorld2D(x, z, [instance.position[0], instance.position[2]], instance.rotation || 0));
    }
  }
  return result;
}

export function validateTerrainTraversalFoundation() {
  const errors = [];
  const warnings = [];
  const regionReports = [];
  let totalBaseRectangles = 0;
  let totalTerraceRectangles = 0;
  let totalRoadRuns = 0;
  let totalRoads = 0;
  let totalBridges = 0;
  let totalWaters = 0;
  let totalEncounterSpawns = 0;
  let maxRoadSlopeDegrees = 0;

  for (const layout of Object.values(REGION_PRODUCTION_LAYOUTS)) {
    const baseReport = validateTraversalLayout(layout);
    errors.push(...baseReport.errors.map((message) => `${layout.id}: ${message}`));
    warnings.push(...baseReport.warnings.map((message) => `${layout.id}: ${message}`));

    const baseRectangles = buildWalkableRectangles(layout, { cellSize: 4 });
    const terraceRectangles = layout.subareas.flatMap((area) => buildWalkableRectangles(layout, {
      scope: { id: area.id, center: area.center, size: area.size },
      elevation: area.elevation,
      cellSize: 3.5,
    }));
    totalBaseRectangles += baseRectangles.length;
    totalTerraceRectangles += terraceRectangles.length;
    totalBridges += layout.bridges.length;
    totalWaters += layout.waters.length;

    for (const rectangle of [...baseRectangles, ...terraceRectangles]) {
      const [cx, , cz] = rectangle.center;
      const [width, depth] = rectangle.size;
      const probes = [
        [cx, cz],
        [cx - width / 2 + 0.05, cz - depth / 2 + 0.05],
        [cx + width / 2 - 0.05, cz - depth / 2 + 0.05],
        [cx - width / 2 + 0.05, cz + depth / 2 - 0.05],
        [cx + width / 2 - 0.05, cz + depth / 2 - 0.05],
      ];
      for (const [x, z] of probes) {
        const water = getWaterAtPoint(layout, x, z, 0.02);
        if (water) errors.push(`${layout.id}: surface rectangle ${rectangle.id} covers ${water.id}`);
      }
    }

    let regionRoadRuns = 0;
    for (const road of layout.roads) {
      totalRoads += 1;
      const runs = buildRoadRuns(layout, road);
      if (!runs.length) errors.push(`${layout.id}: road ${road.id} has no safe route`);
      regionRoadRuns += runs.length;
      totalRoadRuns += runs.length;
      for (const run of runs) {
        const horizontal = Math.hypot(run.to[0] - run.from[0], run.to[2] - run.from[2]);
        const slope = Math.atan2(Math.abs(run.to[1] - run.from[1]), Math.max(0.001, horizontal)) * 180 / Math.PI;
        maxRoadSlopeDegrees = Math.max(maxRoadSlopeDegrees, slope);
        if (slope > 18) errors.push(`${layout.id}: road ${road.id} slope ${slope.toFixed(2)} exceeds 18 degrees`);
        for (const point of sampleLine(run.from, run.to)) {
          const water = getWaterAtPoint(layout, point.x, point.z, road.width * 0.45);
          const bridge = getBridgeAtPoint(layout, point.x, point.z, road.width * 0.45);
          if (water && !bridge) errors.push(`${layout.id}: road ${road.id} leaks into ${water.id}`);
        }
      }
    }

    for (const instance of layout.structures) {
      const prefab = REGION_STRUCTURE_CATALOG[instance.type];
      if (!prefab?.footprint) {
        errors.push(`${layout.id}: structure ${instance.id} missing footprint`);
        continue;
      }
      for (const point of structureFootprintSamples(instance, prefab.footprint)) {
        const water = getWaterAtPoint(layout, point.x, point.z, 0.15);
        if (water) errors.push(`${layout.id}: structure ${instance.id} footprint overlaps ${water.id}`);
      }
    }

    const encounter = REGION_ENCOUNTERS[layout.id];
    if (!encounter) errors.push(`${layout.id}: missing encounter profile`);
    else {
      const spawnPoints = [
        ...encounter.normalSpawns.map((point, index) => ({ id: `normal_${index}`, x: point[0], z: point[1] })),
        { id: 'elite', x: encounter.eliteSpawn[0], z: encounter.eliteSpawn[2] },
        { id: 'boss', x: encounter.bossSpawn[0], z: encounter.bossSpawn[2] },
      ];
      totalEncounterSpawns += spawnPoints.length;
      for (const spawn of spawnPoints) {
        const surface = sampleTraversalSurface(layout, spawn.x, spawn.z);
        if (!surface.walkable) errors.push(`${layout.id}: encounter ${spawn.id} spawns on ${surface.kind}`);
      }
    }

    regionReports.push({
      regionId: layout.id,
      ok: !errors.some((message) => message.startsWith(`${layout.id}:`)),
      subareas: layout.subareas.length,
      roads: layout.roads.length,
      roadRuns: regionRoadRuns,
      waters: layout.waters.length,
      bridges: layout.bridges.length,
      structures: layout.structures.length,
      baseRectangles: baseRectangles.length,
      terraceRectangles: terraceRectangles.length,
    });
  }

  return {
    ok: errors.length === 0,
    version: '0.23.0',
    regions: regionReports.length,
    subareas: regionReports.reduce((sum, item) => sum + item.subareas, 0),
    roads: totalRoads,
    roadRuns: totalRoadRuns,
    waters: totalWaters,
    bridges: totalBridges,
    structures: regionReports.reduce((sum, item) => sum + item.structures, 0),
    baseRectangles: totalBaseRectangles,
    terraceRectangles: totalTerraceRectangles,
    encounterSpawns: totalEncounterSpawns,
    maxRoadSlopeDegrees: Number(maxRoadSlopeDegrees.toFixed(2)),
    regionReports,
    errors,
    warnings,
  };
}
