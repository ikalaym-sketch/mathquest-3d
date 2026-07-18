// v0.27.0 村莊商店：完整繁中化；高品質農產品保留給出貨箱，不在一般商店壓平出售。
import { useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { DB } from '../../data/index.js';
import { aggregate, rarityColor, sellPrice, buyPrice } from '../../utils/inventory.js';
import { getVillageShopStock } from '../../services/VillageEconomyService.js';

function categoryOf(item) {
  if (item.type === 'melee' || item.type === 'ranged') return 'weapons';
  if (item.type === 'armor') return 'armors';
  if (item.equipSlot) return 'equipment';
  if (item.type === 'consumable') return 'items';
  if (SEEDS.some((seed) => seed.id === item.id)) return 'seeds';
  return 'materials';
}

export default function ShopPanel() {
  const buyItem = useStore((state) => state.buyItem);
  const sellItem = useStore((state) => state.sellItem);
  const inventory = useStore((state) => state.inventory);
  const unlockedBlueprints = useStore((state) => state.unlockedBlueprints);
  const villageEconomy = useStore((state) => state.villageEconomy);
  const dayIndex = useStore((state) => state.worldClock?.dayIndex || 1);
  const [tab, setTab] = useState('buy');
  const [message, setMessage] = useState(null);
  const stock = getVillageShopStock({ economy: villageEconomy, dayIndex, unlockedBlueprints });
  const orangeStock = stock.filter((item) => item.rarity === 'Orange');
  const sellable = [...aggregate(inventory.materials), ...aggregate(inventory.seeds)];

  const onBuy = (item) => {
    const price = buyPrice(item);
    const ok = buyItem(categoryOf(item), item.id, price);
    setMessage(ok ? `已購買 ${item.nameZh || item.crop || item.name}，支付 ${price}G。` : '金幣不足。');
  };
  const onSell = (entry) => {
    const item = entry.item;
    const price = sellPrice(item);
    const ok = sellItem(categoryOf(item), item.id, price);
    setMessage(ok ? `已出售 ${item.nameZh || item.crop || item.name}，獲得 ${price}G。` : '目前無法出售。');
  };

  return <Panel title={`村莊商店｜市場 Lv ${villageEconomy?.marketTier || 1}`} wide>
    <div className="mb-4 flex gap-2"><button onClick={() => setTab('buy')} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === 'buy' ? 'bg-[#ffd36f] text-[#573b16]' : 'bg-white/70 text-slate-600'}`}>購買</button><button onClick={() => setTab('sell')} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === 'sell' ? 'bg-[#ffd36f] text-[#573b16]' : 'bg-white/70 text-slate-600'}`}>販售</button>{tab === 'buy' && <span className="self-center text-[11px] font-black text-sky-700">本週供應會依農場出貨與星期輪替</span>}{orangeStock.length > 0 && tab === 'buy' && <span className="ml-auto self-center text-[11px] font-black text-amber-700">傳說裝備已解鎖</span>}</div>
    {message && <p className="mb-3 rounded-xl bg-[#fff3bf] p-2 text-center text-sm font-black text-[#76541e]">{message}</p>}
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{tab === 'buy' ? stock.map((item, index) => <div key={`${item.id}_${index}`} className="flex items-center justify-between rounded-2xl border-2 border-white bg-white/75 p-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: rarityColor(item.rarity) }} /><span className="truncate text-sm font-black text-[#4f463f]">{item.nameZh || item.crop || item.name}</span></div><p className="truncate text-[11px] font-bold text-slate-500">{item.description || '冒險與生活用品'}</p></div><button onClick={() => onBuy(item)} className="ml-2 rounded-xl bg-[#d99a48] px-3 py-2 text-xs font-black text-white">{buyPrice(item)}G</button></div>) : sellable.length ? sellable.map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-2xl border-2 border-white bg-white/75 p-3"><div><span className="text-sm font-black text-[#4f463f]">{entry.item?.nameZh || entry.item?.crop || entry.item?.name}</span><span className="ml-2 text-xs font-bold text-slate-500">×{entry.count}</span></div><button onClick={() => onSell(entry)} className="rounded-xl bg-[#69ae72] px-3 py-2 text-xs font-black text-white">+{sellPrice(entry.item)}G</button></div>) : <p className="col-span-2 py-8 text-center text-sm font-bold text-slate-500">目前沒有可販售的材料或種子。農產品請使用農場出貨箱。</p>}</div>
  </Panel>;
}
