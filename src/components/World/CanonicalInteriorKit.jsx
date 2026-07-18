// v0.34 室內 Canonical Modular Kit；物理仍由 InteriorPocket 統一掌管，GLB 只提供可換裝視覺。
import { useEffect, useMemo } from 'react';
import Model from '../3D/Model.jsx';
import { getInteriorRoomDefinition, getInteriorSupportDefinitions } from '../../data/interiorTowerV034Catalog.js';
import { activateInteriorV034Assets, releaseInteriorV034Assets } from '../../services/InteriorTowerAssetService.js';

const SUPPORT_POSITIONS = Object.freeze([
  [-3.4, 0, -1.5], [3.4, 0, -1.5], [-3.2, 0, 2.3], [3.2, 0, 2.3],
]);

export default function CanonicalInteriorKit({ interior }) {
  const room = useMemo(() => getInteriorRoomDefinition(interior?.regionId, interior?.structureId), [interior?.regionId, interior?.structureId]);
  const supports = useMemo(() => getInteriorSupportDefinitions(interior), [interior]);

  useEffect(() => {
    if (!room) return undefined;
    activateInteriorV034Assets(interior);
    return () => releaseInteriorV034Assets(interior);
  }, [interior, room]);

  if (!room) return null;
  return (
    <group name={`canonical-interior-kit-${interior.id}`}>
      <Model assetId={room.assetId} instanceId={`${interior.id}-room-shell`} kind="interior-room-shell" />
      {supports.map((asset, index) => (
        <Model
          key={asset.assetId}
          assetId={asset.assetId}
          instanceId={`${interior.id}-support-${index}`}
          kind="interior-support-module"
          position={SUPPORT_POSITIONS[index]}
          rotation={[0, index % 2 ? -0.35 : 0.35, 0]}
          scale={asset.supportId === 'lamp' ? 0.78 : 0.9}
        />
      ))}
    </group>
  );
}
