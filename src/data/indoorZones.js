import { VILLAGE_LAYOUT } from './villageLayout.js';
import { FARM_LAYOUT } from './farmLayout.js';
import { createFarmInterior, createVillageInterior } from './interiorDefinitions.js';
import { pointInOrientedRect } from '../utils/placementGeometry.js';

export const VILLAGE_INDOOR_ZONES = VILLAGE_LAYOUT.buildings.map(createVillageInterior);
export const FARM_INDOOR_ZONES = FARM_LAYOUT.buildings.map(createFarmInterior).filter(Boolean);

export const INDOOR_ZONES_BY_SCENE = {
  village: VILLAGE_INDOOR_ZONES,
  farm: FARM_INDOOR_ZONES,
};

export function getIndoorZone(sceneId, x, z) {
  const zones = INDOOR_ZONES_BY_SCENE[sceneId] || [];
  return zones.find((zone) => pointInOrientedRect(
    { x, z },
    {
      center: zone.center,
      halfWidth: zone.size[0] / 2,
      halfDepth: zone.size[1] / 2,
      yaw: zone.rotationY,
    },
    -0.12,
  )) || null;
}
