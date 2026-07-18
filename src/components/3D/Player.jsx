// Player：共用地面／涉水／游泳／冰面／危險液體／裂縫移動狀態機。
// v0.24 起所有區域移動都以 Canonical Traversal + Water Profile 為唯一判定來源。
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import PlayerAvatar from './PlayerAvatar.jsx';
import { inputState } from '../../input/inputState.js';
import { playerPos } from '../../input/playerPos.js';
import { findNearestEnemy, lockState } from '../../input/combat.js';
import { getCombatProfile, rollDamage } from '../../utils/combatProfile.js';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { envState } from '../Scenes/BiomeEvent.jsx';
import { SFX } from '../../audio/sfx.js';
import { cameraState } from '../../input/cameraState.js';
import { SCENE_RUNTIME } from '../../data/sceneRuntime.js';
import { getRegionProductionLayout } from '../../data/regionProductionLayouts.js';
import { findNearestWalkablePoint, isSafeTraversalPoint, sampleTraversalSurface } from '../../services/TraversalSurfaceService.js';
import {
  WATER_STATE,
  classifyWaterState,
  computeWaterMotion,
  findNearestWaterExit,
  isNearWaterEdge,
} from '../../services/WaterTraversalService.js';
import { executeWeaponCombat } from '../../services/CombatExecutionService.js';

const SPEED = 5;
const LOCK_RANGE = 11;
const DODGE_SPEED = 14;
const DODGE_TIME = 0.35;
const JUMP_SPEED = 6.8;
const PLAYER_HOVER_HEIGHT = 1.2;

export default function Player() {
  const bodyRef = useRef(null);
  const avatarRef = useRef(null);
  const isPaused = useStore((s) => s.isPaused);
  const currentScene = useStore((s) => s.currentScene);
  const respawnToken = useStore((s) => s.respawnToken);
  const currentRegionId = useStore((s) => s.worldProgress.currentRegionId);
  const equippedWeapon = useStore((s) => s.equipped.mainHand);
  const equipped = useStore((s) => s.equipped);
  const talents = useStore((s) => s.talents);
  const lastToolAction = useFarmStore((s) => s.lastToolAction);
  const teleportRequest = useStore((s) => s.playerTeleportRequest);
  const [motion, setMotion] = useState({
    locomotionState: 'idle',
    actionState: null,
    weaponArchetype: 'unarmed_focus',
    comboIndex: 1,
    toolAction: null,
    interactionType: null,
    // 舊欄位暫留至 NPC 與程序化 Fallback 全部完成切換。
    isMoving: false,
    isAttacking: false,
    locomotion: 'ground',
  });

  const { camera } = useThree();
  const camTarget = useRef(new THREE.Vector3());
  const camPos = useRef(new THREE.Vector3());
  const lockedRef = useRef(null);
  const atkCd = useRef(0);
  const dodge = useRef({ t: 0, dx: 0, dz: 0 });
  const lastScene = useRef(currentScene);
  const lastWarningKey = useRef('');
  const sceneGraceUntil = useRef(0);
  const lastSafePosition = useRef({ x: 0, y: 1.2, z: 8.5 });
  const lastTraversalHintAt = useRef(0);
  const iceWarningShown = useRef(false);
  const waterStateRef = useRef(WATER_STATE.GROUND);
  const waterEnteredAt = useRef(0);
  const oxygenRef = useRef(null);
  const waterPublishAt = useRef(0);
  const hazardDamageBuffer = useRef(0);
  const attackCounter = useRef(0);
  const comboState = useRef({ index: 0, lastAttackAt: 0 });
  const attackActionToken = useRef(0);
  const passiveRegenBuffer = useRef({ hp: 0, mp: 0 });

  // 場景切換與復活：依 Canonical 地形尋找安全出生點。
  useEffect(() => {
    const cfg = SCENE_RUNTIME[currentScene] || SCENE_RUNTIME.village;
    const regionLayout = currentScene === 'region' ? getRegionProductionLayout(currentRegionId) : null;
    const safeRegionSpawn = regionLayout ? findNearestWalkablePoint(regionLayout, regionLayout.spawn[0], regionLayout.spawn[2]) : null;
    const spawn = safeRegionSpawn
      ? { x: safeRegionSpawn.x, y: safeRegionSpawn.y + PLAYER_HOVER_HEIGHT, z: safeRegionSpawn.z }
      : cfg.spawn;
    lastSafePosition.current = { ...spawn };
    waterStateRef.current = WATER_STATE.GROUND;
    oxygenRef.current = null;
    hazardDamageBuffer.current = 0;
    if (bodyRef.current) {
      bodyRef.current.setGravityScale(1, true);
      bodyRef.current.setTranslation(spawn, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    useStore.getState().setWaterRuntime?.({ state: 'ground', waterId: null, profileId: null, oxygen: null, isUnderwater: false });
    if (cfg.camera) {
      cameraState.yaw = cfg.camera.yaw;
      cameraState.pitch = cfg.camera.pitch;
      cameraState.distance = cfg.camera.distance;
    }
    sceneGraceUntil.current = performance.now() + 1800;
    playerPos.invuln = true;
    const protectionTimer = window.setTimeout(() => { playerPos.invuln = false; }, 2800);
    lastScene.current = currentScene;
    return () => window.clearTimeout(protectionTimer);
  }, [currentRegionId, currentScene, respawnToken]);

  // 室內 Pocket、任務或救援使用單一傳送請求；完成後立即消耗，避免重複執行。
  useEffect(() => {
    if (!teleportRequest || !bodyRef.current) return;
    bodyRef.current.setGravityScale(1, true);
    bodyRef.current.setTranslation(teleportRequest.position, true);
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    lastSafePosition.current = { ...teleportRequest.position };
    sceneGraceUntil.current = performance.now() + 900;
    useStore.getState().consumePlayerTeleport?.(teleportRequest.id);
  }, [teleportRequest]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    if (isPaused) {
      body.setLinvel({ x: 0, y: body.linvel().y, z: 0 }, true);
      return;
    }

    const st = useStore.getState();
    if (st.playerState.hp <= 0) {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      st.triggerDefeat?.(currentScene);
      return;
    }

    const p = body.translation();
    const cfg = SCENE_RUNTIME[currentScene] || SCENE_RUNTIME.village;
    const activeInterior = st.activeRegionInterior;
    const regionLayout = currentScene === 'region' && !activeInterior
      ? getRegionProductionLayout(st.worldProgress.currentRegionId)
      : null;
    const traversalSurface = regionLayout ? sampleTraversalSurface(regionLayout, p.x, p.z) : null;
    const waterContext = regionLayout
      ? classifyWaterState(regionLayout, p, waterStateRef.current)
      : { state: WATER_STATE.GROUND, water: null, profile: null };
    const boundaryActive = performance.now() >= sceneGraceUntil.current;
    const now = performance.now();

    if (waterStateRef.current !== waterContext.state) {
      const previousWaterState = waterStateRef.current;
      waterStateRef.current = waterContext.state;
      waterEnteredAt.current = now;
      if ([WATER_STATE.WADE, WATER_STATE.SWIM].includes(waterContext.state) || [WATER_STATE.WADE, WATER_STATE.SWIM].includes(previousWaterState)) SFX.waterSplash();
      if ([WATER_STATE.HAZARD, WATER_STATE.RAVINE].includes(waterContext.state)) SFX.environmentWarning();
      oxygenRef.current = waterContext.profile?.oxygenSeconds ?? null;
      iceWarningShown.current = false;
      if ([WATER_STATE.WADE, WATER_STATE.SWIM, WATER_STATE.ICE].includes(waterContext.state) && now - lastTraversalHintAt.current > 1200) {
        const message = waterContext.state === WATER_STATE.SWIM
          ? '進入深水：移動可游泳，跳躍鍵可上浮，靠近岸邊再次按跳躍可上岸。'
          : waterContext.state === WATER_STATE.ICE
            ? '冰面較滑，轉向與停止都需要較長距離。'
            : '進入淺水或濕地，移動速度會降低。';
        st.showWorldHint?.(message);
        lastTraversalHintAt.current = now;
      }
    }

    // 危險液體與裂縫採兒童安全救援，不允許永久卡死或掉出世界。
    if (regionLayout && boundaryActive && waterContext.state === WATER_STATE.RAVINE && p.y < -0.65) {
      rescueToSafePosition(body, st, lastSafePosition.current, '小精靈把你從裂縫旁救回安全地點。');
      return;
    }
    if (regionLayout && boundaryActive && waterContext.state === WATER_STATE.HAZARD) {
      hazardDamageBuffer.current += (waterContext.profile.damagePerSecond || 0) * delta;
      if (hazardDamageBuffer.current >= 1) {
        const damage = Math.floor(hazardDamageBuffer.current);
        hazardDamageBuffer.current -= damage;
        st.receiveDamage?.(damage, { sourceType: 'hazard' });
      }
      if (now - waterEnteredAt.current >= (waterContext.profile.rescueDelay || 1.4) * 1000 || p.y < (traversalSurface?.y || 0) - 1.2) {
        rescueToSafePosition(body, st, lastSafePosition.current, '冷卻液具有危險性，小精靈已把你帶回安全區。');
        return;
      }
    } else {
      hazardDamageBuffer.current = 0;
    }

    // 地面、道路、橋梁與冰面才更新最後安全位置；水中不得覆寫救援點。
    if (regionLayout && traversalSurface?.walkable
      && p.y <= traversalSurface.y + 1.4
      && Math.abs(body.linvel().y) < 0.5
      && isSafeTraversalPoint(regionLayout, p.x, p.z, 1.05)) {
      lastSafePosition.current = { x: p.x, y: traversalSurface.y + PLAYER_HOVER_HEIGHT, z: p.z };
    }

    // 邊界與室內 Pocket 保護。
    const bounds = activeInterior?.bounds || cfg.bounds;
    const nearEdge = p.x < bounds.minX + bounds.warning || p.x > bounds.maxX - bounds.warning
      || p.z < bounds.minZ + bounds.warning || p.z > bounds.maxZ - bounds.warning;
    if (nearEdge && boundaryActive && !activeInterior) {
      const warningKey = `${currentScene}:${Math.floor(p.x)}:${Math.floor(p.z)}`;
      if (warningKey !== lastWarningKey.current) {
        st.showWorldHint?.('已接近場景邊界，請沿道路返回。');
        lastWarningKey.current = warningKey;
      }
    }
    const outOfBounds = p.x < bounds.minX || p.x > bounds.maxX || p.z < bounds.minZ || p.z > bounds.maxZ || p.y < (activeInterior?.safeY ?? cfg.safeY);
    if (outOfBounds && boundaryActive) {
      const fallback = activeInterior?.spawn || (regionLayout ? lastSafePosition.current : cfg.spawn);
      body.setGravityScale(1, true);
      body.setTranslation(fallback, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      st.showWorldHint?.(activeInterior ? '室內守護結界把你帶回入口。' : '魔法結界把你帶回安全位置。');
      return;
    }

    if (atkCd.current > 0) atkCd.current -= delta;

    const nearest = waterContext.state === WATER_STATE.SWIM ? null : findNearestEnemy({ x: p.x, z: p.z }, LOCK_RANGE);
    lockedRef.current = nearest ? nearest.api : null;
    if (nearest) {
      lockState.id = nearest.api.id; lockState.x = nearest.pos.x; lockState.z = nearest.pos.z; lockState.active = true;
    } else {
      lockState.active = false; lockState.id = null;
    }

    const companionRuntime = st.getCompanionRuntime?.() || { modifiers: {} };
    const companionSpeed = Number(companionRuntime.modifiers?.moveSpeedBonus) || 0;
    const equipmentRuntime = st.getEquipmentRuntime?.() || { moveSpeed: 1, dodgeDuration: 1, manaPerSecond: 0, outOfCombatHpPerSecond: 0, outOfCombatDelaySeconds: 6 };
    const speedMul = (1 + (talents?.swift ? 0.15 : 0) + companionSpeed) * equipmentRuntime.moveSpeed * (envState.slow ? 0.6 : 1);

    // 套裝被動採真實 frame delta，不再依遊戲世界分鐘誤算恢復量。
    if (equipmentRuntime.manaPerSecond > 0 && st.playerState.mp < st.playerState.maxMp) {
      passiveRegenBuffer.current.mp += equipmentRuntime.manaPerSecond * delta;
      if (passiveRegenBuffer.current.mp >= 1) {
        const restore = Math.floor(passiveRegenBuffer.current.mp);
        passiveRegenBuffer.current.mp -= restore;
        st.modifyMp?.(restore);
      }
    }
    const outOfCombatSeconds = (Date.now() - (st.lastCombatAtMs || 0)) / 1000;
    if (equipmentRuntime.outOfCombatHpPerSecond > 0 && outOfCombatSeconds >= equipmentRuntime.outOfCombatDelaySeconds && st.playerState.hp < st.playerState.maxHp) {
      passiveRegenBuffer.current.hp += equipmentRuntime.outOfCombatHpPerSecond * delta;
      if (passiveRegenBuffer.current.hp >= 1) {
        const restore = Math.floor(passiveRegenBuffer.current.hp);
        passiveRegenBuffer.current.hp -= restore;
        st.modifyHp?.(restore);
      }
    }

    // 攝影機朝向決定移動方向。
    const inputX = inputState.move.x;
    const inputY = inputState.move.y;
    const cos = Math.cos(cameraState.yaw);
    const sin = Math.sin(cameraState.yaw);
    const moveWX = inputX * cos + inputY * sin;
    const moveWZ = inputX * sin - inputY * cos;
    const currentVelocity = body.linvel();
    let locomotion = waterContext.state;

    // 水中氧氣僅在角色完全潛入水面下才消耗；浮在水面會自動恢復。
    const isUnderwater = waterContext.state === WATER_STATE.SWIM && p.y < (waterContext.surfaceY ?? 0.13) - 0.48;
    if (waterContext.state === WATER_STATE.SWIM && waterContext.profile?.oxygenSeconds) {
      const maxOxygen = waterContext.profile.oxygenSeconds * (1 + (Number(companionRuntime.modifiers?.oxygenBonus) || 0));
      oxygenRef.current = isUnderwater
        ? Math.max(0, (oxygenRef.current ?? maxOxygen) - delta)
        : Math.min(maxOxygen, (oxygenRef.current ?? maxOxygen) + delta * 2.4);
      if (oxygenRef.current <= 0) {
        const exit = findNearestWaterExit(regionLayout, waterContext.water, p) || lastSafePosition.current;
        rescueToSafePosition(body, st, { x: exit.x, y: exit.y + PLAYER_HOVER_HEIGHT, z: exit.z }, '需要換氣，小精靈把你帶回最近岸邊。');
        return;
      }
    } else {
      oxygenRef.current = waterContext.profile?.oxygenSeconds ?? null;
    }

    const iceStress = waterContext.state === WATER_STATE.ICE
      ? THREE.MathUtils.clamp((now - waterEnteredAt.current) / ((waterContext.profile?.breakAfterSeconds || 9) * 1000), 0, 1)
      : null;
    if (iceStress != null && iceStress >= 0.65 && !iceWarningShown.current) {
      iceWarningShown.current = true;
      SFX.environmentWarning();
      st.showWorldHint?.('冰面出現裂紋，請繼續前進並靠近岸邊。');
    }
    if (iceStress >= 1) {
      const exit = findNearestWaterExit(regionLayout, waterContext.water, p, 100);
      const fallback = exit ? { x: exit.x, y: exit.y + PLAYER_HOVER_HEIGHT, z: exit.z } : { x: regionLayout.spawn[0], y: regionLayout.spawn[1] + PLAYER_HOVER_HEIGHT, z: regionLayout.spawn[2] };
      rescueToSafePosition(body, st, fallback, '冰面裂開前，小精靈已把你帶到安全岸邊。');
      return;
    }

    if (now - waterPublishAt.current > 220) {
      waterPublishAt.current = now;
      st.setWaterRuntime?.({
        state: waterContext.state,
        waterId: waterContext.water?.id || null,
        profileId: waterContext.profile?.profileId || null,
        oxygen: oxygenRef.current,
        oxygenMax: waterContext.profile?.oxygenSeconds ? waterContext.profile.oxygenSeconds * (1 + (Number(companionRuntime.modifiers?.oxygenBonus) || 0)) : null,
        isUnderwater,
        iceStress,
      });
    }

    // 跳躍／上浮／上岸。
    const grounded = activeInterior
      ? Math.abs(currentVelocity.y) < 0.35
      : regionLayout
        ? Boolean(traversalSurface?.walkable)
          && Math.abs(p.y - (traversalSurface.y + PLAYER_HOVER_HEIGHT)) <= 0.36
          && Math.abs(currentVelocity.y) < 0.4
        : p.y <= cfg.spawn.y + 0.05 && Math.abs(currentVelocity.y) < 0.25;
    const jumpQueued = inputState.jumpQueued;
    if (jumpQueued) inputState.jumpQueued = false;

    if (waterContext.state === WATER_STATE.SWIM) {
      body.setGravityScale(0.08, true);
      if (jumpQueued && isNearWaterEdge(waterContext.water, p.x, p.z, 1.8)) {
        const exit = findNearestWaterExit(regionLayout, waterContext.water, p);
        if (exit) {
          body.setGravityScale(1, true);
          body.setTranslation({ x: exit.x, y: exit.y + PLAYER_HOVER_HEIGHT, z: exit.z }, true);
          body.setLinvel({ x: 0, y: 1.4, z: 0 }, true);
          lastSafePosition.current = { x: exit.x, y: exit.y + PLAYER_HOVER_HEIGHT, z: exit.z };
          st.showWorldHint?.('安全上岸。');
          return;
        }
      }
      const waterMotion = computeWaterMotion({ state: WATER_STATE.SWIM, profile: waterContext.profile, input: { x: inputX, y: inputY }, yaw: cameraState.yaw, verticalVelocity: currentVelocity.y, delta, jumpQueued });
      const targetFloatY = (waterContext.surfaceY ?? 0.13) + 0.55;
      const buoyancy = THREE.MathUtils.clamp((targetFloatY - p.y) * 3.2, -1.4, 1.8);
      const swimMul = 1 + (Number(companionRuntime.modifiers?.swimSpeedBonus) || 0);
      body.setLinvel({ ...waterMotion.velocity, x: waterMotion.velocity.x * swimMul, z: waterMotion.velocity.z * swimMul, y: jumpQueued ? 2.9 : buoyancy }, true);
      inputState.dodgeQueued = false;
    } else if (waterContext.state === WATER_STATE.WADE) {
      body.setGravityScale(1, true);
      const waterMotion = computeWaterMotion({ state: WATER_STATE.WADE, profile: waterContext.profile, input: { x: inputX, y: inputY }, yaw: cameraState.yaw, verticalVelocity: currentVelocity.y, delta, jumpQueued });
      body.setLinvel({ ...waterMotion.velocity, x: waterMotion.velocity.x * speedMul, z: waterMotion.velocity.z * speedMul }, true);
      if (jumpQueued && grounded) body.setLinvel({ x: body.linvel().x, y: JUMP_SPEED * 0.72, z: body.linvel().z }, true);
      inputState.dodgeQueued = false;
    } else if (waterContext.state === WATER_STATE.ICE) {
      body.setGravityScale(1, true);
      const waterMotion = computeWaterMotion({ state: WATER_STATE.ICE, profile: waterContext.profile, input: { x: inputX, y: inputY }, yaw: cameraState.yaw, verticalVelocity: currentVelocity.y, delta, jumpQueued });
      const traction = THREE.MathUtils.clamp((waterMotion.traction || 0.22) * delta * 8, 0.02, 0.3);
      body.setLinvel({
        x: THREE.MathUtils.lerp(currentVelocity.x, waterMotion.velocity.x * speedMul, traction),
        y: currentVelocity.y,
        z: THREE.MathUtils.lerp(currentVelocity.z, waterMotion.velocity.z * speedMul, traction),
      }, true);
      if (jumpQueued && grounded) body.setLinvel({ x: body.linvel().x, y: JUMP_SPEED, z: body.linvel().z }, true);
    } else if (![WATER_STATE.HAZARD, WATER_STATE.RAVINE].includes(waterContext.state)) {
      body.setGravityScale(1, true);
      if (jumpQueued && grounded && dodge.current.t <= 0) {
        body.setLinvel({ x: currentVelocity.x, y: JUMP_SPEED, z: currentVelocity.z }, true);
        st.showWorldHint?.('跳躍！');
      }

      // 翻滾只允許在正常地面與室內使用。
      if (inputState.dodgeQueued && dodge.current.t <= 0) {
        inputState.dodgeQueued = false;
        const dodgeTime = DODGE_TIME * equipmentRuntime.dodgeDuration;
        let dx = moveWX;
        let dz = moveWZ;
        if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) {
          dx = Math.sin(playerPos.yaw); dz = Math.cos(playerPos.yaw);
        }
        const length = Math.hypot(dx, dz) || 1;
        dodge.current = { t: dodgeTime, dx: dx / length, dz: dz / length };
        playerPos.invuln = true;
        SFX.dodge();
      }

      if (dodge.current.t > 0) {
        dodge.current.t -= delta;
        body.setLinvel({ x: dodge.current.dx * DODGE_SPEED, y: body.linvel().y, z: dodge.current.dz * DODGE_SPEED }, true);
        if (dodge.current.t <= 0) playerPos.invuln = false;
      } else {
        body.setLinvel({ x: moveWX * SPEED * speedMul, y: body.linvel().y, z: moveWZ * SPEED * speedMul }, true);
      }
      locomotion = 'ground';
    }

    // 朝向。
    let yaw = avatarRef.current ? avatarRef.current.rotation.y : 0;
    if (lockedRef.current) {
      const target = lockedRef.current.getPos();
      yaw = Math.atan2(target.x - p.x, target.z - p.z);
    } else if (Math.abs(moveWX) > 0.01 || Math.abs(moveWZ) > 0.01) {
      yaw = Math.atan2(moveWX, moveWZ);
    }
    if (avatarRef.current) avatarRef.current.rotation.y = yaw;

    playerPos.x = p.x;
    playerPos.y = p.y;
    playerPos.z = p.z;
    playerPos.yaw = yaw;
    playerPos.locomotion = locomotion;
    playerPos.waterId = waterContext.water?.id || null;

    // 游泳、危險液體與裂縫中禁止攻擊，避免動作與救援狀態衝突。
    let attacking = motion.actionState === 'Attack' || motion.isAttacking;
    let comboIndex = motion.comboIndex || 1;
    const canAttack = ![WATER_STATE.SWIM, WATER_STATE.HAZARD, WATER_STATE.RAVINE].includes(waterContext.state);
    if (inputState.attackQueued) {
      inputState.attackQueued = false;
      if (canAttack && atkCd.current <= 0) {
        const combatProfile = getCombatProfile(equippedWeapon);
        const spellCost = st.consumeSpellCost?.(combatProfile.mpCost || 0);
        if (spellCost && !spellCost.ok) return;
        attackCounter.current += 1;
        const attackAt = performance.now();
        comboIndex = attackAt - comboState.current.lastAttackAt <= 850
          ? (comboState.current.index % 3) + 1
          : 1;
        comboState.current = { index: comboIndex, lastAttackAt: attackAt };
        const talentAtk = talents?.power ? 1.2 : 1;
        const companionPower = Number(companionRuntime.modifiers?.battlePowerBonus) || 0;
        const companionProc = companionPower > 0 && Math.random() < 0.2;
        if (companionProc) st.triggerCompanionSkill?.();
        const companionAtk = companionProc ? 1 + companionPower : 1;
        const damageFactory = (targetApi) => {
          const roll = rollDamage(combatProfile, {
            targetHpRatio: targetApi?.hpRatio?.() ?? 1,
            attackIndex: attackCounter.current,
            armorRuntime: { ...equipmentRuntime, playerHp: st.playerState.hp, playerMaxHp: st.playerState.maxHp },
            activeEffects: st.activeItemEffects,
          });
          let element = combatProfile.element;
          if (element === 'random') element = ['fire', 'ice', 'lightning'][Math.floor(Math.random() * 3)];
          return {
            dmg: Math.round(roll.dmg * talentAtk * companionAtk),
            crit: roll.crit || companionProc,
            element,
            status: combatProfile.status,
          };
        };
        const onHit = ({ damage }) => {
          st.applyDamageRecovery?.(damage);
          const weaponLifesteal = Math.max(0, Number(combatProfile.effects?.lifesteal) || 0);
          if (weaponLifesteal > 0) st.modifyHp?.(Math.max(1, Math.round(damage * weaponLifesteal)));
        };
        executeWeaponCombat({
          profile: combatProfile,
          origin: { x: p.x, y: p.y, z: p.z },
          yaw,
          lockedApi: lockedRef.current,
          damageFactory,
          knockbackMagnitude: combatProfile.knockback,
          onHit,
        });
        atkCd.current = combatProfile.cooldown;
        SFX.weaponAttack(combatProfile.audioProfileId);
        attacking = true;
        attackActionToken.current += 1;
        const actionToken = attackActionToken.current;
        window.setTimeout(() => setMotion((value) => (
          actionToken === attackActionToken.current && value.actionState === 'Attack'
            ? { ...value, actionState: null, isAttacking: false }
            : value
        )), Math.max(220, Math.min(520, combatProfile.cooldown * 700)));
      }
    }
    const isFarmInteracting = currentScene === 'farm' && lastToolAction && Date.now() - lastToolAction.id < 650;
    const locomotionState = resolveLocomotionState({
      locomotion,
      isMoving: inputState.isMoving,
      grounded,
      dodging: dodge.current.t > 0,
    });
    const actionState = attacking ? 'Attack' : isFarmInteracting ? 'Interact' : locomotionState === 'dodge' ? 'Dodge' : null;
    const toolAction = isFarmInteracting ? lastToolAction.toolId : null;
    if (motion.isMoving !== inputState.isMoving
      || attacking !== motion.isAttacking
      || motion.locomotion !== locomotion
      || motion.locomotionState !== locomotionState
      || motion.actionState !== actionState
      || motion.comboIndex !== comboIndex
      || motion.toolAction !== toolAction) {
      setMotion({
        locomotionState,
        actionState,
        comboIndex,
        toolAction,
        interactionType: isFarmInteracting ? 'farm' : null,
        isMoving: inputState.isMoving,
        isAttacking: attacking,
        isInteracting: isFarmInteracting,
        locomotion,
      });
    }

    // 水中相機距離稍縮短並提高目標點，避免水面遮住角色。
    const targetY = p.y + (waterContext.state === WATER_STATE.SWIM ? 1.25 : 1.6);
    const mobileView = typeof window !== 'undefined' && window.innerWidth < 600;
    const cameraPitch = mobileView ? Math.max(cameraState.pitch, 0.64) : cameraState.pitch;
    const baseDistance = mobileView ? Math.min(cameraState.maxDistance, cameraState.distance * 1.12) : cameraState.distance;
    const cameraDistance = waterContext.state === WATER_STATE.SWIM ? baseDistance * 0.88 : baseDistance;
    const planarDistance = cameraDistance * Math.cos(cameraPitch);
    camTarget.current.set(p.x, targetY, p.z);
    camPos.current.set(
      p.x + Math.sin(cameraState.yaw) * planarDistance,
      targetY + Math.sin(cameraPitch) * cameraDistance,
      p.z + Math.cos(cameraState.yaw) * planarDistance,
    );
    camera.position.lerp(camPos.current, 1 - Math.pow(0.001, delta));
    camera.lookAt(camTarget.current);
  });

  return (
    <RigidBody ref={bodyRef} colliders={false} enabledRotations={[false, false, false]} position={[0, 1.2, 8.5]} mass={1}>
      <CapsuleCollider args={[0.5, 0.4]} position={[0, 0.9, 0]} />
      <group ref={avatarRef} position={[0, -0.4, 0]}>
        <PlayerAvatar motion={motion} />
      </group>
    </RigidBody>
  );
}


function resolveLocomotionState({ locomotion, isMoving, grounded, dodging }) {
  if (dodging) return 'dodge';
  if (locomotion === WATER_STATE.SWIM || locomotion === 'swim') return isMoving ? 'swim' : 'swimIdle';
  if (locomotion === WATER_STATE.WADE || locomotion === 'wade') return 'wade';
  if (!grounded) return 'jumpLoop';
  return isMoving ? 'walk' : 'idle';
}

function rescueToSafePosition(body, store, position, message) {
  body.setGravityScale(1, true);
  body.setTranslation(position, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  store.setWaterRuntime?.({ state: 'ground', waterId: null, profileId: null, oxygen: null, isUnderwater: false, iceStress: null });
  store.showWorldHint?.(message);
}
