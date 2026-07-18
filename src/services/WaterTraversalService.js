// v0.24 玩家水域狀態機的純函式服務。
// 此檔不直接操作 Rapier；只計算狀態、速度、救援與上岸候選，便於 Runtime 與測試共用。
import { getWaterEnvironmentProfile } from '../data/waterEnvironmentProfiles.js';
import { getWaterAtPoint, localToWorld2D, pointInRotatedRect, sampleTraversalSurface, worldToLocal2D } from './TraversalSurfaceService.js';

export const WATER_STATE = Object.freeze({
  GROUND: 'ground', WADE: 'wade', SWIM: 'swim', ICE: 'ice', HAZARD: 'hazard', RAVINE: 'ravine', EXIT: 'exit-water',
});

export function classifyWaterState(layout, position, previousState = WATER_STATE.GROUND) {
  const water = getWaterAtPoint(layout, position.x, position.z, 0);
  if (!water) {
    return { state: previousState === WATER_STATE.SWIM || previousState === WATER_STATE.WADE ? WATER_STATE.EXIT : WATER_STATE.GROUND, water: null, profile: null };
  }
  const profile = getWaterEnvironmentProfile(water);
  if (profile.mode === 'ravine') return { state: WATER_STATE.RAVINE, water, profile };
  if (profile.mode === 'hazard') return { state: WATER_STATE.HAZARD, water, profile };
  if (profile.mode === 'ice') return { state: WATER_STATE.ICE, water, profile };
  const surfaceY = Number.isFinite(water.surfaceY) ? water.surfaceY : 0.13;
  const bodyDepth = surfaceY - (position.y - 1.05);
  if (profile.swimAllowed && bodyDepth > profile.shallowDepth * 0.62) return { state: WATER_STATE.SWIM, water, profile, surfaceY, bodyDepth };
  return { state: WATER_STATE.WADE, water, profile, surfaceY, bodyDepth };
}

export function computeWaterMotion({ state, profile, input, yaw, verticalVelocity, delta, jumpQueued }) {
  const inputLength = Math.hypot(input.x, input.y);
  const normalizedX = inputLength > 1 ? input.x / inputLength : input.x;
  const normalizedY = inputLength > 1 ? input.y / inputLength : input.y;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const worldX = normalizedX * cos + normalizedY * sin;
  const worldZ = normalizedX * sin - normalizedY * cos;
  const current = profile?.current || [0, 0];
  if (state === WATER_STATE.SWIM) {
    const rise = jumpQueued ? 2.9 : Math.max(-1.35, Math.min(1.35, verticalVelocity * 0.45));
    return {
      velocity: {
        x: worldX * 3.25 * profile.movementMultiplier + current[0],
        y: rise,
        z: worldZ * 3.25 * profile.movementMultiplier + current[1],
      },
      gravityScale: 0.08,
      animation: inputLength > 0.1 ? 'swim' : 'float',
    };
  }
  if (state === WATER_STATE.WADE) {
    return {
      velocity: {
        x: worldX * 5 * profile.movementMultiplier + current[0],
        y: verticalVelocity,
        z: worldZ * 5 * profile.movementMultiplier + current[1],
      },
      gravityScale: 1,
      animation: inputLength > 0.1 ? 'wade' : 'idle',
    };
  }
  if (state === WATER_STATE.ICE) {
    return {
      velocity: {
        x: worldX * 5.4 + current[0],
        y: verticalVelocity,
        z: worldZ * 5.4 + current[1],
      },
      gravityScale: 1,
      animation: inputLength > 0.1 ? 'slide' : 'idle',
      traction: profile.traction || 0.25,
    };
  }
  return { velocity: { x: 0, y: verticalVelocity, z: 0 }, gravityScale: 1, animation: 'idle' };
}

export function getWaterFloorY(water) {
  const profile = getWaterEnvironmentProfile(water);
  const surfaceY = Number.isFinite(water?.surfaceY) ? water.surfaceY : 0.13;
  return surfaceY - (profile?.shallowDepth || 0.6);
}

export function findWaterExitCandidates(layout, water, position, maxDistance = 14) {
  if (!layout || !water) return [];
  const local = worldToLocal2D(position.x, position.z, water.center, water.rotation || 0);
  const halfW = water.size[0] / 2;
  const halfD = water.size[1] / 2;
  const candidates = [
    { x: -halfW - 1.45, z: Math.max(-halfD, Math.min(halfD, local.z)) },
    { x: halfW + 1.45, z: Math.max(-halfD, Math.min(halfD, local.z)) },
    { x: Math.max(-halfW, Math.min(halfW, local.x)), z: -halfD - 1.45 },
    { x: Math.max(-halfW, Math.min(halfW, local.x)), z: halfD + 1.45 },
  ];
  return candidates
    .map((candidate) => {
      const world = localToWorld2D(candidate.x, candidate.z, water.center, water.rotation || 0);
      const surface = sampleTraversalSurface(layout, world.x, world.z);
      return { ...world, y: surface.walkable ? surface.y : 0, surface, distance: Math.hypot(world.x - position.x, world.z - position.z) };
    })
    .filter((candidate) => candidate.surface.walkable && candidate.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

export function findNearestWaterExit(layout, water, position, maxDistance = 14) {
  return findWaterExitCandidates(layout, water, position, maxDistance)[0] || null;
}

export function isNearWaterEdge(water, x, z, margin = 1.5) {
  if (!water || !pointInRotatedRect(x, z, water, 0)) return false;
  const local = worldToLocal2D(x, z, water.center, water.rotation || 0);
  const edgeDistance = Math.min(water.size[0] / 2 - Math.abs(local.x), water.size[1] / 2 - Math.abs(local.z));
  return edgeDistance <= margin;
}

export function validateWaterEnvironment(layout) {
  const errors = [];
  const warnings = [];
  for (const water of layout?.waters || []) {
    const profile = getWaterEnvironmentProfile(water);
    if (!profile) errors.push(`Missing water profile: ${layout.id}/${water.id}`);
    if (profile?.swimAllowed && profile.deepDepth <= profile.shallowDepth) errors.push(`Invalid swim depth: ${layout.id}/${water.id}`);
    if (profile?.mode === 'hazard' && profile.damagePerSecond <= 0) errors.push(`Hazard liquid has no damage: ${layout.id}/${water.id}`);
    if (profile?.mode === 'ice' && profile.swimAllowed) errors.push(`Ice cannot be swimmable: ${layout.id}/${water.id}`);
    if (profile?.swimAllowed) {
      const center = { x: water.center[0], y: water.surfaceY ?? 0.13, z: water.center[1] };
      const exitCount = findWaterExitCandidates(layout, water, center, 100).length;
      if (exitCount < 2) errors.push(`Swim water requires at least two safe exits: ${layout.id}/${water.id} (${exitCount})`);
    }
    if (profile?.childSafe && profile.rescueDelay > 10) warnings.push(`Child-safe rescue delay too long: ${layout.id}/${water.id}`);
  }
  return { ok: errors.length === 0, regionId: layout?.id, waterCount: layout?.waters?.length || 0, errors, warnings };
}
