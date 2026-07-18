// Boss 預警幾何純函式：畫面旋轉與傷害命中共用同一組計算，避免「看得到已躲開但仍受傷」。
export function calculateLineTelegraphRotation(origin, target) {
  const dx = Number(target?.x || 0) - Number(origin?.x || 0);
  const dz = Number(target?.z || 0) - Number(origin?.z || 0);
  return Math.atan2(-dx, -dz);
}

export function isPointInsideBossSkill(active, point) {
  if (!active?.skill || !active.position || !point) return false;
  const dx = Number(point.x || 0) - active.position[0];
  const dz = Number(point.z || 0) - active.position[2];
  const skill = active.skill;
  if (skill.kind === 'line') {
    const yaw = active.rotationY || 0;
    const localX = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const localZ = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    return Math.abs(localX) <= skill.radius && localZ <= 1 && localZ >= -(skill.length || 14);
  }
  return Math.hypot(dx, dz) <= skill.radius;
}
