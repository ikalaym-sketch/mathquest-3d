// v0.27.0 戰鬥命中核心：敵人註冊、鎖定、狀態傳遞與命中回報。
const enemies = new Set();

export const lockState = { id: null, x: 0, z: 0, active: false };

export function registerEnemy(api) {
  enemies.add(api);
  return () => enemies.delete(api);
}

export function getEnemies() {
  const out = [];
  enemies.forEach((enemy) => {
    if (!enemy.alive || enemy.alive()) out.push(enemy);
  });
  return out;
}

export function findNearestEnemy(origin, maxRange) {
  let best = null;
  let bestDistance = maxRange;
  enemies.forEach((enemy) => {
    if (enemy.alive && !enemy.alive()) return;
    const position = enemy.getPos();
    const distance = Math.hypot(position.x - origin.x, position.z - origin.z);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = { api: enemy, pos: position, dist: distance };
    }
  });
  return best;
}

export function meleeAttack(origin, range, damageFactory, lockedApi, knockbackMagnitude = 3, onHit = null) {
  const hitIds = new Set();
  const applyHit = (enemy) => {
    if (!enemy || hitIds.has(enemy.id)) return false;
    const position = enemy.getPos();
    const dx = position.x - origin.x;
    const dz = position.z - origin.z;
    const length = Math.hypot(dx, dz) || 1;
    const knockback = { x: (dx / length) * knockbackMagnitude, z: (dz / length) * knockbackMagnitude };
    const result = typeof damageFactory === 'function' ? damageFactory(enemy) : { dmg: damageFactory, crit: false };
    enemy.takeHit(result.dmg, { crit: result.crit, knockback, element: result.element, status: result.status, audioProfileId: result.audioProfileId });
    hitIds.add(enemy.id);
    onHit?.({ target: enemy, damage: result.dmg, result });
    return true;
  };

  if (lockedApi) {
    const position = lockedApi.getPos();
    if (Math.hypot(position.x - origin.x, position.z - origin.z) <= range && applyHit(lockedApi)) return 1;
  }
  enemies.forEach((enemy) => {
    if (enemy.alive && !enemy.alive()) return;
    const position = enemy.getPos();
    if (Math.hypot(position.x - origin.x, position.z - origin.z) <= range) applyHit(enemy);
  });
  return hitIds.size;
}

export function aoeAttack(origin, radius, damageFactory, knockbackMagnitude = 3, onHit = null) {
  let hitCount = 0;
  enemies.forEach((enemy) => {
    if (enemy.alive && !enemy.alive()) return;
    const position = enemy.getPos();
    const dx = position.x - origin.x;
    const dz = position.z - origin.z;
    const length = Math.hypot(dx, dz) || 1;
    if (length > radius) return;
    const knockback = { x: (dx / length) * knockbackMagnitude, z: (dz / length) * knockbackMagnitude };
    const result = typeof damageFactory === 'function' ? damageFactory(enemy) : { dmg: damageFactory, crit: false };
    enemy.takeHit(result.dmg, { crit: result.crit, knockback, element: result.element, status: result.status, audioProfileId: result.audioProfileId });
    onHit?.({ target: enemy, damage: result.dmg, result });
    hitCount += 1;
  });
  return hitCount;
}


// 長槍等直線武器使用角色面向建立窄形命中區；只命中前方且依距離排序，避免以圓形 AOE 冒充穿透。
export function lineAttack(origin, yaw, length, halfWidth, maxTargets, damageFactory, knockbackMagnitude = 3, onHit = null) {
  const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const candidates = [];
  enemies.forEach((enemy) => {
    if (enemy.alive && !enemy.alive()) return;
    const position = enemy.getPos();
    const dx = position.x - origin.x;
    const dz = position.z - origin.z;
    const along = dx * forward.x + dz * forward.z;
    const side = Math.abs(dx * forward.z - dz * forward.x);
    if (along >= 0 && along <= length && side <= halfWidth) candidates.push({ enemy, position, along });
  });
  candidates.sort((a, b) => a.along - b.along);
  const selected = candidates.slice(0, Math.max(1, maxTargets || 1));
  selected.forEach(({ enemy, position }) => {
    const dx = position.x - origin.x;
    const dz = position.z - origin.z;
    const magnitude = Math.hypot(dx, dz) || 1;
    const result = typeof damageFactory === 'function' ? damageFactory(enemy) : { dmg: damageFactory, crit: false };
    enemy.takeHit(result.dmg, {
      crit: result.crit,
      knockback: { x: (dx / magnitude) * knockbackMagnitude, z: (dz / magnitude) * knockbackMagnitude },
      element: result.element,
      status: result.status,
      audioProfileId: result.audioProfileId,
    });
    onHit?.({ target: enemy, damage: result.dmg, result });
  });
  return selected.length;
}

// 刀劍、雙持與戰鐮使用前方扇形命中；依距離排序並受Base Archetype的maxTargets約束。
export function arcAttack(origin, yaw, range, halfAngle, maxTargets, damageFactory, knockbackMagnitude = 3, onHit = null) {
  const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const candidates = [];
  enemies.forEach((enemy) => {
    if (enemy.alive && !enemy.alive()) return;
    const position = enemy.getPos();
    const dx = position.x - origin.x;
    const dz = position.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance > range || distance <= 0.001) return;
    const dot = Math.max(-1, Math.min(1, (dx * forward.x + dz * forward.z) / distance));
    if (Math.acos(dot) <= halfAngle) candidates.push({ enemy, position, distance });
  });
  candidates.sort((a, b) => a.distance - b.distance);
  const selected = candidates.slice(0, Math.max(1, maxTargets || 1));
  selected.forEach(({ enemy, position }) => applyDirectHit(enemy, origin, position, damageFactory, knockbackMagnitude, onHit));
  return selected.length;
}

// 投射物在視覺抵達後才呼叫此入口，讓傷害結算與GLB飛行時間使用同一契約。
export function directAttack(enemy, origin, damageFactory, knockbackMagnitude = 3, onHit = null) {
  if (!enemy || (enemy.alive && !enemy.alive())) return 0;
  const position = enemy.getPos();
  return applyDirectHit(enemy, origin, position, damageFactory, knockbackMagnitude, onHit) ? 1 : 0;
}

function applyDirectHit(enemy, origin, position, damageFactory, knockbackMagnitude, onHit) {
  const dx = position.x - origin.x;
  const dz = position.z - origin.z;
  const magnitude = Math.hypot(dx, dz) || 1;
  const result = typeof damageFactory === 'function' ? damageFactory(enemy) : { dmg: damageFactory, crit: false };
  enemy.takeHit(result.dmg, {
    crit: result.crit,
    knockback: { x: (dx / magnitude) * knockbackMagnitude, z: (dz / magnitude) * knockbackMagnitude },
    element: result.element,
    status: result.status,
    audioProfileId: result.audioProfileId,
  });
  onHit?.({ target: enemy, damage: result.dmg, result });
  return true;
}
