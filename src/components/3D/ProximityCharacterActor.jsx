// v0.31 行動裝置角色細節配額：只有最近的少數居民掛載完整 Rig + 四個外觀模組。
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { playerPos } from '../../input/playerPos.js';
import {
  rebalanceCharacterDetailBudget,
  registerCharacterDetailCandidate,
  updateCharacterDetailCandidate,
} from '../../services/CharacterCompanionVisualService.js';
import CharacterActorRig from './CharacterActorRig.jsx';
import Outlined from './Outlined.jsx';

export default function ProximityCharacterActor({ actorId, rigProps = {}, priority = false }) {
  const rootRef = useRef(null);
  const worldPositionRef = useRef(new Vector3());
  const [detailed, setDetailed] = useState(false);

  useEffect(() => registerCharacterDetailCandidate(actorId, setDetailed), [actorId]);

  useEffect(() => {
    if (!priority) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    updateCharacterDetailCandidate(actorId, -1, now);
    rebalanceCharacterDetailBudget(now);
  }, [actorId, priority]);

  useFrame(() => {
    if (!rootRef.current) return;
    rootRef.current.getWorldPosition(worldPositionRef.current);
    const dx = worldPositionRef.current.x - playerPos.x;
    const dz = worldPositionRef.current.z - playerPos.z;
    updateCharacterDetailCandidate(actorId, priority ? -1 : Math.hypot(dx, dz));
  });

  return (
    <group ref={rootRef}>
      {detailed
        ? <CharacterActorRig {...rigProps} actorId={actorId} />
        : <LowDetailResident {...rigProps} />}
    </group>
  );
}

function LowDetailResident({ profileId = 'npc_adult', outfitColor = '#6f8fb5', skinColor = '#efc7a5', bodyScale = [1, 1, 1] }) {
  const childScale = profileId === 'npc_child' ? 0.82 : 1;
  return (
    <group scale={[bodyScale[0] * childScale, bodyScale[1] * childScale, bodyScale[2] * childScale]}>
      <Outlined color={outfitColor} position={[0, 1.05, 0]} outlineScale={1.012}>
        <capsuleGeometry args={[0.3, 0.9, 5, 8]} />
      </Outlined>
      <Outlined color={skinColor} position={[0, 1.82, 0]} outlineScale={1.012}>
        <sphereGeometry args={[0.33, 10, 8]} />
      </Outlined>
    </group>
  );
}
