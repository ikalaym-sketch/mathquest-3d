// v0.27.0 農場道具命令控制器：成長粉即使在其他場景使用，也會透過唯一農場 Store 執行。
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';

export default function FarmCommandController() {
  const command = useStore((state) => state.pendingFarmCommand);
  const consume = useStore((state) => state.consumePendingFarmCommand);
  useEffect(() => {
    if (!command?.id) return;
    if (command.type === 'instantGrowFirstCrop') {
      const result = useFarmStore.getState().instantGrowFirstCrop();
      useStore.getState().showWorldHint(result.ok ? '成長粉使一株作物立即成熟。' : '目前沒有可使用成長粉的作物。');
    }
    consume(command.id);
  }, [command, consume]);
  return null;
}
