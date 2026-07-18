// v0.5.0 玩家世界座標 + 朝向單例
// Player 每幀寫入位置與朝向；怪物 AI / 鎖定系統讀取。
export const playerPos = { x: 0, y: 1.2, z: 0, yaw: 0, invuln: false, locomotion: 'ground', waterId: null };

// 玩家前方向量（依 yaw 計算，供「背對才動」判定）
export function playerForward() {
  return { x: Math.sin(playerPos.yaw), z: Math.cos(playerPos.yaw) };
}
