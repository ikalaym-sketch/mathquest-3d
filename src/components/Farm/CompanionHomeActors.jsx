// v0.28 農場守護夥伴休息區：非同行夥伴會回到農舍旁，不再只存在名冊資料中。
import { Html } from '@react-three/drei';
import { useStore } from '../../store/useStore.js';
import { COMPANION_PROFILES } from '../../data/companionProfiles.js';
import CompanionActor from '../3D/CompanionActor.jsx';
import Model from '../3D/Model.jsx';
import { getCompanionVisualProfile } from '../../services/CharacterCompanionVisualService.js';

const HOME_SPOTS = [
  [-18.2, 0.08, 22.4], [-16.5, 0.08, 23.1], [-14.8, 0.08, 23.4], [-13.1, 0.08, 23.0],
  [-18.5, 0.08, 20.8], [-12.6, 0.08, 21.3], [-17.2, 0.08, 19.8], [-13.4, 0.08, 19.6],
];

export default function CompanionHomeActors() {
  const companionState = useStore((state) => state.companionState);
  const setActive = useStore((state) => state.setActiveCompanion);
  const showWorldHint = useStore((state) => state.showWorldHint);
  const inactiveIds = (companionState?.ownedIds || []).filter((id) => id !== companionState.activeId);
  return <>{inactiveIds.map((id, index) => {
    const profile = COMPANION_PROFILES[id];
    if (!profile) return null;
    const visual = getCompanionVisualProfile(id);
    const position = HOME_SPOTS[index % HOME_SPOTS.length];
    return <group key={id} position={position} onClick={(event) => {
      event.stopPropagation();
      const result = setActive(id);
      if (result.ok) showWorldHint(`${profile.name}現在和你同行。`);
    }}>
      {visual?.homeAssetId && <Model assetId={visual.homeAssetId} kind="companion-home" instanceId={`companion-home-${id}`} scale={0.92} />}
      <group position={[0, 0.22, 0.05]}>
        <CompanionActor profile={profile} animation={index % 3 === 0 ? 'Sleep' : 'Idle'} scale={0.62} instanceId={`companion-home-actor-${id}`} />
      </group>
      <Html position={[0, 1.35, 0]} center distanceFactor={13}><button className="whitespace-nowrap rounded-xl border border-white/70 bg-[#fff7df]/90 px-2 py-1 text-[10px] font-black text-[#6a4c32]">{profile.emoji} {profile.name}・休息中</button></Html>
    </group>;
  })}</>;
}
