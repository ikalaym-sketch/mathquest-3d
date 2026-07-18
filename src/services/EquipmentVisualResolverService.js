// v0.29 裝備外觀解析服務。
// UI、角色 Rig 與 Runtime 只傳 equipment instance；本服務統一決定資產、Socket、掛載修正與程序備援類型。
import { getCanonicalAsset } from '../data/productionAssetCatalog.js';
import { resolveEquipmentInstance } from './EquipmentInstanceService.js';
import { DB } from '../data/index.js';

export const EQUIPMENT_SOCKET_BY_SLOT = Object.freeze({
  head: 'SOCKET_head',
  body: 'SOCKET_body',
  hands: 'SOCKET_hands',
  legs: 'SOCKET_legs',
  feet: 'SOCKET_feet',
  mainHand: 'SOCKET_main_hand',
  offHand: 'SOCKET_off_hand',
  accessory: 'SOCKET_accessory',
  back: 'SOCKET_back',
  waist: 'SOCKET_waist',
  faceAccessory: 'SOCKET_face',
  hairAccessory: 'SOCKET_hair',
  aura: 'SOCKET_aura',
  costumeOverride: 'SOCKET_costume_override',
});

const DEFAULT_TRANSFORM = Object.freeze({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });

export function resolveEquipmentVisualProfile(ref, equipmentInstances = {}, slotOverride = null) {
  const instance = resolveEquipmentInstance(ref, equipmentInstances);
  const item = instance ? DB[instance.definitionId] : null;
  if (!item) return null;
  const slot = slotOverride || item.equipSlot || item.slot || (['melee', 'ranged'].includes(item.type) ? 'mainHand' : null);
  const assetId = item.visualAssetId || null;
  const asset = assetId ? getCanonicalAsset(assetId) : null;
  const transform = normalizeTransform(item.visualTransform);
  return {
    instance,
    item,
    slot,
    socket: item.visualSocket || EQUIPMENT_SOCKET_BY_SLOT[slot] || null,
    assetId: asset?.assetId || null,
    requestedAssetId: assetId,
    hasCanonicalAsset: Boolean(asset),
    transform,
    archetype: item.archetype || item.type || 'unknown',
    handedness: item.handedness || 'one',
    fallbackType: item.fallbackVisual || item.archetype || item.slot || item.type || 'generic',
    hideBodyNodes: Array.isArray(item.hideBodyNodes) ? [...item.hideBodyNodes] : [],
  };
}

export function resolvePlayerVisualLoadout(equipped = {}, equipmentInstances = {}) {
  return Object.fromEntries(Object.entries(equipped || {}).map(([slot, ref]) => [
    slot,
    resolveEquipmentVisualProfile(ref, equipmentInstances, slot),
  ]));
}

function normalizeTransform(value = {}) {
  return {
    position: normalizeVector(value.position, DEFAULT_TRANSFORM.position),
    rotation: normalizeVector(value.rotation, DEFAULT_TRANSFORM.rotation),
    scale: normalizeVector(value.scale, DEFAULT_TRANSFORM.scale),
  };
}

function normalizeVector(value, fallback) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? [...value] : [...fallback];
}
