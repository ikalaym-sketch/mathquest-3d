// v0.27.0 階段 A/B 強制驗證器。
// 目的：證明資料宣告、Runtime Handler、農場經濟與舊存檔遷移使用同一契約，而不是只檢查檔案存在。
import { ARMORS, DB, ITEMS, SEEDS, WEAPONS } from '../data/index.js';
import { REGISTERED_EFFECT_IDS } from '../data/runtimeEffects.js';
import { getNextFarmUpgrade } from '../data/farmProgression.js';
import { resolveEquipmentRuntime, resolveArmorSetRuntime, validateEquipRequest } from './EquipmentRuntimeService.js';
import { resolveItemUse } from './ItemRuntimeService.js';
import { calculateShipment, createFarmProductInstance, normalizeFarmProductInstance } from './FarmInventoryService.js';
import { FARM_ACTION_TOOL, resolveFarmToolAction } from './FarmToolService.js';
import { applyAnimalCare, createFarmAnimal, resolveAnimalProductQuality } from './AnimalCareService.js';
import { canPlantSeedInSeason, getSeasonSnapshot } from './SeasonCropService.js';
import { getCombatProfile } from '../utils/combatProfile.js';
import { migrateFarmState, useFarmStore } from '../store/farmStore.js';
import { createFarmGrid, plantFarmCell, prepareFarmCell } from '../systems/farmSimulation.js';
import { migrateMainSaveState, useStore } from '../store/useStore.js';
import { addEquipmentDefinitionToState, createInitialEquipmentState } from './EquipmentInstanceService.js';

const ARMOR_SLOTS = ['head', 'body', 'hands', 'legs'];

export function validateLifeSimulationCore() {
  const errors = [];
  const warnings = [];
  const cases = [];
  const run = (id, callback) => {
    try {
      callback();
      cases.push({ id, status: 'PASSED' });
    } catch (error) {
      errors.push(`${id}: ${error.message || error}`);
      cases.push({ id, status: 'FAILED', error: String(error) });
    }
  };

  run('all_10_items_have_registered_runtime_handler', () => {
    assert(ITEMS.length === 10, `道具數量應為 10，實際 ${ITEMS.length}`);
    ITEMS.forEach((item) => {
      assert(REGISTERED_EFFECT_IDS.has(item.effectId), `${item.id} 的 effectId 未註冊`);
      const state = createItemTestState();
      const result = resolveItemUse(item, state);
      assert(result.ok, `${item.id} Handler 無法執行：${result.reason}`);
    });
  });

  run('armor_set_requires_exact_four_matching_pieces', () => {
    const setKeys = [...new Set(ARMORS.map((item) => item.setKey))];
    assert(setKeys.length === 10, `防具套裝應為 10，實際 ${setKeys.length}`);
    setKeys.forEach((setKey) => {
      const pieces = ARMORS.filter((item) => item.setKey === setKey);
      assert(pieces.length === 4, `${setKey} 部位數不是 4`);
      const equipped = Object.fromEntries(pieces.map((item) => [item.slot, item.id]));
      assert(resolveArmorSetRuntime(equipped, {}).active, `${setKey} 四件套未啟動`);
      const incomplete = { ...equipped };
      delete incomplete.legs;
      assert(!resolveArmorSetRuntime(incomplete, {}).active, `${setKey} 三件套錯誤啟動`);
    });
  });

  run('equipment_slot_and_ownership_are_defensive', () => {
    const initial = createInitialEquipmentState();
    const inventory = { equipment: initial.inventoryEquipment };
    const weaponInstance = initial.inventoryEquipment.find((instanceId) => initial.equipmentInstances[instanceId]?.definitionId === 'wpn_m_01');
    assert(validateEquipRequest({ inventory, equipmentInstances: initial.equipmentInstances, slot: 'mainHand', itemId: weaponInstance }).ok, '已持有武器無法裝備');
    assert(!validateEquipRequest({ inventory, equipmentInstances: initial.equipmentInstances, slot: 'head', itemId: weaponInstance }).ok, '武器可錯裝到頭部');
    assert(!validateEquipRequest({ inventory, equipmentInstances: initial.equipmentInstances, slot: 'mainHand', itemId: 'wpn_m_02_missing' }).ok, '未持有武器可直接裝備');
    assert(!validateEquipRequest({ inventory, equipmentInstances: initial.equipmentInstances, slot: 'pet', itemId: weaponInstance }).ok, '舊 pet 欄位仍可穿戴');
  });

  run('all_20_weapons_have_effective_lv5_profile', () => {
    assert(WEAPONS.length === 20, `武器應為 20，實際 ${WEAPONS.length}`);
    WEAPONS.forEach((weapon) => {
      assert(REGISTERED_EFFECT_IDS.has(weapon.lv5EffectId), `${weapon.id} Lv5 Effect 未註冊`);
      const base = getCombatProfile(weapon.id, false);
      const lv5 = getCombatProfile(weapon.id, true);
      assert(lv5.lv5EffectId === weapon.lv5EffectId, `${weapon.id} Lv5 Profile ID 不一致`);
      assert(JSON.stringify(base) !== JSON.stringify(lv5), `${weapon.id} Lv5 Profile 沒有任何 Runtime 差異`);
    });
  });

  run('mage_spell_cost_and_full_set_runtime', () => {
    const mage = Object.fromEntries(ARMORS.filter((item) => item.setKey === 'mage').map((item) => [item.slot, item.id]));
    const levels = Object.fromEntries(Object.values(mage).map((itemId) => [itemId, true]));
    const runtime = resolveEquipmentRuntime({ equipped: mage, equipmentLevels: levels, playerState: { hp: 100, maxHp: 100 } });
    assert(runtime.manaPerSecond === 2, '法師 Lv5 回魔不正確');
    assert(runtime.spellCostMultiplier === 0.8, '法師 Lv5 魔力消耗倍率不正確');
  });

  run('spell_cost_blocks_cast_when_mp_is_insufficient', () => {
    const original = useStore.getState();
    useStore.setState({ playerState: { ...original.playerState, mp: 3 }, nextSpellDiscount: 1 });
    const blocked = useStore.getState().consumeSpellCost(4);
    assert(!blocked.ok && blocked.cost === 4, '魔力不足仍可施放');
    useStore.setState({ playerState: { ...useStore.getState().playerState, mp: 10 }, nextSpellDiscount: 1 });
    const paid = useStore.getState().consumeSpellCost(4);
    assert(paid.ok && useStore.getState().playerState.mp === 6, '魔力消耗未正確扣除');
  });

  run('guardian_and_mirror_counter_use_correct_damage_source', () => {
    const base = useStore.getState();
    let reflected = 0;
    const source = { takeHit: (damage) => { reflected += damage; } };
    const added = addEquipmentDefinitionToState(base, 'wpn_m_10', { source: 'validation' });
    const mirrorInstance = { ...added.instance, level: 5 };
    useStore.setState({
      playerState: { ...base.playerState, hp: 100, maxHp: 100 },
      activeItemEffects: { guardian: { reflectDamage: 0.5, expiresAtWorldMinute: 9999 } },
      inventory: added.inventory,
      equipmentInstances: { ...added.equipmentInstances, [mirrorInstance.instanceId]: mirrorInstance },
      equipped: { ...base.equipped, mainHand: mirrorInstance.instanceId },
      equipmentLevels: { ...base.equipmentLevels, wpn_m_10: true },
    });
    const guarded = useStore.getState().receiveDamage(20, { source, sourceType: 'bossSkill' });
    assert(guarded.damage === 0 && reflected === 10, '守護卷軸未以原始傷害反射');
    reflected = 0;
    useStore.setState({ activeItemEffects: {}, playerState: { ...useStore.getState().playerState, hp: 100 } });
    useStore.getState().receiveDamage(20, { source, sourceType: 'hazard' });
    assert(reflected === 0, '鏡盾錯誤反擊環境傷害');
    useStore.getState().receiveDamage(20, { source, sourceType: 'monster' });
    assert(reflected > 0, '鏡盾未反擊近身怪物');
  });

  run('growth_powder_is_not_consumed_without_target_crop', () => {
    useFarmStore.getState().resetFarm();
    const state = useStore.getState();
    useStore.setState({ inventory: { ...state.inventory, items: ['item_10'] } });
    const result = useStore.getState().useInventoryItem('item_10');
    assert(!result.ok && useStore.getState().inventory.items.includes('item_10'), '無作物時成長粉仍被消耗');
  });

  run('quality_product_metadata_and_shipment_value_are_preserved', () => {
    const product = createFarmProductInstance({ itemId: 'seed_02', quality: 'star', quantity: 3, worldMinute: 720, sourceType: 'crop', metadata: { cellId: 24 } });
    assert(product.quality === 'star', '星級品質遺失');
    assert(product.quantity === 3, '收成數量遺失');
    assert(product.metadata.cellId === 24, '來源 metadata 遺失');
    assert(product.unitValue === DB.seed_02.sellPrice * 2, '星級售價倍率錯誤');
    const shipment = calculateShipment([product]);
    assert(shipment.itemCount === 3 && shipment.totalGold === product.unitValue * 3, '出貨計算錯誤');
  });

  run('legacy_crop_ids_migrate_without_quantity_loss', () => {
    const migrated = migrateMainSaveState({ inventory: { materials: ['seed_01', 'seed_01', 'mat_wood'], farmProducts: [] }, worldClock: { totalMinutes: 600 } });
    assert(migrated.inventory.farmProducts.length === 2, '舊作物數量遷移錯誤');
    assert(migrated.inventory.materials.length === 1 && migrated.inventory.materials[0] === 'mat_wood', '一般材料被錯誤移除');
    migrated.inventory.farmProducts.forEach((product) => assert(normalizeFarmProductInstance(product), '遷移產品無法正規化'));
  });

  run('four_seasons_and_greenhouse_rules', () => {
    assert(getSeasonSnapshot(1).id === 'spring', '第 1 天應為春季');
    assert(getSeasonSnapshot(29).id === 'summer', '第 29 天應為夏季');
    assert(getSeasonSnapshot(57).id === 'autumn', '第 57 天應為秋季');
    assert(getSeasonSnapshot(85).id === 'winter', '第 85 天應為冬季');
    assert(getSeasonSnapshot(113).id === 'spring' && getSeasonSnapshot(113).year === 2, '第 2 年季節循環錯誤');
    const tomato = SEEDS.find((seed) => seed.id === 'seed_04');
    assert(!canPlantSeedInSeason(tomato, 'winter', 4), 'Lv4 冬季可錯種番茄');
    assert(canPlantSeedInSeason(tomato, 'winter', 5), 'Lv5 溫室未允許跨季種植');
  });

  run('new_field_requires_hoe_before_planting', () => {
    const freshCell = createFarmGrid(1, false).find((cell) => cell.isUnlocked);
    assert(freshCell && !freshCell.isPrepared, '新農地錯誤地預先整地');
    assert(plantFarmCell(freshCell, 'seed_01', 500) === freshCell, '未整地即可播種');
    const prepared = prepareFarmCell(freshCell);
    assert(prepared.isPrepared, '鋤頭整地未改變狀態');
    assert(plantFarmCell(prepared, 'seed_01', 500).currentSeedId === 'seed_01', '整地後仍無法播種');
  });

  run('all_farm_actions_require_correct_tool_and_stamina', () => {
    Object.entries(FARM_ACTION_TOOL).forEach(([action, requiredTool]) => {
      const smart = resolveFarmToolAction({ selectedTool: 'smart', action, toolLevels: {} });
      assert(smart.ok && smart.toolId === requiredTool, `${action} 智慧工具解析錯誤`);
      assert(smart.staminaCost > 0, `${action} 體力成本不得為 0`);
      const wrong = requiredTool === 'hoe' ? 'wateringCan' : 'hoe';
      assert(!resolveFarmToolAction({ selectedTool: wrong, action, toolLevels: {} }).ok, `${action} 錯誤工具仍可執行`);
    });
  });

  run('animal_care_changes_quality_and_blocks_repeat_actions', () => {
    let animal = createFarmAnimal({ id: 'cow', type: 'cow', name: '小莓', product: 'mat_milk' });
    animal = applyAnimalCare(animal, 'feed', { dayIndex: 2, worldMinute: 500 }).animal;
    const petted = applyAnimalCare(animal, 'pet', { dayIndex: 2, worldMinute: 501 });
    assert(petted.ok, '首次撫摸失敗');
    assert(!applyAnimalCare(petted.animal, 'pet', { dayIndex: 2, worldMinute: 502 }).ok, '同日可重複撫摸');
    const quality = resolveAnimalProductQuality({ ...petted.animal, affection: 100, hunger: 100, cleanliness: 100, health: 100 }, 5);
    assert(quality === 'star', '完整照顧與 Lv5 農莊未產生星級品質');
  });

  run('machine_legacy_time_migration_uses_world_clock', () => {
    const migrated = migrateFarmState({ lastSimulationWorldMinute: 800, craftedObjects: [{ id: 'm1', type: 'cheeseMaker', processingItem: 'mat_milk', finishTime: Date.now() + 5000 }] }, 2);
    assert(migrated.craftedObjects[0].finishWorldMinute === 980, '舊加工機未補上三小時世界時間');
    assert(migrated.craftedObjects[0].finishTime == null, '舊 Date.now 完成時間未移除');
  });

  run('farm_upgrades_require_materials_and_one_day', () => {
    for (let level = 1; level < 5; level += 1) {
      const upgrade = getNextFarmUpgrade(level);
      assert(upgrade.cost > 0, `Lv${level} 金幣需求無效`);
      assert(Object.keys(upgrade.materials).length >= 2, `Lv${level} 材料需求不足`);
      assert(upgrade.durationMinutes === 1440, `Lv${level} 施工時間不是一個遊戲日`);
    }
  });

  run('animal_feed_is_a_real_inventory_item', () => {
    assert(DB.mat_animal_feed?.type === 'farmSupply', '營養飼料未進入 Canonical DB');
    assert(DB.mat_animal_feed.buyPrice > DB.mat_animal_feed.sellPrice, '飼料買賣價格可形成無限套利');
  });

  return {
    ok: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    summary: {
      items: ITEMS.length,
      weapons: WEAPONS.length,
      armorPieces: ARMORS.length,
      armorSets: new Set(ARMORS.map((item) => item.setKey)).size,
      farmTools: Object.keys(FARM_ACTION_TOOL).length,
      seasons: 4,
      destructiveCases: cases.length,
    },
    cases,
  };
}

function createItemTestState() {
  return {
    playerState: { hp: 20, maxHp: 100, mp: 10, maxMp: 50, stamina: 10, maxStamina: 100 },
    worldClock: { totalMinutes: 500 },
    activeItemEffects: {},
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
