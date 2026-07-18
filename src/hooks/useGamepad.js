import { useEffect } from 'react';
import { cameraState } from '../input/cameraState.js';
import { setMove, triggerAttack, triggerDodge, triggerJump } from '../input/inputState.js';

const DEAD_ZONE = 0.18;
const CAMERA_SPEED = 0.045;

function normalizeAxis(value) {
  const magnitude = Math.abs(value || 0);
  if (magnitude <= DEAD_ZONE) return 0;
  const normalized = (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);
  return Math.sign(value) * Math.min(1, normalized);
}

// 標準 Gamepad 映射：左搖桿移動、右搖桿鏡頭、A 跳躍、X 攻擊、B 翻滾。
export function useGamepad() {
  useEffect(() => {
    let frameId = 0;
    let wasConnected = false;
    const previousButtons = new Map();

    const poll = () => {
      const pads = navigator.getGamepads?.() || [];
      const pad = Array.from(pads).find(Boolean);
      if (!pad) {
        if (wasConnected) setMove(0, 0);
        wasConnected = false;
        frameId = requestAnimationFrame(poll);
        return;
      }

      wasConnected = true;
      const x = normalizeAxis(pad.axes?.[0]);
      const y = -normalizeAxis(pad.axes?.[1]);
      setMove(x, y);

      const cameraX = normalizeAxis(pad.axes?.[2]);
      const cameraY = normalizeAxis(pad.axes?.[3]);
      cameraState.yaw -= cameraX * CAMERA_SPEED;
      cameraState.pitch = Math.max(cameraState.minPitch, Math.min(cameraState.maxPitch, cameraState.pitch + cameraY * CAMERA_SPEED * 0.7));

      const edges = [
        [0, triggerJump],
        [1, triggerDodge],
        [2, triggerAttack],
      ];
      edges.forEach(([index, action]) => {
        const pressed = Boolean(pad.buttons?.[index]?.pressed);
        const key = `${pad.index}:${index}`;
        const previous = previousButtons.get(key) || false;
        if (pressed && !previous) action();
        previousButtons.set(key, pressed);
      });

      frameId = requestAnimationFrame(poll);
    };

    frameId = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frameId);
      if (wasConnected) setMove(0, 0);
    };
  }, []);
}
