// v0.24 水域狀態 HUD：只顯示必要資訊，並遵守 HUD Layout Manager 的安全區與左右手設定。
import { useStore } from '../../store/useStore.js';

const LABELS = {
  wade: ['淺水移動', 'waves'],
  swim: ['游泳中', 'pool'],
  ice: ['冰面滑行', 'ac_unit'],
  hazard: ['危險液體', 'warning'],
  ravine: ['跌落救援', 'health_and_safety'],
  'exit-water': ['正在上岸', 'directions_walk'],
};

export default function WaterStatusWidget() {
  const runtime = useStore((state) => state.waterRuntime);
  const preferences = useStore((state) => state.uiPreferences);
  if (!runtime || runtime.state === 'ground') return null;
  const [label, icon] = LABELS[runtime.state] || ['環境移動', 'waves'];
  const oxygenRatio = runtime.oxygenMax ? Math.max(0, Math.min(1, runtime.oxygen / runtime.oxygenMax)) : null;
  return (
    <div
      className={`pointer-events-none fixed z-30 rounded-2xl border-2 border-white/90 bg-sky-800/88 px-3 py-2 text-white shadow-xl backdrop-blur-sm ${preferences?.handedness === 'left' ? 'right-[var(--hud-safe-x)]' : 'left-[var(--hud-safe-x)]'}`}
      style={{ bottom: 'calc(var(--hud-safe-bottom) + 7.2rem)' }}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-black">
        <span className="material-symbols-rounded text-[20px]" aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      {oxygenRatio != null && (
        <div className="mt-1.5 w-32">
          <div className="mb-0.5 flex justify-between text-[11px] font-bold"><span>換氣</span><span>{Math.ceil(runtime.oxygen)} 秒</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-cyan-200 transition-[width] duration-200" style={{ width: `${oxygenRatio * 100}%` }} />
          </div>
        </div>
      )}
      {runtime.state === 'ice' && runtime.iceStress != null && (
        <div className="mt-1.5 w-32">
          <div className="mb-0.5 flex justify-between text-[11px] font-bold"><span>冰面穩定</span><span>{Math.max(0, Math.round((1 - runtime.iceStress) * 100))}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-blue-100 transition-[width] duration-200" style={{ width: `${Math.max(0, 1 - runtime.iceStress) * 100}%` }} /></div>
        </div>
      )}
      {runtime.isUnderwater && <div className="mt-1 text-[11px] font-bold text-cyan-100">向上：跳躍鍵</div>}
    </div>
  );
}
