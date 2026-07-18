// v0.5.0 小怪：偵測/警戒(!)/追蹤/攻擊 + 巡邏(未警戒) + 10 行為樹
import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { playerPos, playerForward } from '../../input/playerPos.js';
import { registerEnemy } from '../../input/combat.js';
import { worldTime } from '../../input/worldTime.js';
import { SFX } from '../../audio/sfx.js';
import { spawnDamage, shakeCamera, triggerHitstop } from '../../input/fx.js';
import AnimatedProductionModel from '../3D/AnimatedProductionModel.jsx';
import { grantMonsterLoot } from '../../systems/regionLoot.js';
import { getRegionProductionLayout } from '../../data/regionProductionLayouts.js';
import { findNearestWalkablePoint, projectTraversalStep } from '../../services/TraversalSurfaceService.js';

export function Monster({ def, spawn, onDefeated }) {
  const bodyRef = useRef(null);
  const meshRef = useRef(null);
  const timersRef = useRef(new Set());
  const [hp, setHp] = useState(Math.round(def.hp * (worldTime.isNight ? 1.25 : 1)));
  const [alerted, setAlerted] = useState(false); // 頭頂驚嘆號
  const [visualState, setVisualState] = useState('Idle');
  const [removed, setRemoved] = useState(false);
  // 夜間強化：生成時若為夜晚，HP/傷害提升 25%
  const nightBornRef = useRef(worldTime.isNight);
  const maxHpRef = useRef(Math.round(def.hp * (worldTime.isNight ? 1.25 : 1)));
  const hpRef = useRef(maxHpRef.current);
  const nightAtkMul = nightBornRef.current ? 1.25 : 1;
  const state = useRef({
    hurtTimer: 0,
    hopTimer: 0,
    atkCd: 0,
    weavePhase: Math.random() * Math.PI * 2,
    dead: false,
    aggro: false,
    alertShownUntil: 0,
    kb: { x: 0, z: 0 }, // 擊退位移（衰減套用）
    burnUntil: 0, burnTick: 0, // 火：持續傷害
    freezeUntil: 0,            // 冰：減速
    shockUntil: 0,             // 雷：短暫暈眩
    poisonUntil: 0, poisonTick: 0, poisonDamage: 0, poisonStacks: 0,
    armorBreakUntil: 0, armorBreakRatio: 0,
    // 巡邏：以 spawn 為中心的隨機遊走目標
    patrolTarget: new THREE.Vector3(spawn.x, 0.5, spawn.z),
    patrolTimer: 0,
    barrierHitsRemaining: Number(def.eliteTraits?.barrierHits) || 0,
    pulseTimer: Number(def.eliteTraits?.pulseEvery) || 999,
    enraged: false,
  }).current;

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

  const isPaused = useStore((s) => s.isPaused);
  const traversalLayout = useMemo(() => def.regionId ? getRegionProductionLayout(def.regionId) : null, [def.regionId]);
  const resolvedSpawn = useMemo(() => traversalLayout
    ? findNearestWalkablePoint(traversalLayout, spawn.x, spawn.z)
    : { x: spawn.x, y: (spawn.y ?? 0.5) - 0.5, z: spawn.z }, [spawn.x, spawn.z, spawn.y, traversalLayout]);
  const baseY = traversalLayout ? resolvedSpawn.y + 0.5 : (spawn.y ?? 0.5);
  const pos = useMemo(() => new THREE.Vector3(resolvedSpawn.x, baseY, resolvedSpawn.z), [baseY, resolvedSpawn.x, resolvedSpawn.z]);
  const spawnV = useMemo(() => new THREE.Vector3(resolvedSpawn.x, baseY, resolvedSpawn.z), [baseY, resolvedSpawn.x, resolvedSpawn.z]);

  // 共用死亡處理：掉落 + 金幣(連擊/greed) + fortune + 事件
  const die = () => {
    if (state.dead) return;
    state.dead = true;
    setHp(0);
    setVisualState('Defeat');
    SFX.enemyDeath();
    const st = useStore.getState();
    if (def.grantLoot !== false) grantMonsterLoot(st, def);
    if (def.grantLoot !== false && st.talents?.fortune && Math.random() < 0.5) st.addToInventory('materials', def.regionMaterialId || 'mat_stone');
    if (def.regionId) {
      st.recordRegionEventSignal?.({ regionId: def.regionId, type: 'defeat', targetId: def.id, tier: def.tier || 'normal', amount: 1 });
      st.recordStorySignal?.({ regionId: def.regionId, type: 'defeat', targetId: def.id, tier: def.tier || 'normal', amount: 1 });
    }
    const combo = st.mathPerformance.consecutiveCorrect;
    const bonus = 1 + Math.min(combo, 5) * 0.2;
    const equipmentRuntime = st.getEquipmentRuntime?.() || { goldDrop: 1, rareDropChance: 0 };
    const greedMul = (st.talents?.greed ? 1.5 : 1) * equipmentRuntime.goldDrop;
    const baseGold = Number.isFinite(def.rewardGold) ? def.rewardGold : 10;
    if (baseGold > 0) st.addGold(Math.round(baseGold * bonus * greedMul));
    if (def.grantLoot !== false && equipmentRuntime.rareDropChance > 0 && Math.random() < equipmentRuntime.rareDropChance) st.addToInventory('materials', def.regionMaterialId || 'mat_stone');
    st.onCombatEvent && st.onCombatEvent('kill', { monsterId: def.id });
    scheduleTimeout(() => {
      setRemoved(true);
      onDefeated?.(def.id);
    }, 720);
  };

  const takeHit = (dmg, opts = {}) => {
    if ((state.hurtTimer > 0 && !opts.ignoreHurtCooldown) || state.dead) return;
    state.hurtTimer = 0.5;
    setVisualState('Hurt');
    scheduleTimeout(() => { if (!state.dead) setVisualState(state.aggro ? 'Move' : 'Idle'); }, 320);
    if (!state.aggro) triggerAggro();
    // 擊退：暫存位移，於 useFrame 衰減套用
    if (opts.knockback) {
      state.kb.x = opts.knockback.x;
      state.kb.z = opts.knockback.z;
    }
    // 傷害跳字 + 震動 + 頓幀
    // 元素相剋：命中弱點元素 → 傷害 +50%
    let finalDmg = dmg;
    if (state.barrierHitsRemaining > 0) {
      state.barrierHitsRemaining -= 1;
      finalDmg = Math.max(1, Math.round(finalDmg * 0.45));
      useStore.getState().showWorldHint(`${def.eliteTraits?.label || '精英護盾'}吸收了部分傷害，剩餘 ${state.barrierHitsRemaining} 層。`);
    }
    if (opts.element && opts.element === def.weak) finalDmg = Math.round(finalDmg * 1.5);
    // 施加元素狀態
    if (opts.element) {
      const now = performance.now();
      if (opts.element === 'fire') { state.burnUntil = now + 3000; state.burnTick = now; }
      else if (opts.element === 'ice') state.freezeUntil = now + 2000;
      else if (opts.element === 'lightning') state.shockUntil = now + 600;
    }
    if (opts.status) {
      const now = performance.now();
      if (opts.status.poisonSeconds) {
        const maxStacks = Math.max(1, Number(opts.status.poisonStacks) || 1);
        state.poisonStacks = now < state.poisonUntil ? Math.min(maxStacks, state.poisonStacks + 1) : 1;
        state.poisonUntil = Math.max(state.poisonUntil, now + opts.status.poisonSeconds * 1000);
        const basePoisonDamage = Number(opts.status.poisonDamage) || Math.max(1, Math.round(dmg * 0.08));
        state.poisonDamage = basePoisonDamage * state.poisonStacks;
        state.poisonTick = Math.min(state.poisonTick || now, now);
      }
      if (opts.status.stunSeconds && Math.random() < (opts.status.stunChance ?? 1)) {
        state.shockUntil = Math.max(state.shockUntil, now + opts.status.stunSeconds * 1000);
      }
      if (opts.status.armorBreakSeconds) {
        state.armorBreakUntil = now + opts.status.armorBreakSeconds * 1000;
        state.armorBreakRatio = Math.max(state.armorBreakRatio, Number(opts.status.armorBreak) || 0);
      }
    }
    if (performance.now() < state.armorBreakUntil) finalDmg = Math.round(finalDmg * (1 + state.armorBreakRatio));
    spawnDamage(pos.x, pos.y + 0.8, pos.z, finalDmg, opts.crit || (opts.element === def.weak));
    shakeCamera(opts.crit ? 0.5 : 0.25);
    triggerHitstop(0.04);
    if (opts.audioProfileId) SFX.weaponImpact(opts.audioProfileId, opts.crit || opts.element === def.weak);
    else SFX.hit(opts.crit || opts.element === def.weak);

    hpRef.current -= finalDmg;
    if (!state.enraged && def.eliteTraits && hpRef.current / maxHpRef.current <= def.eliteTraits.enrageThreshold) {
      state.enraged = true;
      useStore.getState().showWorldHint(`${def.name}進入強化狀態，攻擊頻率提高。`);
    }
    if (hpRef.current <= 0) {
      die();
    } else {
      setHp(hpRef.current);
    }
  };

  const triggerAggro = () => {
    state.aggro = true;
    setVisualState('Move');
    state.alertShownUntil = performance.now() + 1200; // 顯示 ! 1.2s
    setAlerted(true);
    scheduleTimeout(() => setAlerted(false), 1200);
  };

  // 註冊到戰鬥/小地圖系統
  const apiRef = useRef({});
  apiRef.current.id = useMemo(() => `${def.id}_${Math.random().toString(36).slice(2, 7)}`, [def]);
  apiRef.current.kind = 'monster';
  apiRef.current.def = def;
  apiRef.current.getPos = () => ({ x: pos.x, z: pos.z });
  apiRef.current.takeHit = takeHit;
  apiRef.current.alive = () => !state.dead;
  apiRef.current.hpRatio = () => Math.max(0, hpRef.current / Math.max(1, maxHpRef.current));
  useEffect(() => registerEnemy(apiRef.current), []);

  useFrame((_, delta) => {
    if (isPaused || state.dead) return;

    // 受擊閃爍 + 結束還原本色
    if (state.hurtTimer > 0) {
      state.hurtTimer -= delta;
      if (meshRef.current) {
        const flash = Math.floor(state.hurtTimer * 20) % 2 === 0;
        meshRef.current.material.color.set(flash ? '#ff3a3a' : def.color);
        if (state.hurtTimer <= 0) meshRef.current.material.color.set(def.color);
      }
    }

    const frameOrigin = { x: pos.x, z: pos.z };
    const player = playerPos;
    const toPlayer = new THREE.Vector3(player.x - pos.x, 0, player.z - pos.z);
    const dist = toPlayer.length();
    const dir = dist > 0.001 ? toPlayer.clone().normalize() : new THREE.Vector3();

    // ── 元素狀態處理 ──
    const now = performance.now();
    // 火：每 0.5s 造成 DOT
    if (now < state.burnUntil) {
      if (now - state.burnTick > 500) {
        state.burnTick = now;
        hpRef.current -= 3;
        spawnDamage(pos.x, pos.y + 0.8, pos.z, 3, false);
        if (hpRef.current <= 0 && !state.dead) { die(); }
        else setHp(hpRef.current);
      }
    }
    if (now < state.poisonUntil && now - state.poisonTick > 1000) {
      state.poisonTick = now;
      const poisonDamage = Math.max(1, state.poisonDamage);
      hpRef.current -= poisonDamage;
      spawnDamage(pos.x, pos.y + 0.8, pos.z, poisonDamage, false);
      if (hpRef.current <= 0 && !state.dead) die();
      else setHp(hpRef.current);
    }
    // 雷：暈眩期間完全不動作
    if (now < state.shockUntil) {
      if (bodyRef.current) bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: Math.max(pos.y, baseY - 0.9), z: pos.z });
      return;
    }
    // 冰：減速倍率
    const freezeMul = now < state.freezeUntil ? 0.45 : 1;

    // 精英脈衝：固定節奏顯示可預測近距離傷害，與一般怪形成明確差異。
    if (def.eliteTraits) {
      state.pulseTimer -= delta;
      if (state.pulseTimer <= 0) {
        state.pulseTimer = def.eliteTraits.pulseEvery * (state.enraged ? 0.72 : 1);
        if (dist <= def.eliteTraits.pulseRadius && !playerPos.invuln) {
          useStore.getState().receiveDamage(def.eliteTraits.pulseDamage, { source: apiRef.current, sourceType: 'elitePulse' });
          useStore.getState().showWorldHint(`${def.eliteTraits.label}脈衝：-${def.eliteTraits.pulseDamage} HP`);
          shakeCamera(0.25);
        }
      }
    }

    // ── 偵測：進入 aggroRange → 警戒；離太遠(1.5x) → 脫離 ──
    if (!state.aggro && dist <= def.aggroRange) triggerAggro();
    else if (state.aggro && dist > def.aggroRange * 1.6) { state.aggro = false; setVisualState('Idle'); }

    if (!state.aggro) {
      // ── 巡邏模式（未發現玩家）：於 spawn 附近隨機遊走 ──
      patrol(delta * freezeMul);
    } else {
      // ── 警戒模式：依行為樹追蹤/風箏/逃跑 ──
      chase(delta * freezeMul, dist, dir);
      // 攻擊：進入 atkRange 且冷卻好 → 造成傷害
      state.atkCd -= delta * (state.enraged ? 1.35 : 1);
      if (def.atkRange > 0 && dist <= def.atkRange && state.atkCd <= 0) {
        if (!playerPos.invuln) {
          const st = useStore.getState();
          const guardMul = st.talents?.guardian ? 0.75 : 1;
          st.receiveDamage(Math.max(1, Math.round(def.atk * guardMul * nightAtkMul)), { source: apiRef.current, sourceType: 'monster' });
          setVisualState('Attack');
          scheduleTimeout(() => { if (!state.dead) setVisualState('Move'); }, 420);
          SFX.playerHurt();
        }
        state.atkCd = def.ranged ? 1.5 : 1.0;
      }
    }

    if (bodyRef.current) {
      // 套用擊退位移並衰減。
      if (Math.abs(state.kb.x) > 0.01 || Math.abs(state.kb.z) > 0.01) {
        pos.x += state.kb.x * delta * 6;
        pos.z += state.kb.z * delta * 6;
        state.kb.x *= Math.pow(0.001, delta);
        state.kb.z *= Math.pow(0.001, delta);
      }
      // 八區怪物只能走在地面、道路與橋梁；遇到水域或裂縫時先嘗試沿單軸滑動，否則停在原位。
      if (traversalLayout) {
        const projected = projectTraversalStep(traversalLayout, frameOrigin, { x: pos.x, z: pos.z }, { hoverHeight: 0.5 });
        pos.set(projected.x, projected.y, projected.z);
      }
      bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: Math.max(pos.y, baseY - 0.9), z: pos.z });
    }
  });

  // 巡邏：抵達目標或逾時就換一個 spawn 附近的新目標
  function patrol(delta) {
    state.patrolTimer -= delta;
    const toTarget = state.patrolTarget.clone().sub(pos);
    toTarget.y = 0;
    if (toTarget.length() < 0.3 || state.patrolTimer <= 0) {
      const ang = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 2.5;
      const targetX = spawnV.x + Math.cos(ang) * r;
      const targetZ = spawnV.z + Math.sin(ang) * r;
      if (traversalLayout) {
        const safeTarget = findNearestWalkablePoint(traversalLayout, targetX, targetZ, 4, 1);
        state.patrolTarget.set(safeTarget.x, safeTarget.y + 0.5, safeTarget.z);
      } else state.patrolTarget.set(targetX, baseY, targetZ);
      state.patrolTimer = 2 + Math.random() * 2;
    }
    // 靜止型(食人花/坦克)巡邏時僅原地待命
    if (def.behavior === 'lure') {
      pos.y = baseY + Math.sin(performance.now() * 0.002) * 0.1;
      return;
    }
    const step = toTarget.normalize().multiplyScalar(Math.min(def.speed, 1.2) * delta * 0.6);
    pos.add(step);
    pos.y = baseY;
  }

  // 警戒追蹤：沿用 10 種行為樹（含石像鬼背對才動）
  function chase(delta, dist, dir) {
    switch (def.behavior) {
      case 'hop':
        state.hopTimer -= delta;
        if (state.hopTimer <= 0) { state.hopTimer = 1.0; pos.addScaledVector(dir, def.speed); }
        pos.y = baseY + Math.abs(Math.sin(performance.now() * 0.004)) * 0.4;
        break;
      case 'shield':
        pos.addScaledVector(dir, def.speed * delta * 0.7);
        break;
      case 'kite': // 弓手：太近後退、太遠靠近，維持射程
        if (dist < 4) pos.addScaledVector(dir, -def.speed * delta);
        else if (dist > def.atkRange) pos.addScaledVector(dir, def.speed * delta);
        break;
      case 'burrow':
        if (dist > 6) { pos.y = baseY - 0.9; } else { pos.y = baseY; pos.addScaledVector(dir, def.speed * delta); }
        break;
      case 'weave': {
        state.weavePhase += delta * 3;
        const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(Math.sin(state.weavePhase) * def.speed * delta);
        pos.addScaledVector(dir, def.speed * delta * 0.7).add(perp);
        break;
      }
      case 'weeping': {
        // 石像鬼：只有玩家「背對」時才移動（玩家前方向量與 玩家→石像鬼 同向 => 在玩家背後）
        const fwd = playerForward();
        const pToM = { x: pos.x - playerPos.x, z: pos.z - playerPos.z };
        const dot = fwd.x * pToM.x + fwd.z * pToM.z; // >0 表在玩家後方
        if (dot > 0) pos.addScaledVector(dir, def.speed * delta);
        break;
      }
      case 'lure':
        pos.y = baseY + Math.sin(performance.now() * 0.003) * 0.15;
        break;
      case 'explode':
        pos.addScaledVector(dir, def.speed * delta);
        break;
      case 'flee':
        pos.addScaledVector(dir, -def.speed * delta); // 被發現就高速逃跑
        break;
      case 'tank':
        pos.addScaledVector(dir, def.speed * delta * 0.6);
        break;
      default:
        break;
    }
  }

  if (removed) return null;

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="ball"
      position={[resolvedSpawn.x, baseY, resolvedSpawn.z]}
      userData={{ kind: 'monster', def }}
    >
      <MonsterVisual def={def} meshRef={meshRef} animationState={visualState} instanceId={apiRef.current.id} />
      {/* 頭頂驚嘆號（發現玩家瞬間） */}
      {alerted && (
        <Html zIndexRange={[20, 0]} position={[0, 1.3, 0]} center>
          <div className="text-red-400 font-display text-2xl font-bold select-none animate-bounce">!</div>
        </Html>
      )}
      {def.eliteTraits && (
        <Html zIndexRange={[20, 0]} position={[0, 1.72, 0]} center distanceFactor={12}>
          <div className="rounded-full border border-white/80 bg-violet-700/88 px-2 py-1 text-[10px] font-black text-white shadow-lg">
            精英 · {def.eliteTraits.label}{state.enraged ? ' · 強化' : ''}
          </div>
        </Html>
      )}
      {/* 血條（左端錨定） */}
      <group position={[0, 1, 0]}>
        <mesh position={[-(1 - hp / maxHpRef.current) / 2, 0, 0]} scale={[hp / maxHpRef.current, 1, 1]}>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="#ff4a4a" />
        </mesh>
      </group>
    </RigidBody>
  );
}


// 怪物輪廓依行為類型明確區分，讓兒童可直接從外型辨識近戰、遠程與特殊怪。
function MonsterVisual({ def, meshRef, animationState, instanceId }) {
  const behavior = def.behavior;
  const fallback = (
    <group>
      <mesh ref={meshRef} castShadow>
        {behavior === 'hop' && <sphereGeometry args={[0.58, 16, 12]} />}
        {behavior === 'shield' && <capsuleGeometry args={[0.42, 0.55, 8, 12]} />}
        {behavior === 'kite' && <coneGeometry args={[0.52, 1.15, 8]} />}
        {behavior === 'burrow' && <dodecahedronGeometry args={[0.62, 0]} />}
        {behavior === 'weave' && <octahedronGeometry args={[0.68, 0]} />}
        {behavior === 'weeping' && <boxGeometry args={[0.9, 1.15, 0.75]} />}
        {behavior === 'lure' && <coneGeometry args={[0.62, 1.15, 7]} />}
        {behavior === 'explode' && <icosahedronGeometry args={[0.62, 1]} />}
        {behavior === 'flee' && <capsuleGeometry args={[0.34, 0.42, 8, 10]} />}
        {behavior === 'tank' && <boxGeometry args={[1.15, 1.3, 0.95]} />}
        <meshToonMaterial color={def.color} />
      </mesh>

      {behavior === 'shield' && (
        <mesh position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.48, 0.48, 0.16, 12]} />
          <meshToonMaterial color="#d8c06a" />
        </mesh>
      )}
      {behavior === 'kite' && (
        <group position={[0.5, 0.05, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.38, 0.06, 8, 16, Math.PI]} /><meshToonMaterial color="#8a552f" /></mesh>
          <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.9, 6]} /><meshToonMaterial color="#f1d27a" /></mesh>
        </group>
      )}
      {behavior === 'burrow' && (
        <group>
          {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, -0.1, 0]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}><coneGeometry args={[0.16, 0.9, 6]} /><meshToonMaterial color="#7d4c2c" /></mesh>)}
        </group>
      )}
      {behavior === 'weave' && (
        <mesh position={[0, -0.52, 0]}><coneGeometry args={[0.42, 0.75, 8]} /><meshToonMaterial color="#d9f4ff" transparent opacity={0.75} /></mesh>
      )}
      {behavior === 'weeping' && (
        <group>
          {[-0.65, 0.65].map((x) => <mesh key={x} position={[x, 0.25, 0]} rotation={[0, 0, x > 0 ? -0.7 : 0.7]}><coneGeometry args={[0.36, 1.2, 5]} /><meshToonMaterial color="#6f7180" /></mesh>)}
        </group>
      )}
      {behavior === 'lure' && (
        <group position={[0, 0.45, 0]}>
          {[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]} rotation={[0, -a, 0]}><sphereGeometry args={[0.22, 8, 8]} /><meshToonMaterial color="#ff82b4" /></mesh>; })}
        </group>
      )}
      {behavior === 'explode' && (
        <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.06, 0.06, 0.5, 6]} /><meshToonMaterial color="#d9a34b" /></mesh>
      )}
      {behavior === 'flee' && (
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 4]}><coneGeometry args={[0.48, 0.7, 4]} /><meshToonMaterial color="#f3cf55" /></mesh>
      )}
      {behavior === 'tank' && (
        <group>
          <mesh position={[0, 0.72, 0]}><boxGeometry args={[1.28, 0.35, 1.05]} /><meshToonMaterial color="#babcd0" /></mesh>
          <mesh position={[0.7, 0, 0]}><boxGeometry args={[0.3, 1.15, 0.85]} /><meshToonMaterial color="#555d76" /></mesh>
        </group>
      )}
      {/* 眼睛是共通辨識焦點，但會依怪物比例自動保持在正面。 */}
      <mesh position={[0, 0.13, 0.54]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.13, 0.62]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#25304a" />
      </mesh>
    </group>
  );
  if (!def.modelAssetId) return fallback;
  return (
    <group scale={def.modelScale || 0.9} position={def.modelPosition || [0, -0.5, 0]}>
      <AnimatedProductionModel
        assetId={def.modelAssetId}
        instanceId={instanceId}
        kind={def.tier === 'elite' ? 'elite' : 'monster'}
        clipName={animationState}
        loop={!['Attack', 'Hurt', 'Defeat'].includes(animationState)}
        fallback={fallback}
      />
    </group>
  );
}
