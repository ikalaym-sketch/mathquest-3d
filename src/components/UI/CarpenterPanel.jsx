// v0.27.0 木匠工坊：農莊升級採金幣＋材料＋一個遊戲日施工，不再即時完成。
import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { DB } from '../../data/index.js';
import { getFarmLevelConfig, getNextFarmUpgrade } from '../../data/farmProgression.js';

export default function CarpenterPanel() {
  const farmLevel = useFarmStore((state) => state.farmLevel);
  const pendingUpgrade = useFarmStore((state) => state.pendingUpgrade);
  const startFarmUpgrade = useFarmStore((state) => state.startFarmUpgrade);
  const gold = useStore((state) => state.playerState.gold);
  const materials = useStore((state) => state.inventory.materials || []);
  const addGold = useStore((state) => state.addGold);
  const removeFromInventory = useStore((state) => state.removeFromInventory);
  const openMathChallenge = useStore((state) => state.openMathChallenge);
  const worldClock = useStore((state) => state.worldClock);
  const [message, setMessage] = useState(null);
  const current = getFarmLevelConfig(farmLevel);
  const upgrade = getNextFarmUpgrade(farmLevel);

  const materialStatus = useMemo(() => Object.entries(upgrade?.materials || {}).map(([itemId, required]) => ({
    itemId,
    required,
    owned: materials.filter((value) => value === itemId).length,
    label: DB[itemId]?.nameZh || DB[itemId]?.name || itemId,
  })), [materials, upgrade]);

  const remainingMinutes = pendingUpgrade
    ? Math.max(0, pendingUpgrade.finishWorldMinute - (worldClock?.totalMinutes || 0))
    : 0;

  const onExpand = () => {
    if (!upgrade || pendingUpgrade) return;
    if (gold < upgrade.cost) {
      setMessage(`金幣不足，需要 ${upgrade.cost}G。`);
      return;
    }
    const missing = materialStatus.find((entry) => entry.owned < entry.required);
    if (missing) {
      setMessage(`${missing.label}不足，需要 ${missing.required}，目前只有 ${missing.owned}。`);
      return;
    }
    openMathChallenge({
      skillContext: farmLevel >= 3 ? 'farm_yield' : 'farm_area',
      onResolve: (correct) => {
        if (!correct) {
          setMessage('施工規劃尚未完成，金幣與材料都沒有扣除。');
          return;
        }
        const latest = useFarmStore.getState();
        const latestPlayer = useStore.getState();
        if (latest.pendingUpgrade || latest.farmLevel !== farmLevel) {
          setMessage('農莊狀態已變更，請重新開啟木匠工坊。');
          return;
        }
        const missingNow = materialStatus.find((entry) => (latestPlayer.inventory.materials || []).filter((value) => value === entry.itemId).length < entry.required);
        if (latestPlayer.playerState.gold < upgrade.cost || missingNow) {
          setMessage('資源已變更，施工沒有開始。');
          return;
        }
        const started = startFarmUpgrade({
          requestedLevel: upgrade.nextLevel,
          worldMinute: latestPlayer.worldClock.totalMinutes,
          durationMinutes: upgrade.durationMinutes,
        });
        if (!started.ok) {
          setMessage('施工狀態不一致，未扣除任何資源。');
          return;
        }
        addGold(-upgrade.cost);
        materialStatus.forEach((entry) => {
          for (let index = 0; index < entry.required; index += 1) removeFromInventory('materials', entry.itemId);
        });
        setMessage(`施工開始：預計一個遊戲日後完成 Lv${upgrade.nextLevel}。`);
      },
    });
  };

  return (
    <Panel title="木匠工坊">
      <div className="rounded-2xl border-2 border-white bg-[#fff8e5] p-4 text-center text-[#604b38] shadow">
        <div className="text-xs font-black text-[#8b735d]">目前農莊</div>
        <div className="my-2 text-3xl font-black text-[#c17828]">Lv{farmLevel}</div>
        <div className="font-black">{current.label} · {current.plotCount} 格田地</div>
        <p className="mt-2 text-xs leading-5 text-[#76614e]">{current.description}</p>

        {pendingUpgrade ? (
          <div className="mt-4 rounded-xl bg-[#dff4e5] p-3 text-sm font-black text-[#35674a]">
            木匠施工中：Lv{pendingUpgrade.targetLevel}<br />
            剩餘約 {Math.ceil(remainingMinutes / 60)} 個遊戲小時
          </div>
        ) : upgrade ? (
          <>
            <div className="mt-4 rounded-xl bg-white/80 p-3 text-left text-xs font-bold">
              <div className="mb-2 text-sm font-black">施工需求</div>
              <div>金幣：{gold}/{upgrade.cost}G</div>
              {materialStatus.map((entry) => (
                <div key={entry.itemId} className={entry.owned >= entry.required ? 'text-[#397651]' : 'text-[#b34a3d]'}>
                  {entry.label}：{entry.owned}/{entry.required}
                </div>
              ))}
              <div className="mt-1 text-[#806b59]">施工時間：1 個遊戲日</div>
            </div>
            <button onClick={onExpand} className="mt-4 w-full rounded-xl border-b-4 border-[#7c4a2d] bg-[#b87a45] px-5 py-3 text-sm font-black text-white active:translate-y-1 active:border-b-0">
              {upgrade.label} · 開始施工
            </button>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-black text-emerald-700">✓ 農莊已完整升級</p>
        )}
        {message && <p className="mt-3 text-sm font-bold text-[#a4621f]">{message}</p>}
      </div>
    </Panel>
  );
}
