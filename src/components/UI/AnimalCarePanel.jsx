// v0.27.0 動物照顧面板：餵食、撫摸、梳毛與收集產出各自使用正確農具與體力。
import { useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { FARM_LAYOUT } from '../../data/farmLayout.js';
import { QUALITY_LABEL } from '../../services/FarmInventoryService.js';

const ACTIONS = [
  { id: 'feed', toolAction: 'animalFeed', label: '餵食', icon: '🥣' },
  { id: 'pet', toolAction: 'animalPet', label: '撫摸', icon: '🤲' },
  { id: 'brush', toolAction: 'animalBrush', label: '梳毛', icon: '🪮' },
];

export default function AnimalCarePanel() {
  const animalId = useStore((state) => state.panelData);
  const worldClock = useStore((state) => state.worldClock);
  const consumeStamina = useStore((state) => state.consumeStamina);
  const staminaValue = useStore((state) => state.playerState.stamina);
  const feedCount = useStore((state) => (state.inventory.materials || []).filter((itemId) => itemId === 'mat_animal_feed').length);
  const removeFromInventory = useStore((state) => state.removeFromInventory);
  const showWorldHint = useStore((state) => state.showWorldHint);
  const companionRuntime = useStore((state) => state.getCompanionRuntime?.());
  const recordCompanionActivity = useStore((state) => state.recordCompanionActivity);
  const animal = useFarmStore((state) => state.animals.find((entry) => entry.id === animalId));
  const resolveToolAction = useFarmStore((state) => state.resolveToolAction);
  const recordToolAction = useFarmStore((state) => state.recordToolAction);
  const careAnimal = useFarmStore((state) => state.careAnimal);
  const collectAnimalProduct = useFarmStore((state) => state.collectAnimalProduct);
  const productState = useFarmStore((state) => state.getAnimalProductState(animalId, worldClock?.totalMinutes));
  const [message, setMessage] = useState('');

  if (!animal) return <Panel title="動物照顧"><p className="text-sm font-bold text-slate-500">找不到這隻動物。</p></Panel>;

  const doCare = (action) => {
    const tool = resolveToolAction(action.toolAction);
    if (!tool.ok) { setMessage('請先在農具列選擇正確工具，或使用智慧工具。'); return; }
    if (action.id === 'feed' && feedCount <= 0) {
      setMessage('沒有營養飼料，請先到村莊商店購買。');
      return;
    }
    if (staminaValue < tool.staminaCost) {
      setMessage(`體力不足，需要 ${tool.staminaCost} 點體力。`);
      return;
    }
    const result = careAnimal(animal.id, action.id, { dayIndex: worldClock.dayIndex, worldMinute: worldClock.totalMinutes, companionMoodBonus: companionRuntime?.modifiers?.animalMoodBonus || 0 });
    if (!result.ok) {
      setMessage(result.reason === 'already-petted' ? '今天已經撫摸過了。' : result.reason === 'already-brushed' ? '今天已經梳毛過了。' : '目前無法執行。');
      return;
    }
    const stamina = consumeStamina(tool.staminaCost, `animal:${action.id}`);
    if (!stamina.ok) return;
    if (action.id === 'feed') removeFromInventory('materials', 'mat_animal_feed');
    recordToolAction(action.toolAction, tool);
    recordCompanionActivity('animalCare', { animalId: animal.id, action: action.id });
    setMessage(`${action.label}完成，${animal.name}看起來更開心了。`);
  };

  const collect = () => {
    const placement = FARM_LAYOUT.animals[animal.id];
    const result = collectAnimalProduct(animal.id, placement?.position, worldClock.totalMinutes, companionRuntime?.modifiers?.animalQualityBonus || 0);
    if (!result.ok) { setMessage('產出尚未準備好，或動物需要先餵食與休息。'); return; }
    recordCompanionActivity('animalProduct', { animalId: animal.id, quality: result.product.quality });
    showWorldHint(`${animal.name}產出了${QUALITY_LABEL[result.product.quality] || result.product.quality}品質農產品，請到旁邊拾取。`);
    setMessage('產出已放在動物旁邊。');
  };

  return (
    <Panel title={`${animal.name}的照顧時間`}>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fff7df] p-3 text-sm font-black text-[#5d4c3c]">
        <span>心情：{animal.mood}</span><span>好感：{Math.round(animal.affection)}</span>
        <span>飽足：{Math.round(animal.hunger)}</span><span>清潔：{Math.round(animal.cleanliness)}</span>
        <span>飼料：{feedCount} 袋</span><span>健康：{Math.round(animal.health)}</span>
        <span>產出：{productState?.ready ? '可收集' : `等待 ${Math.ceil((productState?.remaining || 0) / 60)} 小時`}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ACTIONS.map((action) => <button key={action.id} onClick={() => doCare(action)} className="min-h-16 rounded-2xl border-2 border-white bg-[#dff2ff] text-sm font-black text-[#315f7b] shadow active:translate-y-1"><span className="block text-2xl">{action.icon}</span>{action.label}</button>)}
      </div>
      <button onClick={collect} className="mt-3 h-12 w-full rounded-2xl border-b-4 border-[#b8782e] bg-[#f0b458] font-black text-white active:translate-y-1 active:border-b-0">收集農產品</button>
      {message && <p className="mt-3 rounded-xl bg-white/80 p-2 text-center text-sm font-bold text-[#6c5846]">{message}</p>}
    </Panel>
  );
}
