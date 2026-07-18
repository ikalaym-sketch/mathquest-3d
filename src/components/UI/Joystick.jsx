import { useRef, useState, useCallback } from 'react';
import { setMove, triggerAttack, triggerDodge, triggerJump } from '../../input/inputState.js';
import { useStore } from '../../store/useStore.js';

export default function Joystick() {
  const baseRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeId = useRef(null);
  const isPaused = useStore((state) => state.isPaused);
  const radius = 44;

  const updateFromPoint = useCallback((clientX, clientY) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }
    setKnob({ x: dx, y: dy });
    setMove(dx / radius, -dy / radius);
  }, []);

  const onStart = (event) => {
    const pointer = event.changedTouches ? event.changedTouches[0] : event;
    activeId.current = pointer.identifier ?? 'mouse';
    updateFromPoint(pointer.clientX, pointer.clientY);
  };
  const onMove = (event) => {
    if (activeId.current == null) return;
    const pointers = event.changedTouches ? Array.from(event.changedTouches) : [event];
    const pointer = pointers.find((item) => (item.identifier ?? 'mouse') === activeId.current) || pointers[0];
    if (pointer) updateFromPoint(pointer.clientX, pointer.clientY);
  };
  const onEnd = () => {
    activeId.current = null;
    setKnob({ x: 0, y: 0 });
    setMove(0, 0);
  };

  if (isPaused) return null;

  return (
    <>
      <div
        ref={baseRef}
        aria-label="移動搖桿"
        className="mq-joystick fixed z-30 h-28 w-28 touch-none rounded-full border-[3px] border-white/55 bg-[#244561]/42 shadow-[0_7px_0_rgba(21,48,67,.28)] backdrop-blur-sm md:hidden"
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        <div className="absolute inset-4 rounded-full border border-white/25" />
        <div className="absolute left-1/2 top-1/2 grid h-12 w-12 place-items-center rounded-full border-2 border-white/75 bg-gradient-to-b from-[#ffe27b] to-[#f4a94e] text-xl shadow-lg" style={{ transform: `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)` }}>✦</div>
      </div>

      <ActionButton label="攻擊" icon="⚔️" className="bottom-[92px] right-3 h-[72px] w-[72px] from-[#ff9a68] to-[#e95454]" onPress={triggerAttack} />
      <ActionButton label="翻滾" icon="🌀" className="bottom-[172px] right-5 h-14 w-14 from-[#83c7ff] to-[#4689d8]" onPress={triggerDodge} small />
      <ActionButton label="跳躍" icon="⬆️" className="bottom-[238px] right-3 h-14 w-14 from-[#83dfa4] to-[#3ca769]" onPress={triggerJump} small />
    </>
  );
}

function ActionButton({ className, onPress, icon, label, small = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-action={label}
      className={`mq-action-button fixed z-30 flex touch-none flex-col items-center justify-center rounded-full border-[3px] border-white/70 bg-gradient-to-b font-black text-white shadow-[0_6px_0_rgba(27,48,62,.28)] transition-transform active:translate-y-1 active:shadow-none md:hidden ${className}`}
      onTouchStart={(event) => { event.preventDefault(); onPress(); }}
      onMouseDown={onPress}
    >
      <span className={small ? 'text-xl' : 'text-3xl'}>{icon}</span>
      <span className={small ? 'text-[9px]' : 'text-[10px]'}>{label}</span>
    </button>
  );
}
