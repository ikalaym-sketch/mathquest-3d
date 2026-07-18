// 區域資訊卡：顯示目前子區、探索進度、核心機制與多步驟事件。
import { getWorldRegion } from '../../data/worldRegions.js';
import { FOREST_RUINS_LAYOUT } from '../../data/forestRuinsLayout.js';
import { getRegionProductionLayout } from '../../data/regionProductionLayouts.js';
import { getRegionGameplayProfile } from '../../data/regionGameplayProfiles.js';
import { useStore } from '../../store/useStore.js';

export default function RegionHUD() {
  const scene = useStore((state) => state.currentScene);
  const regionId = useStore((state) => state.worldProgress.currentRegionId);
  const event = useStore((state) => state.activeRegionEvent);
  const activeSubareaId = useStore((state) => state.activeRegionSubarea);
  const objectives = useStore((state) => state.worldProgress.regionObjectives || {});
  const kills = useStore((state) => state.worldProgress.regionKillProgress || {});
  const activeMonsterCount = useStore((state) => state.activeRegionMonsterCount || 0);
  const exploredSubareas = useStore((state) => state.worldProgress.exploredSubareas?.[regionId] || []);
  const mechanicProgress = useStore((state) => state.worldProgress.regionMechanicProgress?.[regionId] || {});
  const completedEvents = useStore((state) => state.worldProgress.completedEvents || {});

  if (scene !== 'region') return null;
  const region = getWorldRegion(regionId);

  if (regionId === 'forest_ruins') {
    const activeArea = FOREST_RUINS_LAYOUT.subareas[activeSubareaId] || FOREST_RUINS_LAYOUT.subareas.whispering_grove;
    const required = FOREST_RUINS_LAYOUT.boss.requiredObjectives;
    const done = required.filter((id) => objectives[`forest_ruins:${id}`]).length;
    return (
      <div className="mq-region-hud fixed z-30 w-[min(92vw,650px)] -translate-x-1/2 pointer-events-none">
        <div className="rounded-2xl border-2 border-white/75 bg-white/88 px-4 py-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2"><span className="text-2xl">🌳</span><div className="min-w-0"><div className="truncate font-display text-sm font-black text-slate-900">森林遺跡 · {activeArea.name}</div><div className="truncate text-[11px] font-semibold text-slate-600">探索、數學機關、怪物群落與苔蘚神殿</div></div></div>
            <div className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black text-white">封印 {done}/4 · 怪物 {activeMonsterCount}</div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">{required.map((id) => { const isDone = Boolean(objectives[`forest_ruins:${id}`]); const label = id === 'grove_runes' ? '數列' : id === 'waterfall_bridge' ? '路徑' : id === 'ancient_gate' ? '圖形' : `守衛 ${kills['forest_ruins:forest_guardians'] || 0}/5`; return <div key={id} className={`rounded-lg px-2 py-1 text-center text-[10px] font-black ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{isDone ? '✓ ' : '○ '}{label}</div>; })}</div>
        </div>
      </div>
    );
  }

  const layout = getRegionProductionLayout(regionId);
  const profile = getRegionGameplayProfile(regionId);
  const activeArea = layout?.subareas.find((item) => item.id === activeSubareaId) || layout?.subareas[0];
  const mechanicDone = Object.values(mechanicProgress).filter(Boolean).length;
  const eventDone = profile?.events.filter((item) => completedEvents[`${regionId}:${item.id}`]).length || 0;

  return (
    <div className="mq-region-hud fixed z-30 w-[min(94vw,680px)] -translate-x-1/2 pointer-events-none">
      <div className="rounded-2xl border-2 border-white/75 bg-white/88 px-4 py-2 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">{region.icon}</span>
            <div className="min-w-0"><div className="truncate font-display text-sm font-black text-slate-900">{region.name} · {activeArea?.name || '探索區域'}</div><div className="truncate text-[11px] font-semibold text-slate-600">{profile?.mechanic.title}：{profile?.mechanic.description}</div></div>
          </div>
          <div className="shrink-0 rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ backgroundColor: region.accent }}>怪物 {activeMonsterCount}</div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px] font-black">
          <div className={`rounded-lg px-2 py-1.5 ${exploredSubareas.length >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>探索 {exploredSubareas.length}/4</div>
          <div className={`rounded-lg px-2 py-1.5 ${mechanicDone >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'}`}>核心機制 {mechanicDone}/3</div>
          <div className={`rounded-lg px-2 py-1.5 ${eventDone >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>區域事件 {eventDone}/3</div>
        </div>

        {event && (
          <div className="mt-2 rounded-xl border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs font-bold text-amber-950">
            <div className="flex items-center justify-between gap-2"><span className="truncate">✨ {event.name}</span><span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">步驟 {event.stepNumber}/{event.totalSteps}</span></div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px]"><span className="truncate">{event.stepLabel}</span><span className="shrink-0">{event.target > 1 ? `${event.progress}/${event.target}` : '進行中'}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
