// 每日秘境資訊卡：清楚顯示日期種子、固定獎勵與今日完成狀態。
import { useMemo } from 'react';
import { createDailyRiftConfig } from '../../data/dailyRift.js';
import { useStore } from '../../store/useStore.js';

export default function DailyRiftHUD() {
  const scene = useStore((state) => state.currentScene);
  const config = useMemo(() => createDailyRiftConfig(), []);
  const completed = useStore((state) => Boolean(state.worldProgress.dailyRiftCompletions?.[config.dayKey]));
  if (scene !== 'wilderness') return null;
  return (
    <div className="mq-region-hud fixed z-30 w-[min(92vw,560px)] -translate-x-1/2 pointer-events-none">
      <div className="rounded-2xl border-2 border-white/80 bg-slate-900/84 px-4 py-3 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black tracking-[0.18em] text-sky-200">每日秘境 · {config.dayKey}</div><div className="mt-1 text-base font-black">🌀 {config.title}</div></div><span className={`rounded-full px-3 py-1 text-xs font-black ${completed ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>{completed ? '✓ 今日完成' : '挑戰中'}</span></div>
        <div className="mt-2 text-xs font-bold text-white/75">首次擊敗守護者：{config.rewardIcon} {config.rewardMaterialName} ×1 ＋ {config.rewardGold}G</div>
      </div>
    </div>
  );
}
