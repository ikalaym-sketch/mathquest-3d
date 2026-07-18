// v0.29.1 玩家裝備與外觀的唯一 3D 掛載層。
// Store 只保存 instanceId／assetId；本層統一轉成 Socket 附件，避免 PlayerAvatar 逐欄硬接元件。
import { useMemo } from 'react';
import Model from './Model.jsx';
import Outlined from './Outlined.jsx';
import EquipmentAttachmentMesh from './EquipmentAttachmentMesh.jsx';
import { EQUIPMENT_SOCKET_BY_SLOT, resolvePlayerVisualLoadout } from '../../services/EquipmentVisualResolverService.js';
import { getCanonicalAsset } from '../../data/productionAssetCatalog.js';

export default function EquipmentAttachmentLayer({ equipped, equipmentInstances, appearance = {}, mainHandOverride = null, children }) {
  const loadout = useMemo(
    () => resolvePlayerVisualLoadout(equipped, equipmentInstances),
    [equipped, equipmentInstances],
  );
  const hiddenBodyNodes = useMemo(
    () => [...new Set(Object.values(loadout).flatMap((profile) => profile?.hideBodyNodes || []))],
    [loadout],
  );
  const offHandRef = equipped.offHand || (loadout.mainHand?.handedness === 'dual' ? equipped.mainHand : null);
  const attachments = useMemo(() => ({
    SOCKET_head: <EquipmentAttachmentMesh equipmentRef={equipped.head} equipmentInstances={equipmentInstances} slot="head" />,
    SOCKET_body: <EquipmentAttachmentMesh equipmentRef={equipped.body} equipmentInstances={equipmentInstances} slot="body" />,
    SOCKET_hands: <EquipmentAttachmentMesh equipmentRef={equipped.hands} equipmentInstances={equipmentInstances} slot="hands" />,
    SOCKET_legs: <EquipmentAttachmentMesh equipmentRef={equipped.legs} equipmentInstances={equipmentInstances} slot="legs" />,
    SOCKET_feet: <EquipmentAttachmentMesh equipmentRef={equipped.feet} equipmentInstances={equipmentInstances} slot="feet" />,
    SOCKET_main_hand: mainHandOverride || <EquipmentAttachmentMesh equipmentRef={equipped.mainHand} equipmentInstances={equipmentInstances} slot="mainHand" />,
    SOCKET_off_hand: <EquipmentAttachmentMesh equipmentRef={offHandRef} equipmentInstances={equipmentInstances} slot="offHand" />,
    SOCKET_accessory: <EquipmentAttachmentMesh equipmentRef={equipped.accessory} equipmentInstances={equipmentInstances} slot="accessory" />,
    SOCKET_face: <AppearanceAttachment appearanceRef={appearance.faceAccessory} slot="faceAccessory" />,
    SOCKET_hair: <AppearanceAttachment appearanceRef={appearance.hairAccessory} slot="hairAccessory" />,
    SOCKET_back: <AppearanceAttachment appearanceRef={appearance.back} slot="back" />,
    SOCKET_waist: <AppearanceAttachment appearanceRef={appearance.waist} slot="waist" />,
    SOCKET_aura: <AppearanceAttachment appearanceRef={appearance.aura} slot="aura" />,
    SOCKET_costume_override: <AppearanceAttachment appearanceRef={appearance.costumeOverride} slot="costumeOverride" />,
  }), [appearance, equipped, equipmentInstances, mainHandOverride, offHandRef]);
  return children({ attachments, hiddenBodyNodes });
}

function AppearanceAttachment({ appearanceRef, slot }) {
  if (!appearanceRef) return null;
  const asset = getCanonicalAsset(appearanceRef);
  if (asset) return <Model assetId={asset.assetId} kind="appearance" instanceId={`appearance-${slot}-${asset.assetId}`} />;
  if (slot === 'back') return <Outlined color="#7e5c46"><boxGeometry args={[0.42, 0.6, 0.14]} /></Outlined>;
  if (slot === 'waist') return <Outlined color="#c9a861" rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.22, 0.035, 8, 18]} /></Outlined>;
  if (slot === 'aura') return <Outlined color="#8eddf2" rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.55, 0.025, 8, 28]} /></Outlined>;
  if (slot === 'faceAccessory') return <Outlined color="#4d5868"><boxGeometry args={[0.34, 0.08, 0.05]} /></Outlined>;
  if (slot === 'hairAccessory') return <Outlined color="#f1cf70"><sphereGeometry args={[0.1, 8, 6]} /></Outlined>;
  return null;
}

export { EQUIPMENT_SOCKET_BY_SLOT };
