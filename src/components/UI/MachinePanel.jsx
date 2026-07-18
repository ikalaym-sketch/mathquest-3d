// v0.27.0 加工機投料面板：原料品質由農產品實例一路傳遞到加工成品，世界時間為唯一計時來源。
import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { QUALITY_LABEL } from '../../services/FarmInventoryService.js';

const ACCEPTS = { cheeseMaker: 'mat_milk', mayoMaker: 'mat_egg', loom: 'mat_wool' };
const LABELS = { cheeseMaker: '起司加工機', mayoMaker: '美乃滋加工機', loom: '織布機' };
const MATERIAL_LABELS = { mat_milk: '牛奶', mat_egg: '雞蛋', mat_wool: '羊毛' };
const QUALITY_ORDER = { star: 4, high: 3, good: 2, normal: 1 };

export default function MachinePanel() {
  const objectId = useStore((state) => state.panelData);
  const farmProducts = useStore((state) => state.inventory.farmProducts || []);
  const legacyMaterials = useStore((state) => state.inventory.materials || []);
  const worldClock = useStore((state) => state.worldClock);
  const removeFarmProduct = useStore((state) => state.removeFarmProduct);
  const removeFromInventory = useStore((state) => state.removeFromInventory);
  const companionRuntime = useStore((state) => state.getCompanionRuntime?.());
  const recordCompanionActivity = useStore((state) => state.recordCompanionActivity);
  const crafted = useFarmStore((state) => state.craftedObjects);
  const processInMachine = useFarmStore((state) => state.processInMachine);
  const [message, setMessage] = useState(null);
  const machine = crafted.find((object) => object.id === objectId);
  const acceptedItemId = machine ? ACCEPTS[machine.type] : null;
  const candidates = useMemo(() => farmProducts
    .filter((product) => product.itemId === acceptedItemId && product.quantity > 0)
    .sort((a, b) => (QUALITY_ORDER[b.quality] || 0) - (QUALITY_ORDER[a.quality] || 0)), [acceptedItemId, farmProducts]);
  const selectedProduct = candidates[0] || null;
  const legacyCount = legacyMaterials.filter((itemId) => itemId === acceptedItemId).length;

  if (!machine) return <Panel title="加工機"><p className="text-sm font-bold text-slate-500">這台加工機已不存在。</p></Panel>;
  const busy = Boolean(machine.processingItem && worldClock.totalMinutes < machine.finishWorldMinute);
  const ready = Boolean(machine.processingItem && worldClock.totalMinutes >= machine.finishWorldMinute);
  const remaining = Math.max(0, machine.finishWorldMinute - worldClock.totalMinutes);
  const materialName = MATERIAL_LABELS[acceptedItemId] || acceptedItemId;

  const onInsert = () => {
    if (machine.processingItem) {
      setMessage(ready ? '成品已完成，請回到農場收取。' : '加工機正在運作。');
      return;
    }
    if (!selectedProduct && legacyCount <= 0) {
      setMessage(`沒有可用的${materialName}。請先照顧動物並收集產出。`);
      return;
    }
    const quality = selectedProduct?.quality || 'normal';
    const reduction = companionRuntime?.modifiers?.processingMinutesReduction || 0;
    const result = processInMachine(machine.id, acceptedItemId, worldClock.totalMinutes, quality, reduction);
    if (!result.ok) {
      setMessage('目前無法開始加工。');
      return;
    }
    if (selectedProduct) removeFarmProduct(selectedProduct.instanceId, 1);
    else removeFromInventory('materials', acceptedItemId);
    recordCompanionActivity('process', { machineType: machine.type, quality });
    setMessage(`加工已開始，${QUALITY_LABEL[quality] || '一般'}品質會保留到成品${result.duration < 180 ? '，夥伴縮短了加工時間' : ''}。`);
  };

  return (
    <Panel title={LABELS[machine.type] || '加工機'}>
      {busy ? (
        <p className="py-6 text-center text-sm font-black text-amber-700">加工中，約剩 {Math.ceil(remaining / 60)} 個遊戲小時。</p>
      ) : ready ? (
        <p className="py-6 text-center text-sm font-black text-emerald-700">成品已完成，請在農場機器旁收取。</p>
      ) : (
        <>
          <p className="mb-2 text-sm font-bold text-slate-600">投入 {materialName}，加工約需 3 個遊戲小時。</p>
          <p className="mb-1 text-xs font-bold text-slate-500">品質農產品：{candidates.reduce((sum, product) => sum + product.quantity, 0)} 件</p>
          <p className="mb-4 text-xs font-bold text-slate-500">舊存檔一般原料：{legacyCount} 件</p>
          {selectedProduct && <p className="mb-3 rounded-xl bg-[#fff0b8] p-2 text-xs font-black text-[#79591f]">將優先投入：{QUALITY_LABEL[selectedProduct.quality]}品質</p>}
          <button onClick={onInsert} className="h-12 w-full rounded-2xl border-b-4 border-[#8d672c] bg-[#d6a64d] font-black text-white active:translate-y-1 active:border-b-0">投入 {materialName}</button>
        </>
      )}
      {message && <p className="mt-3 rounded-xl bg-white/80 p-2 text-center text-sm font-bold text-slate-600">{message}</p>}
    </Panel>
  );
}
