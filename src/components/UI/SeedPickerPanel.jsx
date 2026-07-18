// v0.27.0 選種面板：四季適種、農具與體力都在播種提交前驗證。
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { aggregate, rarityColor } from '../../utils/inventory.js';
import { getSeedGrowthMinutes } from '../../systems/farmSimulation.js';
import { getSeasonSnapshot, canPlantSeedInSeason } from '../../services/SeasonCropService.js';

export default function SeedPickerPanel() {
  const cellId = useStore((state) => state.panelData);
  const seedsInv = useStore((state) => state.inventory.seeds);
  const worldClock = useStore((state) => state.worldClock);
  const removeFromInventory = useStore((state) => state.removeFromInventory);
  const consumeStamina = useStore((state) => state.consumeStamina);
  const showWorldHint = useStore((state) => state.showWorldHint);
  const closePanel = useStore((state) => state.closePanel);
  const companionRuntime = useStore((state) => state.getCompanionRuntime?.());
  const plantSeed = useFarmStore((state) => state.plantSeed);
  const resolveToolAction = useFarmStore((state) => state.resolveToolAction);
  const recordToolAction = useFarmStore((state) => state.recordToolAction);
  const farmLevel = useFarmStore((state) => state.farmLevel);
  const season = getSeasonSnapshot(worldClock.dayIndex);
  const list = aggregate(seedsInv);

  const onPick = (seedId) => {
    const tool = resolveToolAction('plant');
    if (!tool.ok) { showWorldHint('請先選擇種子袋，或切換為智慧工具。'); return; }
    const stamina = consumeStamina(tool.staminaCost, 'farm:plant');
    if (!stamina.ok) return;
    const result = plantSeed(cellId, seedId, worldClock.totalMinutes, worldClock.dayIndex);
    if (!result.ok) {
      useStore.getState().restoreStamina(tool.staminaCost);
      showWorldHint(result.reason === 'wrong-season' ? `${season.label}不適合種植這種作物。` : '這格田地目前無法播種。');
      return;
    }
    recordToolAction('plant', tool);
    const refundChance = companionRuntime?.modifiers?.seedRefundChance || 0;
    if (Math.random() >= refundChance) removeFromInventory('seeds', seedId);
    else showWorldHint(`${companionRuntime.profile.name}替你保存了一顆種子。`);
    closePanel();
  };

  return (
    <Panel title={`選擇作物｜${season.icon}${season.label}第 ${season.dayOfSeason} 天`}>
      {list.length === 0 ? <p className="py-8 text-center text-sm font-bold text-slate-500">目前沒有種子，請先到商店購買。</p> : (
        <div className="grid grid-cols-2 gap-2">
          {list.map((entry) => {
            const item = entry.item;
            if (!item) return null;
            const growthMinutes = getSeedGrowthMinutes(item);
            const allowed = canPlantSeedInSeason(item, season.id, farmLevel);
            return (
              <button key={entry.id} disabled={!allowed} onClick={() => onPick(item.id)} className={`rounded-xl border-2 p-3 text-left transition active:translate-y-0.5 ${allowed ? 'border-white bg-white/80 hover:bg-white' : 'border-slate-200 bg-slate-100 opacity-55'}`}>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: rarityColor(item.rarity) }} /><span className="truncate text-sm font-black text-slate-700">{item.crop}</span><span className="ml-auto text-xs font-bold text-slate-500">×{entry.count}</span></div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">約 {Math.ceil(growthMinutes / 60)} 個遊戲小時成熟。{allowed ? '目前可以種植。' : `不適合${season.label}。`}</p>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
