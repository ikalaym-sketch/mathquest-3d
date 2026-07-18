import { useEffect, useRef } from 'react';
import { cameraState, resetCamera, rotateCamera, zoomCamera } from '../../input/cameraState.js';
import { useStore } from '../../store/useStore.js';

export default function CameraInput() {
  const isPaused = useStore((s) => s.isPaused);
  const dragRef = useRef({ active: false, x: 0, y: 0, touchId: null });

  useEffect(() => {
    const onContextMenu = (e) => e.preventDefault();
    const onMouseDown = (e) => {
      if (isPaused) return;
      if (e.button !== 2) return;
      dragRef.current = { active: true, x: e.clientX, y: e.clientY, touchId: null };
    };
    const onMouseMove = (e) => {
      const d = dragRef.current;
      if (!d.active || d.touchId !== null) return;
      rotateCamera(e.clientX - d.x, e.clientY - d.y);
      d.x = e.clientX; d.y = e.clientY;
    };
    const onMouseUp = (e) => {
      if (e.button !== 2) return;
      dragRef.current.active = false;
      dragRef.current.touchId = null;
    };
    const onWheel = (e) => {
      if (isPaused) return;
      zoomCamera(e.deltaY);
    };
    const onKey = (e) => {
      if (isPaused) return;
      if (e.code === 'KeyR') resetCamera();
    };

    const onTouchStart = (e) => {
      if (isPaused) return;
      const touch = Array.from(e.changedTouches).find((t) => t.clientX > window.innerWidth * 0.5);
      if (!touch) return;
      dragRef.current = { active: true, x: touch.clientX, y: touch.clientY, touchId: touch.identifier };
    };
    const onTouchMove = (e) => {
      const d = dragRef.current;
      if (!d.active || d.touchId == null) return;
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === d.touchId);
      if (!touch) return;
      rotateCamera(touch.clientX - d.x, touch.clientY - d.y);
      d.x = touch.clientX; d.y = touch.clientY;
    };
    const onTouchEnd = (e) => {
      const d = dragRef.current;
      if (d.touchId == null) return;
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === d.touchId);
      if (touch) {
        dragRef.current.active = false;
        dragRef.current.touchId = null;
      }
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isPaused]);

  if (isPaused) return null;

  return null;
}
