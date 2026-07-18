// 可重複使用的多元件角色 Rig。
// 玩家與 NPC 共用部位命名、裝備 Socket 與動畫骨架；外層 RigidBody 負責實際碰撞。
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Outlined from './Outlined.jsx';
import AnimatedProductionModel from './AnimatedProductionModel.jsx';
import Model from './Model.jsx';
import { CHARACTER_ASSETS } from '../../data/productionAssetCatalog.js';
import { isAttackAnimationState, isMovingAnimationState, resolveCharacterAnimationState } from '../../services/AnimationStateService.js';
import { getResidentCharacterVisualProfile } from '../../services/CharacterCompanionVisualService.js';


export default function CharacterActorRig(props) {
  const {
    profileId = 'npc_adult',
    appearanceProfileId = null,
    actorId = null,
    skinColor = '#f0d2aa',
    hairColor = '#5b3b2b',
    outfitColor = '#5f8fd5',
    trimColor = '#f2cf79',
    role = 'villager',
    weapon = null,
    offHand = null,
    headEquipment = null,
    backEquipment = null,
    accessoryEquipment = null,
    attachmentsOverride = null,
    hiddenBodyNodes = null,
    weaponDefinition = null,
    motion = { isMoving: false, isAttacking: false },
    bodyScale = [1, 1, 1],
  } = props;
  const asset = CHARACTER_ASSETS[profileId];
  const visualProfile = getResidentCharacterVisualProfile(appearanceProfileId);
  const assetId = visualProfile?.bodyAssetId || asset?.assetId;
  const animationState = resolveCharacterAnimationState(motion, weaponDefinition);
  const proceduralMotion = {
    ...motion,
    isMoving: isMovingAnimationState(animationState),
    isAttacking: isAttackAnimationState(animationState),
  };
  const materialOverrides = useMemo(() => ({
    pelvis: outfitColor,
    torso: outfitColor,
    trim: trimColor,
    hair: hairColor,
    head: skinColor,
    neck: skinColor,
    hand_l: skinColor,
    hand_r: skinColor,
    lower_arm_l: skinColor,
    lower_arm_r: skinColor,
  }), [hairColor, outfitColor, skinColor, trimColor]);
  const attachments = useMemo(() => mergeAttachmentMaps({
    SOCKET_main_hand: weapon,
    SOCKET_off_hand: offHand,
    SOCKET_head: headEquipment,
    SOCKET_back: backEquipment,
    SOCKET_accessory: accessoryEquipment,
    SOCKET_work_tool: role !== 'player' && !visualProfile ? <ProductionRoleTool role={role} trimColor={trimColor} /> : null,
  }, visualProfile ? {
    SOCKET_face: <Model assetId={visualProfile.faceAssetId} kind="resident-face" instanceId={`${actorId || appearanceProfileId}-face`} />,
    SOCKET_hair: <Model assetId={visualProfile.hairAssetId} kind="resident-hair" instanceId={`${actorId || appearanceProfileId}-hair`} />,
    SOCKET_costume_override: <Model assetId={visualProfile.outfitAssetId} kind="resident-outfit" instanceId={`${actorId || appearanceProfileId}-outfit`} />,
    SOCKET_work_tool: <Model assetId={visualProfile.roleAssetId} kind="resident-role" instanceId={`${actorId || appearanceProfileId}-role`} />,
  } : null, attachmentsOverride), [accessoryEquipment, actorId, appearanceProfileId, attachmentsOverride, backEquipment, headEquipment, offHand, role, trimColor, visualProfile, weapon]);
  const hiddenBodyNodeKey = [...(hiddenBodyNodes || [])].sort().join('|');
  const resolvedHiddenBodyNodes = useMemo(
    () => [...new Set([...(visualProfile?.hiddenBodyNodes || []), ...(hiddenBodyNodes || [])])],
    [hiddenBodyNodeKey, visualProfile],
  );
  const childScale = visualProfile ? 1 : profileId === 'npc_child' ? 0.82 : 1;

  if (!assetId) return <ProceduralCharacterRig {...props} motion={proceduralMotion} />;

  return (
    <AnimatedProductionModel
      assetId={assetId}
      instanceId={actorId || `character-${profileId}-${role}`}
      kind="character"
      clipName={animationState.requestedClip}
      clipCandidates={animationState.clipCandidates}
      loop={animationState.loop}
      attachments={attachments}
      materialOverrides={materialOverrides}
      hiddenBodyNodes={resolvedHiddenBodyNodes}
      scale={[bodyScale[0] * childScale, bodyScale[1] * childScale, bodyScale[2] * childScale]}
      fallback={<ProceduralCharacterRig {...props} motion={proceduralMotion} />}
    />
  );
}

function mergeAttachmentMaps(...maps) {
  const result = {};
  maps.filter(Boolean).forEach((map) => {
    Object.entries(map).forEach(([socketName, attachment]) => {
      if (!attachment) return;
      result[socketName] = result[socketName]
        ? <>{result[socketName]}{attachment}</>
        : attachment;
    });
  });
  return result;
}

function ProductionRoleTool({ role, trimColor }) {
  if (role === 'blacksmith') return <group rotation={[0.15, 0, -0.2]}><Outlined color="#67503b" position={[0, -0.22, 0]} outlineScale={1.01}><cylinderGeometry args={[0.045, 0.055, 0.72, 7]} /></Outlined><Outlined color="#6f7680" position={[0, 0.18, 0]} outlineScale={1.01}><boxGeometry args={[0.32, 0.16, 0.16]} /></Outlined></group>;
  if (role === 'carpenter') return <group rotation={[0.1, 0, -0.18]}><Outlined color="#755337" position={[0, -0.18, 0]} outlineScale={1.01}><cylinderGeometry args={[0.04, 0.05, 0.65, 7]} /></Outlined><Outlined color={trimColor} position={[0, 0.18, 0]} outlineScale={1.01}><boxGeometry args={[0.16, 0.28, 0.08]} /></Outlined></group>;
  if (role === 'merchant') return <Outlined color="#9a603d" position={[0, -0.1, 0]} outlineScale={1.01}><boxGeometry args={[0.35, 0.45, 0.24]} /></Outlined>;
  return null;
}

function ProceduralCharacterRig({
  profileId = 'npc_adult',
  skinColor = '#f0d2aa',
  hairColor = '#5b3b2b',
  outfitColor = '#5f8fd5',
  trimColor = '#f2cf79',
  role = 'villager',
  hairStyle = 'short',
  face = 'smile',
  accessory = null,
  weapon = null,
  offHand = null,
  headEquipment = null,
  backEquipment = null,
  accessoryEquipment = null,
  attachmentsOverride = null,
  motion = { isMoving: false, isAttacking: false },
  paused = false,
  bodyScale = [1, 1, 1],
}) {
  const upperArmL = useRef();
  const upperArmR = useRef();
  const upperLegL = useRef();
  const upperLegR = useRef();
  const lowerArmR = useRef();
  const attackTimer = useRef(0);
  const resolvedAttachments = attachmentsOverride || {};
  const resolvedWeapon = resolvedAttachments.SOCKET_main_hand || weapon;
  const resolvedOffHand = resolvedAttachments.SOCKET_off_hand || offHand;
  const resolvedHead = resolvedAttachments.SOCKET_head || headEquipment;
  const resolvedBack = resolvedAttachments.SOCKET_back || backEquipment;
  const resolvedAccessory = resolvedAttachments.SOCKET_accessory || accessoryEquipment;

  useFrame((_, delta) => {
    if (paused) return;
    const time = performance.now() * 0.006;
    if (motion.isMoving) {
      const swing = Math.sin(time) * 0.58;
      if (upperArmL.current) upperArmL.current.rotation.x = swing;
      if (upperArmR.current) upperArmR.current.rotation.x = -swing;
      if (upperLegL.current) upperLegL.current.rotation.x = -swing;
      if (upperLegR.current) upperLegR.current.rotation.x = swing;
    } else {
      [upperArmL, upperArmR, upperLegL, upperLegR].forEach((part) => {
        if (part.current) part.current.rotation.x *= 0.78;
      });
    }
    if (motion.isAttacking && attackTimer.current <= 0) attackTimer.current = 0.24;
    if (attackTimer.current > 0) {
      attackTimer.current -= delta;
      if (upperArmR.current) upperArmR.current.rotation.x = -1.15;
      if (lowerArmR.current) lowerArmR.current.rotation.x = -0.55;
    } else if (lowerArmR.current) lowerArmR.current.rotation.x *= 0.75;
  });

  const childScale = profileId === 'npc_child' ? 0.82 : 1;
  return (
    <group name={`character-rig-${profileId}`} scale={[bodyScale[0] * childScale, bodyScale[1] * childScale, bodyScale[2] * childScale]}>
      <group name="pelvis" position={[0, 0.72, 0]}>
        <Outlined color={mix(outfitColor, '#2f3441', 0.28)} outlineScale={1.01}><boxGeometry args={[0.48, 0.28, 0.34]} /></Outlined>
      </group>

      <group name="torso" position={[0, 1.18, 0]}>
        <Outlined color={outfitColor} outlineScale={1.01}><cylinderGeometry args={[0.30, 0.37, 0.78, 12]} /></Outlined>
        <Outlined color={trimColor} position={[0, 0.07, 0.31]} outlineScale={1.012}><boxGeometry args={[0.44, 0.13, 0.06]} /></Outlined>
        <RoleTorsoAccessory role={role} color={trimColor} />
      </group>

      <group name="neck" position={[0, 1.59, 0]}>
        <Outlined color={skinColor} outlineScale={1.015}><cylinderGeometry args={[0.12, 0.13, 0.16, 8]} /></Outlined>
      </group>

      <group name="head" position={[0, 1.82, 0]}>
        <Outlined color={skinColor} outlineScale={1.012}><sphereGeometry args={[0.34, 18, 16]} /></Outlined>
        <Hair styleId={hairStyle} color={hairColor} />
        <Face faceId={face} />
        <HeadAccessory accessory={accessory} role={role} trimColor={trimColor} />
        <group name="socket_head" position={[0, 0.38, 0]}>{resolvedHead}</group>
        <group name="socket_dialogue" position={[0, 0.62, 0]} />
      </group>

      <group ref={upperArmL} name="upper_arm_l" position={[-0.43, 1.43, 0]}>
        <Outlined color={outfitColor} position={[0, -0.22, 0]} outlineScale={1.014}><cylinderGeometry args={[0.105, 0.115, 0.46, 8]} /></Outlined>
        <group name="lower_arm_l" position={[0, -0.47, 0]}>
          <Outlined color={skinColor} position={[0, -0.2, 0]} outlineScale={1.014}><cylinderGeometry args={[0.09, 0.1, 0.4, 8]} /></Outlined>
          <group name="hand_l" position={[0, -0.45, 0]}>
            <Outlined color={skinColor} outlineScale={1.018}><sphereGeometry args={[0.11, 10, 8]} /></Outlined>
            <group name="socket_off_hand" position={[0, -0.03, 0.08]}>{resolvedOffHand}</group>
          </group>
        </group>
      </group>

      <group ref={upperArmR} name="upper_arm_r" position={[0.43, 1.43, 0]}>
        <Outlined color={outfitColor} position={[0, -0.22, 0]} outlineScale={1.014}><cylinderGeometry args={[0.105, 0.115, 0.46, 8]} /></Outlined>
        <group ref={lowerArmR} name="lower_arm_r" position={[0, -0.47, 0]}>
          <Outlined color={skinColor} position={[0, -0.2, 0]} outlineScale={1.014}><cylinderGeometry args={[0.09, 0.1, 0.4, 8]} /></Outlined>
          <group name="hand_r" position={[0, -0.45, 0]}>
            <Outlined color={skinColor} outlineScale={1.018}><sphereGeometry args={[0.11, 10, 8]} /></Outlined>
            <group name="socket_main_hand" position={[0, -0.03, 0.08]}>
              {resolvedWeapon}
            </group>
          </group>
        </group>
      </group>

      <group ref={upperLegL} name="upper_leg_l" position={[-0.18, 0.68, 0]}>
        <Outlined color={mix(outfitColor, '#263248', 0.42)} position={[0, -0.22, 0]} outlineScale={1.014}><cylinderGeometry args={[0.13, 0.14, 0.46, 8]} /></Outlined>
        <group name="lower_leg_l" position={[0, -0.47, 0]}>
          <Outlined color={mix(outfitColor, '#263248', 0.56)} position={[0, -0.18, 0]} outlineScale={1.014}><cylinderGeometry args={[0.11, 0.12, 0.36, 8]} /></Outlined>
          <group name="foot_l" position={[0, -0.39, 0.08]}>
            <Outlined color="#3f3b3a" outlineScale={1.012}><boxGeometry args={[0.24, 0.15, 0.38]} /></Outlined>
          </group>
        </group>
      </group>
      <group ref={upperLegR} name="upper_leg_r" position={[0.18, 0.68, 0]}>
        <Outlined color={mix(outfitColor, '#263248', 0.42)} position={[0, -0.22, 0]} outlineScale={1.014}><cylinderGeometry args={[0.13, 0.14, 0.46, 8]} /></Outlined>
        <group name="lower_leg_r" position={[0, -0.47, 0]}>
          <Outlined color={mix(outfitColor, '#263248', 0.56)} position={[0, -0.18, 0]} outlineScale={1.014}><cylinderGeometry args={[0.11, 0.12, 0.36, 8]} /></Outlined>
          <group name="foot_r" position={[0, -0.39, 0.08]}>
            <Outlined color="#3f3b3a" outlineScale={1.012}><boxGeometry args={[0.24, 0.15, 0.38]} /></Outlined>
          </group>
        </group>
      </group>

      <group name="socket_back" position={[0, 1.35, -0.31]}>{resolvedBack}</group>
      <group name="socket_fairy" position={[-0.75, 1.75, -0.15]} />
      <group name="socket_accessory" position={[0, 1.12, 0.35]}>{resolvedAccessory}</group>
      <group name="socket_body" position={[0, 1.18, 0]}>{resolvedAttachments.SOCKET_body}</group>
      <group name="socket_hands" position={[0, 0.82, 0]}>{resolvedAttachments.SOCKET_hands}</group>
      <group name="socket_legs" position={[0, 0.46, 0]}>{resolvedAttachments.SOCKET_legs}</group>
      <group name="socket_feet" position={[0, 0.08, 0]}>{resolvedAttachments.SOCKET_feet}</group>
      <group name="socket_waist" position={[0, 0.84, 0]}>{resolvedAttachments.SOCKET_waist}</group>
      <group name="socket_face" position={[0, 1.82, 0.34]}>{resolvedAttachments.SOCKET_face}</group>
      <group name="socket_hair" position={[0, 2.06, 0]}>{resolvedAttachments.SOCKET_hair}</group>
      <group name="socket_aura" position={[0, 0.05, 0]}>{resolvedAttachments.SOCKET_aura}</group>
      <group name="socket_costume_override" position={[0, 1.05, 0]}>{resolvedAttachments.SOCKET_costume_override}</group>
      <group name="socket_interaction_origin" position={[0, 1.02, 0.45]} />
      <RoleTool role={role} trimColor={trimColor} />
    </group>
  );
}

function RoleTorsoAccessory({ role, color }) {
  if (role === 'blacksmith') return <Outlined color="#5c4437" position={[0, -0.08, 0.31]} outlineScale={1.01}><boxGeometry args={[0.5, 0.58, 0.05]} /></Outlined>;
  if (role === 'merchant') return <Outlined color="#8b5a3b" position={[0.27, -0.08, 0.03]} rotation={[0, 0, -0.4]} outlineScale={1.01}><boxGeometry args={[0.12, 0.85, 0.08]} /></Outlined>;
  if (role === 'carpenter') return <Outlined color="#74553c" position={[0, -0.26, 0.29]} outlineScale={1.01}><boxGeometry args={[0.58, 0.16, 0.08]} /></Outlined>;
  if (role === 'chief') return <Outlined color={color} position={[0, 0.1, 0.32]} rotation={[Math.PI / 2, 0, Math.PI / 4]} outlineScale={1.012}><octahedronGeometry args={[0.12, 0]} /></Outlined>;
  return null;
}

function RoleTool({ role, trimColor }) {
  if (role === 'blacksmith') return <group name="role_tool" position={[0.64, 0.82, -0.06]} rotation={[0, 0, -0.45]}><Outlined color="#67503b" outlineScale={1.01}><cylinderGeometry args={[0.045, 0.055, 0.72, 7]} /></Outlined><Outlined color="#6f7680" position={[0, 0.38, 0]} outlineScale={1.01}><boxGeometry args={[0.32, 0.16, 0.16]} /></Outlined></group>;
  if (role === 'carpenter') return <group name="role_tool" position={[0.63, 0.8, 0]} rotation={[0, 0, -0.35]}><Outlined color="#755337" outlineScale={1.01}><cylinderGeometry args={[0.04, 0.05, 0.65, 7]} /></Outlined><Outlined color={trimColor} position={[0, 0.34, 0]} outlineScale={1.01}><boxGeometry args={[0.16, 0.28, 0.08]} /></Outlined></group>;
  if (role === 'merchant') return <Outlined name="role_tool" color="#9a603d" position={[-0.38, 0.95, -0.1]} outlineScale={1.01}><boxGeometry args={[0.35, 0.45, 0.24]} /></Outlined>;
  return null;
}

function Hair({ styleId = 'short', color }) {
  if (styleId === 'twin') return <group name="hair"><Outlined color={color} position={[0, 0.16, -0.03]} scale={[1.03, 0.65, 1.03]}><sphereGeometry args={[0.34, 14, 14]} /></Outlined><Outlined color={color} position={[-0.36, -0.02, -0.04]}><sphereGeometry args={[0.13, 10, 10]} /></Outlined><Outlined color={color} position={[0.36, -0.02, -0.04]}><sphereGeometry args={[0.13, 10, 10]} /></Outlined></group>;
  if (styleId === 'spiky') return <group name="hair">{[-0.22, 0, 0.22].map((x, index) => <Outlined key={x} color={color} position={[x, 0.31 + (index === 1 ? 0.05 : 0), 0]} rotation={[0, 0, x * 1.4]}><coneGeometry args={[0.14, 0.38, 6]} /></Outlined>)}</group>;
  if (styleId === 'bob') return <Outlined name="hair" color={color} position={[0, 0.06, -0.03]} scale={[1.04, 0.82, 1.04]}><sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.68]} /></Outlined>;
  return <Outlined name="hair" color={color} position={[0, 0.18, -0.02]} scale={[1.02, 0.58, 1.02]}><sphereGeometry args={[0.34, 14, 14]} /></Outlined>;
}

function Face({ faceId = 'smile' }) {
  const eyeScale = faceId === 'curious' ? 1.2 : 1;
  const mouthWidth = faceId === 'brave' ? 0.16 : faceId === 'calm' ? 0.1 : 0.14;
  return <group name="face" position={[0, 0, 0.31]}><mesh position={[-0.11, 0.06, 0]} scale={eyeScale}><sphereGeometry args={[0.026, 8, 8]} /><meshBasicMaterial color="#26333d" /></mesh><mesh position={[0.11, 0.06, 0]} scale={eyeScale}><sphereGeometry args={[0.026, 8, 8]} /><meshBasicMaterial color="#26333d" /></mesh><mesh position={[0, -0.09, 0]} scale={[mouthWidth, 0.028, 0.02]}><sphereGeometry args={[1, 10, 6]} /><meshBasicMaterial color="#a44f4f" /></mesh></group>;
}

function HeadAccessory({ accessory, role, trimColor }) {
  if (role === 'farmer') return <group name="head_accessory"><Outlined color="#d8b45c" position={[0, 0.34, 0]} scale={[1, 0.18, 1]} outlineScale={1.01}><sphereGeometry args={[0.48, 14, 8]} /></Outlined><Outlined color="#c8953e" position={[0, 0.45, 0]} outlineScale={1.01}><cylinderGeometry args={[0.25, 0.32, 0.25, 10]} /></Outlined></group>;
  if (role === 'chief') return <Outlined name="head_accessory" color={trimColor} position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 4]} outlineScale={1.01}><octahedronGeometry args={[0.16, 0]} /></Outlined>;
  if (accessory === 'starPin') return <Outlined name="head_accessory" color="#ffd34f" position={[0.25, 0.22, 0.18]} rotation={[Math.PI / 2, 0, 0]}><octahedronGeometry args={[0.08, 0]} /></Outlined>;
  if (accessory === 'leafPin') return <mesh name="head_accessory" position={[0.25, 0.2, 0.2]} rotation={[0, 0, -0.6]} scale={[0.08, 0.14, 0.03]}><sphereGeometry args={[1, 8, 8]} /><meshToonMaterial color="#68b65c" /></mesh>;
  if (accessory === 'glasses') return <group name="head_accessory" position={[0, 0.06, 0.33]}><mesh position={[-0.11, 0, 0]}><torusGeometry args={[0.07, 0.012, 6, 16]} /><meshBasicMaterial color="#4b5361" /></mesh><mesh position={[0.11, 0, 0]}><torusGeometry args={[0.07, 0.012, 6, 16]} /><meshBasicMaterial color="#4b5361" /></mesh><mesh scale={[0.05, 0.012, 0.012]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#4b5361" /></mesh></group>;
  return null;
}

function mix(a, b, ratio) {
  const parse = (hex) => hex.replace('#', '').match(/.{2}/g).map((value) => Number.parseInt(value, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const rgb = [ar, ag, ab].map((value, index) => Math.round(value * (1 - ratio) + [br, bg, bb][index] * ratio));
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
