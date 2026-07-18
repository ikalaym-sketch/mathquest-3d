// 八大區域玩法總裝配器：子區探索、核心機制與結構 Socket 互動分檔維護。
import RegionSubareaTracker from './RegionSubareaTracker.jsx';
import RegionMechanicLayer from './RegionMechanicLayer.jsx';
import RegionStructureInteractionLayer from './RegionStructureInteractionLayer.jsx';

export default function RegionGameplayLayer({ profile, layout }) {
  if (!profile || !layout) return null;
  return (
    <group name={`region-gameplay-${profile.regionId}`}>
      <RegionSubareaTracker regionId={profile.regionId} layout={layout} />
      <RegionMechanicLayer profile={profile} />
      <RegionStructureInteractionLayer profile={profile} layout={layout} />
    </group>
  );
}
