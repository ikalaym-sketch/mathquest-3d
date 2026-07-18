// v0.29 裝備實例服務。
// 定義資料（DB）與玩家擁有的個別裝備分離，讓同款裝備可擁有不同等級、品質、詞綴與鎖定狀態。
import { DB } from '../data/index.js';
import {
  EMPTY_APPEARANCE,
  EMPTY_EQUIPPED,
  EQUIPMENT_SLOT_IDS,
  getDefinitionEquipSlot,
  getLegacyInventoryCategory,
  isEquipmentDefinition,
  normalizeAppearanceSlots,
  normalizeEquippedSlots,
} from '../data/equipmentSchema.js';

export const STARTER_EQUIPMENT_DEFINITION_IDS = Object.freeze([
  'wpn_m_01',
  'wpn_r_01',
  'wpn_r_02',
  'arm_leather_head',
  'arm_leather_body',
  'arm_leather_hands',
  'arm_leather_legs',
  'arm_scholar_body',
]);

const STARTER_EQUIPPED_DEFINITIONS = Object.freeze({
  head: 'arm_leather_head',
  body: 'arm_leather_body',
  hands: 'arm_leather_hands',
  legs: 'arm_leather_legs',
  mainHand: 'wpn_m_01',
});

export function createEquipmentInstance(definitionId, options = {}) {
  const definition = DB[definitionId];
  if (!isEquipmentDefinition(definition)) return null;
  return {
    instanceId: options.instanceId || `eq_${sanitize(definitionId)}_1`,
    definitionId,
    level: Math.max(1, Number(options.level) || 1),
    experience: Math.max(0, Number(options.experience) || 0),
    quality: options.quality || 'standard',
    affixes: Array.isArray(options.affixes) ? options.affixes.map((entry) => ({ ...entry })) : [],
    enhancement: Math.max(0, Number(options.enhancement) || 0),
    locked: Boolean(options.locked),
    acquiredAt: Number(options.acquiredAt) || 0,
    source: options.source || 'system',
  };
}

export function createInitialEquipmentState() {
  const equipmentInstances = {};
  const equipment = [];
  for (const definitionId of STARTER_EQUIPMENT_DEFINITION_IDS) {
    const instanceId = nextEquipmentInstanceId(definitionId, equipmentInstances);
    const instance = createEquipmentInstance(definitionId, { instanceId, source: 'starter' });
    if (!instance) continue;
    equipmentInstances[instanceId] = instance;
    equipment.push(instanceId);
  }
  const equipped = { ...EMPTY_EQUIPPED };
  for (const [slot, definitionId] of Object.entries(STARTER_EQUIPPED_DEFINITIONS)) {
    equipped[slot] = findInstanceIdByDefinition(equipment, equipmentInstances, definitionId);
  }
  return {
    equipmentInstances,
    inventoryEquipment: equipment,
    legacyInventory: deriveLegacyInventory(equipment, equipmentInstances),
    equipped,
    equipmentAppearance: { ...EMPTY_APPEARANCE },
  };
}

export function migrateEquipmentState(persistedState = {}) {
  const persistedInventory = { ...(persistedState.inventory || {}) };
  const equipmentInstances = normalizeInstanceMap(persistedState.equipmentInstances);
  const equipment = [];

  for (const instanceId of persistedInventory.equipment || []) {
    if (equipmentInstances[instanceId] && !equipment.includes(instanceId)) equipment.push(instanceId);
  }

  // 舊版只保存 definitionId 陣列；逐件轉換，保留重複數量。
  if (equipment.length === 0) {
    const legacyDefinitions = [
      ...(persistedInventory.weapons || []),
      ...(persistedInventory.armors || []),
    ].filter((definitionId) => isEquipmentDefinition(DB[definitionId]));
    for (const definitionId of legacyDefinitions) {
      const instanceId = nextEquipmentInstanceId(definitionId, equipmentInstances);
      const instance = createEquipmentInstance(definitionId, {
        instanceId,
        level: persistedState.equipmentLevels?.[definitionId] ? 5 : 1,
        affixes: persistedState.weaponAffixes?.[definitionId] || [],
        source: 'legacy-inventory',
      });
      equipmentInstances[instanceId] = instance;
      equipment.push(instanceId);
    }
  }

  const equipped = normalizeEquippedSlots(persistedState.equipped);
  const assigned = new Set();
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const rawRef = equipped[slot];
    if (!rawRef) continue;
    if (equipmentInstances[rawRef]) {
      assigned.add(rawRef);
      continue;
    }
    const definition = DB[rawRef];
    if (!isEquipmentDefinition(definition)) {
      equipped[slot] = null;
      continue;
    }
    let instanceId = findInstanceIdByDefinition(equipment, equipmentInstances, rawRef, assigned);
    if (!instanceId) {
      instanceId = nextEquipmentInstanceId(rawRef, equipmentInstances);
      const instance = createEquipmentInstance(rawRef, {
        instanceId,
        level: persistedState.equipmentLevels?.[rawRef] ? 5 : 1,
        affixes: persistedState.weaponAffixes?.[rawRef] || [],
        source: 'legacy-equipped',
      });
      equipmentInstances[instanceId] = instance;
      equipment.push(instanceId);
    }
    equipped[slot] = instanceId;
    assigned.add(instanceId);
  }

  // 舊版可能沒有裝備背包但有初始欄位；確保現有穿戴都在 inventory.equipment。
  for (const instanceId of Object.values(equipped).filter(Boolean)) {
    if (equipmentInstances[instanceId] && !equipment.includes(instanceId)) equipment.push(instanceId);
  }

  const legacyInventory = deriveLegacyInventory(equipment, equipmentInstances);
  return {
    inventory: {
      ...persistedInventory,
      equipment,
      weapons: legacyInventory.weapons,
      armors: legacyInventory.armors,
      pets: [],
    },
    equipmentInstances,
    equipped,
    equipmentAppearance: normalizeAppearanceSlots(persistedState.equipmentAppearance),
    equipmentLevels: deriveLegacyLevelMap(equipmentInstances),
    weaponAffixes: deriveLegacyAffixMap(equipmentInstances),
  };
}

export function resolveEquipmentInstance(ref, equipmentInstances = {}) {
  if (!ref) return null;
  if (equipmentInstances[ref]) return equipmentInstances[ref];
  if (isEquipmentDefinition(DB[ref])) {
    return createEquipmentInstance(ref, { instanceId: ref, source: 'legacy-reference' });
  }
  return null;
}

export function resolveEquipmentDefinition(ref, equipmentInstances = {}) {
  const instance = resolveEquipmentInstance(ref, equipmentInstances);
  return instance ? DB[instance.definitionId] || null : null;
}

export function resolveEquippedEntry(equipped, slot, equipmentInstances = {}) {
  const instance = resolveEquipmentInstance(equipped?.[slot], equipmentInstances);
  return { instance, item: instance ? DB[instance.definitionId] || null : null };
}

export function findOwnedEquipmentInstance(ref, inventory = {}, equipmentInstances = {}) {
  if (!ref) return null;
  if (equipmentInstances[ref] && (inventory.equipment || []).includes(ref)) return equipmentInstances[ref];
  return (inventory.equipment || [])
    .map((instanceId) => equipmentInstances[instanceId])
    .find((instance) => instance?.definitionId === ref) || null;
}

export function addEquipmentDefinitionToState(state, definitionId, options = {}) {
  const definition = DB[definitionId];
  if (!isEquipmentDefinition(definition)) return null;
  const equipmentInstances = { ...(state.equipmentInstances || {}) };
  const instanceId = nextEquipmentInstanceId(definitionId, equipmentInstances);
  const instance = createEquipmentInstance(definitionId, { ...options, instanceId, acquiredAt: options.acquiredAt || Date.now() });
  equipmentInstances[instanceId] = instance;
  const equipment = [...(state.inventory?.equipment || []), instanceId];
  const legacyInventory = deriveLegacyInventory(equipment, equipmentInstances);
  return {
    instance,
    equipmentInstances,
    inventory: {
      ...state.inventory,
      equipment,
      weapons: legacyInventory.weapons,
      armors: legacyInventory.armors,
    },
  };
}

export function removeEquipmentFromState(state, ref) {
  const equipmentInstances = { ...(state.equipmentInstances || {}) };
  const equippedRefs = new Set(Object.values(state.equipped || {}).filter(Boolean));
  let instanceId = equipmentInstances[ref] ? ref : null;
  if (!instanceId) {
    instanceId = (state.inventory?.equipment || []).find((candidate) => (
      equipmentInstances[candidate]?.definitionId === ref
      && !equippedRefs.has(candidate)
      && !equipmentInstances[candidate]?.locked
    ));
  }
  const instance = instanceId ? equipmentInstances[instanceId] : null;
  if (!instance || equippedRefs.has(instanceId) || instance.locked) return null;
  delete equipmentInstances[instanceId];
  const equipment = (state.inventory?.equipment || []).filter((candidate) => candidate !== instanceId);
  const legacyInventory = deriveLegacyInventory(equipment, equipmentInstances);
  return {
    instance,
    equipmentInstances,
    inventory: {
      ...state.inventory,
      equipment,
      weapons: legacyInventory.weapons,
      armors: legacyInventory.armors,
    },
  };
}

export function ensureEquipmentDefinitions(state, definitionIds = STARTER_EQUIPMENT_DEFINITION_IDS) {
  let nextState = state;
  for (const definitionId of definitionIds) {
    const hasDefinition = (nextState.inventory?.equipment || []).some((instanceId) => nextState.equipmentInstances?.[instanceId]?.definitionId === definitionId);
    if (hasDefinition) continue;
    const patch = addEquipmentDefinitionToState(nextState, definitionId, { source: 'starter-backfill' });
    if (patch) nextState = { ...nextState, ...patch };
  }
  return nextState;
}

export function deriveLegacyInventory(equipment = [], equipmentInstances = {}) {
  const result = { weapons: [], armors: [] };
  for (const instanceId of equipment) {
    const instance = equipmentInstances[instanceId];
    const item = instance ? DB[instance.definitionId] : null;
    const category = getLegacyInventoryCategory(item);
    if (category) result[category].push(instance.definitionId);
  }
  return result;
}

export function nextEquipmentInstanceId(definitionId, equipmentInstances = {}) {
  const base = `eq_${sanitize(definitionId)}_`;
  let ordinal = 1;
  while (equipmentInstances[`${base}${ordinal}`]) ordinal += 1;
  return `${base}${ordinal}`;
}

function normalizeInstanceMap(value = {}) {
  const result = {};
  for (const [instanceId, raw] of Object.entries(value || {})) {
    const definitionId = raw?.definitionId;
    const normalized = createEquipmentInstance(definitionId, { ...raw, instanceId });
    if (normalized) result[instanceId] = normalized;
  }
  return result;
}

function findInstanceIdByDefinition(equipment, equipmentInstances, definitionId, excluded = new Set()) {
  return equipment.find((instanceId) => !excluded.has(instanceId) && equipmentInstances[instanceId]?.definitionId === definitionId) || null;
}

function deriveLegacyLevelMap(equipmentInstances) {
  const result = {};
  for (const instance of Object.values(equipmentInstances)) {
    if (instance.level >= 5) result[instance.definitionId] = true;
  }
  return result;
}

function deriveLegacyAffixMap(equipmentInstances) {
  const result = {};
  for (const instance of Object.values(equipmentInstances)) {
    if (instance.affixes?.length && !result[instance.definitionId]) result[instance.definitionId] = instance.affixes.map((entry) => ({ ...entry }));
  }
  return result;
}

function sanitize(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
}
