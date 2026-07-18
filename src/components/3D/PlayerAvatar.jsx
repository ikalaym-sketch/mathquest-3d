// v0.29.1 模組化玩家角色。
// 角色外觀、八欄裝備、六欄外觀覆蓋與農具暫時掛載，全部經 EquipmentAttachmentLayer 進入正式 Socket。
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { ARMOR_SET_META } from '../../data/index.js';
import { resolveEquippedEntry } from '../../services/EquipmentInstanceService.js';
import Outlined from './Outlined.jsx';
import CharacterActorRig from './CharacterActorRig.jsx';
import EquipmentAttachmentLayer from './EquipmentAttachmentLayer.jsx';
import Model from './Model.jsx';
import { resolveFarmToolModelAssetId } from '../../services/FarmAssetService.js';
import { resolvePlayerAppearanceAssets } from '../../data/characterCompanionV031Catalog.js';
import { activateEquipmentLoadoutBundle } from '../../services/EquipmentAssetService.js';

function bodyColorFromEquip(piece) {
  if (!piece) return '#3a6ac7';
  const set = ARMOR_SET_META.find((entry) => entry.key === piece.setKey);
  return set ? set.color : piece.color || '#3a6ac7';
}

const BODY_SCALE = {
  compact: [0.92, 0.94, 0.92],
  balanced: [1, 1, 1],
  sturdy: [1.08, 1.03, 1.08],
};

export default function PlayerAvatar({ motion = { locomotionState: 'idle', actionState: null }, ...props }) {
  const equipped = useStore((state) => state.equipped);
  const equipmentInstances = useStore((state) => state.equipmentInstances);
  const equipmentAppearance = useStore((state) => state.equipmentAppearance);
  const profile = useStore((state) => state.characterProfile);
  const isPaused = useStore((state) => state.isPaused);
  const currentScene = useStore((state) => state.currentScene);
  const lastToolAction = useFarmStore((state) => state.lastToolAction);
  const bodyEntry = resolveEquippedEntry(equipped, 'body', equipmentInstances);
  const mainHandEntry = resolveEquippedEntry(equipped, 'mainHand', equipmentInstances);
  const bodyColor = bodyColorFromEquip(bodyEntry.item);
  const bodyScale = BODY_SCALE[profile?.bodyType] || BODY_SCALE.balanced;
  const appearanceAssets = resolvePlayerAppearanceAssets(profile);
  const toolActive = currentScene === 'farm' && lastToolAction && Date.now() - lastToolAction.id < 700;
  const toolOverride = toolActive ? <FarmToolMesh toolId={lastToolAction.toolId} /> : null;

  useEffect(() => {
    const runtime = activateEquipmentLoadoutBundle(equipped, equipmentInstances, 'player');
    return runtime.release;
  }, [equipped, equipmentInstances]);

  return (
    <group {...props}>
      <EquipmentAttachmentLayer
        equipped={equipped}
        equipmentInstances={equipmentInstances}
        appearance={equipmentAppearance}
        mainHandOverride={toolOverride}
      >
        {({ attachments, hiddenBodyNodes }) => (
          <CharacterActorRig
            profileId="player_child"
            actorId="player"
            skinColor={profile?.skinColor || '#f2c9a5'}
            hairColor={profile?.hairColor || '#47352b'}
            hairStyle={profile?.hairStyle || 'short'}
            face={profile?.face || 'smile'}
            accessory={profile?.accessory || null}
            outfitColor={bodyColor}
            trimColor="#f6d879"
            role="player"
            motion={{
              ...motion,
              animationSet: mainHandEntry.item?.animationSet,
              weaponArchetype: mainHandEntry.item?.baseArchetype,
              toolAction: toolActive ? lastToolAction.toolId : motion.toolAction,
            }}
            paused={isPaused}
            bodyScale={bodyScale}
            weaponDefinition={mainHandEntry.item}
            attachmentsOverride={mergePlayerAppearanceAttachments(attachments, appearanceAssets)}
            hiddenBodyNodes={[...new Set([...hiddenBodyNodes, ...appearanceAssets.hiddenBodyNodes])]}
          />
        )}
      </EquipmentAttachmentLayer>
    </group>
  );
}

function mergePlayerAppearanceAttachments(attachments, appearanceAssets) {
  const generated = {
    SOCKET_hair: <Model assetId={appearanceAssets.hairAssetId} kind="player-hair" instanceId={`player-hair-${appearanceAssets.hairAssetId}`} />,
    SOCKET_face: <Model assetId={appearanceAssets.faceAssetId} kind="player-face" instanceId={`player-face-${appearanceAssets.faceAssetId}`} />,
    SOCKET_costume_override: <Model assetId={appearanceAssets.outfitAssetId} kind="player-outfit" instanceId={`player-outfit-${appearanceAssets.outfitAssetId}`} />,
    [appearanceAssets.accessorySocket || 'SOCKET_accessory']: appearanceAssets.accessoryAssetId
      ? <Model assetId={appearanceAssets.accessoryAssetId} kind="player-accessory" instanceId={`player-accessory-${appearanceAssets.accessoryAssetId}`} />
      : null,
  };
  const merged = { ...attachments };
  Object.entries(generated).forEach(([socketName, attachment]) => {
    if (!attachment) return;
    merged[socketName] = merged[socketName]
      ? <>{attachment}{merged[socketName]}</>
      : attachment;
  });
  return merged;
}

function FarmToolMesh({ toolId }) {
  const canonicalAssetId = resolveFarmToolModelAssetId(toolId);
  if (canonicalAssetId) {
    return (
      <group rotation={[0.08, 0, -0.18]} scale={0.72}>
        <Model
          assetId={canonicalAssetId}
          kind="farm-tool-attachment"
          instanceId={`player-farm-tool-${toolId}`}
        />
      </group>
    );
  }

  // 動物照護工具不在本版八件正式農具配額內，保留低成本視覺回退，避免操作時手部完全空白。
  if (toolId === 'feed') return <Outlined color="#d3a85a" position={[0, -0.08, 0]}><boxGeometry args={[0.34, 0.45, 0.22]} /></Outlined>;
  if (toolId === 'hand') return null;
  if (toolId === 'brush') return <group rotation={[0.15, 0, -0.2]}><Outlined color="#765238" position={[0, -0.22, 0]}><cylinderGeometry args={[0.035, 0.045, 0.72, 8]} /></Outlined><Outlined color="#b88454" position={[0, 0.18, 0]}><boxGeometry args={[0.34, 0.12, 0.12]} /></Outlined></group>;
  return null;
}
