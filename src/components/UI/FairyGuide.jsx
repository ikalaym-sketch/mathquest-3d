// v0.28 守護夥伴快捷卡：改讀 Companion Runtime，不再依賴舊 Pet 裝備資料。
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { getPOIs } from '../../input/pois.js';
import { playerPos } from '../../input/playerPos.js';

export default function FairyGuide() {
  const companionState = useStore((s) => s.companionState);
  const isPaused = useStore((s) => s.isPaused);
  const scene = useStore((s) => s.currentScene);
  const healHpPercent = useStore((s) => s.healHpPercent);
  const showWorldHint = useStore((s) => s.showWorldHint);
  const openPanel = useStore((s) => s.openPanel);
  const runtime = useStore((s) => s.getCompanionRuntime?.());
  const [expanded, setExpanded] = useState(false);
  const healTimer = useRef(null);
  const profile = runtime?.profile;
  const record = runtime?.record;
  const modifiers = runtime?.modifiers || {};

  useEffect(() => {
    window.clearInterval(healTimer.current);
    if (!profile || !modifiers.healInterval) return undefined;
    const intervalMs = Math.max(10000, modifiers.healInterval * 1000);
    healTimer.current = window.setInterval(() => {
      const state = useStore.getState();
      if (state.isPaused || state.playerState.hp >= state.playerState.maxHp) return;
      healHpPercent(modifiers.healPercent || 5);
      showWorldHint(`${profile.name}靠過來守護你，恢復了一些生命。`);
    }, intervalMs);
    return () => window.clearInterval(healTimer.current);
  }, [profile?.id, modifiers.healInterval, modifiers.healPercent, healHpPercent, showWorldHint]);

  if (!profile || !companionState?.starterChosen || isPaused || scene === 'trialTower') return null;

  const scan = () => {
    const range = Math.max(20, modifiers.treasureScanRange || modifiers.hiddenPathRange || modifiers.npcSenseRange || modifiers.forestScanRange || 20);
    const nearest = getPOIs()
      .map((poi) => {
        const pos = poi.getPos();
        return { poi, distance: Math.hypot(pos.x - playerPos.x, pos.z - playerPos.z) };
      })
      .filter((entry) => entry.distance <= range)
      .sort((a, b) => a.distance - b.distance)[0];
    showWorldHint(nearest
      ? `${profile.name}發現「${nearest.poi.label}」，距離約 ${Math.ceil(nearest.distance)} 公尺。`
      : `${profile.name}沒有發現附近的特殊地點，繼續探索吧。`);
    setExpanded(false);
  };

  return (
    <div className="mq-fairy-guide fixed z-30 -translate-x-1/2 select-none">
      {expanded && (
        <div className="mb-2 w-64 rounded-2xl border-2 border-white/80 bg-gradient-to-b from-[#e4fbff]/96 to-[#fff4cf]/96 p-3 text-[#45545e] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="text-3xl">{profile.emoji}</div>
            <div className="min-w-0"><div className="truncate text-sm font-black text-[#31749a]">{profile.name}・{profile.species}</div><div className="text-[11px] font-bold text-[#75828a]">Lv {record?.level || 1} · 好感 {Math.round(record?.affinity || 0)}/100</div></div>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-[#627079]">探索能力：{profile.skills.exploration}</p>
          <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={scan} className="rounded-xl bg-cyan-400 py-2 text-xs font-black text-slate-900">探索感應</button><button onClick={() => openPanel('companion')} className="rounded-xl bg-amber-300 py-2 text-xs font-black text-slate-900">夥伴名冊</button></div>
        </div>
      )}
      <button onClick={() => setExpanded((value) => !value)} className="mx-auto flex h-14 min-w-14 items-center justify-center gap-2 rounded-full border-2 border-cyan-100/60 bg-cyan-500/75 px-3 text-white shadow-[0_0_22px_rgba(100,225,255,.55)] backdrop-blur-sm active:scale-95" aria-label="開啟守護夥伴引導">
        <span className="text-2xl">{profile.emoji}</span><span className="hidden text-xs font-black sm:inline">守護夥伴</span>
      </button>
    </div>
  );
}
