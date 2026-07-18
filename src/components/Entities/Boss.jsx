// 正式 Boss Runtime：三階段移動、可視預警、攻擊結算、破綻窗口與寬容封印。
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { registerEnemy } from '../../input/combat.js';
import { playerPos } from '../../input/playerPos.js';
import { SFX } from '../../audio/sfx.js';
import { spawnDamage, shakeCamera, triggerHitstop } from '../../input/fx.js';
import AnimatedProductionModel from '../3D/AnimatedProductionModel.jsx';
import { grantMonsterLoot } from '../../systems/regionLoot.js';
import { getBossCombatProfile } from '../../data/combatEncounterProfiles.js';
import BossSkillTelegraph from '../Combat/BossSkillTelegraph.jsx';
import BossPhaseBanner from '../Combat/BossPhaseBanner.jsx';
import { calculateLineTelegraphRotation, isPointInsideBossSkill } from '../../services/CombatGeometryService.js';
import { getRegionProductionLayout } from '../../data/regionProductionLayouts.js';
import { findNearestWalkablePoint, projectTraversalStep } from '../../services/TraversalSurfaceService.js';

export function Boss({ def, position = [0, 1.2, -8], onDefeated = null, rewardGold = 500, grantBlueprint = true, grantLoot = true }) {
  const profile = useMemo(() => getBossCombatProfile(def), [def]);
  const traversalLayout = useMemo(() => def.regionId ? getRegionProductionLayout(def.regionId) : null, [def.regionId]);
  const resolvedSpawn = useMemo(() => traversalLayout
    ? findNearestWalkablePoint(traversalLayout, position[0], position[2])
    : { x: position[0], y: position[1] - 1.2, z: position[2] }, [position, traversalLayout]);
  const bossHoverHeight = 1.2;
  const [hp, setHp] = useState(def.hp);
  const [stunned, setStunned] = useState(false);
  const [dead, setDead] = useState(false);
  const [visualState, setVisualState] = useState('Idle');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [telegraph, setTelegraph] = useState(null);
  const [vulnerable, setVulnerable] = useState(false);
  const bodyRef = useRef(null);
  const meshRef = useRef(null);
  const timersRef = useRef(new Set());
  const hpRef = useRef(def.hp);
  const stunnedRef = useRef(false);
  const deadRef = useRef(false);
  const vulnerableUntilRef = useRef(0);
  const attackReadyAtRef = useRef(performance.now() + 1800);
  const skillIndexRef = useRef(0);
  const phaseIndexRef = useRef(0);
  const telegraphRef = useRef(null);
  const bossPos = useRef(new THREE.Vector3(resolvedSpawn.x, resolvedSpawn.y + bossHoverHeight, resolvedSpawn.z));
  const orbitAngle = useRef(0);
  const statusRef = useRef({ poisonUntil: 0, poisonTickAt: 0, poisonDamage: 0, armorBreakUntil: 0, armorBreakRatio: 0, staggerUntil: 0 });

  const isPaused = useStore((s) => s.isPaused);
  const openSeal = useStore((s) => s.openSealChallenge);
  const defeatBoss = useStore((s) => s.defeatBoss);
  const unlockBlueprint = useStore((s) => s.unlockBlueprint);
  const addGold = useStore((s) => s.addGold);
  const showHint = useStore((s) => s.showWorldHint);

  const scheduleTimeout = (callback, delayMs) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delayMs);
    timersRef.current.add(timerId);
    return timerId;
  };

  useEffect(() => () => {
    for (const timerId of timersRef.current) window.clearTimeout(timerId);
    timersRef.current.clear();
  }, []);

  const phases = profile?.phases || [];
  const currentPhase = phases[phaseIndex] || phases[0];

  useFrame((_, delta) => {
    if (isPaused || deadRef.current || stunnedRef.current || !currentPhase) return;
    const now = performance.now();
    const status = statusRef.current;
    if (now < status.poisonUntil && now >= status.poisonTickAt) {
      status.poisonTickAt = now + 1000;
      const tickDamage = Math.max(1, Math.round(status.poisonDamage));
      hpRef.current = Math.max(1, hpRef.current - tickDamage);
      setHp(hpRef.current);
      spawnDamage(bossPos.current.x, bossPos.current.y + 1, bossPos.current.z, tickDamage, false);
    }
    if (now < status.staggerUntil) {
      setVulnerable(true);
      vulnerableUntilRef.current = Math.max(vulnerableUntilRef.current, status.staggerUntil);
      return;
    }
    const hpRatio = Math.max(0, hpRef.current / Math.max(1, def.hp));
    let nextPhaseIndex = 0;
    phases.forEach((phase, index) => { if (hpRatio <= phase.threshold) nextPhaseIndex = index; });
    if (nextPhaseIndex !== phaseIndexRef.current) {
      phaseIndexRef.current = nextPhaseIndex;
      setPhaseIndex(nextPhaseIndex);
      showHint(`${def.name}進入「${phases[nextPhaseIndex].label}」階段。`);
      attackReadyAtRef.current = now + 900;
    }

    if (telegraphRef.current) {
      const active = telegraphRef.current;
      const progress = Math.min(1, (now - active.startedAt) / active.skill.telegraphMs);
      setTelegraph({ ...active, progress });
      if (progress >= 1) resolveTelegraphedAttack(active);
    } else {
      moveBoss(delta, phases[phaseIndexRef.current]);
      if (now >= attackReadyAtRef.current) beginTelegraph(phases[phaseIndexRef.current]);
    }

    const nextVulnerable = now < vulnerableUntilRef.current;
    if (nextVulnerable !== vulnerable) setVulnerable(nextVulnerable);
    if (meshRef.current && !telegraphRef.current) meshRef.current.rotation.y += delta * 0.4;
  });

  function moveBoss(delta, phase) {
    if (!bodyRef.current) return;
    const current = bossPos.current;
    const target = new THREE.Vector3(playerPos.x, current.y, playerPos.z);
    const frameOrigin = { x: current.x, z: current.z };
    const toPlayer = target.clone().sub(current);
    const distance = Math.max(0.001, toPlayer.length());
    const direction = toPlayer.normalize();
    const speed = 1.15 * (phase.speedMultiplier || 1);

    if (phase.movement === 'chase' && distance > 3.7) current.addScaledVector(direction, speed * delta);
    else if (phase.movement === 'strafe') {
      const tangent = new THREE.Vector3(-direction.z, 0, direction.x);
      current.addScaledVector(tangent, speed * delta);
      if (distance > 7) current.addScaledVector(direction, speed * delta * 0.45);
    } else if (phase.movement === 'orbit') {
      orbitAngle.current += delta * 0.55;
      const desired = target.clone().add(new THREE.Vector3(Math.cos(orbitAngle.current) * 7, 0, Math.sin(orbitAngle.current) * 7));
      current.lerp(desired, Math.min(1, delta * speed * 0.45));
    } else if (phase.movement === 'anchor' && distance < 4) current.addScaledVector(direction, -speed * delta * 0.55);

    if (traversalLayout) {
      const projected = projectTraversalStep(traversalLayout, frameOrigin, { x: current.x, z: current.z }, { hoverHeight: bossHoverHeight });
      current.set(projected.x, projected.y, projected.z);
    }
    bodyRef.current.setNextKinematicTranslation({ x: current.x, y: current.y, z: current.z });
  }

  function beginTelegraph(phase) {
    const skill = phase.skills[skillIndexRef.current % phase.skills.length];
    skillIndexRef.current += 1;
    const worldPosition = skill.kind === 'targetCircle'
      ? [playerPos.x, 0.08, playerPos.z]
      : [bossPos.current.x, 0.08, bossPos.current.z];
    // 線型攻擊以 Boss 當下位置朝玩家方向鎖定；預警開始後不再追蹤，孩子可依紅色區域閃避。
    const rotationY = skill.kind === 'line' ? calculateLineTelegraphRotation(bossPos.current, playerPos) : 0;
    const active = { skill, position: worldPosition, rotationY, startedAt: performance.now(), progress: 0 };
    telegraphRef.current = active;
    setTelegraph(active);
    setVisualState('Attack');
  }

  function resolveTelegraphedAttack(active) {
    telegraphRef.current = null;
    setTelegraph(null);
    const skill = active.skill;
    const hit = isPlayerInsideSkill(active);
    if (hit && !playerPos.invuln) {
      const state = useStore.getState();
      state.receiveDamage(skill.damage, { source: apiRef.current, sourceType: 'bossSkill' });
      state.showWorldHint(`${skill.label}命中：-${skill.damage} HP`);
      SFX.playerHurt();
      shakeCamera(0.45);
    }
    vulnerableUntilRef.current = performance.now() + 2100;
    setVulnerable(true);
    setVisualState('Idle');
    attackReadyAtRef.current = performance.now() + 2400;
  }

  function isPlayerInsideSkill(active) {
    return isPointInsideBossSkill(active, playerPos);
  }

  const takeHit = (damage, opts = {}) => {
    if (stunnedRef.current || deadRef.current) return;
    const now = performance.now();
    const status = statusRef.current;
    if (opts.status?.poisonSeconds) {
      status.poisonUntil = Math.max(status.poisonUntil, now + opts.status.poisonSeconds * 1000);
      status.poisonTickAt = Math.min(status.poisonTickAt || now + 1000, now + 1000);
      status.poisonDamage = Math.max(status.poisonDamage, Number(opts.status.poisonDamage) || Math.max(1, damage * 0.06));
    }
    if (opts.status?.armorBreakSeconds) {
      status.armorBreakUntil = Math.max(status.armorBreakUntil, now + opts.status.armorBreakSeconds * 1000);
      status.armorBreakRatio = Math.max(status.armorBreakRatio, Number(opts.status.armorBreak) || 0);
    }
    if (opts.status?.stunSeconds && Math.random() < (opts.status.stunChance ?? 1)) {
      // Boss 不進入永久暈眩，而是產生短暫破綻窗口，保留 Boss 戰節奏。
      status.staggerUntil = Math.max(status.staggerUntil, now + Math.min(1200, opts.status.stunSeconds * 700));
      vulnerableUntilRef.current = Math.max(vulnerableUntilRef.current, status.staggerUntil);
    }
    const windowMultiplier = now < vulnerableUntilRef.current ? 1.35 : 0.7;
    const armorBreakMultiplier = now < status.armorBreakUntil ? 1 + status.armorBreakRatio : 1;
    const finalDamage = Math.max(1, Math.round(damage * windowMultiplier * armorBreakMultiplier));
    setVisualState('Hurt');
    scheduleTimeout(() => { if (!deadRef.current && !stunnedRef.current) setVisualState('Idle'); }, 320);
    spawnDamage(bossPos.current.x, bossPos.current.y + 1, bossPos.current.z, finalDamage, opts.crit || windowMultiplier > 1);
    shakeCamera(opts.crit ? 0.6 : 0.3);
    triggerHitstop(0.05);
    if (opts.audioProfileId) SFX.weaponImpact(opts.audioProfileId, opts.crit || windowMultiplier > 1);
    else SFX.hit(opts.crit || windowMultiplier > 1);
    hpRef.current -= finalDamage;
    if (hpRef.current <= 0) {
      setHp(0);
      stunnedRef.current = true;
      setStunned(true);
      telegraphRef.current = null;
      setTelegraph(null);
      const seal = profile?.seal || { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '守護者封印' };
      openSeal({
        bossId: def.id,
        bossName: def.name,
        ...seal,
        onResolve: (success) => {
          if (success) finishBoss();
          else {
            stunnedRef.current = false;
            setStunned(false);
            setVisualState('Idle');
            hpRef.current = Math.max(1, Math.round(def.hp * seal.recoveryPercent));
            setHp(hpRef.current);
            attackReadyAtRef.current = performance.now() + 1800;
          }
        },
      });
    } else setHp(hpRef.current);
  };

  function finishBoss() {
    setVisualState('Defeat');
    scheduleTimeout(() => {
      deadRef.current = true;
      setDead(true);
      defeatBoss(def.id);
      SFX.seal();
      if (grantBlueprint) unlockBlueprint(`blueprint_${def.id}`);
      const runtimeStore = useStore.getState();
      if (rewardGold > 0) addGold(Math.round(rewardGold * (runtimeStore.getEquipmentRuntime?.().goldDrop || 1)));
      if (grantLoot) grantMonsterLoot(runtimeStore, { ...def, tier: 'boss' });
      if (def.regionId) {
        runtimeStore.recordRegionEventSignal?.({ regionId: def.regionId, type: 'defeat', targetId: def.id, tier: 'boss', amount: 1 });
        runtimeStore.recordStorySignal?.({ regionId: def.regionId, type: 'defeat', targetId: def.id, tier: 'boss', amount: 1 });
      }
      runtimeStore.onCombatEvent('boss', { bossId: def.id });
      onDefeated?.(def.id);
    }, 720);
  }

  const apiRef = useRef({});
  apiRef.current.id = `boss_${def.id}`;
  apiRef.current.kind = 'boss';
  apiRef.current.def = def;
  apiRef.current.getPos = () => ({ x: bossPos.current.x, z: bossPos.current.z });
  apiRef.current.takeHit = takeHit;
  apiRef.current.alive = () => !deadRef.current;
  apiRef.current.hpRatio = () => Math.max(0, hpRef.current / Math.max(1, def.hp));
  useEffect(() => registerEnemy(apiRef.current), []);

  if (dead) {
    return (
      <group position={[bossPos.current.x, bossPos.current.y + 0.3, bossPos.current.z]}>
        <Sparkles count={80} scale={4} size={10} speed={2} color="#ffd24a" />
        <Html zIndexRange={[20, 0]} center><div className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-black text-amber-950 shadow-xl">{def.name} 已完成封印</div></Html>
      </group>
    );
  }

  return (
    <>
      <RigidBody ref={bodyRef} type="kinematicPosition" colliders="ball" position={[resolvedSpawn.x, resolvedSpawn.y + bossHoverHeight, resolvedSpawn.z]} userData={{ kind: 'boss' }} enabledRotations={[false, false, false]}>
        <group>
          {def.modelAssetId ? (
            <group position={def.modelPosition || [0, -1.2, 0]} scale={def.modelScale || 1}>
              <AnimatedProductionModel assetId={def.modelAssetId} instanceId={`boss-${def.id}`} kind="boss" clipName={visualState} loop={!['Hurt', 'Defeat'].includes(visualState)} fallback={<BossFallback def={def} meshRef={meshRef} />} />
            </group>
          ) : <BossFallback def={def} meshRef={meshRef} />}
          <Html zIndexRange={[20, 0]} position={[0, 2.45, 0]} center>
            <div className="min-w-48 select-none text-center">
              <div className="text-sm font-black text-white drop-shadow">{def.name}</div>
              <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-white/80 bg-slate-900/60"><div className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-[width] duration-200" style={{ width: `${(hp / def.hp) * 100}%` }} /></div>
              {stunned && <div className="mt-1 rounded-full bg-amber-400 px-2 py-1 text-xs font-black text-amber-950">破綻出現：完成封印</div>}
            </div>
          </Html>
          {!stunned && <BossPhaseBanner phase={currentPhase} vulnerable={vulnerable} />}
          {stunned && <Sparkles count={24} scale={3} size={5} speed={0.5} color="#ffe273" />}
        </group>
      </RigidBody>
      <BossSkillTelegraph telegraph={telegraph} />
    </>
  );
}

function BossFallback({ def, meshRef }) {
  return (
    <>
      <mesh ref={meshRef}><dodecahedronGeometry args={[1.4, 0]} /><meshToonMaterial color={def.color} /></mesh>
      <mesh scale={1.06}><dodecahedronGeometry args={[1.4, 0]} /><meshBasicMaterial color="#0a0a12" side={1} /></mesh>
    </>
  );
}
