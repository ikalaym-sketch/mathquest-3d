import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { resolveLifeNpcRoute } from '../../systems/npcSchedule.js';
import { getVillageResidentProfile } from '../../data/villageResidentProfiles.js';
import ProximityCharacterActor from '../3D/ProximityCharacterActor.jsx';
import { useNpcAnimationState } from './useNpcAnimationState.js';

export default function VillageLifeNPCs({ definitions = [] }) {
  return <>{definitions.map((definition) => <LifeNPC key={definition.id} def={definition} />)}</>;
}

function LifeNPC({ def }) {
  const bodyRef = useRef(null);
  const actorRef = useRef(null);
  const routeIndexRef = useRef(0);
  const pauseRef = useRef(0);
  const movingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const clock = useStore((state) => state.worldClock);
  const isPaused = useStore((state) => state.isPaused);
  const talkToNpc = useStore((state) => state.talkToNpc);
  const schedule = useMemo(() => resolveLifeNpcRoute(def, clock, 'village'), [def, clock?.segment, clock?.weather, clock?.dayIndex]);
  const profile = getVillageResidentProfile(def.id);
  const isChild = def.id.includes('child');
  const hairColor = colorFromId(def.id, ['#5b3b2b', '#6d4938', '#3e4b5e', '#8a5b3e']);
  const motion = useNpcAnimationState(def.id, { ...schedule, segment: clock?.segment }, isMoving && !isPaused);

  const publishMoving = (next) => {
    if (movingRef.current === next) return;
    movingRef.current = next;
    setIsMoving(next);
  };

  useFrame((_, delta) => {
    const body = bodyRef.current; const actor = actorRef.current; const route = schedule.route || def.route || [];
    if (!body || !route.length || isPaused || ['Talk', 'Gift', 'Celebrate'].includes(motion.actionState)) { publishMoving(false); return; }
    if (pauseRef.current > 0) { publishMoving(false); pauseRef.current -= delta; return; }
    routeIndexRef.current %= route.length;
    const targetDef = route[routeIndexRef.current]; const current = body.translation();
    const direction = new THREE.Vector3(targetDef[0] - current.x, 0, targetDef[2] - current.z); const distance = direction.length();
    if (distance < 0.25) {
      publishMoving(false);
      routeIndexRef.current = (routeIndexRef.current + 1) % route.length;
      pauseRef.current = schedule.state === 'working' ? 2.2 : schedule.state === 'resting' ? 4 : 0.9;
      return;
    }
    publishMoving(true);
    direction.normalize(); const step = Math.min(distance, def.speed * schedule.speedMultiplier * delta);
    body.setNextKinematicTranslation({ x: current.x + direction.x * step, y: 0, z: current.z + direction.z * step });
    if (actor) actor.rotation.y = Math.atan2(direction.x, direction.z);
  });

  const start = schedule.route?.[0] || def.route[0];
  const interact = (event) => { event.stopPropagation(); talkToNpc(def.id, { name: profile?.name || def.id, servicePanel: null }); };
  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} position={[start[0], 0, start[2]]} enabledRotations={[false, false, false]} userData={{ kind: 'npc', npcId: def.id }}>
      <CapsuleCollider args={isChild ? [0.5, 0.3] : [0.64, 0.34]} position={isChild ? [0, 0.82, 0] : [0, 1.0, 0]} friction={0.9} />
      <group ref={actorRef} position={[0, 0.26, 0]} onClick={interact}>
        <ProximityCharacterActor
          actorId={`npc-life-${def.id}`}
          priority={['Talk', 'Gift'].includes(motion.actionState)}
          rigProps={{ profileId: isChild ? 'npc_child' : 'npc_adult', appearanceProfileId: def.id, outfitColor: def.color, trimColor: mix(def.color, '#fff1a6', 0.35), skinColor: '#f0d2aa', hairColor, role: 'villager', motion }}
        />
      </group>
      <Html position={[0, isChild ? 2.05 : 2.35, 0]} center distanceFactor={12}><button onClick={interact} className="whitespace-nowrap rounded-lg border border-white/50 bg-[#493a2c]/85 px-2 py-1 text-[10px] font-black text-amber-100"><span className="block">{profile?.name || '村民'}</span><span className="text-[9px] text-white/75">{schedule.label}</span></button></Html>
    </RigidBody>
  );
}
function colorFromId(id, palette) { let hash = 0; for (let index = 0; index < id.length; index += 1) hash = ((hash << 5) - hash + id.charCodeAt(index)) | 0; return palette[Math.abs(hash) % palette.length]; }
function mix(a, b, ratio) { const parse = (hex) => hex.replace('#', '').match(/.{2}/g).map((value) => Number.parseInt(value, 16)); const [ar, ag, ab] = parse(a); const [br, bg, bb] = parse(b); const rgb = [ar, ag, ab].map((value, index) => Math.round(value * (1 - ratio) + [br, bg, bb][index] * ratio)); return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`; }
