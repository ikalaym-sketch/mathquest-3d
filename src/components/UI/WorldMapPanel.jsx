// 九宮格世界地圖：呈現子區探索、核心機制與事件完成度，不再只以「是否進入過」判斷探索。
import { WORLD_REGIONS } from '../../data/worldRegions.js';
import { getRegionGameplayProfile, REGION_MATERIAL_BY_ID } from '../../data/regionGameplayProfiles.js';
import { getRegionProductionLayout } from '../../data/regionProductionLayouts.js';
import { getUnlockChapterForRegion } from '../../data/storyContent.js';
import { useStore } from '../../store/useStore.js';
import { goToScene } from './TransitionManager.jsx';

export default function WorldMapPanel() {
  const open = useStore((state) => state.worldMapOpen);
  const progress = useStore((state) => state.worldProgress);
  const close = useStore((state) => state.closeWorldMap);
  const enterRegion = useStore((state) => state.enterRegion);

  if (!open) return null;

  const travel = async (regionId) => {
    if (!progress.unlockedRegionIds.includes(regionId)) return;
    enterRegion(regionId);
    await goToScene('region');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/45 p-3 backdrop-blur-md">
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border-4 border-amber-200 bg-gradient-to-b from-sky-100 to-emerald-100 shadow-2xl">
        <header className="flex items-center justify-between border-b-2 border-amber-300 bg-white/75 px-5 py-3">
          <div><h2 className="font-display text-2xl font-black text-sky-900">九宮格冒險世界</h2><p className="text-xs font-semibold text-sky-700">每個正式區域包含四個子區、三個核心機制節點與三條多步驟事件。</p></div>
          <button onClick={close} className="grid h-12 w-12 place-items-center rounded-full border-2 border-red-200 bg-red-500 text-2xl font-black text-white shadow-lg active:scale-95" aria-label="關閉世界地圖">×</button>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-4 md:p-5">
          {WORLD_REGIONS.map((region) => {
            const unlocked = progress.unlockedRegionIds.includes(region.id);
            const unlockChapter = getUnlockChapterForRegion(region.id);
            const current = progress.currentRegionId === region.id;
            const profile = getRegionGameplayProfile(region.id);
            const layout = getRegionProductionLayout(region.id);
            const exploredIds = progress.exploredSubareas?.[region.id] || [];
            const explored = exploredIds.length;
            const mechanicDone = profile ? Object.values(progress.regionMechanicProgress?.[region.id] || {}).filter(Boolean).length : 0;
            const eventDone = profile ? profile.events.filter((item) => progress.completedEvents?.[`${region.id}:${item.id}`]).length : 0;
            const material = profile ? REGION_MATERIAL_BY_ID[profile.materialId] : null;
            const complete = profile ? explored >= 4 && mechanicDone >= 3 && eventDone >= 3 : progress.discoveredRegionIds.includes(region.id);
            return (
              <button
                key={region.id}
                disabled={!unlocked}
                onClick={() => travel(region.id)}
                className={`group relative min-h-52 overflow-hidden rounded-3xl border-4 p-3 text-left shadow-lg transition active:scale-[0.98] ${current ? 'border-yellow-400 ring-4 ring-yellow-200' : 'border-white/90'} ${unlocked ? 'hover:-translate-y-1 hover:shadow-xl' : 'cursor-not-allowed grayscale opacity-55'}`}
                style={{ background: `linear-gradient(145deg, ${region.sky}, ${region.ground})` }}
              >
                <div className="absolute -right-5 -top-7 text-[90px] opacity-20">{region.icon}</div>
                <div className="relative flex items-start justify-between gap-2"><div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-white/80 bg-white/75 text-3xl shadow-md">{region.icon}</div><span className="rounded-full border border-white/80 bg-white/80 px-2 py-1 text-[10px] font-black text-sky-900">LV {region.level}+</span></div>
                <h3 className="relative mt-2 font-display text-base font-black text-slate-900 md:text-lg">{region.name}</h3>
                <div className="relative mt-2 grid grid-cols-2 gap-1">{region.subareas.map((subarea, index) => { const subareaId = layout?.subareas?.[index]?.id || null; const found = !profile ? progress.discoveredRegionIds.includes(region.id) : Boolean(subareaId && exploredIds.includes(subareaId)); return <div key={subarea} className={`truncate rounded-lg border px-2 py-1 text-[10px] font-bold ${found ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800' : 'border-white/70 bg-white/60 text-slate-700'}`}><span className="mr-1">{found ? '✓' : ['①', '②', '③', '④'][index]}</span>{subarea}</div>; })}</div>
                {profile ? (
                  <div className="relative mt-3 grid grid-cols-3 gap-1 text-center text-[10px] font-black"><div className="rounded-lg bg-white/72 px-1 py-1.5 text-sky-800">探索 {explored}/4</div><div className="rounded-lg bg-white/72 px-1 py-1.5 text-violet-800">機制 {mechanicDone}/3</div><div className="rounded-lg bg-white/72 px-1 py-1.5 text-amber-800">事件 {eventDone}/3</div></div>
                ) : <div className="relative mt-3 rounded-lg bg-white/72 px-2 py-1.5 text-center text-[10px] font-black text-emerald-800">森林垂直切片區域</div>}
                <div className="relative mt-2 flex items-center justify-between text-[10px] font-bold text-slate-700"><span>{material ? `${material.icon} ${material.name}` : `🎒 ${region.material}`}</span><span>{complete ? '✓ 區域完成' : '✨ 尚有內容'}</span></div>
                {!unlocked && <div className="absolute inset-0 grid place-items-center bg-slate-800/35"><span className="max-w-[85%] rounded-2xl bg-slate-900/88 px-3 py-2 text-center text-xs font-black leading-5 text-white">🔒 {unlockChapter?.unlockReason || '完成前置章節後解鎖'}</span></div>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
