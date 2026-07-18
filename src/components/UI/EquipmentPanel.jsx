// v0.29 裝備面板：八個正式穿戴欄、裝備實例與即時比較共用單一資料流。
import { useEffect, useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import ItemIcon from './ItemIcon.jsx';
import PaperDollAvatar from './PaperDollAvatar.jsx';
import { useStore } from '../../store/useStore.js';
import { ARMOR_SET_META } from '../../data/index.js';
import { resolveEquipmentInstance, resolveEquippedEntry } from '../../services/EquipmentInstanceService.js';
import {
  SLOT_META,
  calculateEquipmentStats,
  compareWithEquipped,
  createEquipmentView,
  getDisplayName,
  getItemCategory,
  getRarityTheme,
  getTypeLabel,
} from '../../utils/equipmentPresentation.js';

const FILTERS = [
  { key: 'all', label: '全部', icon: '🎒' },
  { key: 'melee', label: '近戰', icon: '⚔️' },
  { key: 'ranged', label: '遠程', icon: '🏹' },
  { key: 'magic', label: '魔法', icon: '🪄' },
  { key: 'armor', label: '防具', icon: '🛡️' },
];

const STAT_META = [
  { key: 'power', label: '總能力', icon: '⭐' },
  { key: 'attack', label: '攻擊', icon: '⚔️' },
  { key: 'defense', label: '防禦', icon: '🛡️' },
  { key: 'maxHp', label: '生命', icon: '❤️' },
  { key: 'speed', label: '速度', icon: '🪽' },
  { key: 'range', label: '距離', icon: '🎯' },
];

export default function EquipmentPanel() {
  const inventory = useStore((state) => state.inventory);
  const equipmentInstances = useStore((state) => state.equipmentInstances);
  const equipped = useStore((state) => state.equipped);
  const playerState = useStore((state) => state.playerState);
  const equip = useStore((state) => state.equip);
  const unequip = useStore((state) => state.unequip);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(equipped.mainHand || null);
  const [message, setMessage] = useState(null);

  const ownedViews = useMemo(() => (inventory.equipment || [])
    .map((instanceId) => createEquipmentView(instanceId, equipmentInstances))
    .filter(Boolean), [equipmentInstances, inventory.equipment]);

  const filteredViews = useMemo(() => ownedViews.filter((view) => (
    filter === 'all' || getItemCategory(view.item) === filter
  )), [filter, ownedViews]);

  useEffect(() => {
    if (selectedId && ownedViews.some((view) => view.instanceId === selectedId)) return;
    setSelectedId(filteredViews[0]?.instanceId || ownedViews[0]?.instanceId || null);
  }, [filteredViews, ownedViews, selectedId]);

  const selected = selectedId ? createEquipmentView(selectedId, equipmentInstances) : null;
  const comparison = selected ? compareWithEquipped(selected, equipped, playerState, equipmentInstances) : null;
  const totals = calculateEquipmentStats(equipped, playerState, equipmentInstances);
  const selectedEquipped = Boolean(selected?.slot && equipped[selected.slot] === selected.instanceId);

  const handleEquip = () => {
    if (!selected?.slot) return;
    const result = equip(selected.slot, selected.instanceId);
    setMessage(result?.ok ? `已裝備 ${getDisplayName(selected.item, selected.instance)}` : equipFailureMessage(result?.reason));
  };

  return (
    <Panel title="🛡️ 我的裝備" extraWide>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-200/15 bg-sky-100/5 px-4 py-3">
        <div>
          <div className="text-base font-bold text-white">八欄裝備與外觀同步</div>
          <div className="text-xs text-white/55">同款裝備會保留各自的等級、品質與附魔，不再合併。</div>
        </div>
        <div className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-200">⭐ 總能力 {totals.power}</div>
      </div>
      {message && <div className="mb-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center text-xs font-bold text-white/80">{message}</div>}

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(320px,1fr)_minmax(360px,1.15fr)]">
        <section className="order-3 rounded-3xl border border-white/10 bg-black/20 p-3 xl:order-1">
          <h3 className="mb-3 text-sm font-bold text-sky-200">目前能力</h3>
          <div className="space-y-2">{STAT_META.map((meta) => <StatRow key={meta.key} meta={meta} value={totals[meta.key]} />)}</div>
          <SetSummary equipped={equipped} equipmentInstances={equipmentInstances} />
        </section>

        <section className="order-1 space-y-3 xl:order-2">
          <PaperDollAvatar equipped={equipped} equipmentInstances={equipmentInstances} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            {Object.entries(SLOT_META).map(([slot, meta]) => {
              const entry = resolveEquippedEntry(equipped, slot, equipmentInstances);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => entry.instance && setSelectedId(entry.instance.instanceId)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-left transition hover:bg-white/10"
                >
                  <div className="mb-1 text-[10px] font-semibold text-white/55">{meta.icon} {meta.label}</div>
                  <div className="flex items-center gap-2">
                    <ItemIcon item={entry.item} size="sm" equipped={Boolean(entry.item)} emptyIcon={meta.icon} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{entry.item ? getDisplayName(entry.item, entry.instance) : '尚未裝備'}</div>
                      {entry.instance && <div className="text-[10px] text-amber-200">Lv {entry.instance.level}</div>}
                    </div>
                    {entry.instance && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => { event.stopPropagation(); unequip(slot); }}
                        onKeyDown={(event) => { if (event.key === 'Enter') unequip(slot); }}
                        className="text-[10px] text-rose-300 hover:text-rose-200"
                      >卸下</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="order-2 flex min-h-[520px] flex-col rounded-3xl border border-white/10 bg-black/20 p-3 xl:order-3">
          <div className="mb-3 grid grid-cols-3 gap-1 pb-1 sm:flex sm:overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${filter === item.key ? 'border-amber-300 bg-amber-300 text-slate-900' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
              >{item.icon} {item.label}</button>
            ))}
          </div>

          <div className="grid max-h-[245px] grid-cols-4 gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2 sm:grid-cols-5">
            {filteredViews.map((view) => {
              const theme = getRarityTheme(view.item.rarity);
              const isEquipped = equipped[view.slot] === view.instanceId;
              return (
                <button
                  key={view.instanceId}
                  type="button"
                  onClick={() => setSelectedId(view.instanceId)}
                  className={`relative rounded-2xl border p-1.5 transition hover:-translate-y-0.5 ${selected?.instanceId === view.instanceId ? 'ring-2 ring-amber-300' : ''}`}
                  style={{ borderColor: theme.border, background: `${theme.bg}aa` }}
                >
                  <ItemIcon item={view.item} equipped={isEquipped} />
                  <div className="mt-1 truncate text-[10px] font-semibold">{getDisplayName(view.item, view.instance)}</div>
                  <div className="text-[9px] text-amber-300">Lv {view.instance.level}</div>
                  {view.instance.locked && <div className="absolute right-1 top-1 text-[10px]">🔒</div>}
                </button>
              );
            })}
          </div>

          <ItemDetail view={selected} comparison={comparison} isEquipped={selectedEquipped} onEquip={handleEquip} />
        </section>
      </div>
    </Panel>
  );
}

function StatRow({ meta, value }) {
  return <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-3 py-2"><span className="text-xs text-white/70">{meta.icon} {meta.label}</span><span className="font-bold text-white">{value}</span></div>;
}

function SetSummary({ equipped, equipmentInstances }) {
  const keys = Object.keys(SLOT_META)
    .map((slot) => resolveEquippedEntry(equipped, slot, equipmentInstances).item?.setKey)
    .filter(Boolean);
  const counts = keys.reduce((acc, key) => ({ ...acc, [key]: (acc[key] || 0) + 1 }), {});
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const bestSet = best ? ARMOR_SET_META.find((set) => set.key === best[0]) : null;
  return <div className="mt-3 rounded-2xl border border-violet-300/20 bg-violet-300/8 p-3"><div className="text-xs font-bold text-violet-200">✨ 套裝效果</div><div className="mt-1 text-xs text-white/60">{best ? `${bestSet?.nameZh || best[0]}套裝 ${best[1]}/4` : '裝備同系列四件核心防具可啟動套裝能力。'}</div></div>;
}

function ItemDetail({ view, comparison, isEquipped, onEquip }) {
  if (!view) return <div className="mt-3 flex flex-1 items-center justify-center text-sm text-white/40">目前沒有可裝備物品。</div>;
  const { item, instance } = view;
  const theme = getRarityTheme(item.rarity);
  const stats = item.stats || {};
  const deltaPower = comparison?.delta.power || 0;
  return (
    <div className="mt-3 flex-1 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3">
      <div className="flex gap-3">
        <ItemIcon item={item} size="lg" equipped={isEquipped} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white">{getDisplayName(item, instance)}</h3>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: theme.border, background: theme.bg }}>{theme.label}</span>
            <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-200">{getTypeLabel(item)}</span>
            <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">Lv {instance.level}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">{item.description}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.atk != null && <MiniStat icon="⚔️" label="攻擊" value={stats.atk} />}
        {stats.def != null && <MiniStat icon="🛡️" label="防禦" value={stats.def} />}
        {stats.range != null && <MiniStat icon="🎯" label="距離" value={stats.range} />}
        {stats.atkSpeed != null && <MiniStat icon="🪽" label="攻速" value={stats.atkSpeed} />}
      </div>
      {comparison && <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">替換後總能力：<span className={deltaPower >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{deltaPower >= 0 ? '+' : ''}{deltaPower}</span></div>}
      {instance.affixes?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{instance.affixes.map((affix, index) => <span key={`${affix.type}-${index}`} className="rounded-full border border-violet-300/30 bg-violet-300/10 px-2 py-1 text-[10px] text-violet-200">{affix.label} +{formatAffix(affix)}</span>)}</div>}
      <button type="button" disabled={isEquipped || !view.slot} onClick={onEquip} className="mt-4 w-full rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-45">{isEquipped ? '目前已裝備' : `裝備到${SLOT_META[view.slot]?.label || '指定欄位'}`}</button>
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return <div className="rounded-xl border border-white/8 bg-black/15 px-2 py-2 text-center"><div className="text-[10px] text-white/45">{icon} {label}</div><div className="mt-1 text-sm font-bold text-white">{value}</div></div>;
}

function formatAffix(affix) {
  return ['atk', 'crit', 'lifesteal', 'speed'].includes(affix.type) ? `${Math.round(affix.value * 100)}%` : Number(affix.value).toFixed(1);
}

function equipFailureMessage(reason) {
  if (reason === 'main-hand-locks-offhand') return '雙手武器使用中，副手欄位已鎖定。';
  if (reason === 'not-owned') return '背包中找不到這件裝備。';
  return '這件裝備不能放入該欄位。';
}
