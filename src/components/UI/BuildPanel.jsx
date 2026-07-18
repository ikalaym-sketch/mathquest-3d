// v0.27.0 農場建造面板：設備建造保留於此，農莊擴建統一交由木匠工坊處理。
import { useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { getFarmLevelConfig, getNextFarmUpgrade } from '../../data/farmProgression.js';

const BUILDABLES = [
  { type: 'sprinkler', name: '灑水器', cost: 100, minLevel: 2, desc: '自動澆灌相鄰四格田地。' },
  { type: 'cheeseMaker', name: '起司機', cost: 180, minLevel: 3, desc: '將牛奶加工為高價起司。' },
  { type: 'mayoMaker', name: '美乃滋機', cost: 180, minLevel: 3, desc: '將雞蛋加工為美乃滋。' },
  { type: 'loom', name: '織布機', cost: 180, minLevel: 3, desc: '將羊毛加工為布料。' },
];

const UNLOCK_LABELS = {
  basicFields: '基礎田地', farmhouse: '農舍', barn: '穀倉', animals: '動物照顧',
  fullOrchard: '完整果園', waterTower: '水塔', yardExpansion: '庭院擴建',
  fullFields: '完整田地', processingWorkshop: '加工工坊', qualityCrops: '品質作物',
  irrigation: '灌溉水路', rainCollector: '雨水收集', animalShelter: '動物棚舍', weatherBoard: '天氣看板',
  automation: '自動化', climateProtection: '氣候保護', starGreenhouse: '星光溫室', premiumProduce: '高級農產品',
};

export default function BuildPanel() {
  const gold = useStore((state) => state.playerState.gold);
  const addGold = useStore((state) => state.addGold);
  const openPanel = useStore((state) => state.openPanel);
  const buildObject = useFarmStore((state) => state.buildObject);
  const crafted = useFarmStore((state) => state.craftedObjects);
  const farmLevel = useFarmStore((state) => state.farmLevel);
  const pendingUpgrade = useFarmStore((state) => state.pendingUpgrade);
  const [message, setMessage] = useState(null);
  const current = getFarmLevelConfig(farmLevel);
  const upgrade = getNextFarmUpgrade(farmLevel);

  const onBuild = (buildable) => {
    if (farmLevel < buildable.minLevel) {
      setMessage(`農莊 Lv${buildable.minLevel} 才能建造${buildable.name}。`);
      return;
    }
    if (gold < buildable.cost) {
      setMessage('金幣不足。');
      return;
    }
    const count = crafted.length;
    const x = -24 + (count % 4) * 1.7;
    const z = -13 + Math.floor(count / 4) * 1.7;
    if (!buildObject(buildable.type, x, z)) {
      setMessage('建造資料不正確，未扣除金幣。');
      return;
    }
    addGold(-buildable.cost);
    setMessage(`${buildable.name}已完成，請前往加工工坊查看。`);
  };

  return (
    <Panel title="農場建造">
      <div className="mb-4 rounded-2xl border-2 border-white bg-[#e8f8e9] p-4 text-[#3f5f49] shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black tracking-wider text-[#5c8f68]">農莊等級</div>
            <div className="mt-1 text-xl font-black">Lv{farmLevel} · {current.label}</div>
          </div>
          <div className="rounded-xl bg-[#ffe8a8] px-3 py-2 text-sm font-black text-[#7c571b]">{gold}G</div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#607567]">{current.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {current.unlocks.map((unlock) => <span key={unlock} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#52715c]">{UNLOCK_LABELS[unlock] || unlock}</span>)}
        </div>
        {pendingUpgrade ? (
          <p className="mt-4 rounded-xl bg-[#fff3c8] px-3 py-2 text-center text-sm font-black text-[#8b641e]">木匠正在施工 Lv{pendingUpgrade.targetLevel}</p>
        ) : upgrade ? (
          <button onClick={() => openPanel('carpenter')} className="mt-4 w-full rounded-xl border-b-4 border-[#3f7351] bg-[#62a875] px-4 py-3 text-sm font-black text-white active:translate-y-1 active:border-b-0">
            前往木匠工坊規劃「{upgrade.label}」
          </button>
        ) : (
          <p className="mt-4 rounded-xl bg-emerald-400/15 px-3 py-2 text-center text-sm font-black text-emerald-700">✓ 已完成 Lv5 星光示範農莊</p>
        )}
      </div>

      {message && <p className="mb-3 rounded-xl bg-[#fff3bf] px-3 py-2 text-center text-sm font-bold text-[#8a621e]">{message}</p>}

      <div className="space-y-2">
        {BUILDABLES.map((buildable) => {
          const locked = farmLevel < buildable.minLevel;
          return (
            <div key={buildable.type} className="flex items-center justify-between rounded-xl border-2 border-white bg-white/80 p-3 shadow-sm">
              <div className="min-w-0">
                <div className="text-sm font-black text-[#4c594f]">{buildable.name}</div>
                <p className="text-[11px] leading-5 text-[#708077]">{buildable.desc}</p>
              </div>
              <button disabled={locked} onClick={() => onBuild(buildable)} className={`ml-2 shrink-0 rounded-lg border px-3 py-2 text-xs font-black ${locked ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-[#d09b4b] bg-[#e6ad58] text-white'}`}>
                {locked ? `Lv${buildable.minLevel}` : `${buildable.cost}G`}
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
