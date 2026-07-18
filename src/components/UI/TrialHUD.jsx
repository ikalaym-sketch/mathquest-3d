// v0.6.0 試煉 HUD：波次 / 最佳紀錄 / 撤退
import { useStore } from '../../store/useStore.js';
import { goToScene } from './TransitionManager.jsx';

export default function TrialHUD() {
  const active = useStore((s) => s.trialActive);
  const wave = useStore((s) => s.trialWave);
  const best = useStore((s) => s.records.bestWave || 0);
  const stopTrial = useStore((s) => s.stopTrial);
  const isPaused = useStore((s) => s.isPaused);

  if (!active || isPaused) return null;

  const retreat = () => {
    stopTrial();
    goToScene('village');
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1">
      <div className="px-4 py-1 rounded-full bg-black/60 border border-purple-400/60 text-white font-display tracking-wider text-sm">
        TRIAL · Wave {wave}
      </div>
      <div className="text-[10px] text-white/60">Best: Wave {best}</div>
      <button onClick={retreat} className="mt-1 px-3 py-0.5 rounded bg-hyrule-bronze/70 border border-white/25 text-white text-[10px]">
        Retreat
      </button>
    </div>
  );
}
