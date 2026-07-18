// v0.28 村莊委託板：每遊戲週產生四項委託，交付物品後連動金幣與居民好感。
import { useEffect, useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { DB } from '../../data/index.js';
import { VILLAGE_RESIDENT_PROFILES } from '../../data/villageResidentProfiles.js';
import { canCompleteCommission } from '../../services/VillageEconomyService.js';
import { canCompleteVillageFestival, getVillageFestival } from '../../services/VillageFestivalService.js';

export default function VillageBoardPanel() {
  const economy = useStore((state) => state.villageEconomy);
  const inventory = useStore((state) => state.inventory);
  const ensureWeek = useStore((state) => state.ensureVillageWeek);
  const accept = useStore((state) => state.acceptVillageCommission);
  const turnIn = useStore((state) => state.turnInVillageCommission);
  const completeFestival = useStore((state) => state.completeVillageFestival);
  const dayIndex = useStore((state) => state.worldClock?.dayIndex || 1);
  const [message, setMessage] = useState('');
  useEffect(() => { ensureWeek(); }, [ensureWeek]);
  const commissions = useMemo(() => economy.commissions || [], [economy.commissions]);
  const festival = useMemo(() => getVillageFestival(dayIndex), [dayIndex]);
  const festivalDone = economy.attendedFestivalIds?.includes(festival.runId);
  const festivalReady = canCompleteVillageFestival(festival, inventory);
  return <Panel title={`村莊委託板・第 ${economy.activeWeek || 1} 週`} wide><div className="mb-3 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-900">市場等級 {economy.marketTier || 1} · 累積出貨 {economy.totalShipmentGold || 0}G。完成委託會提高居民好感。</div><article className="mb-4 rounded-[24px] border-2 border-white bg-gradient-to-r from-amber-50 to-pink-50 p-4 shadow"><div className="flex items-start gap-3"><span className="text-4xl">{festival.icon}</span><div className="flex-1"><h3 className="font-black text-slate-800">{festival.name}</h3><p className="mt-1 text-xs font-bold leading-5 text-slate-600">{festival.description}</p><p className="mt-1 text-xs font-black text-amber-700">{festival.active ? `活動進行中｜需求 ${DB[festival.itemId]?.nameZh || DB[festival.itemId]?.crop || DB[festival.itemId]?.name} ×${festival.quantity}` : `距離活動約 ${festival.daysUntil} 天`}</p></div></div>{festivalDone ? <div className="mt-3 rounded-xl bg-emerald-100 py-2 text-center text-xs font-black text-emerald-700">本年度已參加</div> : festival.active ? <button disabled={!festivalReady} onClick={() => { const r = completeFestival(); setMessage(r.ok ? `活動完成，獲得 ${r.rewardGold}G，所有村民留下共同回憶。` : "活動物品尚未備齊。"); }} className="mt-3 h-11 w-full rounded-xl bg-pink-500 text-xs font-black text-white disabled:bg-slate-300">{festivalReady ? "參加季節活動" : "活動物品尚未備齊"}</button> : null}</article><div className="grid gap-3 sm:grid-cols-2">{commissions.map((entry) => {
    const accepted = economy.acceptedCommissionIds?.includes(entry.runId);
    const completed = economy.completedCommissionIds?.includes(entry.runId);
    const ready = canCompleteCommission(entry, inventory);
    const requester = VILLAGE_RESIDENT_PROFILES[entry.requesterId];
    const item = DB[entry.itemId];
    return <article key={entry.runId} className="rounded-2xl border-2 border-white bg-white/80 p-3 shadow"><h3 className="font-black text-slate-800">{requester?.emoji} {entry.label}</h3><p className="mt-1 text-xs font-bold text-slate-500">委託人：{requester?.name}｜需求：{item?.nameZh || item?.crop || item?.name} ×{entry.quantity}</p><p className="mt-1 text-sm font-black text-amber-700">報酬 {entry.rewardGold}G</p>{completed ? <div className="mt-3 rounded-xl bg-emerald-100 py-2 text-center text-xs font-black text-emerald-700">已完成</div> : !accepted ? <button onClick={() => { const r = accept(entry.runId); setMessage(r.ok ? '已接受委託。' : '無法接受委託。'); }} className="mt-3 h-10 w-full rounded-xl bg-sky-500 text-xs font-black text-white">接受委託</button> : <button disabled={!ready} onClick={() => { const r = turnIn(entry.runId); setMessage(r.ok ? `交付完成，獲得 ${r.rewardGold}G。` : '物品數量不足。'); }} className="mt-3 h-10 w-full rounded-xl bg-amber-500 text-xs font-black text-white disabled:bg-slate-300">{ready ? '交付物品' : '物品尚未備齊'}</button>}</article>;
  })}</div>{message && <p className="mt-3 rounded-xl bg-white p-2 text-center text-sm font-black text-slate-600">{message}</p>}</Panel>;
}
