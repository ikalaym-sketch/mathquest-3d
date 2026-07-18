// 水下視覺覆蓋：只在角色頭部低於深水水面時顯示，避免依賴昂貴後製管線。
import { useStore } from '../../store/useStore.js';

export default function UnderwaterOverlay() {
  const runtime = useStore((state) => state.waterRuntime);
  if (!runtime?.isUnderwater) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-cyan-700/18 backdrop-blur-[0.5px]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-100/18 to-transparent" />
      {[12, 26, 41, 58, 72, 87].map((left, index) => (
        <span
          key={left}
          className="absolute bottom-[-2rem] block rounded-full border border-cyan-100/55 bg-white/10 animate-pulse"
          style={{ left: `${left}%`, width: `${8 + (index % 3) * 5}px`, height: `${8 + (index % 3) * 5}px`, animationDelay: `${index * 0.22}s`, transform: `translateY(-${80 + index * 10}vh)` }}
        />
      ))}
      <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(7,72,102,0.42)]" />
    </div>
  );
}
