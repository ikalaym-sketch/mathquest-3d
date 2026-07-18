// 鍵盤輸入 hook
// WASD / 方向鍵 → 移動；Space → 跳躍；F/J/Enter → 攻擊；Shift → 翻滾
import { useEffect } from 'react';
import { setMove, triggerAttack, triggerDodge, triggerJump } from '../input/inputState.js';

export function useKeyboard() {
  useEffect(() => {
    const keys = new Set();

    const recompute = () => {
      let x = 0;
      let y = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      const len = Math.hypot(x, y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
      setMove(x, y);
    };

    const onDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.repeat) {
        if (e.code === 'Space') e.preventDefault();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        triggerJump();
        return;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        triggerDodge();
        return;
      }
      if (e.code === 'KeyF' || e.code === 'KeyJ' || e.code === 'Enter') {
        triggerAttack();
        return;
      }
      keys.add(e.code);
      recompute();
    };

    const onUp = (e) => {
      keys.delete(e.code);
      recompute();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);
}
