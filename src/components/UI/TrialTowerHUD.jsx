// 試煉之塔 HUD：繁體中文、裝置安全區與大型離開按鈕。
import { useStore } from '../../store/useStore.js';
import { goToScene } from './TransitionManager.jsx';
import GameIcon from './GameIcon.jsx';

export default function TrialTowerHUD() {
  const scene = useStore((s) => s.currentScene);
  const floor = useStore((s) => s.trialTower.currentFloor);
  const highest = useStore((s) => s.trialTower.highestFloor);
  const portalReady = useStore((s) => s.trialTower.portalReady);
  const exitTrialTower = useStore((s) => s.exitTrialTower);
  const isPaused = useStore((s) => s.isPaused);
  if (scene !== 'trialTower' || isPaused) return null;
  const nextMilestone = Math.ceil(floor / 10) * 10;
  const leave = async () => { exitTrialTower(); await goToScene('village'); };
  return <div className="mq-tower-hud fixed z-30 flex w-[min(94vw,660px)] items-center justify-between gap-3 rounded-3xl border-[3px] border-white/90 bg-white/90 px-4 py-2 text-slate-800 shadow-xl backdrop-blur-md"><div className="flex min-w-0 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white shadow-md"><GameIcon name="tower" size={28} /></div><div className="min-w-0"><div className="truncate text-base font-black">試煉之塔 · 第 {floor} 層</div><div className="truncate text-xs font-bold text-slate-600">最高第 {highest} 層 · 下一里程碑第 {nextMilestone} 層</div></div></div><div className="flex shrink-0 items-center gap-2"><span className={`hidden rounded-full px-3 py-1 text-xs font-black sm:inline ${portalReady ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-900'}`}>{portalReady ? '傳送門已開啟' : '挑戰進行中'}</span><button onClick={leave} className="min-h-11 rounded-2xl border-b-4 border-red-700 bg-red-500 px-3 text-xs font-black text-white active:translate-y-1 active:border-b-0">離開並保存</button></div></div>;
}
