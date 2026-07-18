// 八區生活層：24 名區域 NPC、環境動物與可閱讀敘事物件。
// NPC 使用 Kinematic RigidBody 與 Capsule Collider，移動路線由 RegionLifeScheduleService 解析。
import { Html, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { resolveRegionLifeSchedule } from '../../services/RegionLifeScheduleService.js';
import CharacterActorRig from '../3D/CharacterActorRig.jsx';
import Outlined from '../3D/Outlined.jsx';

export default function RegionLifeLayer({ profile, layout }) {
  const clock = useStore((state) => state.worldClock);
  const weatherType = useStore((state) => state.weatherType);
  const storyProgress = useStore((state) => state.storyProgress);
  if (!profile || !layout) return null;

  return (
    <group name={`region-life-${profile.regionId}`}>
      {profile.npcs.map((npc, index) => (
        <RegionLifeNpc
          key={npc.id}
          npc={npc}
          npcIndex={index}
          layout={layout}
          clock={clock}
          weatherType={weatherType}
        />
      ))}
      {profile.critters.map((critterId, index) => (
        <RegionCritter key={critterId} id={critterId} index={index} layout={layout} />
      ))}
      {profile.storyProps.map((propId, index) => (
        <RegionStoryProp
          key={propId}
          id={propId}
          index={index}
          layout={layout}
          active={Boolean(storyProgress?.completedQuestIds?.length || storyProgress?.completedChapterIds?.length)}
        />
      ))}
      <RegionAmbienceLights profile={profile} layout={layout} segment={clock?.segment} />
    </group>
  );
}

function RegionLifeNpc({ npc, npcIndex, layout, clock, weatherType }) {
  const bodyRef = useRef(null);
  const actorRef = useRef(null);
  const routeIndexRef = useRef(0);
  const movingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const talkToNpc = useStore((state) => state.talkToNpc);
  const isPaused = useStore((state) => state.isPaused);
  const schedule = useMemo(
    () => resolveRegionLifeSchedule(npc, layout, clock, weatherType, npcIndex),
    [npc, layout, clock?.segment, clock?.dayIndex, weatherType, npcIndex],
  );
  const start = schedule.route[0] || [layout.spawn[0], layout.spawn[1], layout.spawn[2]];

  // 排程跨時段或雨天突變時，若舊位置與新安全路線相距過遠，直接移到路線起點，避免直線穿越危險地形。
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !schedule.route.length) return;
    routeIndexRef.current = 0;
    const current = body.translation();
    const first = schedule.route[0];
    if (Math.hypot(current.x - first[0], current.z - first[2]) > 12) {
      body.setNextKinematicTranslation({ x: first[0], y: first[1] + 0.04, z: first[2] });
    }
  }, [schedule]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body || isPaused || !schedule.route.length) {
      if (movingRef.current) { movingRef.current = false; setIsMoving(false); }
      return;
    }
    routeIndexRef.current %= schedule.route.length;
    const target = schedule.route[routeIndexRef.current];
    const current = body.translation();
    const direction = new THREE.Vector3(target[0] - current.x, 0, target[2] - current.z);
    const distance = direction.length();
    if (distance < 0.28) {
      routeIndexRef.current = (routeIndexRef.current + 1) % schedule.route.length;
      if (movingRef.current) { movingRef.current = false; setIsMoving(false); }
      return;
    }
    direction.normalize();
    const step = Math.min(distance, schedule.speed * delta);
    const next = { x: current.x + direction.x * step, y: target[1] + 0.04, z: current.z + direction.z * step };
    body.setNextKinematicTranslation(next);
    if (!movingRef.current) { movingRef.current = true; setIsMoving(true); }
    if (actorRef.current) actorRef.current.rotation.y = Math.atan2(direction.x, direction.z);
  });

  const interact = (event) => {
    event?.stopPropagation?.();
    talkToNpc(npc.id, {
      name: npc.name,
      role: npc.role,
      topics: npc.topics,
    });
  };

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[start[0], start[1] + 0.04, start[2]]}
      enabledRotations={[false, false, false]}
      userData={{ kind: 'npc', npcId: npc.id, regionId: layout.id }}
      name={`region-life-npc-${npc.id}`}
    >
      <CapsuleCollider args={[0.62, 0.34]} position={[0, 1, 0]} friction={0.9} />
      <group ref={actorRef} onClick={interact}>
        <CharacterActorRig
          profileId="npc_adult"
          actorId={`region-life-${npc.id}`}
          outfitColor={npc.outfitColor}
          trimColor={npc.trimColor}
          role={npc.role}
          motion={{ isMoving, isInteracting: false }}
        />
      </group>
      <Html position={[0, 2.72, 0]} center distanceFactor={13} zIndexRange={[24, 0]}>
        <button
          type="button"
          onClick={interact}
          className="whitespace-nowrap rounded-2xl border-2 border-white/85 bg-slate-800/88 px-3 py-1 text-xs font-black text-white shadow-xl active:scale-95"
        >
          {npc.name} · {schedule.label}
        </button>
      </Html>
    </RigidBody>
  );
}

function RegionCritter({ id, index, layout }) {
  const groupRef = useRef(null);
  const area = layout.subareas[index % layout.subareas.length];
  const center = useMemo(() => ({ x: area.center[0], y: area.elevation + 0.45, z: area.center[1] }), [area]);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.elapsedTime * (0.45 + index * 0.08);
    groupRef.current.position.set(
      center.x + Math.cos(time + index) * (3.2 + index),
      center.y + Math.sin(time * 2.4) * 0.14,
      center.z + Math.sin(time + index) * (2.4 + index * 0.7),
    );
    groupRef.current.rotation.y = -time + Math.PI / 2;
  });
  const flying = /bird|moth|butterfly|dragonfly|sparrow/.test(id);
  return (
    <group ref={groupRef} name={`region-critter-${id}`} position={[center.x, center.y, center.z]}>
      <Outlined color={index % 2 ? '#ffe08b' : '#b9efff'} outlineScale={1.02}>
        {flying ? <sphereGeometry args={[0.18, 8, 7]} /> : <capsuleGeometry args={[0.13, 0.22, 4, 8]} />}
      </Outlined>
      {flying && (
        <>
          <Outlined color="#f8fbff" position={[-0.18, 0.02, 0]} rotation={[0, 0, -0.45]} outlineScale={1.015}><sphereGeometry args={[0.13, 7, 6]} /></Outlined>
          <Outlined color="#f8fbff" position={[0.18, 0.02, 0]} rotation={[0, 0, 0.45]} outlineScale={1.015}><sphereGeometry args={[0.13, 7, 6]} /></Outlined>
        </>
      )}
    </group>
  );
}

function RegionStoryProp({ id, index, layout, active }) {
  const showHint = useStore((state) => state.showWorldHint);
  const recordLearningInteraction = useStore((state) => state.recordLearningInteraction);
  const area = layout.subareas[(index + 1) % layout.subareas.length];
  const x = area.center[0] + (index ? 3.2 : -3.2);
  const z = area.center[1] + (index ? -2.4 : 2.4);
  const position = [x, area.elevation + 0.35, z];
  const interact = (event) => {
    event.stopPropagation();
    recordLearningInteraction?.({ kind: 'environment-story', regionId: layout.id, targetId: id, source: 'region-life' });
    showHint(active ? `你在「${id}」旁發現了新的故事線索。` : `這件物品似乎與本區主線有關，完成更多任務後再回來看看。`);
  };
  return (
    <group position={position} name={`region-story-prop-${id}`} onClick={interact}>
      <Outlined color={active ? '#ffd968' : '#9aa9ad'} position={[0, 0.55, 0]} outlineScale={1.018}><dodecahedronGeometry args={[0.48, 0]} /></Outlined>
      <Outlined color="#72543c" position={[0, 0.12, 0]} outlineScale={1.012}><cylinderGeometry args={[0.16, 0.22, 0.32, 8]} /></Outlined>
      {active && <Sparkles count={12} scale={2.2} size={3} speed={0.35} color="#fff0a2" position={[0, 0.8, 0]} />}
      <Html position={[0, 1.55, 0]} center distanceFactor={13} zIndexRange={[24, 0]}>
        <button type="button" onClick={interact} className="whitespace-nowrap rounded-xl border border-amber-100 bg-amber-700/88 px-2.5 py-1 text-[11px] font-black text-white shadow-lg active:scale-95">
          🔎 環境線索
        </button>
      </Html>
    </group>
  );
}

function RegionAmbienceLights({ profile, layout, segment }) {
  const isNight = ['evening', 'night', 'lateNight'].includes(segment);
  if (!isNight) return null;
  return (
    <group name={`region-night-life-${profile.regionId}`}>
      {layout.subareas.map((area, index) => (
        <group key={area.id} position={[area.center[0], area.elevation + 2.4, area.center[1]]}>
          <pointLight color={profile.ambience.nightLight} intensity={0.7} distance={11} decay={2} />
          <mesh position={[0, -1.35, 0]}><sphereGeometry args={[0.18, 10, 8]} /><meshBasicMaterial color={profile.ambience.nightLight} /></mesh>
          {index % 2 === 0 && <Sparkles count={8} scale={[5, 2, 5]} size={2} speed={0.18} color={profile.ambience.nightLight} />}
        </group>
      ))}
    </group>
  );
}
