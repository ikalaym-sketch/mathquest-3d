// 區域引導 NPC：實體位置由結構 Socket 計算，不在元件內硬編座標。
import { Html } from '@react-three/drei';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import CharacterActorRig from '../3D/CharacterActorRig.jsx';

export default function RegionGuideNPC({ guide, position, label, icon, onInteract }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position} name={`region-guide-${guide.name}`}>
      <CapsuleCollider args={[0.55, 0.3]} position={[0, 0.85, 0]} />
      <group onClick={(event) => { event.stopPropagation(); onInteract(); }}>
        <CharacterActorRig
          profileId="npc_adult"
          actorId={`region-guide-${guide.name}`}
          outfitColor={guide.outfitColor}
          trimColor={guide.trimColor}
          role={guide.role}
          motion={{ isInteracting: false }}
        />
        <Html zIndexRange={[24, 0]} position={[0, 2.65, 0]} center distanceFactor={13}>
          <button onClick={(event) => { event.stopPropagation(); onInteract(); }} className="whitespace-nowrap rounded-2xl border-2 border-white/85 bg-sky-800/90 px-3 py-1.5 text-xs font-black text-white shadow-xl active:scale-95">
            {icon} {guide.name} · {label}
          </button>
        </Html>
      </group>
    </RigidBody>
  );
}
