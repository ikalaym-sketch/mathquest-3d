// 農場生活 NPC：正式農夫 GLB + 時間/天氣作息。
import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CharacterActorRig from '../3D/CharacterActorRig.jsx';
import { useStore } from '../../store/useStore.js';
import { resolveLifeNpcRoute } from '../../systems/npcSchedule.js';
import { resolveResidentAnimation } from '../../services/CharacterCompanionVisualService.js';

export default function FarmLifeNPCs({ npcs = [] }) {
  return <>{npcs.map((npc) => <FarmLifeNPC key={npc.id} npc={npc} />)}</>;
}

function FarmLifeNPC({ npc }) {
  const groupRef = useRef(null);
  const routeIndexRef = useRef(0);
  const pauseRef = useRef(0);
  const movingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const clock = useStore((state) => state.worldClock);
  const isPaused = useStore((state) => state.isPaused);
  const schedule = useMemo(() => resolveLifeNpcRoute(npc, clock, 'farm'), [npc, clock?.segment, clock?.weather]);
  const motion = resolveResidentAnimation({ isMoving: isMoving && !isPaused, scheduleState: schedule.state, timeSegment: clock?.segment });
  const publishMoving = (next) => {
    if (movingRef.current === next) return;
    movingRef.current = next;
    setIsMoving(next);
  };

  useFrame((_, delta) => {
    const group = groupRef.current;
    const route = schedule.route || npc.route;
    if (!group || !route?.length || isPaused) { publishMoving(false); return; }
    if (pauseRef.current > 0) {
      publishMoving(false);
      pauseRef.current -= delta;
      return;
    }

    routeIndexRef.current %= route.length;
    const target = new THREE.Vector3(...route[routeIndexRef.current]);
    const dx = target.x - group.position.x;
    const dz = target.z - group.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.2) {
      publishMoving(false);
      routeIndexRef.current = (routeIndexRef.current + 1) % route.length;
      pauseRef.current = route.length === 1 ? 2.4 : 0.8 + (routeIndexRef.current % 3) * 0.35;
      return;
    }
    publishMoving(true);
    const speed = npc.speed * schedule.speedMultiplier;
    const step = Math.min(distance, speed * delta);
    group.position.x += (dx / distance) * step;
    group.position.z += (dz / distance) * step;
    group.rotation.y = Math.atan2(dx, dz);
  });

  const start = schedule.route?.[0] || npc.route[0];
  return (
    <group ref={groupRef} position={start}>
      <CharacterActorRig
        profileId="npc_adult"
        actorId={`farm-life-${npc.id}`}
        role="farmer"
        motion={motion}
        bodyScale={[0.9, 0.9, 0.9]}
        outfitColor={farmNpcColor(npc.id)}
        trimColor="#f2d080"
      />
      <Html position={[0, 3.2, 0]} center distanceFactor={13}>
        <div className="whitespace-nowrap rounded-lg border border-white/50 bg-[#463322]/80 px-2 py-0.5 text-[10px] font-black text-amber-100">
          {npc.name} · {schedule.label}
        </div>
      </Html>
    </group>
  );
}

function farmNpcColor(id) {
  const palette = ['#6f9f63', '#c48655', '#728fc1'];
  return palette[Math.abs([...id].reduce((hash, char) => hash + char.charCodeAt(0), 0)) % palette.length];
}
