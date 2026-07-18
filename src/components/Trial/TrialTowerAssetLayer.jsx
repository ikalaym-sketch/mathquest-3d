// v0.34 試煉塔 Canonical 組合層；100 層由 10 主題與 6 共用機關確定性組合，不建立 100 份重複 GLB。
import { useEffect, useMemo } from 'react';
import Model from '../3D/Model.jsx';
import { getTrialTowerDefinitionsForConfig } from '../../data/interiorTowerV034Catalog.js';
import { activateTrialTowerV034Assets, releaseTrialTowerV034Assets } from '../../services/InteriorTowerAssetService.js';

const ROLE_TRANSFORMS = Object.freeze({
  foundation: Object.freeze({ position: [0, 0.02, 0], scale: 1 }),
  boundary: Object.freeze({ position: [0, 0, 0], scale: 1 }),
  landmark: Object.freeze({ position: [0, 0, -8.8], scale: 1 }),
  mechanism: Object.freeze({ position: [0, 0, 4.8], scale: 1 }),
});

export default function TrialTowerAssetLayer({ config }) {
  const definitions = useMemo(() => getTrialTowerDefinitionsForConfig(config), [config]);
  useEffect(() => {
    activateTrialTowerV034Assets(config.floor);
    return () => releaseTrialTowerV034Assets(config.floor);
  }, [config.floor]);

  return (
    <group name={`trial-tower-v034-assets-floor-${config.floor}`}>
      {definitions.map((asset) => {
        const transform = ROLE_TRANSFORMS[asset.role || 'mechanism'];
        return (
          <Model
            key={asset.assetId}
            assetId={asset.assetId}
            instanceId={`trial-floor-${config.floor}-${asset.role || asset.mechanism}`}
            kind="trial-tower-module"
            position={transform.position}
            scale={transform.scale}
          />
        );
      })}
    </group>
  );
}
