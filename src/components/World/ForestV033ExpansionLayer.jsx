// v0.33 森林30資產依目前三個 Residency 子區載入；離開子區後由 ForestAssetService 釋放。
import { useMemo } from 'react';
import LodEnvironmentModel from '../3D/LodEnvironmentModel.jsx';
import { FOREST_RUINS_LAYOUT } from '../../data/forestRuinsLayout.js';
import { getV033ForestAssetsForSubarea } from '../../data/regionCreatureV033Catalog.js';

export default function ForestV033ExpansionLayer({ residentIds }) {
  const placements = useMemo(() => residentIds.flatMap((subareaId) => {
    const area = FOREST_RUINS_LAYOUT.subareas[subareaId];
    return getV033ForestAssetsForSubarea(subareaId).map((asset, index) => {
      const angle = index * 2.17 + area.index * 0.73;
      const radius = 6.5 + (index % 3) * 2.2;
      return {
        asset,
        position: [area.center[0] + Math.cos(angle) * radius, area.height + 0.03, area.center[2] + Math.sin(angle) * radius],
        rotation: angle,
        scale: asset.role === 'landmark-detail' ? 0.78 : 0.62,
      };
    });
  }), [residentIds]);
  return (
    <group name="forest-v033-expansion">
      {placements.map(({ asset, position, rotation, scale }) => (
        <LodEnvironmentModel key={asset.assetId} assetId={asset.assetId} instanceId={`forest-v033-${asset.id}`} position={position} rotation={[0, rotation, 0]} scale={scale} />
      ))}
    </group>
  );
}
