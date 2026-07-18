// v0.27.0 加工系統：所有完成判定使用世界分鐘，產出保留品質與來源 metadata。
import { Html } from '@react-three/drei';
import { useFarmStore } from '../../store/farmStore.js';
import { useStore } from '../../store/useStore.js';
import Outlined from '../3D/Outlined.jsx';

const MACHINE_COLOR = { cheeseMaker: '#e8c83a', mayoMaker: '#e8e0c0', loom: '#8a6a3b', sprinkler: '#3a8ae8' };

export default function CraftingSystem() {
  const crafted = useFarmStore((state) => state.craftedObjects);
  const collect = useFarmStore((state) => state.collectFromMachine);
  const runSprinkler = useFarmStore((state) => state.runSprinkler);
  const addFarmProduct = useStore((state) => state.addFarmProduct);
  const openPanel = useStore((state) => state.openPanel);
  const worldClock = useStore((state) => state.worldClock);
  const equipmentRuntime = useStore((state) => state.getEquipmentRuntime?.()) || { waterRetentionMinutes: 0 };

  const onCollect = (object) => {
    const product = collect(object.id, worldClock.totalMinutes);
    if (product) addFarmProduct(product);
  };

  return <>{crafted.map((object) => {
    const ready = Boolean(object.processingItem && worldClock.totalMinutes >= object.finishWorldMinute);
    return <group key={object.id} position={[object.x, 0, object.z]}>
      <group onClick={(event) => {
        event.stopPropagation();
        if (object.type === 'sprinkler') runSprinkler(object.id, worldClock.totalMinutes, equipmentRuntime.waterRetentionMinutes);
        else if (!ready) openPanel('machine', object.id);
      }}>
        <Outlined color={MACHINE_COLOR[object.type] || '#888'} position={[0, 0.5, 0]}><boxGeometry args={[0.8, 1, 0.8]} /></Outlined>
      </group>
      {ready && <><pointLight position={[0, 1.6, 0]} intensity={2} distance={3} color="#fff2a0" /><Html zIndexRange={[20, 0]} position={[0, 1.8, 0]} center><button onClick={() => onCollect(object)} className="rounded-xl bg-[#ffd36a] px-3 py-2 text-xs font-black text-[#5c3d16] shadow">收取成品</button></Html></>}
    </group>;
  })}</>;
}
