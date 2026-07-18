// 九宮格大區場景：單一大區內含四個子區、地標、事件、定時怪物刷新與傳送門。
import { Sparkles } from '@react-three/drei';
import { useEffect } from 'react';
import { getWorldRegion } from '../../data/worldRegions.js';
import { useStore } from '../../store/useStore.js';
import { RegionProductionTerrain } from '../World/RegionProductionKit.jsx';
import { getRegionProductionLayout } from '../../data/regionProductionLayouts.js';
import RegionalEvent from '../World/RegionalEvent.jsx';
import RegionEncounterLayer from '../Entities/RegionEncounterLayer.jsx';
import TeleportGate from '../World/TeleportGate.jsx';
import { goToScene } from '../UI/TransitionManager.jsx';
import ForestRuinsScene from './ForestRuinsScene.jsx';
import { getRegionEncounter } from '../../data/regionEncounters.js';
import { getRegionGameplayProfile } from '../../data/regionGameplayProfiles.js';
import RegionGameplayLayer from '../World/RegionGameplayLayer.jsx';
import { findNearestWalkablePoint } from '../../services/TraversalSurfaceService.js';
import { getRegionLifeProfile } from '../../data/regionLifeProfiles.js';
import RegionLifeLayer from '../World/RegionLifeLayer.jsx';
import RegionInteriorLayer from '../World/RegionInteriorLayer.jsx';
import RegionExpansionLayer from '../World/RegionExpansionLayer.jsx';
import WorldEventAssetLayer from '../World/WorldEventAssetLayer.jsx';

export default function RegionScene() {
  const regionId = useStore((s) => s.worldProgress.currentRegionId);
  const openWorldMap = useStore((s) => s.openWorldMap);
  const showHint = useStore((s) => s.showWorldHint);
  const region = getWorldRegion(regionId);
  const productionLayout = getRegionProductionLayout(regionId);
  const encounter = getRegionEncounter(regionId);
  const gameplayProfile = getRegionGameplayProfile(regionId);
  const lifeProfile = getRegionLifeProfile(regionId);
  const ensureStoryProgress = useStore((s) => s.ensureStoryProgress);
  const gateBase = productionLayout ? productionLayout.spawn : [0, 0, 10];
  const villageGate = productionLayout
    ? findNearestWalkablePoint(productionLayout, gateBase[0] - 5, gateBase[2] - 4)
    : { x: -5, y: 0, z: 1 };
  const mapGate = productionLayout
    ? findNearestWalkablePoint(productionLayout, gateBase[0] + 5, gateBase[2] - 4)
    : { x: 5, y: 0, z: 1 };

  useEffect(() => { ensureStoryProgress(regionId); }, [ensureStoryProgress, regionId]);

  if (regionId === 'forest_ruins') return <ForestRuinsScene />;

  const returnVillage = async () => {
    showHint('正在返回星光村。');
    await goToScene('village');
  };

  return (
    <>
      <RegionProductionTerrain layout={productionLayout} region={region} />
      <RegionExpansionLayer regionId={regionId} layout={productionLayout} />
      <WorldEventAssetLayer sceneId="region" regionId={regionId} layout={productionLayout} />
      <RegionGameplayLayer profile={gameplayProfile} layout={productionLayout} />
      <RegionLifeLayer profile={lifeProfile} layout={productionLayout} />
      <RegionInteriorLayer layout={productionLayout} />
      <RegionalEvent region={region} />
      {encounter && (
        <RegionEncounterLayer
          encounter={encounter}
          onAreaCleared={() => showHint('這個區域暫時恢復平靜，怪物稍後會重新出現。')}
        />
      )}

      {/* 區域中心的兩個傳送點：回村與開啟九宮格世界地圖。 */}
      <TeleportGate position={[villageGate.x, villageGate.y, villageGate.z]} portalType="village" color="#5edb8b" icon="🏠" label="返回星光村" onActivate={returnVillage} />
      <TeleportGate position={[mapGate.x, mapGate.y, mapGate.z]} portalType="region" color="#5bbce8" icon="🗺️" label="世界地圖" onActivate={openWorldMap} />

      <Sparkles count={55} scale={[85, 14, 85]} size={2.5} speed={0.25} color="#fff2a8" position={[0, 5, 0]} />
    </>
  );
}
