// v0.29 背包面板：武器與防具顯示唯一 equipment instance，其餘物品維持數量聚合。
import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { aggregate, rarityColor, sellPrice } from '../../utils/inventory.js';
import { aggregateFarmProducts, QUALITY_LABEL } from '../../services/FarmInventoryService.js';
import { createEquipmentView, getDisplayName, getItemSlot } from '../../utils/equipmentPresentation.js';
import { DB } from '../../data/index.js';

const TABS = [
  { key: 'weapons', label: '武器' }, { key: 'armors', label: '防具' }, { key: 'items', label: '道具' },
  { key: 'farmProducts', label: '農產品' }, { key: 'materials', label: '材料' }, { key: 'seeds', label: '種子' },
];

export default function InventoryPanel() {
  const inventory = useStore((state) => state.inventory);
  const equipmentInstances = useStore((state) => state.equipmentInstances);
  const equip = useStore((state) => state.equip);
  const useInventoryItem = useStore((state) => state.useInventoryItem);
  const assignQuickSlot = useStore((state) => state.assignQuickSlot);
  const [tab, setTab] = useState('weapons');
  const [message, setMessage] = useState(null);
  const farmProducts = aggregateFarmProducts(inventory.farmProducts || []);
  const equipmentViews = useMemo(() => (inventory.equipment || [])
    .map((instanceId) => createEquipmentView(instanceId, equipmentInstances))
    .filter((view) => view && (tab === 'weapons' ? ['melee', 'ranged'].includes(view.item.type) : view.item.type === 'armor')), [equipmentInstances, inventory.equipment, tab]);
  const list = tab === 'farmProducts' || tab === 'weapons' || tab === 'armors' ? [] : aggregate(inventory[tab] || []);

  const onEquip = (view) => {
    const result = equip(getItemSlot(view.item), view.instanceId);
    setMessage(result?.ok ? `已裝備 ${getDisplayName(view.item, view.instance)}` : '目前無法裝備這件物品。');
  };
  const onUse = (entry) => {
    const result = useInventoryItem(entry.item.id);
    setMessage(result.ok ? `已使用 ${entry.item.nameZh || entry.item.name}` : '目前無法使用。');
  };
  const addToQuickSlot = (entry) => {
    const slots = useStore.getState().quickSlots || [];
    const emptyIndex = slots.findIndex((id) => !id);
    const target = emptyIndex >= 0 ? emptyIndex : 0;
    assignQuickSlot(target, entry.item.id);
    setMessage(`已放入快捷格 ${target + 1}`);
  };

  const tabCount = (key) => {
    if (key === 'farmProducts') return (inventory.farmProducts || []).reduce((sum, product) => sum + product.quantity, 0);
    if (key === 'weapons' || key === 'armors') return (inventory.equipment || []).filter((instanceId) => {
      const view = createEquipmentView(instanceId, equipmentInstances);
      return key === 'weapons' ? ['melee', 'ranged'].includes(view?.item?.type) : view?.item?.type === 'armor';
    }).length;
    return (inventory[key] || []).length;
  };

  return <Panel title="背包" wide>
    <div className="mb-4 flex flex-wrap gap-1">{TABS.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${tab === item.key ? 'border-[#dfa64d] bg-[#ffd477] text-[#563915]' : 'border-white bg-white/70 text-[#5c5148]'}`}>{item.label} ({tabCount(item.key)})</button>)}</div>
    {message && <p className="mb-3 rounded-xl bg-[#fff4c8] p-2 text-center text-sm font-black text-[#76501e]">{message}</p>}
    {tab === 'farmProducts' ? <FarmProductList products={farmProducts} /> : (tab === 'weapons' || tab === 'armors') ? <EquipmentList views={equipmentViews} onEquip={onEquip} /> : list.length === 0 ? <p className="py-8 text-center text-sm font-bold text-slate-500">這個分類目前沒有物品。</p> : <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{list.map((entry) => {
      const item = entry.item;
      if (!item) return null;
      return <div key={entry.id} className="flex items-center justify-between rounded-2xl border-2 border-white bg-white/70 p-3 shadow-sm"><div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: rarityColor(item.rarity) }} /><span className="truncate text-sm font-black text-[#50463f]">{item.nameZh || item.crop || item.name}</span><span className="text-xs font-bold text-slate-500">×{entry.count}</span></div><p className="truncate text-[11px] font-bold text-slate-500">{item.description || `價值 ${sellPrice(item)}G`}</p></div>{tab === 'items' && <div className="ml-2 flex gap-1"><button type="button" onClick={() => addToQuickSlot(entry)} className="rounded-xl bg-[#fff0b2] px-2 py-2 text-[10px] font-black text-[#76531d]">快捷列</button><button type="button" onClick={() => onUse(entry)} className="rounded-xl bg-[#68b77b] px-3 py-2 text-xs font-black text-white">使用</button></div>}</div>;
    })}</div>}
  </Panel>;
}

function EquipmentList({ views, onEquip }) {
  if (!views.length) return <p className="py-8 text-center text-sm font-bold text-slate-500">這個分類目前沒有裝備。</p>;
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{views.map((view) => <div key={view.instanceId} className="flex items-center justify-between rounded-2xl border-2 border-white bg-white/70 p-3 shadow-sm"><div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: rarityColor(view.item.rarity) }} /><span className="truncate text-sm font-black text-[#50463f]">{getDisplayName(view.item, view.instance)}</span><span className="text-[10px] font-black text-amber-700">Lv {view.instance.level}</span></div><p className="truncate text-[11px] font-bold text-slate-500">{view.item.description}</p></div><button type="button" onClick={() => onEquip(view)} className="ml-2 rounded-xl bg-[#e2a653] px-3 py-2 text-xs font-black text-white">裝備</button></div>)}</div>;
}

function FarmProductList({ products }) {
  if (!products.length) return <p className="py-8 text-center text-sm font-bold text-slate-500">目前沒有農產品，收成與照顧動物後會出現在這裡。</p>;
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{products.map((product) => { const item = DB[product.itemId]; return <div key={`${product.itemId}-${product.quality}-${product.unitValue}`} className="rounded-2xl border-2 border-white bg-white/75 p-3 shadow-sm"><div className="flex items-center justify-between"><span className="font-black text-[#4e453e]">{item?.crop || item?.name || product.itemId}</span><span className="rounded-full bg-[#ffe08a] px-2 py-1 text-[10px] font-black text-[#73531b]">{QUALITY_LABEL[product.quality]}</span></div><div className="mt-2 flex justify-between text-xs font-bold text-slate-500"><span>數量 ×{product.quantity}</span><span>{product.unitValue}G／件</span></div></div>; })}</div>;
}
