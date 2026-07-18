// 遊戲主選單：依場景顯示必要入口，使用正式 SVG 圖示與大型觸控區。
import { useState } from 'react';
import { useStore } from '../../store/useStore.js';
import GameIcon from './GameIcon.jsx';

export default function GameMenu() {
  const [open, setOpen] = useState(false);
  const openPanel = useStore((state) => state.openPanel);
  const paused = useStore((state) => state.isPaused);
  const scene = useStore((state) => state.currentScene);
  const openWorldMap = useStore((state) => state.openWorldMap);
  if (paused || scene === 'trialTower') return null;

  const items = [
    ['map', '地圖', openWorldMap], ['bag', '背包', () => openPanel('inventory')], ['shield', '裝備', () => openPanel('equipment')],
    ['companion', '守護夥伴', () => openPanel('companion')], ['people', '村民手冊', () => openPanel('villageRelations')],
    ['book', '冒險手冊', () => openPanel('journal')], ['settings', '畫面品質', () => openPanel('renderSettings')], ['accessibility', '介面輔助', () => openPanel('accessibility')],
  ];
  if (scene === 'farm') items.splice(3, 0, ['settings', '建造', () => openPanel('build')], ['bag', '小屋', () => openPanel('homeInterior')]);
  const run = (action) => { setOpen(false); action(); };

  return (
    <div className="mq-game-menu fixed z-30 flex flex-col items-end gap-2">
      {open && <div className="grid grid-cols-2 gap-2 rounded-[28px] border-[3px] border-white/90 bg-gradient-to-b from-[#fff7d7]/96 to-[#dff4ff]/96 p-3 shadow-2xl sm:grid-cols-3">{items.map(([icon, label, action]) => <button key={label} onClick={() => run(action)} className="flex min-h-20 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-white bg-white/82 px-2 text-slate-700 shadow-md active:translate-y-1"><GameIcon name={icon} size={28} /><span className="text-xs font-black">{label}</span></button>)}</div>}
      <button aria-label={open ? '關閉主選單' : '開啟主選單'} onClick={() => setOpen((value) => !value)} className="grid h-14 w-14 place-items-center rounded-full border-4 border-white/90 bg-gradient-to-b from-[#78d2ff] to-[#3b9fe0] text-white shadow-2xl"><GameIcon name={open ? 'close' : 'menu'} size={28} /></button>
    </div>
  );
}
