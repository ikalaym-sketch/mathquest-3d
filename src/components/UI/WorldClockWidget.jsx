import { useStore } from '../../store/useStore.js';
import { getSeasonSnapshot } from '../../services/SeasonCropService.js';

export default function WorldClockWidget() {
  const paused = useStore((state) => state.isPaused);
  const clock = useStore((state) => state.worldClock);
  if (paused || !clock) return null;
  const season = getSeasonSnapshot(clock.dayIndex || 1);
  return (
    <div className="mq-world-clock fixed z-30 flex min-w-[126px] items-center gap-2 rounded-2xl border-2 border-white/75 bg-[#fff8dc]/95 px-3 py-2 text-[#4d3a2b] shadow-xl backdrop-blur-md md:right-4 md:top-[148px] md:min-w-[150px] md:px-4">
      <span className="text-2xl" aria-hidden>{clock.weatherIcon}</span>
      <div className="min-w-0 leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black md:text-base">{clock.timeText}</span>
          <span className="rounded-full bg-[#ead59b] px-1.5 py-0.5 text-[9px] font-black text-[#5c4938]">第 {clock.dayIndex || 1} 天</span>
        </div>
        <div className="truncate text-[10px] font-bold text-[#78614f] md:text-xs">
          {season.icon} {season.label}第 {season.dayOfSeason} 天 · {clock.weatherLabel}{clock.indoorZoneId ? ' · 室內' : ''}
        </div>
      </div>
    </div>
  );
}
