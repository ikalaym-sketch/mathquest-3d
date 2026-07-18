// v0.6.0 戰鬥特效匯流排（module 單例，供跨元件溝通）
let _id = 0;
export const fxState = {
  damages: [],      // { id, x, y, z, amount, crit, born }
  shake: 0,         // 螢幕震動強度（衰減）
  hitstop: 0,       // 頓幀計時（秒）
};

// 生成傷害跳字
export function spawnDamage(x, y, z, amount, crit = false) {
  fxState.damages.push({ id: ++_id, x, y, z, amount, crit, born: performance.now() });
  if (fxState.damages.length > 30) fxState.damages.shift(); // 上限
}

// 觸發螢幕震動
export function shakeCamera(intensity = 0.3) {
  fxState.shake = Math.min(1, fxState.shake + intensity);
}

// 觸發頓幀（命中頓挫感）
export function triggerHitstop(sec = 0.05) {
  fxState.hitstop = Math.max(fxState.hitstop, sec);
}

// 清除過期跳字（>1s）
export function pruneDamages(now) {
  fxState.damages = fxState.damages.filter((d) => now - d.born < 1000);
}
