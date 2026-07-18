import { useStore } from '../../store/useStore.js';

export default function HUD() {
  const player = useStore((s) => s.playerState);
  const paused = useStore((s) => s.isPaused);
  const profile = useStore((s) => s.characterProfile);
  if (paused) return null;
  const xpTarget = Math.max(100, player.level * 100);
  return (
    <section className="mq-player-hud fixed z-30 select-none md:left-4 md:top-4" aria-label="角色狀態">
      <div className="flex items-center gap-2 rounded-[24px] border-[3px] border-white/80 bg-gradient-to-br from-[#fff6d8]/95 to-[#dff4ff]/95 p-2 pr-3 text-[#47382c] shadow-[0_8px_0_rgba(74,55,37,.18),0_14px_24px_rgba(39,64,82,.22)] backdrop-blur-md md:gap-3 md:p-2.5 md:pr-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[4px] border-[#ffe08b] bg-gradient-to-b from-[#c8f0ff] to-[#73bce8] text-3xl shadow-inner md:h-[72px] md:w-[72px] md:text-[42px]">
          {profile?.face === 'curious' ? '🤩' : profile?.face === 'brave' ? '😄' : profile?.face === 'calm' ? '🙂' : '😊'}
          <span className="absolute -bottom-1 -right-1 grid h-7 min-w-7 place-items-center rounded-full border-2 border-white bg-[#ffbf4a] px-1 text-[10px] font-black text-[#5a3a16] shadow-md md:h-8 md:min-w-8 md:text-xs">{player.level}</span>
        </div>
        <div className="w-[154px] md:w-[230px]">
          <div className="mb-1 flex items-center justify-between gap-2">
            <strong className="truncate text-sm font-black md:text-base">{profile?.name || '星光冒險者'}</strong>
            <span className="rounded-full border border-[#e6b34c]/50 bg-[#fff0b9] px-2 py-0.5 text-[10px] font-black md:text-xs">🪙 {player.gold}</span>
          </div>
          <Meter icon="❤" label="生命" value={player.hp} max={player.maxHp} fill="linear-gradient(90deg,#ff5f72,#ff9f54)" />
          <Meter icon="✦" label="魔力" value={player.mp} max={player.maxMp} fill="linear-gradient(90deg,#4e91ff,#65dcff)" />
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-4 text-[10px]">⭐</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full border border-[#7d653f]/15 bg-white/80">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ffd84d] to-[#ff9a45]" style={{ width: `${Math.min(100, (player.xp / xpTarget) * 100)}%` }} />
            </div>
            <span className="w-10 text-right text-[9px] font-black text-[#806b55]">{player.xp}/{xpTarget}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Meter({ icon, label, value, max, fill }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span className="w-4 text-[10px]" aria-label={label}>{icon}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-[#6a553e]/15 bg-white/75 shadow-inner">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${percent}%`, background: fill }} />
      </div>
      <span className="w-11 text-right text-[9px] font-black text-[#6b5949]">{Math.round(value)}/{max}</span>
    </div>
  );
}
