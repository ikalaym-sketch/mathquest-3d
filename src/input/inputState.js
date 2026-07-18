// v0.2.0 輸入狀態單例
// 說明：以 module 級可變物件保存輸入，供 useFrame 每幀讀取而不觸發 React re-render。
// 鍵盤與虛擬搖桿都寫入此物件；Player 控制器每幀讀取。
export const inputState = {
  move: { x: 0, y: 0 },   // 移動向量（-1~1），y 正為前（螢幕上方）
  isMoving: false,
  isAttacking: false,     // 單幀觸發旗標，Player 讀取後自行歸零
  attackQueued: false,    // 佇列攻擊（避免漏接）
  dodgeQueued: false,     // 佇列翻滾（i-frame 閃避）
  jumpQueued: false,      // 佇列跳躍
};

// 觸發一次翻滾
export function triggerDodge() {
  inputState.dodgeQueued = true;
}

// 觸發一次攻擊
export function triggerAttack() {
  inputState.attackQueued = true;
}

// 設定移動向量（由搖桿/鍵盤呼叫）
export function setMove(x, y) {
  inputState.move.x = x;
  inputState.move.y = y;
  inputState.isMoving = Math.hypot(x, y) > 0.05;
}


// 觸發一次跳躍
export function triggerJump() {
  inputState.jumpQueued = true;
}
