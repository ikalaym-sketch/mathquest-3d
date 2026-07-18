// 星光農莊 Lv1～Lv5 的唯一進度設定。
// 田地格數、設施、美術升級、產量與成長倍率集中管理，避免 UI、Store、場景各自寫死。
export const FARM_MAX_LEVEL = 5;

export const FARM_LEVEL_CONFIG = {
  1: {
    level: 1,
    label: '初心農莊',
    gridMargin: 2,
    plotCount: 9,
    upgradeCost: 500,
    upgradeMaterials: { mat_wood: 20, mat_stone: 10 },
    nextLabel: '拓建田地與果園',
    description: '中央 3×3 田地、基礎農舍、穀倉與三種動物。',
    unlocks: ['basicFields', 'farmhouse', 'barn', 'animals'],
    yieldBonus: 0,
    growthMultiplier: 1,
    moistureFloor: 0,
  },
  2: {
    level: 2,
    label: '成長農莊',
    gridMargin: 1,
    plotCount: 25,
    upgradeCost: 1500,
    upgradeMaterials: { mat_wood: 35, mat_stone: 25 },
    nextLabel: '完成全區耕地',
    description: '解鎖 5×5 田地、完整果園、水塔與更多庭院配置。',
    unlocks: ['fullOrchard', 'waterTower', 'yardExpansion'],
    yieldBonus: 0.08,
    growthMultiplier: 0.94,
    moistureFloor: 0,
  },
  3: {
    level: 3,
    label: '豐收農莊',
    gridMargin: 0,
    plotCount: 49,
    upgradeCost: 3200,
    upgradeMaterials: { mat_wood: 50, mat_stone: 40, mat_sun_ore: 2 },
    nextLabel: '建造灌溉與動物棚舍',
    description: '解鎖完整 7×7 田地、加工工坊與高級作物品質。',
    unlocks: ['fullFields', 'processingWorkshop', 'qualityCrops'],
    yieldBonus: 0.16,
    growthMultiplier: 0.88,
    moistureFloor: 0.1,
  },
  4: {
    level: 4,
    label: '智慧農莊',
    gridMargin: 0,
    plotCount: 49,
    upgradeCost: 6000,
    upgradeMaterials: { mat_wood: 70, mat_stone: 60, mat_ancient_gear: 3 },
    nextLabel: '完成星光自動化',
    description: '解鎖灌溉水路、雨水收集、動物棚舍與自動維持土壤濕度。',
    unlocks: ['irrigation', 'rainCollector', 'animalShelter', 'weatherBoard'],
    yieldBonus: 0.28,
    growthMultiplier: 0.8,
    moistureFloor: 0.55,
  },
  5: {
    level: 5,
    label: '星光示範農莊',
    gridMargin: 0,
    plotCount: 49,
    upgradeCost: null,
    upgradeMaterials: null,
    nextLabel: null,
    description: '完成自動灌溉、氣候保護、星光溫室與最高品質農產品。',
    unlocks: ['automation', 'climateProtection', 'starGreenhouse', 'premiumProduce'],
    yieldBonus: 0.45,
    growthMultiplier: 0.72,
    moistureFloor: 0.72,
  },
};

export function getFarmLevelConfig(level) {
  const normalized = Math.max(1, Math.min(FARM_MAX_LEVEL, Number(level) || 1));
  return FARM_LEVEL_CONFIG[normalized];
}

export function getNextFarmUpgrade(level) {
  const current = getFarmLevelConfig(level);
  if (current.level >= FARM_MAX_LEVEL) return null;
  const next = getFarmLevelConfig(current.level + 1);
  return {
    fromLevel: current.level,
    nextLevel: next.level,
    cost: current.upgradeCost,
    materials: { ...(current.upgradeMaterials || {}) },
    durationMinutes: 1440,
    label: current.nextLabel,
    description: next.description,
    unlocks: next.unlocks,
  };
}

export function isFarmCellUnlocked(row, col, level) {
  const { gridMargin } = getFarmLevelConfig(level);
  return row >= gridMargin && row <= 6 - gridMargin && col >= gridMargin && col <= 6 - gridMargin;
}

export function getFarmUnlocks(level) {
  const normalized = getFarmLevelConfig(level).level;
  return Array.from({ length: normalized }, (_, index) => FARM_LEVEL_CONFIG[index + 1].unlocks).flat();
}
