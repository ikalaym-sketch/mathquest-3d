export const SCENE_RUNTIME = {
  village: {
    spawn: { x: 0, y: 1.2, z: 28 },
    camera: { yaw: 0, pitch: 0.42, distance: 7.8 },
    safeY: -2,
    bounds: { minX: -46, maxX: 46, minZ: -42, maxZ: 42, warning: 4 },
  },
  farm: {
    spawn: { x: 0, y: 1.2, z: 27 },
    camera: { yaw: 0, pitch: 0.48, distance: 6.8 },
    safeY: -2,
    bounds: { minX: -42, maxX: 42, minZ: -38, maxZ: 38, warning: 4 },
  },
  wilderness: {
    spawn: { x: 0, y: 1.2, z: 14 },
    safeY: -2,
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26, warning: 4 },
  },
  region: {
    spawn: { x: 0, y: 1.2, z: 34 },
    camera: { yaw: 0, pitch: 0.42, distance: 7.8 },
    safeY: -3,
    bounds: { minX: -49, maxX: 49, minZ: -48, maxZ: 48, warning: 5 },
  },
  trialTower: {
    spawn: { x: 0, y: 1.2, z: 13.5 },
    safeY: -3,
    bounds: { minX: -16.5, maxX: 16.5, minZ: -16.5, maxZ: 16.5, warning: 2.5 },
  },
};
