// 共用 2D 空間幾何工具：供草皮散佈、室內判斷、道路/建築淨空與 Validator 使用。
export function pointSegmentDistance2D(point, from, to) {
  const px = point.x ?? point[0];
  const pz = point.z ?? point[2] ?? point[1];
  const ax = from.x ?? from[0];
  const az = from.z ?? from[2] ?? from[1];
  const bx = to.x ?? to[0];
  const bz = to.z ?? to[2] ?? to[1];
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lengthSq));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function rotatePointToLocal(point, origin, yaw = 0) {
  const px = (point.x ?? point[0]) - (origin.x ?? origin[0]);
  const pz = (point.z ?? point[2] ?? point[1]) - (origin.z ?? origin[2] ?? origin[1]);
  const c = Math.cos(-yaw);
  const s = Math.sin(-yaw);
  return { x: px * c - pz * s, z: px * s + pz * c };
}

export function pointInOrientedRect(point, rect, margin = 0) {
  const local = rotatePointToLocal(point, rect.center, rect.yaw || 0);
  return Math.abs(local.x) <= rect.halfWidth + margin && Math.abs(local.z) <= rect.halfDepth + margin;
}

export function pointInCircle(point, circle, margin = 0) {
  const px = point.x ?? point[0];
  const pz = point.z ?? point[2] ?? point[1];
  const cx = circle.center?.x ?? circle.center?.[0] ?? circle.position?.[0] ?? 0;
  const cz = circle.center?.z ?? circle.center?.[2] ?? circle.position?.[2] ?? 0;
  return Math.hypot(px - cx, pz - cz) <= (circle.radius || 0) + margin;
}

export function createSeededRandom(seedText = 'mathquest') {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildingFootprint(building, fallback = [6.4, 6]) {
  const size = building.footprint || building.size || fallback;
  return {
    center: building.position,
    halfWidth: (size[0] || fallback[0]) / 2,
    halfDepth: (size[1] || size[2] || fallback[1]) / 2,
    yaw: building.rotation?.[1] || 0,
  };
}

export function buildPlacementExclusions({ layout, sceneId }) {
  const roads = (layout?.roads || []).map((road) => ({
    from: road.from,
    to: road.to,
    halfWidth: (road.width || 3.2) / 2,
  }));
  const buildingFallback = sceneId === 'farm' ? [7.2, 6.4] : [6.5, 6.2];
  const buildings = (layout?.buildings || []).map((building) => buildingFootprint(building, buildingFallback));
  const circles = [];

  for (const landmark of layout?.landmarks || []) {
    const radiusByKind = {
      pond: landmark.radius || 5.2,
      pondBridge: 7.2,
      fountain: 3.8,
      tree: 3.4,
      altar: 2.2,
      board: 1.6,
      shipping: 5.8,
    };
    const radius = radiusByKind[landmark.kind];
    if (radius) circles.push({ center: landmark.position, radius });
  }

  if (sceneId === 'farm') {
    for (const zoneId of ['fields', 'paddock', 'pond', 'shipping']) {
      const zone = layout?.zones?.[zoneId];
      if (zone) circles.push({ center: zone.center, radius: zone.radius });
    }
  }

  return { roads, buildings, circles };
}

export function isPointExcluded(point, exclusions, margin = 0.35) {
  if (exclusions.roads.some((road) => pointSegmentDistance2D(point, road.from, road.to) <= road.halfWidth + margin)) return true;
  if (exclusions.buildings.some((rect) => pointInOrientedRect(point, rect, margin))) return true;
  if (exclusions.circles.some((circle) => pointInCircle(point, circle, margin))) return true;
  return false;
}
