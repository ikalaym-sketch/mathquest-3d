// v0.32 玩家裝備分包與Residency服務。
// 畫面附件、目前武器攻擊載體與命中特效共用同一Bundle，換裝後完整釋放舊引用。
import { DB } from '../data/index.js';
import { EQUIPMENT_SLOT_IDS } from '../data/equipmentSchema.js';
import { activateAssetBundle, defineAssetBundle, releaseAssetBundle } from './AssetBundleService.js';
import { resolveEquipmentInstance } from './EquipmentInstanceService.js';
import { resolveV035CombatEffectAssetId } from '../data/eventEffectV035Catalog.js';

export const MAX_PLAYER_EQUIPMENT_RESIDENT_ASSETS = 11;

export function getEquipmentLoadoutAssetIds(equipped = {}, equipmentInstances = {}) {
  const assetIds = [];
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const instance = resolveEquipmentInstance(equipped?.[slot], equipmentInstances);
    const item = instance ? DB[instance.definitionId] : null;
    if (item?.visualAssetId) assetIds.push(item.visualAssetId);
    if (slot === 'mainHand' && item) assetIds.push(item.deliveryAssetId, item.impactAssetId, resolveV035CombatEffectAssetId(item.vfxProfileId || item.baseArchetype));
  }
  return [...new Set(assetIds.filter(Boolean))];
}

export function activateEquipmentLoadoutBundle(equipped = {}, equipmentInstances = {}, actorId = 'player') {
  const assetIds = getEquipmentLoadoutAssetIds(equipped, equipmentInstances);
  const bundleId = `equipment-loadout:${actorId}:${hashAssetIds(assetIds)}`;
  defineAssetBundle(bundleId, assetIds);
  activateAssetBundle(bundleId);
  return {
    bundleId,
    assetIds,
    release: () => releaseAssetBundle(bundleId),
  };
}

function hashAssetIds(assetIds) {
  let hash = 2166136261;
  for (const char of assetIds.slice().sort().join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
