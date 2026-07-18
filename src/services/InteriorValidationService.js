import { VILLAGE_INDOOR_ZONES, FARM_INDOOR_ZONES } from '../data/indoorZones.js';
import { pointInOrientedRect } from '../utils/placementGeometry.js';

function validateZones(zones, expectedCount, sceneId) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  if (zones.length !== expectedCount) errors.push(`${sceneId}: expected ${expectedCount} interiors, got ${zones.length}`);

  for (const zone of zones) {
    if (!zone.id || !zone.buildingId) errors.push(`${sceneId}: interior missing id/buildingId`);
    if (ids.has(zone.id)) errors.push(`${sceneId}: duplicate interior id ${zone.id}`);
    ids.add(zone.id);
    if (!Array.isArray(zone.size) || zone.size[0] < 3.5 || zone.size[1] < 3.2) errors.push(`${zone.id}: invalid room size`);
    if (!zone.furniture?.length) warnings.push(`${zone.id}: no furniture`);

    for (let index = 0; index < (zone.furniture || []).length; index += 1) {
      const a = zone.furniture[index];
      for (const b of zone.furniture.slice(index + 1)) {
        const overlapX = Math.abs(a.position[0] - b.position[0]) < (a.size[0] + b.size[0]) / 2 - 0.08;
        const overlapZ = Math.abs(a.position[2] - b.position[2]) < (a.size[2] + b.size[2]) / 2 - 0.08;
        if (overlapX && overlapZ) errors.push(`${zone.id}: furniture overlap ${a.id}/${b.id}`);
      }
    }

    for (const item of zone.furniture || []) {
      if (!item.id || !item.type || !item.size || !item.position) errors.push(`${zone.id}: malformed furniture item`);
      const footprint = {
        center: item.position,
        halfWidth: item.size[0] / 2,
        halfDepth: item.size[2] / 2,
        yaw: 0,
      };
      const roomPoint = { x: item.position[0], z: item.position[2] };
      const roomRect = { center: [0, 0, 0], halfWidth: zone.size[0] / 2, halfDepth: zone.size[1] / 2, yaw: 0 };
      if (!pointInOrientedRect(roomPoint, roomRect, -0.12)) errors.push(`${zone.id}: furniture outside room ${item.id}`);
      const entranceRect = {
        center: [zone.entranceLocal[0], 0, zone.entranceLocal[1]],
        halfWidth: zone.entranceClearance[0] / 2,
        halfDepth: zone.entranceClearance[1] / 2,
        yaw: 0,
      };
      if (pointInOrientedRect(roomPoint, entranceRect, Math.max(footprint.halfWidth, footprint.halfDepth) * 0.35)) {
        errors.push(`${zone.id}: furniture blocks entrance ${item.id}`);
      }
    }
  }
  return { errors, warnings };
}

export function validateAllInteriors() {
  const village = validateZones(VILLAGE_INDOOR_ZONES, 11, 'village');
  const farm = validateZones(FARM_INDOOR_ZONES, 2, 'farm');
  const errors = [...village.errors, ...farm.errors];
  const warnings = [...village.warnings, ...farm.warnings];
  return { ok: errors.length === 0, errors, warnings, counts: { village: VILLAGE_INDOOR_ZONES.length, farm: FARM_INDOOR_ZONES.length } };
}
