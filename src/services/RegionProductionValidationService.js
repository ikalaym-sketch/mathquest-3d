import { REGION_PRODUCTION_LAYOUTS, REGION_PRODUCTION_IDS } from '../data/regionProductionLayouts.js';
import { getRegionStructurePrefab } from '../data/physicalObjectCatalog.js';

function pushUniqueErrors(items, label, errors) {
  const ids = items.map((item) => item.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`${label} duplicate ids: ${[...new Set(duplicates)].join(', ')}`);
}

function insideRect(point, center, size, padding = 0) {
  return Math.abs(point[0] - center[0]) <= size[0] / 2 - padding && Math.abs(point[1] - center[1]) <= size[1] / 2 - padding;
}

function rotatedRectContains(point, center, size, rotation = 0, padding = 0) {
  const dx = point[0] - center[0];
  const dz = point[1] - center[1];
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= size[0] / 2 + padding && Math.abs(localZ) <= size[1] / 2 + padding;
}

function aabbOverlap(aCenter, aSize, bCenter, bSize, padding = 0) {
  return Math.abs(aCenter[0] - bCenter[0]) < (aSize[0] + bSize[0]) / 2 + padding &&
    Math.abs(aCenter[1] - bCenter[1]) < (aSize[1] + bSize[1]) / 2 + padding;
}

function roadTopologySignature(layout) {
  return layout.roads
    .map((item) => {
      const dx = item.to[0] - item.from[0];
      const dz = item.to[1] - item.from[1];
      const angleBucket = Math.round((Math.atan2(dz, dx) / Math.PI) * 12);
      const lengthBucket = Math.round(Math.hypot(dx, dz) / 5);
      return `${item.kind}:${angleBucket}:${lengthBucket}`;
    })
    .sort()
    .join('|');
}

export function validateRegionProductionLayout(layout) {
  const errors = [];
  const warnings = [];
  if (!layout) return { ok: false, errors: ['Layout is missing'], warnings };
  if (!layout.id) errors.push('Layout id is required');
  if (!Array.isArray(layout.size) || layout.size.length !== 2 || layout.size.some((value) => value < 100)) errors.push(`${layout.id}: map size must be at least 100x100`);
  if (!Array.isArray(layout.subareas) || layout.subareas.length !== 4) errors.push(`${layout.id}: exactly four authored subareas are required`);
  if (!Array.isArray(layout.roads) || layout.roads.length < 6) errors.push(`${layout.id}: at least six authored road segments are required`);
  if (!Array.isArray(layout.structures) || layout.structures.length < 4) errors.push(`${layout.id}: at least four authored structures are required`);
  if (!Array.isArray(layout.waters) || layout.waters.length < 1) errors.push(`${layout.id}: at least one authored water or terrain gap is required`);
  if (!Array.isArray(layout.bridges) || layout.bridges.length < 1) errors.push(`${layout.id}: at least one bridge is required`);

  pushUniqueErrors(layout.subareas || [], `${layout.id}/subareas`, errors);
  pushUniqueErrors(layout.roads || [], `${layout.id}/roads`, errors);
  pushUniqueErrors(layout.structures || [], `${layout.id}/structures`, errors);
  pushUniqueErrors(layout.waters || [], `${layout.id}/waters`, errors);
  pushUniqueErrors(layout.bridges || [], `${layout.id}/bridges`, errors);

  const subareaMap = Object.fromEntries((layout.subareas || []).map((item) => [item.id, item]));
  const waterMap = Object.fromEntries((layout.waters || []).map((item) => [item.id, item]));

  for (const area of layout.subareas || []) {
    if (!Array.isArray(area.center) || area.center.length !== 2) errors.push(`${layout.id}/${area.id}: invalid center`);
    if (!Array.isArray(area.size) || area.size.some((value) => value < 20)) errors.push(`${layout.id}/${area.id}: subarea size is too small`);
    if (area.elevation < 0 || area.elevation > 4) errors.push(`${layout.id}/${area.id}: elevation must be between 0 and 4`);
    if (!getRegionStructurePrefab(area.structureType)) errors.push(`${layout.id}/${area.id}: unknown primary structure ${area.structureType}`);
  }

  for (const item of layout.structures || []) {
    const prefab = getRegionStructurePrefab(item.type);
    if (!prefab) {
      errors.push(`${layout.id}/${item.id}: missing structure prefab ${item.type}`);
      continue;
    }
    if (!item.subareaId || !subareaMap[item.subareaId]) errors.push(`${layout.id}/${item.id}: invalid subareaId ${item.subareaId}`);
    const area = subareaMap[item.subareaId];
    if (area && !insideRect([item.position[0], item.position[2]], area.center, area.size, 2)) {
      errors.push(`${layout.id}/${item.id}: structure is outside subarea clearance`);
    }
    for (const water of layout.waters || []) {
      if (rotatedRectContains([item.position[0], item.position[2]], water.center, water.size, water.rotation, 1.5)) {
        errors.push(`${layout.id}/${item.id}: structure center overlaps water ${water.id}`);
      }
    }
  }

  for (let i = 0; i < (layout.structures || []).length; i += 1) {
    const a = layout.structures[i];
    const aPrefab = getRegionStructurePrefab(a.type);
    if (!aPrefab) continue;
    for (let j = i + 1; j < layout.structures.length; j += 1) {
      const b = layout.structures[j];
      const bPrefab = getRegionStructurePrefab(b.type);
      if (!bPrefab) continue;
      const aSize = aPrefab.footprint.map((value) => value * (a.scale || 1));
      const bSize = bPrefab.footprint.map((value) => value * (b.scale || 1));
      if (aabbOverlap([a.position[0], a.position[2]], aSize, [b.position[0], b.position[2]], bSize, 1.5)) {
        errors.push(`${layout.id}: structures ${a.id} and ${b.id} overlap`);
      }
    }
  }

  for (const item of layout.bridges || []) {
    const target = waterMap[item.waterId];
    if (!target) {
      errors.push(`${layout.id}/${item.id}: bridge references missing water ${item.waterId}`);
      continue;
    }
    if (!rotatedRectContains(item.center, target.center, target.size, target.rotation, Math.max(2, item.length / 3))) {
      errors.push(`${layout.id}/${item.id}: bridge does not intersect referenced water ${item.waterId}`);
    }
    if (item.width < 3.5) warnings.push(`${layout.id}/${item.id}: bridge width is below child-friendly 3.5m clearance`);
  }

  for (const road of layout.roads || []) {
    const length = Math.hypot(road.to[0] - road.from[0], road.to[1] - road.from[1]);
    if (length < 12) warnings.push(`${layout.id}/${road.id}: road is shorter than 12m`);
    if (road.width < 4 && road.kind !== 'secondary') errors.push(`${layout.id}/${road.id}: main road width must be at least 4m`);
  }

  const structureSubareas = new Set((layout.structures || []).map((item) => item.subareaId));
  for (const area of layout.subareas || []) {
    if (!structureSubareas.has(area.id)) errors.push(`${layout.id}/${area.id}: no authored structure instance`);
  }

  return { ok: errors.length === 0 && warnings.length === 0, errors, warnings };
}

export function validateRegionStructureCatalog(catalog) {
  const errors = [];
  const warnings = [];
  for (const [type, prefab] of Object.entries(catalog)) {
    if (!prefab.label) errors.push(`${type}: label is required`);
    if (!Array.isArray(prefab.footprint) || prefab.footprint.some((value) => value <= 0)) errors.push(`${type}: valid footprint is required`);
    if (!Array.isArray(prefab.parts) || prefab.parts.length < 6) errors.push(`${type}: at least six visual parts are required`);
    if (!Array.isArray(prefab.colliders) || prefab.colliders.length < 1) errors.push(`${type}: at least one physical collider is required`);
    if (!Array.isArray(prefab.sockets) || prefab.sockets.length < 1) errors.push(`${type}: at least one interaction/socket definition is required`);
    pushUniqueErrors(prefab.parts || [], `prefab/${type}/parts`, errors);
    pushUniqueErrors(prefab.colliders || [], `prefab/${type}/colliders`, errors);
    pushUniqueErrors(prefab.sockets || [], `prefab/${type}/sockets`, errors);
    if ((prefab.colliders || []).length === 1 && (prefab.parts || []).length > 10) warnings.push(`${type}: complex prefab currently uses only one collider`);
  }
  return { ok: errors.length === 0 && warnings.length === 0, errors, warnings };
}

export function validateAllRegionProductionLayouts(catalog) {
  const layouts = Object.fromEntries(REGION_PRODUCTION_IDS.map((id) => [id, validateRegionProductionLayout(REGION_PRODUCTION_LAYOUTS[id])]));
  const catalogResult = validateRegionStructureCatalog(catalog);
  const topologyGroups = {};
  for (const id of REGION_PRODUCTION_IDS) {
    const signature = roadTopologySignature(REGION_PRODUCTION_LAYOUTS[id]);
    topologyGroups[signature] = [...(topologyGroups[signature] || []), id];
  }
  const duplicateTopologies = Object.values(topologyGroups).filter((ids) => ids.length > 1);
  const topologyResult = {
    ok: duplicateTopologies.length === 0,
    errors: duplicateTopologies.map((ids) => `Duplicate road topology: ${ids.join(', ')}`),
    warnings: [],
  };
  const errors = [
    ...Object.entries(layouts).flatMap(([id, result]) => result.errors.map((message) => `${id}: ${message}`)),
    ...catalogResult.errors,
    ...topologyResult.errors,
  ];
  const warnings = [
    ...Object.entries(layouts).flatMap(([id, result]) => result.warnings.map((message) => `${id}: ${message}`)),
    ...catalogResult.warnings,
    ...topologyResult.warnings,
  ];
  return {
    ok: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    regionCount: REGION_PRODUCTION_IDS.length,
    subareaCount: REGION_PRODUCTION_IDS.reduce((sum, id) => sum + REGION_PRODUCTION_LAYOUTS[id].subareas.length, 0),
    structureCount: REGION_PRODUCTION_IDS.reduce((sum, id) => sum + REGION_PRODUCTION_LAYOUTS[id].structures.length, 0),
    bridgeCount: REGION_PRODUCTION_IDS.reduce((sum, id) => sum + REGION_PRODUCTION_LAYOUTS[id].bridges.length, 0),
    layouts,
    catalog: catalogResult,
    topology: topologyResult,
  };
}
