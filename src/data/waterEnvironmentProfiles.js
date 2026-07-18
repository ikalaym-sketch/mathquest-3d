// v0.24 水域與危險地形 Canonical 行為設定。
// 所有 Runtime、玩家移動、視覺與驗證器必須透過此表取得規則，禁止在元件內依 water.id 分散判斷。

const profile = (id, config) => Object.freeze({ id, ...config });

export const WATER_ENVIRONMENT_PROFILES = Object.freeze({
  water: profile('water', {
    mode: 'swim', swimAllowed: true, shallowDepth: 0.55, deepDepth: 2.8,
    movementMultiplier: 0.58, current: [0, 0], damagePerSecond: 0,
    surfaceColor: '#6fcfe4', foamColor: '#eafcff', floorColor: '#7ebea0',
    rescueDelay: 7, oxygenSeconds: 14, childSafe: true,
  }),
  pond: profile('pond', {
    mode: 'wade', swimAllowed: false, shallowDepth: 0.58, deepDepth: 0.58,
    movementMultiplier: 0.68, current: [0, 0], damagePerSecond: 0,
    surfaceColor: '#75cfc8', foamColor: '#e7fff6', floorColor: '#719f73',
    rescueDelay: 8, oxygenSeconds: null, childSafe: true,
  }),
  stream: profile('stream', {
    mode: 'wade', swimAllowed: false, shallowDepth: 0.7, deepDepth: 0.7,
    movementMultiplier: 0.62, current: [0.34, 0.08], damagePerSecond: 0,
    surfaceColor: '#70cce2', foamColor: '#f2ffff', floorColor: '#789f7c',
    rescueDelay: 7, oxygenSeconds: null, childSafe: true,
  }),
  river: profile('river', {
    mode: 'swim', swimAllowed: true, shallowDepth: 0.85, deepDepth: 2.6,
    movementMultiplier: 0.54, current: [0.48, 0.12], damagePerSecond: 0,
    surfaceColor: '#64c3dc', foamColor: '#eafcff', floorColor: '#668f78',
    rescueDelay: 6, oxygenSeconds: 12, childSafe: true,
  }),
  lake: profile('lake', {
    mode: 'swim', swimAllowed: true, shallowDepth: 0.9, deepDepth: 3.2,
    movementMultiplier: 0.6, current: [0.08, 0.04], damagePerSecond: 0,
    surfaceColor: '#69c9e7', foamColor: '#f2ffff', floorColor: '#567b78',
    rescueDelay: 8, oxygenSeconds: 16, childSafe: true,
  }),
  oasis: profile('oasis', {
    mode: 'wade', swimAllowed: false, shallowDepth: 0.62, deepDepth: 0.62,
    movementMultiplier: 0.76, current: [0, 0], damagePerSecond: 0,
    surfaceColor: '#62cbd4', foamColor: '#f5ffff', floorColor: '#c49d64',
    rescueDelay: 8, oxygenSeconds: null, childSafe: true,
  }),
  wetland: profile('wetland', {
    mode: 'wade', swimAllowed: false, shallowDepth: 0.48, deepDepth: 0.48,
    movementMultiplier: 0.5, current: [0.05, 0.03], damagePerSecond: 0,
    surfaceColor: '#70bca7', foamColor: '#d9f5dc', floorColor: '#546f54',
    rescueDelay: 7, oxygenSeconds: null, childSafe: true,
  }),
  ice: profile('ice', {
    mode: 'ice', swimAllowed: false, shallowDepth: 0, deepDepth: 0,
    movementMultiplier: 1.08, current: [0, 0], damagePerSecond: 0,
    surfaceColor: '#c8f3ff', foamColor: '#ffffff', floorColor: '#9ed9e8',
    rescueDelay: 7, oxygenSeconds: null, childSafe: true, traction: 0.22, breakAfterSeconds: 9,
  }),
  'hazard-liquid': profile('hazard-liquid', {
    mode: 'hazard', swimAllowed: false, shallowDepth: 1.2, deepDepth: 2.2,
    movementMultiplier: 0.25, current: [0.18, -0.08], damagePerSecond: 16,
    surfaceColor: '#65c8ae', foamColor: '#d9ff78', floorColor: '#384f44',
    rescueDelay: 1.4, oxygenSeconds: null, childSafe: false,
  }),
  ravine: profile('ravine', {
    mode: 'ravine', swimAllowed: false, shallowDepth: 0, deepDepth: 20,
    movementMultiplier: 0, current: [0, 0], damagePerSecond: 0,
    surfaceColor: '#241c22', foamColor: '#000000', floorColor: '#2f2526',
    rescueDelay: 1.1, oxygenSeconds: null, childSafe: true,
  }),
});

// 個別水域覆寫：用於同一 kind 在不同區域需具有不同深度或玩法的情況。
export const WATER_INSTANCE_OVERRIDES = Object.freeze({
  sky_stream: { profileId: 'stream', current: [0.2, -0.28], shallowDepth: 0.64 },
  mirror_lake_water: { profileId: 'lake', deepDepth: 2.5, oxygenSeconds: 16 },
  frozen_river: { profileId: 'ice' },
  plains_river: { profileId: 'river', current: [0.42, 0.16] },
  orchard_pond: { profileId: 'pond' },
  market_river: { profileId: 'river', current: [-0.32, 0.18] },
  crystal_main_lake: { profileId: 'lake', deepDepth: 3.6, oxygenSeconds: 18 },
  crystal_stream: { profileId: 'river', current: [0.38, -0.12] },
  canyon_oasis: { profileId: 'oasis' },
  ravine_gap: { profileId: 'ravine' },
  glow_pond_water: { profileId: 'wetland', movementMultiplier: 0.46 },
  spore_stream: { profileId: 'wetland', current: [0.08, 0.18] },
  coolant_channel: { profileId: 'hazard-liquid', damagePerSecond: 18 },
});

export function getWaterEnvironmentProfile(water) {
  if (!water) return null;
  const override = WATER_INSTANCE_OVERRIDES[water.id] || {};
  const fallbackId = water.id === 'frozen_river'
    ? 'ice'
    : water.kind === 'channel'
      ? 'hazard-liquid'
      : water.kind === 'ravine'
        ? 'ravine'
        : water.kind || 'water';
  const profileId = override.profileId || fallbackId;
  const base = WATER_ENVIRONMENT_PROFILES[profileId] || WATER_ENVIRONMENT_PROFILES.water;
  return Object.freeze({ ...base, ...override, profileId, waterId: water.id });
}
