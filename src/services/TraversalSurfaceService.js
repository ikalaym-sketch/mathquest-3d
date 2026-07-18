// v0.23 地形與通行純函式服務。
// 所有幾何判定均以 Canonical regionProductionLayouts 為唯一來源，供 Runtime、AI 與驗證器共用。
import { getWaterEnvironmentProfile } from '../data/waterEnvironmentProfiles.js';

export const WATER_BEHAVIOR = Object.freeze({
  pond: 'water',
  stream: 'water',
  river: 'water',
  lake: 'water',
  oasis: 'water',
  frozen: 'ice',
  channel: 'hazard-liquid',
  ravine: 'ravine',
});

const EPSILON = 1e-6;
const BRIDGE_GEOMETRY_CACHE = new Map();

export function worldToLocal2D(x, z, center, rotation = 0) {
  const dx = x - center[0];
  const dz = z - center[1];
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos,
  };
}

export function localToWorld2D(x, z, center, rotation = 0) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: center[0] + x * cos + z * sin,
    z: center[1] - x * sin + z * cos,
  };
}

export function pointInRotatedRect(x, z, rect, margin = 0) {
  const local = worldToLocal2D(x, z, rect.center, rect.rotation || 0);
  return Math.abs(local.x) <= rect.size[0] / 2 + margin + EPSILON
    && Math.abs(local.z) <= rect.size[1] / 2 + margin + EPSILON;
}

export function getWaterBehavior(water) {
  if (!water) return null;
  return getWaterEnvironmentProfile(water)?.mode || WATER_BEHAVIOR[water.kind] || 'water';
}

export function getWaterAtPoint(layout, x, z, margin = 0) {
  return (layout?.waters || []).find((water) => pointInRotatedRect(x, z, water, margin)) || null;
}

export function getSubareaAtPoint(layout, x, z, margin = 0) {
  return (layout?.subareas || [])
    .filter((area) => Math.abs(x - area.center[0]) <= area.size[0] / 2 + margin
      && Math.abs(z - area.center[1]) <= area.size[1] / 2 + margin)
    .sort((a, b) => (b.elevation || 0) - (a.elevation || 0))[0] || null;
}

export function getTerrainElevation(layout, x, z) {
  return getSubareaAtPoint(layout, x, z)?.elevation || 0;
}

export function resolveBridgeGeometry(layout, bridge) {
  const cacheKey = `${layout?.id || 'unknown'}:${bridge.id}:${bridge.center.join(',')}:${bridge.length}:${bridge.width}:${bridge.rotation || 0}`;
  if (BRIDGE_GEOMETRY_CACHE.has(cacheKey)) return BRIDGE_GEOMETRY_CACHE.get(cacheKey);
  const water = (layout?.waters || []).find((item) => item.id === bridge.waterId) || null;
  if (!water) {
    const fallback = {
      ...bridge,
      resolvedRotation: bridge.rotation || 0,
      resolvedLength: bridge.length,
      deckY: 0.38,
      start: [bridge.center[0], bridge.center[1] - bridge.length / 2],
      end: [bridge.center[0], bridge.center[1] + bridge.length / 2],
      water: null,
    };
    BRIDGE_GEOMETRY_CACHE.set(cacheKey, fallback);
    return fallback;
  }

  const [waterWidth, waterDepth] = water.size;
  const crossesWidth = waterWidth <= waterDepth;
  const resolvedRotation = crossesWidth
    ? (water.rotation || 0) + Math.PI / 2
    : (water.rotation || 0);
  const crossedDimension = crossesWidth ? waterWidth : waterDepth;
  const resolvedLength = Math.max(bridge.length || 0, crossedDimension + 3.2);
  const dirX = Math.sin(resolvedRotation);
  const dirZ = Math.cos(resolvedRotation);
  const half = resolvedLength / 2;
  const start = [bridge.center[0] - dirX * half, bridge.center[1] - dirZ * half];
  const end = [bridge.center[0] + dirX * half, bridge.center[1] + dirZ * half];
  const startGround = getTerrainElevation(layout, start[0] - dirX * 1.2, start[1] - dirZ * 1.2);
  const endGround = getTerrainElevation(layout, end[0] + dirX * 1.2, end[1] + dirZ * 1.2);
  const deckY = Math.max(startGround, endGround) + 0.38;

  const resolved = {
    ...bridge,
    resolvedRotation,
    resolvedLength,
    deckY,
    start,
    end,
    startGround,
    endGround,
    water,
  };
  BRIDGE_GEOMETRY_CACHE.set(cacheKey, resolved);
  return resolved;
}

export function getBridgeAtPoint(layout, x, z, margin = 0) {
  for (const bridge of layout?.bridges || []) {
    const geometry = resolveBridgeGeometry(layout, bridge);
    const local = worldToLocal2D(x, z, geometry.center, geometry.resolvedRotation);
    if (Math.abs(local.x) <= geometry.width / 2 + margin
      && Math.abs(local.z) <= geometry.resolvedLength / 2 + margin) return geometry;
  }
  return null;
}

export function distancePointToSegment2D(x, z, from, to) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq <= EPSILON) return { distance: Math.hypot(x - from[0], z - from[1]), t: 0 };
  const t = Math.max(0, Math.min(1, ((x - from[0]) * dx + (z - from[1]) * dz) / lengthSq));
  const px = from[0] + dx * t;
  const pz = from[1] + dz * t;
  return { distance: Math.hypot(x - px, z - pz), t };
}

export function getRoadAtPoint(layout, x, z) {
  let best = null;
  for (const road of layout?.roads || []) {
    const runs = buildRoadRuns(layout, road);
    for (const run of runs) {
      const from = [run.from[0], run.from[2]];
      const to = [run.to[0], run.to[2]];
      const hit = distancePointToSegment2D(x, z, from, to);
      if (hit.distance <= road.width / 2 && (!best || hit.distance < best.distance)) {
        best = {
          road,
          run,
          distance: hit.distance,
          t: hit.t,
          y: run.from[1] + (run.to[1] - run.from[1]) * hit.t,
        };
      }
    }
  }
  return best;
}

export function isInsideLayout(layout, x, z, margin = 0) {
  if (!layout?.size) return false;
  return Math.abs(x) <= layout.size[0] / 2 - margin && Math.abs(z) <= layout.size[1] / 2 - margin;
}

export function sampleTraversalSurface(layout, x, z) {
  if (!layout || !isInsideLayout(layout, x, z)) return { walkable: false, kind: 'outside', y: -Infinity };

  const bridge = getBridgeAtPoint(layout, x, z, 0.05);
  if (bridge) return { walkable: true, kind: 'bridge', y: bridge.deckY, bridgeId: bridge.id };

  const water = getWaterAtPoint(layout, x, z);
  if (water) {
    const waterProfile = getWaterEnvironmentProfile(water);
    const kind = getWaterBehavior(water);
    return {
      walkable: kind === 'ice',
      kind,
      y: water.surfaceY ?? 0.13,
      waterId: water.id,
      waterProfile,
    };
  }

  const road = getRoadAtPoint(layout, x, z);
  if (road) return { walkable: true, kind: 'road', y: road.y + 0.08, roadId: road.road.id };

  const area = getSubareaAtPoint(layout, x, z);
  if (area) return { walkable: true, kind: 'terrace', y: area.elevation || 0, subareaId: area.id };

  return { walkable: true, kind: 'ground', y: 0 };
}

export function isSafeTraversalPoint(layout, x, z, margin = 1.1) {
  const surface = sampleTraversalSurface(layout, x, z);
  if (!surface.walkable) return false;
  const water = getWaterAtPoint(layout, x, z, margin);
  if (!water) return true;
  return getWaterEnvironmentProfile(water)?.mode === 'ice';
}

export function projectTraversalStep(layout, current, next, options = {}) {
  const hoverHeight = Number.isFinite(options.hoverHeight) ? options.hoverHeight : 0.5;
  const capabilities = options.capabilities || {};
  const resolve = (candidate) => {
    const surface = sampleTraversalSurface(layout, candidate.x, candidate.z);
    const profile = surface.waterProfile;
    const canTraverseWater = surface.kind === 'ice'
      || (surface.kind === 'wade' && capabilities.canWade)
      || (surface.kind === 'swim' && capabilities.canSwim)
      || (profile?.mode === 'wade' && capabilities.canWade)
      || (profile?.mode === 'swim' && capabilities.canSwim)
      || (surface.kind === 'hazard' && capabilities.canHazard);
    if (!surface.walkable && !canTraverseWater) return null;
    return { x: candidate.x, y: surface.y + hoverHeight, z: candidate.z, surface };
  };

  const direct = resolve(next);
  if (direct) return direct;
  const slideX = resolve({ x: next.x, z: current.z });
  if (slideX) return slideX;
  const slideZ = resolve({ x: current.x, z: next.z });
  if (slideZ) return slideZ;
  const currentSurface = sampleTraversalSurface(layout, current.x, current.z);
  return {
    x: current.x,
    y: (currentSurface.walkable ? currentSurface.y : 0) + hoverHeight,
    z: current.z,
    surface: currentSurface,
    blocked: true,
  };
}

function waterAabb(water, padding = 0) {
  const halfW = water.size[0] / 2 + padding;
  const halfD = water.size[1] / 2 + padding;
  const cos = Math.abs(Math.cos(water.rotation || 0));
  const sin = Math.abs(Math.sin(water.rotation || 0));
  return {
    minX: water.center[0] - (halfW * cos + halfD * sin),
    maxX: water.center[0] + (halfW * cos + halfD * sin),
    minZ: water.center[1] - (halfW * sin + halfD * cos),
    maxZ: water.center[1] + (halfW * sin + halfD * cos),
  };
}

function cellIntersectsWater(layout, minX, maxX, minZ, maxZ, padding = 0.35) {
  return (layout?.waters || []).some((water) => {
    const bounds = waterAabb(water, padding);
    return !(maxX <= bounds.minX || minX >= bounds.maxX || maxZ <= bounds.minZ || minZ >= bounds.maxZ);
  });
}

export function buildWalkableRectangles(layout, options = {}) {
  const cellSize = options.cellSize || 4;
  const scope = options.scope || { center: [0, 0], size: layout.size };
  const elevation = options.elevation || 0;
  const minX = scope.center[0] - scope.size[0] / 2;
  const maxX = scope.center[0] + scope.size[0] / 2;
  const minZ = scope.center[1] - scope.size[1] / 2;
  const maxZ = scope.center[1] + scope.size[1] / 2;
  const cols = Math.ceil((maxX - minX) / cellSize);
  const rows = Math.ceil((maxZ - minZ) / cellSize);
  const rowRuns = [];

  for (let row = 0; row < rows; row += 1) {
    const z0 = minZ + row * cellSize;
    const z1 = Math.min(maxZ, z0 + cellSize);
    const runs = [];
    let runStart = null;
    for (let col = 0; col < cols; col += 1) {
      const x0 = minX + col * cellSize;
      const x1 = Math.min(maxX, x0 + cellSize);
      const blocked = cellIntersectsWater(layout, x0, x1, z0, z1);
      if (!blocked && runStart == null) runStart = x0;
      if ((blocked || col === cols - 1) && runStart != null) {
        const runEnd = blocked ? x0 : x1;
        if (runEnd - runStart > 0.2) runs.push({ minX: runStart, maxX: runEnd, minZ: z0, maxZ: z1 });
        runStart = null;
      }
    }
    rowRuns.push(runs);
  }

  const merged = [];
  for (const runs of rowRuns) {
    const used = new Set();
    for (const run of runs) {
      const match = merged.find((item, index) => !used.has(index)
        && Math.abs(item.minX - run.minX) < EPSILON
        && Math.abs(item.maxX - run.maxX) < EPSILON
        && Math.abs(item.maxZ - run.minZ) < EPSILON);
      if (match) {
        match.maxZ = run.maxZ;
        used.add(merged.indexOf(match));
      } else {
        merged.push({ ...run, elevation });
        used.add(merged.length - 1);
      }
    }
  }

  return merged.map((rect, index) => ({
    id: `${layout.id}-${scope.id || 'base'}-surface-${index}`,
    center: [(rect.minX + rect.maxX) / 2, elevation, (rect.minZ + rect.maxZ) / 2],
    size: [rect.maxX - rect.minX, rect.maxZ - rect.minZ],
    elevation,
  }));
}

const ROAD_ROUTE_CACHE = new Map();
const ROAD_RUN_CACHE = new Map();

function sampleStaticSurface(layout, x, z) {
  const bridge = getBridgeAtPoint(layout, x, z, 0.05);
  if (bridge) return { walkable: true, kind: 'bridge', y: bridge.deckY, bridgeId: bridge.id };
  const water = getWaterAtPoint(layout, x, z);
  if (water) return { walkable: false, kind: getWaterBehavior(water), y: water.surfaceY ?? 0.13, waterId: water.id };
  const area = getSubareaAtPoint(layout, x, z);
  if (area) return { walkable: true, kind: 'terrace', y: area.elevation || 0, subareaId: area.id };
  return isInsideLayout(layout, x, z, 0.8)
    ? { walkable: true, kind: 'ground', y: 0 }
    : { walkable: false, kind: 'outside', y: -Infinity };
}

function roadCacheKey(layout, segment) {
  return `${layout.id}:${segment.id}:${segment.from.join(',')}:${segment.to.join(',')}`;
}

function gridKey(ix, iz) { return `${ix},${iz}`; }

function linePassable(layout, from, to, width = 0) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const samples = Math.max(2, Math.ceil(length / 0.65));
  const offsets = width > 0 ? [-width * 0.28, 0, width * 0.28] : [0];
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const magnitude = Math.hypot(dx, dz) || 1;
  const normalX = -dz / magnitude;
  const normalZ = dx / magnitude;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    for (const offset of offsets) {
      const x = from[0] + dx * t + normalX * offset;
      const z = from[1] + dz * t + normalZ * offset;
      const bridge = getBridgeAtPoint(layout, x, z, width * 0.52);
      if (bridge) continue;
      if (getWaterAtPoint(layout, x, z, width * 0.52)) return false;
      if (!isInsideLayout(layout, x, z, width * 0.52 + 0.6)) return false;
    }
  }
  return true;
}

function reconstructPath(cameFrom, currentKey, nodeMap) {
  const result = [nodeMap.get(currentKey)];
  while (cameFrom.has(currentKey)) {
    currentKey = cameFrom.get(currentKey);
    result.push(nodeMap.get(currentKey));
  }
  return result.reverse();
}

export function resolveRoadPolyline(layout, segment, gridStep = 2) {
  const cacheKey = roadCacheKey(layout, segment);
  if (ROAD_ROUTE_CACHE.has(cacheKey)) return ROAD_ROUTE_CACHE.get(cacheKey);
  if (linePassable(layout, segment.from, segment.to, segment.width)) {
    const direct = [segment.from, segment.to];
    ROAD_ROUTE_CACHE.set(cacheKey, direct);
    return direct;
  }

  const [width, depth] = layout.size;
  const minX = -width / 2 + 1;
  const minZ = -depth / 2 + 1;
  const maxIx = Math.floor((width - 2) / gridStep);
  const maxIz = Math.floor((depth - 2) / gridStep);
  const toGrid = (point) => ({
    ix: Math.max(0, Math.min(maxIx, Math.round((point[0] - minX) / gridStep))),
    iz: Math.max(0, Math.min(maxIz, Math.round((point[1] - minZ) / gridStep))),
  });
  const toWorld = (ix, iz) => [minX + ix * gridStep, minZ + iz * gridStep];
  const startNode = toGrid(segment.from);
  const goalNode = toGrid(segment.to);
  const startKey = gridKey(startNode.ix, startNode.iz);
  const goalKey = gridKey(goalNode.ix, goalNode.iz);
  const open = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map();
  const nodeMap = new Map([[startKey, { ...startNode, point: segment.from }]]);
  const heuristic = (ix, iz) => Math.hypot(ix - goalNode.ix, iz - goalNode.iz);
  fScore.set(startKey, heuristic(startNode.ix, startNode.iz));
  const neighbors = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
  ];
  let iterations = 0;
  while (open.size && iterations < 16000) {
    iterations += 1;
    let currentKey = null;
    let currentScore = Infinity;
    for (const key of open) {
      const score = fScore.get(key) ?? Infinity;
      if (score < currentScore) { currentScore = score; currentKey = key; }
    }
    if (currentKey === goalKey) {
      const raw = reconstructPath(cameFrom, currentKey, nodeMap).map((node) => node.point);
      raw[0] = segment.from;
      raw[raw.length - 1] = segment.to;
      const simplified = simplifyRoadPath(layout, raw, segment.width);
      ROAD_ROUTE_CACHE.set(cacheKey, simplified);
      return simplified;
    }
    open.delete(currentKey);
    const current = nodeMap.get(currentKey);
    for (const [dix, diz, cost] of neighbors) {
      const ix = current.ix + dix;
      const iz = current.iz + diz;
      if (ix < 0 || iz < 0 || ix > maxIx || iz > maxIz) continue;
      const point = (ix === goalNode.ix && iz === goalNode.iz) ? segment.to : toWorld(ix, iz);
      const surface = sampleStaticSurface(layout, point[0], point[1]);
      if (!surface.walkable) continue;
      const currentPoint = current.point;
      if (!linePassable(layout, currentPoint, point, segment.width)) continue;
      const key = gridKey(ix, iz);
      const elevationCost = Math.abs(surface.y - sampleStaticSurface(layout, currentPoint[0], currentPoint[1]).y) * 1.8;
      const directDistance = distancePointToSegment2D(point[0], point[1], segment.from, segment.to).distance;
      const tentative = (gScore.get(currentKey) ?? Infinity) + cost + elevationCost + directDistance * 0.025;
      if (tentative < (gScore.get(key) ?? Infinity)) {
        cameFrom.set(key, currentKey);
        gScore.set(key, tentative);
        fScore.set(key, tentative + heuristic(ix, iz));
        nodeMap.set(key, { ix, iz, point });
        open.add(key);
      }
    }
  }

  // 無法找到完整路線時保留安全的可通行片段，不讓道路穿過水面。
  const fallback = [segment.from];
  const samples = Math.max(4, Math.ceil(Math.hypot(segment.to[0] - segment.from[0], segment.to[1] - segment.from[1]) / gridStep));
  for (let index = 1; index <= samples; index += 1) {
    const t = index / samples;
    const point = [segment.from[0] + (segment.to[0] - segment.from[0]) * t, segment.from[1] + (segment.to[1] - segment.from[1]) * t];
    if (!sampleStaticSurface(layout, point[0], point[1]).walkable) break;
    fallback.push(point);
  }
  ROAD_ROUTE_CACHE.set(cacheKey, fallback);
  return fallback;
}

function simplifyRoadPath(layout, points, width) {
  if (points.length <= 2) return points;
  const simplified = [points[0]];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let next = anchor + 1;
    for (let candidate = points.length - 1; candidate > anchor + 1; candidate -= 1) {
      if (linePassable(layout, points[anchor], points[candidate], width)) {
        next = candidate;
        break;
      }
    }
    simplified.push(points[next]);
    anchor = next;
  }
  return simplified;
}

export function buildRoadRuns(layout, segment) {
  const cacheKey = roadCacheKey(layout, segment);
  if (ROAD_RUN_CACHE.has(cacheKey)) return ROAD_RUN_CACHE.get(cacheKey);
  const points = resolveRoadPolyline(layout, segment);
  const runs = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const from2D = points[index];
    const to2D = points[index + 1];
    if (!linePassable(layout, from2D, to2D, segment.width)) continue;
    const fromSurface = sampleStaticSurface(layout, from2D[0], from2D[1]);
    const toSurface = sampleStaticSurface(layout, to2D[0], to2D[1]);
    runs.push({
      id: `${segment.id}-run-${runs.length}`,
      from: [from2D[0], fromSurface.y, from2D[1]],
      to: [to2D[0], toSurface.y, to2D[1]],
      width: segment.width,
      kind: segment.kind,
    });
  }
  ROAD_RUN_CACHE.set(cacheKey, runs);
  return runs;
}

export function validateTraversalLayout(layout) {
  const errors = [];
  const warnings = [];
  const baseRects = buildWalkableRectangles(layout);
  const terraceRects = layout.subareas.flatMap((area) => buildWalkableRectangles(layout, {
    scope: { id: area.id, center: area.center, size: area.size },
    elevation: area.elevation,
    cellSize: 3.5,
  }));
  const bridgeProfiles = layout.bridges.map((bridge) => resolveBridgeGeometry(layout, bridge));

  const spawnSurface = sampleTraversalSurface(layout, layout.spawn[0], layout.spawn[2]);
  if (!spawnSurface.walkable) errors.push(`Spawn is not walkable: ${layout.id}`);

  for (const profile of bridgeProfiles) {
    if (!profile.water) errors.push(`Bridge ${profile.id} references missing water ${profile.waterId}`);
    const dirX = Math.sin(profile.resolvedRotation);
    const dirZ = Math.cos(profile.resolvedRotation);
    const before = sampleTraversalSurface(layout, profile.start[0] - dirX * 1.4, profile.start[1] - dirZ * 1.4);
    const after = sampleTraversalSurface(layout, profile.end[0] + dirX * 1.4, profile.end[1] + dirZ * 1.4);
    if (!before.walkable || !after.walkable) errors.push(`Bridge ${profile.id} does not connect two walkable banks`);
  }

  for (const structure of layout.structures) {
    const surface = sampleTraversalSurface(layout, structure.position[0], structure.position[2]);
    if (!surface.walkable) errors.push(`Structure ${structure.id} is centered on ${surface.kind}`);
  }

  const roadRuns = layout.roads.flatMap((road) => buildRoadRuns(layout, road));
  if (!roadRuns.length) errors.push(`No road run generated for ${layout.id}`);

  return {
    ok: errors.length === 0,
    regionId: layout.id,
    baseRectangleCount: baseRects.length,
    terraceRectangleCount: terraceRects.length,
    roadRunCount: roadRuns.length,
    bridgeCount: bridgeProfiles.length,
    waterCount: layout.waters.length,
    errors,
    warnings,
  };
}

export function findNearestWalkablePoint(layout, x, z, maxRadius = 14, step = 1.4) {
  const direct = sampleTraversalSurface(layout, x, z);
  if (direct.walkable) return { x, y: direct.y, z, surface: direct };
  for (let radius = step; radius <= maxRadius; radius += step) {
    const samples = Math.max(12, Math.ceil((Math.PI * 2 * radius) / step));
    for (let index = 0; index < samples; index += 1) {
      const angle = (index / samples) * Math.PI * 2;
      const candidateX = x + Math.cos(angle) * radius;
      const candidateZ = z + Math.sin(angle) * radius;
      const surface = sampleTraversalSurface(layout, candidateX, candidateZ);
      if (surface.walkable && isSafeTraversalPoint(layout, candidateX, candidateZ, 0.45)) {
        return { x: candidateX, y: surface.y, z: candidateZ, surface };
      }
    }
  }
  const fallback = sampleTraversalSurface(layout, layout.spawn[0], layout.spawn[2]);
  return { x: layout.spawn[0], y: fallback.walkable ? fallback.y : 0, z: layout.spawn[2], surface: fallback };
}
