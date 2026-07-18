// v0.35 可達的節慶／關係／生態 Runtime：村莊依季節與關係切換，八區只載入當前生態與機關效果。
import { useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore.js';
import { getVillageFestival } from '../../services/VillageFestivalService.js';
import { activateEventEcologyBundle } from '../../services/EventEcologyAssetService.js';
import {
  getFestivalAssetDefinitions,
  getMechanismEffectDefinition,
  getPortalEffectAssetId,
  getRegionEcologyDefinition,
  getRelationshipMemoryDefinitions,
  getVillageEcologyDefinitions,
} from '../../data/eventEffectV035Catalog.js';
import LodEnvironmentModel from '../3D/LodEnvironmentModel.jsx';
import Model from '../3D/Model.jsx';

const FESTIVAL_POSITIONS = Object.freeze([[-4.8, 0.04, 2], [4.8, 0.04, 2], [0, 0.04, -4.6]]);
const VILLAGE_ECOLOGY_POSITIONS = Object.freeze([[-10, 0.04, 10], [10, 0.04, 11], [-11, 0.04, -9], [11, 0.04, -10], [8, 0.04, 27]]);

export default function WorldEventAssetLayer({ sceneId, regionId = null, layout = null }) {
  const dayIndex = useStore((state) => state.worldClock?.dayIndex || 1);
  const relations = useStore((state) => state.npcRelations || {});
  const village = sceneId === 'village';
  const festival = useMemo(() => getVillageFestival(dayIndex), [dayIndex]);
  const festivalAssets = useMemo(() => village ? getFestivalAssetDefinitions(festival.seasonId) : [], [festival.seasonId, village]);
  const relationshipAssets = useMemo(() => village ? getRelationshipMemoryDefinitions(relations) : [], [relations, village]);
  const villageEcology = useMemo(() => village ? getVillageEcologyDefinitions() : [], [village]);
  const regionEcology = useMemo(() => !village ? getRegionEcologyDefinition(regionId) : null, [regionId, village]);
  const mechanism = useMemo(() => !village ? getMechanismEffectDefinition(regionId) : null, [regionId, village]);
  const assetIds = useMemo(() => village
    ? [
      ...festivalAssets.map((item) => item.assetId),
      ...relationshipAssets.map((item) => item.assetId),
      ...villageEcology.map((item) => item.assetId),
      getPortalEffectAssetId('farm'), getPortalEffectAssetId('region'), getPortalEffectAssetId('trial'),
    ]
    : [regionEcology?.assetId, mechanism?.assetId, getPortalEffectAssetId('village'), getPortalEffectAssetId('region')].filter(Boolean),
  [festivalAssets, mechanism, regionEcology, relationshipAssets, village, villageEcology]);
  const assetKey = assetIds.join('|');

  useEffect(() => {
    const residency = activateEventEcologyBundle(village ? `village:${festival.seasonId}` : `region:${regionId}`, assetIds);
    return residency.release;
  }, [assetKey, festival.seasonId, regionId, village]);

  if (village) return (
    <group name={`v035-village-events-${festival.seasonId}`}>
      {festivalAssets.map((asset, index) => <LodEnvironmentModel key={asset.assetId} assetId={asset.assetId} instanceId={`festival-${festival.runId}-${asset.role}`} kind="festival-prop" position={FESTIVAL_POSITIONS[index]} rotation={[0, index * 0.7, 0]} scale={festival.active ? 0.78 : 0.55} />)}
      {relationshipAssets.map((asset, index) => {
        const angle = index / Math.max(1, relationshipAssets.length) * Math.PI * 2;
        return <LodEnvironmentModel key={asset.assetId} assetId={asset.assetId} instanceId={`relationship-memory-${asset.npcId}`} kind="relationship-memory" position={[Math.cos(angle) * 8.2, 0.04, 2 + Math.sin(angle) * 8.2]} rotation={[0, -angle, 0]} scale={0.62} />;
      })}
      {villageEcology.map((asset, index) => <LodEnvironmentModel key={asset.assetId} assetId={asset.assetId} instanceId={`village-ecology-${asset.ecologyId}`} kind="village-ecology" position={VILLAGE_ECOLOGY_POSITIONS[index]} rotation={[0, index * 1.17, 0]} scale={0.72} />)}
    </group>
  );

  if (!layout || !regionEcology || !mechanism) return null;
  const ecologyArea = layout.subareas?.[0];
  const mechanismArea = layout.subareas?.[1] || ecologyArea;
  return (
    <group name={`v035-region-events-${regionId}`}>
      <LodEnvironmentModel assetId={regionEcology.assetId} instanceId={`${regionId}-ecology`} kind="region-ecology" position={[ecologyArea.center[0] + 4, ecologyArea.elevation + 0.05, ecologyArea.center[1] - 4]} scale={0.82} />
      <Model assetId={mechanism.assetId} instanceId={`${regionId}-mechanism-vfx`} kind="mechanism-vfx" position={[mechanismArea.center[0] - 3, mechanismArea.elevation + 0.08, mechanismArea.center[1] + 3]} scale={0.75} />
    </group>
  );
}
