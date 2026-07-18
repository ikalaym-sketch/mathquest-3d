import { buildingFootprint, pointSegmentDistance2D, rotatePointToLocal } from '../utils/placementGeometry.js';

export function validatePlacementRules(layout) {
  const errors = [];
  const warnings = [];
  const pond = layout.landmarks?.find((item) => item.id === 'village_pond');
  const bridge = layout.landmarks?.find((item) => item.id === 'red_bridge');
  const pondRadius = pond?.radius || 4.2;

  if (pond) {
    for (const road of layout.roads || []) {
      const distance = pointSegmentDistance2D(pond.position, road.from, road.to);
      if (distance < pondRadius + road.width / 2 - 0.25) errors.push(`Pond overlaps road: ${road.id}`);
    }
  }

  if (pond && bridge) {
    const distance = Math.hypot(pond.position[0] - bridge.position[0], pond.position[2] - bridge.position[2]);
    if (distance > pondRadius * 0.65) errors.push('Bridge is not structurally anchored to the pond.');
  }

  for (const building of layout.buildings || []) {
    const footprint = buildingFootprint(building, [5.8, 5]);
    let nearestRoad = Infinity;
    for (const road of layout.roads || []) {
      const roadHalfWidth = (road.width || 3.2) / 2;
      if (segmentIntersectsExpandedFootprint(road.from, road.to, footprint, roadHalfWidth + 0.18)) {
        errors.push(`Building footprint overlaps road: ${building.id}/${road.id}`);
      }
      const entrance = buildingEntranceWorld(building, 3.2);
      nearestRoad = Math.min(nearestRoad, pointSegmentDistance2D(entrance, road.from, road.to) - roadHalfWidth);
    }
    if (nearestRoad > 6.5) warnings.push(`Building entrance is not connected to a road: ${building.id}`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

function buildingEntranceWorld(building, localDepth) {
  const yaw = building.rotation?.[1] || 0;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return {
    x: building.position[0] + sin * localDepth,
    z: building.position[2] + cos * localDepth,
  };
}

function segmentIntersectsExpandedFootprint(from, to, footprint, padding) {
  const a = rotatePointToLocal({ x: from[0], z: from[2] }, footprint.center, footprint.yaw);
  const b = rotatePointToLocal({ x: to[0], z: to[2] }, footprint.center, footprint.yaw);
  const minX = -footprint.halfWidth - padding;
  const maxX = footprint.halfWidth + padding;
  const minZ = -footprint.halfDepth - padding;
  const maxZ = footprint.halfDepth + padding;
  return segmentIntersectsAabb(a.x, a.z, b.x, b.z, minX, maxX, minZ, maxZ);
}

function segmentIntersectsAabb(x1, z1, x2, z2, minX, maxX, minZ, maxZ) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const checks = [
    [-dx, x1 - minX],
    [dx, maxX - x1],
    [-dz, z1 - minZ],
    [dz, maxZ - z1],
  ];
  for (const [p, q] of checks) {
    if (p === 0 && q < 0) return false;
    if (p === 0) continue;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return true;
}
