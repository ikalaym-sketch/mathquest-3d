// v0.30 農場正式設施模型層。
// 每0.3秒依玩家位置切換最多兩個設施分包；重複物件使用相同assetId但獨立instanceId。
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { playerPos } from '../../input/playerPos.js';
import Model from '../3D/Model.jsx';
import {
  FARM_ZONE_PROP_PLACEMENTS,
  getFarmZoneIdsForBundles,
  releaseFarmZoneBundles,
  syncFarmZoneBundles,
} from '../../services/FarmAssetService.js';

export default function FarmProductionAssetLayer({ farmLevel = 1 }) {
  const activeBundles = useRef([]);
  const elapsed = useRef(0);
  const [activeZones, setActiveZones] = useState(['fields']);

  useEffect(() => {
    activeBundles.current = syncFarmZoneBundles([], playerPos.x, playerPos.z);
    setActiveZones(getFarmZoneIdsForBundles(activeBundles.current));
    return () => {
      releaseFarmZoneBundles(activeBundles.current);
      activeBundles.current = [];
    };
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < .3) return;
    elapsed.current = 0;
    const next = syncFarmZoneBundles(activeBundles.current, playerPos.x, playerPos.z);
    if (next.join('|') !== activeBundles.current.join('|')) {
      activeBundles.current = next;
      setActiveZones(getFarmZoneIdsForBundles(next));
    }
  });

  const placements = activeZones.flatMap((zoneId) => FARM_ZONE_PROP_PLACEMENTS[zoneId] || [])
    .filter((item) => farmLevel >= requiredLevel(item.assetId));
  return <>{placements.map((item) => (
    <group key={item.id} position={item.position} rotation={item.rotation} scale={item.scale}>
      <Model assetId={item.assetId} instanceId={`farm-prop:${item.id}`} />
    </group>
  ))}</>;
}

function requiredLevel(assetId) {
  if (assetId?.endsWith(':greenhouse') || assetId?.endsWith(':grain_silo')) return 3;
  if (assetId?.includes('processing') || assetId?.endsWith(':cold_storage')) return 2;
  return 1;
}
