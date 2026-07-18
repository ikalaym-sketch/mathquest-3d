// v0.32 戰鬥執行唯一入口。
// Base Archetype決定Hit幾何、Projectile飛行、VFX資產與Cooldown；Player不得再自行分叉三套攻擊判定。
import {
  aoeAttack,
  arcAttack,
  directAttack,
  getEnemies,
  lineAttack,
} from '../input/combat.js';
import { resolveV035CombatEffectAssetId } from '../data/eventEffectV035Catalog.js';

const MAX_DELIVERIES = 12;
const MAX_IMPACTS = 16;
const IMPACT_LIFETIME_MS = 380;
let nextVisualId = 0;

export const combatVisualState = {
  deliveries: [],
  impacts: [],
  revision: 0,
};

export function executeWeaponCombat({
  profile,
  origin,
  yaw,
  lockedApi = null,
  damageFactory,
  knockbackMagnitude = 3,
  onHit = null,
  now = currentTime(),
}) {
  const execution = profile?.attackContract?.execution || {};
  const runtimeDamageFactory = (enemy) => ({
    ...(typeof damageFactory === 'function' ? damageFactory(enemy) : { dmg: damageFactory, crit: false }),
    audioProfileId: profile?.audioProfileId || null,
  });
  const runtimeOnHit = (hit) => {
    const position = hit.target?.getPos?.() || origin;
    spawnCombatImpact(profile?.impactAssetId, position, profile?.vfxProfileId, now);
    onHit?.(hit);
  };
  const isProjectile = Boolean(profile?.ranged || execution.projectileSpeed > 0);

  if (isProjectile) {
    const targets = resolveProjectileTargets(origin, profile?.range || 6, lockedApi, profile);
    const forwardTarget = {
      x: origin.x + Math.sin(yaw) * (profile?.range || 6),
      y: origin.y ?? 0.7,
      z: origin.z + Math.cos(yaw) * (profile?.range || 6),
    };
    const selected = targets.length ? targets : [{ api: null, pos: forwardTarget }];
    selected.forEach(({ api, pos }, index) => enqueueProjectile({
      profile,
      origin,
      yaw: yaw + (index - (selected.length - 1) / 2) * 0.09,
      targetApi: api,
      targetPosition: pos,
      damageFactory: runtimeDamageFactory,
      knockbackMagnitude,
      onHit,
      now,
    }));
    return { delivery: 'projectile', queued: selected.length, immediateHits: 0, hitProfileId: profile?.hitProfileId || null };
  }

  enqueueSwing(profile, origin, yaw, now);
  let immediateHits = 0;
  const shape = execution.shape || (profile?.pierce ? 'line' : profile?.aoe > 0 ? 'impact' : 'arc');
  if (shape === 'line' || profile?.pierce) {
    immediateHits = lineAttack(origin, yaw, profile.range, 0.7 + (execution.areaScale || 1) * 0.16, profile.pierceCount || execution.maxTargets || 1, runtimeDamageFactory, knockbackMagnitude, runtimeOnHit);
  } else if (shape === 'impact' || shape === 'focus-burst') {
    immediateHits = aoeAttack(origin, Math.max(profile.aoe || 0, profile.range * 0.82), runtimeDamageFactory, knockbackMagnitude, runtimeOnHit);
  } else {
    const halfAngle = shape === 'wide-arc' ? Math.PI * 0.62 : shape === 'multi-arc' ? Math.PI * 0.48 : Math.PI * 0.36;
    immediateHits = arcAttack(origin, yaw, profile.range, halfAngle, execution.maxTargets || 3, runtimeDamageFactory, knockbackMagnitude, runtimeOnHit);
  }
  return { delivery: 'melee', queued: 1, immediateHits, hitProfileId: profile?.hitProfileId || null };
}

export function updateCombatVisualState(now = currentTime()) {
  const pending = [];
  for (const delivery of combatVisualState.deliveries) {
    if (delivery.homing && delivery.targetApi?.alive?.() !== false) {
      const target = delivery.targetApi?.getPos?.();
      if (target) delivery.target = worldPosition(target, 0.72);
    }
    if (now < delivery.endsAt) {
      pending.push(delivery);
      continue;
    }
    if (!delivery.resolved) {
      delivery.resolved = true;
      delivery.resolveImpact?.(delivery.target, now);
    }
  }
  const changed = pending.length !== combatVisualState.deliveries.length;
  combatVisualState.deliveries = pending;
  const nextImpacts = combatVisualState.impacts.filter((impact) => now - impact.startedAt < IMPACT_LIFETIME_MS);
  if (nextImpacts.length !== combatVisualState.impacts.length) {
    combatVisualState.impacts = nextImpacts;
    combatVisualState.revision += 1;
  } else if (changed) combatVisualState.revision += 1;
  return combatVisualState;
}

export function getCombatVisualPose(event, now = currentTime()) {
  if (event.kind === 'impact') {
    const progress = clamp01((now - event.startedAt) / IMPACT_LIFETIME_MS);
    const scale = 0.32 + Math.sin(progress * Math.PI) * 1.05;
    return { position: [event.position.x, event.position.y, event.position.z], rotation: [0, progress * Math.PI * 1.6, 0], scale: [scale, scale, scale] };
  }
  const progress = clamp01((now - event.startedAt) / Math.max(1, event.endsAt - event.startedAt));
  if (event.kind === 'swing') {
    const scale = 0.62 + Math.sin(progress * Math.PI) * 0.42;
    return {
      position: [event.origin.x, event.origin.y, event.origin.z],
      rotation: [0, event.yaw + (progress - 0.5) * 1.4, 0],
      scale: [scale, scale, scale],
    };
  }
  const position = {
    x: lerp(event.origin.x, event.target.x, progress),
    y: lerp(event.origin.y, event.target.y, progress) + Math.sin(progress * Math.PI) * 0.28,
    z: lerp(event.origin.z, event.target.z, progress),
  };
  const dx = event.target.x - event.origin.x;
  const dz = event.target.z - event.origin.z;
  const spin = event.returns ? progress * Math.PI * 6 : 0;
  return { position: [position.x, position.y, position.z], rotation: [0, Math.atan2(dx, dz), spin], scale: [0.72, 0.72, 0.72] };
}

export function spawnCombatImpact(assetId, position, vfxProfileId = null, now = currentTime()) {
  if (!assetId) return null;
  const impact = {
    id: `combat-impact-${++nextVisualId}`,
    kind: 'impact',
    assetId,
    effectAssetId: resolveV035CombatEffectAssetId(vfxProfileId),
    vfxProfileId,
    position: worldPosition(position, 0.55),
    startedAt: now,
  };
  combatVisualState.impacts.push(impact);
  if (combatVisualState.impacts.length > MAX_IMPACTS) combatVisualState.impacts.splice(0, combatVisualState.impacts.length - MAX_IMPACTS);
  combatVisualState.revision += 1;
  return impact;
}

export function resetCombatVisualStateForTests() {
  combatVisualState.deliveries = [];
  combatVisualState.impacts = [];
  combatVisualState.revision = 0;
  nextVisualId = 0;
}

function enqueueSwing(profile, origin, yaw, now) {
  if (!profile?.deliveryAssetId) return;
  pushDelivery({
    id: `combat-delivery-${++nextVisualId}`,
    kind: 'swing',
    assetId: profile.deliveryAssetId,
    effectAssetId: resolveV035CombatEffectAssetId(profile.vfxProfileId),
    origin: worldPosition(origin, 0.82),
    target: worldPosition(origin, 0.82),
    yaw,
    startedAt: now,
    endsAt: now + Math.max(150, Math.min(320, (profile.cooldown || 0.5) * 420)),
    resolved: false,
  });
}

function enqueueProjectile({ profile, origin, yaw, targetApi, targetPosition, damageFactory, knockbackMagnitude, onHit, now }) {
  const execution = profile.attackContract?.execution || {};
  const start = worldPosition(origin, 0.82);
  const target = worldPosition(targetPosition, 0.72);
  const distance = Math.hypot(target.x - start.x, target.z - start.z);
  const speed = Math.max(4, execution.projectileSpeed || 8);
  const durationMs = Math.max(120, Math.min(1250, distance / speed * 1000));
  pushDelivery({
    id: `combat-delivery-${++nextVisualId}`,
    kind: 'projectile',
    assetId: profile.deliveryAssetId,
    effectAssetId: resolveV035CombatEffectAssetId(profile.vfxProfileId),
    impactAssetId: profile.impactAssetId,
    vfxProfileId: profile.vfxProfileId,
    origin: start,
    target,
    targetApi,
    yaw,
    homing: Boolean(profile.effects?.homing),
    returns: Boolean(profile.returns),
    startedAt: now,
    endsAt: now + durationMs,
    resolved: false,
    resolveImpact: (impactPosition, resolvedAt) => {
      const shape = execution.shape;
      if (targetApi && targetApi.alive?.() !== false) {
        if (['target-area', 'projectile-impact', 'focus-burst'].includes(shape) || profile.aoe > 0) {
          aoeAttack(impactPosition, Math.max(1.5, profile.aoe || execution.areaScale * 2), damageFactory, knockbackMagnitude, onHit);
        } else directAttack(targetApi, start, damageFactory, knockbackMagnitude, onHit);
      }
      spawnCombatImpact(profile.impactAssetId, impactPosition, profile.vfxProfileId, resolvedAt ?? currentTime());
    },
  });
}

function resolveProjectileTargets(origin, range, lockedApi, profile) {
  const candidates = [];
  for (const api of getEnemies()) {
    const pos = api.getPos();
    const distance = Math.hypot(pos.x - origin.x, pos.z - origin.z);
    if (distance <= range) candidates.push({ api, pos, distance });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  if (lockedApi && lockedApi.alive?.() !== false) {
    const lockedIndex = candidates.findIndex((entry) => entry.api === lockedApi);
    if (lockedIndex > 0) candidates.unshift(...candidates.splice(lockedIndex, 1));
  }
  const projectileCount = profile?.spread
    ? Math.max(1, Math.min(5, profile.projectileCount || profile.spread))
    : 1;
  return candidates.slice(0, projectileCount);
}

function pushDelivery(delivery) {
  combatVisualState.deliveries.push(delivery);
  if (combatVisualState.deliveries.length > MAX_DELIVERIES) combatVisualState.deliveries.splice(0, combatVisualState.deliveries.length - MAX_DELIVERIES);
  combatVisualState.revision += 1;
}

function worldPosition(value, yOffset = 0) {
  return { x: Number(value?.x) || 0, y: (Number(value?.y) || 0) + yOffset, z: Number(value?.z) || 0 };
}

function currentTime() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
