// v0.27.0 水晶湖釣魚面板：萬用魚餌 Buff 在此被正式消耗。
import { useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';

export default function FishingPanel() {
  const openMath = useStore((state) => state.openMathChallenge);
  const performFishing = useStore((state) => state.performFishing);
  const openPanel = useStore((state) => state.openPanel);
  const fishingBuff = useStore((state) => state.fishingBuff);
  const [message, setMessage] = useState('');
  const fish = () => openMath({
    skillContext: 'farm_market',
    onResolve: (correct) => {
      if (!correct) { setMessage('魚兒溜走了，再觀察水面後試一次。'); return; }
      const result = performFishing();
      setMessage(`釣到「${result.item?.name || result.itemId}」！`);
    },
  });
  return <Panel title="水晶湖碼頭">
    <div className="rounded-2xl bg-[#dff7ff] p-4 text-sm font-bold text-[#376579]">觀察水波並完成數學挑戰即可釣魚。{fishingBuff ? '萬用魚餌已準備：本次至少獲得稀有魚。' : '使用萬用魚餌可保證下一次稀有魚。'}</div>
    <button onClick={fish} className="mt-3 h-12 w-full rounded-2xl border-b-4 border-[#277da3] bg-[#54b7d8] font-black text-white active:translate-y-1 active:border-b-0">🎣 開始釣魚</button>
    <button onClick={() => openPanel('regionWorkshop', { regionId: 'crystal_lake', targetId: 'shimmering_dock:fishing' })} className="mt-2 h-11 w-full rounded-2xl bg-[#f3d67a] font-black text-[#664d19]">💎 開啟湖光素材工坊</button>
    {message && <p className="mt-3 rounded-xl bg-white/80 p-2 text-center text-sm font-black text-[#426273]">{message}</p>}
  </Panel>;
}
