// 八大區域子區追蹤器：依玩家世界座標判斷目前所在子區，並只在首次進入時寫入探索紀錄。
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { playerPos } from '../../input/playerPos.js';
import { useStore } from '../../store/useStore.js';

export default function RegionSubareaTracker({ regionId, layout }) {
  const elapsedRef = useRef(0);
  const activeRef = useRef(null);
  const setActiveSubarea = useStore((state) => state.setActiveRegionSubarea);
  const discoverSubarea = useStore((state) => state.discoverRegionSubarea);

  useEffect(() => () => setActiveSubarea(null), [setActiveSubarea]);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (elapsedRef.current < 0.25) return;
    elapsedRef.current = 0;
    const area = layout.subareas.find((item) => isInsideArea(playerPos.x, playerPos.z, item));
    const nextId = area?.id || null;
    if (nextId === activeRef.current) return;
    activeRef.current = nextId;
    setActiveSubarea(nextId);
    if (nextId) discoverSubarea(regionId, nextId);
  });

  return null;
}

function isInsideArea(x, z, area) {
  const halfWidth = area.size[0] / 2;
  const halfDepth = area.size[1] / 2;
  return x >= area.center[0] - halfWidth && x <= area.center[0] + halfWidth && z >= area.center[1] - halfDepth && z <= area.center[1] + halfDepth;
}
