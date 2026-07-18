import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { registerPOI } from '../../input/pois.js';
import { useStore } from '../../store/useStore.js';
import { resolveRoleNpcSchedule } from '../../systems/npcSchedule.js';
import ProximityCharacterActor from '../3D/ProximityCharacterActor.jsx';
import { useNpcAnimationState } from './useNpcAnimationState.js';

export default function VillageNPCs({ definitions = [] }) {
  const talkToNpc = useStore((state) => state.talkToNpc);

  useEffect(() => {
    const unregister = definitions.map((definition) => registerPOI({
      id: `npc_${definition.id}`,
      type: 'npc',
      label: definition.name,
      getPos: () => {
        const schedule = resolveRoleNpcSchedule(definition, useStore.getState().worldClock);
        return { x: schedule.position[0], z: schedule.position[2] };
      },
    }));
    return () => unregister.forEach((fn) => fn());
  }, [definitions]);

  return <>{definitions.map((definition) => <RoleNPC key={definition.id} definition={definition} talkToNpc={talkToNpc} />)}</>;
}

function RoleNPC({ definition, talkToNpc }) {
  const bodyRef = useRef(null);
  const actorRef = useRef(null);
  const movingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const clock = useStore((state) => state.worldClock);
  const isPaused = useStore((state) => state.isPaused);
  const schedule = useMemo(() => resolveRoleNpcSchedule(definition, clock), [definition, clock?.segment, clock?.weather, clock?.minutes]);
  const motion = useNpcAnimationState(definition.id, { ...schedule, segment: clock?.segment }, isMoving && !isPaused);

  const publishMoving = (next) => {
    if (movingRef.current === next) return;
    movingRef.current = next;
    setIsMoving(next);
  };

  useFrame((_, delta) => {
    const body = bodyRef.current;
    const actor = actorRef.current;
    if (!body || isPaused || ['Talk', 'Gift', 'Celebrate'].includes(motion.actionState)) { publishMoving(false); return; }
    const current = body.translation();
    const target = new THREE.Vector3(schedule.position[0], 0, schedule.position[2]);
    const direction = target.sub(new THREE.Vector3(current.x, 0, current.z));
    const distance = direction.length();
    if (distance < 0.08) { publishMoving(false); return; }
    publishMoving(true);
    direction.normalize();
    const speed = schedule.state === 'working' ? 2.3 : 1.8;
    const step = Math.min(distance, speed * delta);
    body.setNextKinematicTranslation({ x: current.x + direction.x * step, y: 0, z: current.z + direction.z * step });
    if (actor) actor.rotation.y = Math.atan2(direction.x, direction.z);
  });

  const interact = (event) => {
    event.stopPropagation();
    const servicePanel = schedule.serviceOpen ? (definition.id === 'chief' ? 'learningReport' : definition.id === 'merchant' ? 'shop' : definition.id) : null;
    talkToNpc(definition.id, { name: definition.name, servicePanel });
  };

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} position={[definition.position[0], 0, definition.position[2]]} enabledRotations={[false, false, false]} userData={{ kind: 'npc', npcId: definition.id }}>
      <CapsuleCollider args={[0.64, 0.34]} position={[0, 1.0, 0]} friction={0.95} />
      <group ref={actorRef} position={[0, 0.26, 0]} onClick={interact}>
        <ProximityCharacterActor
          actorId={`npc-role-${definition.id}`}
          priority={['Talk', 'Gift'].includes(motion.actionState)}
          rigProps={{
            profileId: 'npc_adult',
            appearanceProfileId: definition.id,
            outfitColor: definition.color,
            trimColor: roleTrim(definition.id),
            skinColor: '#f0d2aa',
            hairColor: roleHair(definition.id),
            role: definition.id,
            motion,
          }}
        />
      </group>
      <Html position={[0, 2.55, 0]} center distanceFactor={10}>
        <button onClick={interact} className={`whitespace-nowrap rounded-xl border border-white/50 px-3 py-1 text-xs font-black text-white ${schedule.serviceOpen ? 'bg-slate-900/80' : 'bg-slate-600/75'}`}>
          <span className="block">{definition.name}</span>
          <span className="text-[9px] text-amber-200">{schedule.label}</span>
        </button>
      </Html>
    </RigidBody>
  );
}

function roleTrim(role) {
  if (role === 'chief') return '#f5d85f';
  if (role === 'merchant') return '#e3c26c';
  if (role === 'blacksmith') return '#c4c9d1';
  if (role === 'carpenter') return '#e0ad63';
  return '#f0d178';
}

function roleHair(role) {
  if (role === 'chief') return '#d5c6a5';
  if (role === 'merchant') return '#6a3f31';
  if (role === 'blacksmith') return '#353b42';
  if (role === 'carpenter') return '#7a4f34';
  return '#5b3b2b';
}
