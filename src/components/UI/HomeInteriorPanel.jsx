// 可進入農舍的生活面板：休息、收納、更衣與庭院佈置共用同一頁。
import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { DB } from '../../data/index.js';
import { HomeDecorContent } from './HomeDecorPanel.jsx';

const TABS = [
  { id: 'life', icon: '🛏️', label: '生活' },
  { id: 'storage', icon: '📦', label: '收納' },
  { id: 'decor', icon: '🏡', label: '庭院' },
];

export default function HomeInteriorPanel() {
  const storedTab = useFarmStore((state) => state.homeInteriorTab || 'life');
  const setStoredTab = useFarmStore((state) => state.setHomeInteriorTab);
  const [tab, setTab] = useState(storedTab);
  const chooseTab = (next) => { setTab(next); setStoredTab(next); };

  return (
    <Panel title="我的農舍">
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-2">
        {TABS.map((item) => <button key={item.id} onClick={() => chooseTab(item.id)} className={`min-h-12 rounded-xl px-2 py-2 text-sm font-black ${tab === item.id ? 'bg-amber-500 text-[#4d321c]' : 'bg-white/5 text-white/60'}`}>{item.icon} {item.label}</button>)}
      </div>
      {tab === 'life' && <LifeTab />}
      {tab === 'storage' && <StorageTab />}
      {tab === 'decor' && <HomeDecorContent />}
    </Panel>
  );
}

function LifeTab() {
  const clock = useStore((state) => state.worldClock);
  const restUntilMorning = useStore((state) => state.restUntilMorning);
  const openCharacterEditor = useStore((state) => state.openCharacterEditor);
  const farmLevel = useFarmStore((state) => state.farmLevel);
  const farmStats = useFarmStore((state) => state.farmStats);
  const [message, setMessage] = useState(null);

  const rest = () => {
    restUntilMorning();
    setMessage('休息完成，時間前進到下一個早上 07:00，生命、魔力與體力已恢復。');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-sky-200/20 bg-sky-950/30 p-4">
        <div className="text-xs font-black tracking-wider text-sky-200">HOME LIFE</div>
        <div className="mt-1 text-xl font-black text-white">農莊 Lv{farmLevel} · 第 {clock?.dayIndex || 1} 天 {clock?.timeText || '08:00'}</div>
        <p className="mt-2 text-xs leading-5 text-white/55">在床上休息會推進遊戲時間，不會依賴裝置的真實時鐘。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={rest} className="min-h-24 rounded-2xl border-b-4 border-[#496d91] bg-[#7cb7e4] p-4 text-left font-black text-[#20384c] active:translate-y-1 active:border-b-0"><span className="block text-3xl">🛏️</span><span className="mt-2 block">休息到早上</span></button>
        <button onClick={openCharacterEditor} className="min-h-24 rounded-2xl border-b-4 border-[#8b5c92] bg-[#d79ddd] p-4 text-left font-black text-[#4d3152] active:translate-y-1 active:border-b-0"><span className="block text-3xl">🪞</span><span className="mt-2 block">更換外觀</span></button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-white/70 sm:grid-cols-4">
        <Stat label="收成" value={farmStats.harvests} />
        <Stat label="星光品質" value={farmStats.starHarvests} />
        <Stat label="動物產品" value={farmStats.animalProducts} />
        <Stat label="出貨收入" value={`${farmStats.shippedGold}G`} />
      </div>
      {message && <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-100">{message}</p>}
    </div>
  );
}

function StorageTab() {
  const inventory = useStore((state) => state.inventory);
  const addToInventory = useStore((state) => state.addToInventory);
  const removeFromInventory = useStore((state) => state.removeFromInventory);
  const storage = useFarmStore((state) => state.homeStorage);
  const deposit = useFarmStore((state) => state.depositHomeStorage);
  const withdraw = useFarmStore((state) => state.withdrawHomeStorage);
  const categories = ['items', 'materials', 'seeds'];

  const inventoryRows = useMemo(() => categories.flatMap((category) => aggregate(inventory[category]).map((row) => ({ ...row, category }))), [inventory]);
  const storageRows = useMemo(() => categories.flatMap((category) => aggregate(storage[category]).map((row) => ({ ...row, category }))), [storage]);

  const moveToStorage = (row) => {
    if (!(inventory[row.category] || []).includes(row.id)) return;
    removeFromInventory(row.category, row.id);
    deposit(row.category, row.id);
  };
  const moveToBag = (row) => {
    if (!withdraw(row.category, row.id)) return;
    addToInventory(row.category, row.id);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StorageList title="背包" icon="🎒" rows={inventoryRows} actionLabel="存入" onAction={moveToStorage} empty="背包裡沒有可收納物品。" />
      <StorageList title="農舍收納箱" icon="📦" rows={storageRows} actionLabel="取出" onAction={moveToBag} empty="收納箱目前是空的。" />
    </div>
  );
}

function StorageList({ title, icon, rows, actionLabel, onAction, empty }) {
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-3"><h3 className="mb-3 font-black text-white">{icon} {title}</h3>{rows.length === 0 ? <p className="py-5 text-center text-xs text-white/40">{empty}</p> : <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">{rows.map((row) => <div key={`${row.category}:${row.id}`} className="flex items-center gap-2 rounded-xl bg-black/10 p-2"><div className="min-w-0 flex-1"><div className="truncate text-xs font-black text-white">{displayName(row.id)}</div><div className="text-[10px] text-white/40">{row.category} · ×{row.count}</div></div><button onClick={() => onAction(row)} className="min-h-10 rounded-lg bg-sky-600 px-3 text-xs font-black text-white">{actionLabel}</button></div>)}</div>}</section>;
}

function aggregate(values = []) {
  const counts = new Map();
  values.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  return [...counts.entries()].map(([id, count]) => ({ id, count }));
}

function displayName(id) {
  return DB[id]?.name || DB[id]?.crop || id;
}

function Stat({ label, value }) {
  return <div className="rounded-xl bg-white/5 px-2 py-3"><div className="text-lg font-black text-amber-200">{value}</div><div className="mt-1 text-[10px] text-white/45">{label}</div></div>;
}
