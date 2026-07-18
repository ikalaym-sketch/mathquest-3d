// 玩家住宅庭院佈置；內容可獨立嵌入住宅多分頁面板。
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';

export const HOME_DECOR_ITEMS = [
  { id: 'flowerBox', icon: '🌷', name: '窗邊花箱', price: 80, desc: '在農舍前增加明亮花箱。' },
  { id: 'picnicTable', icon: '🧺', name: '野餐桌', price: 140, desc: '家人與小精靈的庭院休息區。' },
  { id: 'trophyStand', icon: '🏆', name: '戰利品展示台', price: 220, desc: '展示 Boss 與試煉塔的重要收藏。' },
  { id: 'lanternArch', icon: '🏮', name: '星光燈門', price: 180, desc: '夜間會點亮住宅入口。' },
];

export function HomeDecorContent() {
  const gold = useStore((state) => state.playerState.gold);
  const addGold = useStore((state) => state.addGold);
  const owned = useFarmStore((state) => state.homeDecorOwned || []);
  const placed = useFarmStore((state) => state.homeDecorPlaced || []);
  const addHomeDecor = useFarmStore((state) => state.addHomeDecor);
  const toggleHomeDecor = useFarmStore((state) => state.toggleHomeDecor);

  const onAction = (item) => {
    if (!owned.includes(item.id)) {
      if (gold < item.price) return;
      addGold(-item.price);
      addHomeDecor(item.id);
      toggleHomeDecor(item.id);
      return;
    }
    toggleHomeDecor(item.id);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {HOME_DECOR_ITEMS.map((item) => {
        const isOwned = owned.includes(item.id);
        const isPlaced = placed.includes(item.id);
        return (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-4xl">{item.icon}</div>
            <div className="mt-2 font-black text-white">{item.name}</div>
            <div className="mt-1 text-xs leading-5 text-white/45">{item.desc}</div>
            <button onClick={() => onAction(item)} className={`mt-3 w-full rounded-xl px-3 py-2 text-xs font-black text-white ${isPlaced ? 'bg-emerald-600' : isOwned ? 'bg-sky-600' : 'bg-amber-600'}`}>
              {isPlaced ? '✓ 已放置' : isOwned ? '放到庭院' : `${item.price}G 購買`}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function HomeDecorPanel() {
  return <Panel title="我的農舍"><HomeDecorContent /></Panel>;
}
