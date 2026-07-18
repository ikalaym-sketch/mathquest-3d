// v0.25 區域環境資產細化層：每區載入五種 Canonical GLB，配置於地表、岸線、道路與故事節點。
import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import LodEnvironmentModel from '../3D/LodEnvironmentModel.jsx';
import { getRegionEnvironmentKit } from '../../data/regionEnvironmentAssetCatalog.js';
import { createRegionAssetPlacements } from '../../services/RegionAssetPlacementService.js';

export default function RegionAssetDetailLayer({ layout }) {
  const kit = getRegionEnvironmentKit(layout?.id);
  const placements = useMemo(() => kit ? createRegionAssetPlacements(layout, kit) : [], [layout, kit]);
  if (!kit) return null;
  return (
    <group name={`${layout.id}-environment-glb-kit`}>
      {placements.map((placement) => (
        <group key={placement.instanceId} position={placement.position} rotation={[0, placement.rotation, 0]} scale={placement.scale}>
          {placement.asset.solid && placement.asset.collider && (
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={placement.asset.collider} position={[0, placement.asset.collider[1], 0]} friction={0.92} userData={{ environmentAssetId: placement.asset.id }} />
            </RigidBody>
          )}
          <LodEnvironmentModel assetId={placement.asset.assetId} instanceId={placement.instanceId} />
        </group>
      ))}
    </group>
  );
}

