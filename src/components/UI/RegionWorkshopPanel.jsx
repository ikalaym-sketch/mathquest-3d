// 區域工坊：使用唯一 Canonical 區域素材製作一次性紀念品。
import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { DB } from '../../data/index.js';
import { getRegionGameplayProfile, REGION_MATERIAL_BY_ID } from '../../data/regionGameplayProfiles.js';
import { getWorldRegion } from '../../data/worldRegions.js';

export default function RegionWorkshopPanel() {
  const panelData = useStore((state) => state.panelData);
  const inventory = useStore((state) => state.inventory);
  const gold = useStore((state) => state.playerState.gold);
  const craftKeepsake = useStore((state) => state.craftRegionKeepsake);
  const [message, setMessage] = useState(null);
  const regionId = panelData?.regionId;
  const profile = getRegionGameplayProfile(regionId);
  const region = getWorldRegion(regionId);
  const material = profile ? REGION_MATERIAL_BY_ID[profile.materialId] : null;
  const keepsake = profile ? DB[profile.keepsakeId] : null;
  const materialCount = useMemo(() => (inventory.materials || []).filter((itemId) => itemId === profile?.materialId).length, [inventory.materials, profile?.materialId]);
  const owned = Boolean(keepsake && (inventory.items || []).includes(keepsake.id));

  if (!profile || !material || !keepsake) return <Panel title="區域工坊"><p className="text-sm text-white/60">區域工坊資料不存在。</p></Panel>;

  const craft = () => {
    const result = craftKeepsake(regionId);
    if (result.ok) setMessage(`${keepsake.name}製作完成。`);
    else if (result.reason === 'owned') setMessage('這件區域紀念品已經製作完成。');
    else if (result.reason === 'gold') setMessage('金幣不足，需要 120G。');
    else if (result.reason === 'material') setMessage(`素材不足，需要 4 個${material.name}。`);
    else setMessage('工坊狀態不一致，未消耗素材。');
  };

  return (
    <Panel title={`${region.icon} ${region.name}工坊`}>
      <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-sky-900/70 to-slate-900/70 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-white/60 bg-white/15 text-3xl">{material.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black tracking-wider text-sky-200">區域專屬素材</div>
            <div className="mt-1 text-xl font-black text-white">{material.name}</div>
            <p className="mt-1 text-xs leading-5 text-white/60">區域怪物、探索完成與核心機制節點會提供此素材。</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white">持有 {materialCount}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-amber-200">區域紀念品</div>
            <div className="mt-1 text-lg font-black text-white">{keepsake.name}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${owned ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-300/15 text-amber-100'}`}>{owned ? '✓ 已製作' : '可製作'}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-white/60">{keepsake.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black">
          <div className={`rounded-xl px-3 py-2 ${materialCount >= 4 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>{material.icon} {materialCount}/4</div>
          <div className={`rounded-xl px-3 py-2 ${gold >= 120 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>🪙 {gold}/120G</div>
        </div>
        <button disabled={owned} onClick={craft} className={`mt-4 w-full rounded-xl border-b-4 px-4 py-3 text-sm font-black text-white active:translate-y-1 active:border-b-0 ${owned ? 'cursor-not-allowed border-slate-700 bg-slate-600/60' : 'border-amber-800 bg-amber-600'}`}>
          {owned ? '已完成製作' : `製作 ${keepsake.name}`}
        </button>
      </div>

      {message && <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-sm font-bold text-hyrule-gold">{message}</p>}
    </Panel>
  );
}
