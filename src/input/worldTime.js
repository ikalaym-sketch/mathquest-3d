// v0.7.0 世界時間單例（供 gameplay 讀取晝夜狀態）
// WorldAmbience 每幀寫入 phase(0~1) 與 isNight；怪物等系統讀取。
export const worldTime = { phase: 0, isNight: false };

// phase 0=日 0.25=昏 0.5=夜 0.75=曉
export function updateWorldTime(phase) {
  worldTime.phase = phase;
  worldTime.isNight = phase > 0.38 && phase < 0.62; // 夜間區段
}
