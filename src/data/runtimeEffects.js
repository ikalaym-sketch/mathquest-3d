// v0.27.0 Runtime Effect Catalog
// 所有玩家可見能力都必須以 Effect ID 對應到實際 Runtime Handler，禁止只保存自然語言描述。

export const ITEM_EFFECT_IDS = Object.freeze({
  item_01: 'item.math_heal.basic',
  item_02: 'item.math_heal.advanced',
  item_03: 'item.heal.hp',
  item_04: 'item.heal.mp',
  item_05: 'item.buff.speed',
  item_06: 'item.buff.attack',
  item_07: 'item.buff.guardian',
  item_08: 'item.teleport.village',
  item_09: 'item.fishing.rare_guarantee',
  item_10: 'item.farm.instant_grow',
});

export const ARMOR_SET_EFFECTS = Object.freeze({
  leather: { base: 'set.leather.speed', lv5: 'set.leather.speed.lv5' },
  spike: { base: 'set.spike.reflect', lv5: 'set.spike.reflect.lv5' },
  vampire: { base: 'set.vampire.lifesteal', lv5: 'set.vampire.lifesteal.lv5' },
  scholar: { base: 'set.scholar.hint', lv5: 'set.scholar.hint.lv5' },
  paladin: { base: 'set.paladin.regen', lv5: 'set.paladin.regen.lv5' },
  ninja: { base: 'set.ninja.dodge', lv5: 'set.ninja.dodge.lv5' },
  farmer: { base: 'set.farmer.harvest', lv5: 'set.farmer.harvest.lv5' },
  mage: { base: 'set.mage.mana', lv5: 'set.mage.mana.lv5' },
  berserker: { base: 'set.berserker.low_hp', lv5: 'set.berserker.low_hp.lv5' },
  treasure: { base: 'set.treasure.gold', lv5: 'set.treasure.gold.lv5' },
});

export const WEAPON_LV5_EFFECT_IDS = Object.freeze({
  wpn_m_01: 'weapon.lv5.double_strike',
  wpn_m_02: 'weapon.lv5.poison_mastery',
  wpn_m_03: 'weapon.lv5.stun_mastery',
  wpn_m_04: 'weapon.lv5.lance_reach',
  wpn_m_05: 'weapon.lv5.cleave_mastery',
  wpn_m_06: 'weapon.lv5.critical_mastery',
  wpn_m_07: 'weapon.lv5.executioner',
  wpn_m_08: 'weapon.lv5.reaper',
  wpn_m_09: 'weapon.lv5.combo_mastery',
  wpn_m_10: 'weapon.lv5.counter_mastery',
  wpn_r_01: 'weapon.lv5.arrow_mastery',
  wpn_r_02: 'weapon.lv5.split_homing',
  wpn_r_03: 'weapon.lv5.return_mastery',
  wpn_r_04: 'weapon.lv5.burning_blast',
  wpn_r_05: 'weapon.lv5.singularity',
  wpn_r_06: 'weapon.lv5.fifth_critical',
  wpn_r_07: 'weapon.lv5.shuriken_spread',
  wpn_r_08: 'weapon.lv5.poison_duration',
  wpn_r_09: 'weapon.lv5.armor_break',
  wpn_r_10: 'weapon.lv5.element_mastery',
});

// 驗證器會比對此集合與資料庫中的 Effect ID，缺少任何 Handler 即判定失敗。
export const REGISTERED_EFFECT_IDS = new Set([
  ...Object.values(ITEM_EFFECT_IDS),
  ...Object.values(ARMOR_SET_EFFECTS).flatMap((entry) => [entry.base, entry.lv5]),
  ...Object.values(WEAPON_LV5_EFFECT_IDS),
]);
