// v0.29 裝備欄位與外觀欄位的唯一正規化契約。
// 所有 UI、Store、戰鬥、動畫與 3D 掛載都必須引用本檔，禁止各自維護欄位清單。

export const EQUIPMENT_SLOT_IDS = Object.freeze([
  'head',
  'body',
  'hands',
  'legs',
  'feet',
  'mainHand',
  'offHand',
  'accessory',
]);

export const ARMOR_SET_SLOT_IDS = Object.freeze(['head', 'body', 'hands', 'legs']);
export const DEFENSE_SLOT_IDS = Object.freeze(['head', 'body', 'hands', 'legs', 'feet', 'accessory']);

export const APPEARANCE_SLOT_IDS = Object.freeze([
  'faceAccessory',
  'hairAccessory',
  'back',
  'waist',
  'aura',
  'costumeOverride',
]);

export const EMPTY_EQUIPPED = Object.freeze(Object.fromEntries(EQUIPMENT_SLOT_IDS.map((slot) => [slot, null])));
export const EMPTY_APPEARANCE = Object.freeze(Object.fromEntries(APPEARANCE_SLOT_IDS.map((slot) => [slot, null])));

export const LEGACY_SLOT_MAP = Object.freeze({
  weapon: 'mainHand',
  pet: null,
});

export function normalizeEquipmentSlot(slot) {
  if (!slot) return null;
  if (Object.prototype.hasOwnProperty.call(LEGACY_SLOT_MAP, slot)) return LEGACY_SLOT_MAP[slot];
  return EQUIPMENT_SLOT_IDS.includes(slot) ? slot : null;
}

export function normalizeEquippedSlots(value = {}) {
  const next = { ...EMPTY_EQUIPPED };
  for (const [rawSlot, ref] of Object.entries(value || {})) {
    const slot = normalizeEquipmentSlot(rawSlot);
    if (slot) next[slot] = ref || null;
  }
  return next;
}

export function normalizeAppearanceSlots(value = {}) {
  const next = { ...EMPTY_APPEARANCE };
  for (const slot of APPEARANCE_SLOT_IDS) next[slot] = value?.[slot] || null;
  return next;
}

export function isEquipmentDefinition(item) {
  return Boolean(item && (item.type === 'armor' || item.type === 'melee' || item.type === 'ranged' || item.equipSlot));
}

export function getDefinitionEquipSlot(item) {
  if (!item) return null;
  const explicit = normalizeEquipmentSlot(item.equipSlot);
  if (explicit) return explicit;
  if (item.type === 'armor') return normalizeEquipmentSlot(item.slot);
  if (item.type === 'melee' || item.type === 'ranged') return 'mainHand';
  return null;
}

export function getLegacyInventoryCategory(item) {
  if (!item) return null;
  if (item.type === 'armor') return 'armors';
  if (item.type === 'melee' || item.type === 'ranged') return 'weapons';
  return null;
}

export function isTwoHandedDefinition(item) {
  return Boolean(item && ['two', 'dual'].includes(item.handedness));
}

export function supportsOffHand(item) {
  if (!item) return true;
  if (isTwoHandedDefinition(item)) return false;
  return item.supportsOffHand !== false;
}
