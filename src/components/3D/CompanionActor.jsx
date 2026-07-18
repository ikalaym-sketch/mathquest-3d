// v0.29 守護夥伴正式 GLB Runtime。
// 與角色、怪物共用 AnimatedProductionModel，確保路徑、Skeleton 複製、備援與遙測規格一致。
import AnimatedProductionModel from './AnimatedProductionModel.jsx';
import Model from './Model.jsx';
import { getCompanionVisualProfile } from '../../services/CharacterCompanionVisualService.js';

export default function CompanionActor({ profile, animation = 'Idle', scale = 0.72, instanceId = null, fallback = null }) {
  if (!profile) return fallback;
  const visual = getCompanionVisualProfile(profile.id);
  const resolvedInstanceId = instanceId || `companion-${profile.id}`;
  const attachments = visual ? {
    SOCKET_Accessory: <Model assetId={visual.wearableAssetId} kind="companion-wearable" instanceId={`${resolvedInstanceId}-wearable`} />,
    SOCKET_Skill: animation === 'Skill'
      ? <Model assetId={visual.skillAssetId} kind="companion-skill" instanceId={`${resolvedInstanceId}-skill`} />
      : null,
  } : null;
  return (
    <AnimatedProductionModel
      assetId={profile.modelAssetId}
      instanceId={resolvedInstanceId}
      kind="companion"
      clipName={animation}
      loop={!['Happy', 'Skill', 'Find', 'Greet'].includes(animation)}
      attachments={attachments}
      scale={scale}
      fallback={fallback}
    />
  );
}
