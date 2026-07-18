// v0.28 動物守護夥伴 Canonical Profiles。
// 夥伴不屬於裝備欄；每隻具有取得條件、個性、喜好、生活／探索／學習／戰鬥能力與正式模型契約。

export const COMPANION_PROFILES = {
  companion_tanuki: {
    id: 'companion_tanuki', name: '圓圓', species: '狸貓', emoji: '🦝', starter: true, rarity: 'Blue',
    modelAssetId: 'companion:tanuki', color: '#9b7658', accent: '#efe0b9', personality: '貪吃、聰明，最喜歡把撿到的東西分類收藏。',
    favoriteItemIds: ['seed_06', 'mat_cheese'], likedItemIds: ['seed_03', 'mat_wood'],
    skills: { life: '素材整理', exploration: '寶物嗅覺', learning: '分類提示', battle: '幸運拾取' },
    modifiers: { materialDropBonus: 0.18, treasureScanRange: 26, sortingHint: true },
    acquisition: { type: 'starter' }, homeDecorId: 'companion_bed_tanuki',
  },
  companion_rabbit: {
    id: 'companion_rabbit', name: '米米', species: '小兔子', emoji: '🐰', starter: true, rarity: 'Blue',
    modelAssetId: 'companion:rabbit', color: '#f4eee6', accent: '#f5a9bd', personality: '溫柔又有點膽小，會在你困惑時靠近提醒。',
    favoriteItemIds: ['seed_02', 'seed_08'], likedItemIds: ['seed_01', 'item_01'],
    skills: { life: '胡蘿蔔祝福', exploration: '危險耳語', learning: '視覺提示', battle: '緊急療癒' },
    modifiers: { carrotQualityBonus: 0.12, learningHintBonus: 1, dangerSenseRange: 18, healInterval: 22, healPercent: 6 },
    acquisition: { type: 'starter' }, homeDecorId: 'companion_bed_rabbit',
  },
  companion_fox: {
    id: 'companion_fox', name: '焰尾', species: '小狐狸', emoji: '🦊', starter: true, rarity: 'Blue',
    modelAssetId: 'companion:fox', color: '#e78343', accent: '#fff0d4', personality: '活潑、勇敢，喜歡帶你找到不明顯的小路。',
    favoriteItemIds: ['fish_prism_trout', 'seed_08'], likedItemIds: ['item_05', 'mat_egg'],
    skills: { life: '晨間活力', exploration: '隱路追蹤', learning: '方向提示', battle: '敏捷步伐' },
    modifiers: { moveSpeedBonus: 0.12, dodgeBonus: 0.08, hiddenPathRange: 24 },
    acquisition: { type: 'starter' }, homeDecorId: 'companion_bed_fox',
  },
  companion_cat: {
    id: 'companion_cat', name: '雲朵', species: '小貓', emoji: '🐱', starter: false, rarity: 'Blue',
    modelAssetId: 'companion:cat', color: '#b8c7d9', accent: '#ffffff', personality: '慵懶但很會觀察情緒，總知道誰需要陪伴。',
    favoriteItemIds: ['fish_sparkle_carp', 'mat_milk'], likedItemIds: ['fish_prism_trout', 'mat_cloth'],
    skills: { life: '舒服午睡', exploration: '居民感應', learning: '安心陪伴', battle: '休息回復' },
    modifiers: { restRecoveryBonus: 0.25, firstTalkAffinityBonus: 1, npcSenseRange: 22 },
    acquisition: { type: 'relationship', npcId: 'resident_02', affinity: 50 }, homeDecorId: 'companion_bed_cat',
  },
  companion_otter: {
    id: 'companion_otter', name: '波波', species: '小水獺', emoji: '🦦', starter: false, rarity: 'Orange',
    modelAssetId: 'companion:otter', color: '#8a6b50', accent: '#d9f5ff', personality: '愛玩水也愛收集漂亮石頭，在水域裡特別可靠。',
    favoriteItemIds: ['fish_rainbow_spirit', 'fish_prism_trout'], likedItemIds: ['mat_lake_crystal', 'fish_sparkle_carp'],
    skills: { life: '池塘幫手', exploration: '水下尋寶', learning: '容量比較', battle: '水中守護' },
    modifiers: { oxygenBonus: 0.3, swimSpeedBonus: 0.15, fishingLegendaryBonus: 0.08 },
    acquisition: { type: 'boss', bossId: 'crystal_boss' }, homeDecorId: 'companion_bed_otter',
  },
  companion_squirrel: {
    id: 'companion_squirrel', name: '栗栗', species: '小松鼠', emoji: '🐿️', starter: false, rarity: 'Blue',
    modelAssetId: 'companion:squirrel', color: '#b76f3c', accent: '#ffe4ad', personality: '動作快、記憶力好，總能記住種子和果實藏在哪裡。',
    favoriteItemIds: ['seed_09', 'seed_10'], likedItemIds: ['seed_05', 'seed_08'],
    skills: { life: '種子收藏', exploration: '森林雷達', learning: '數量分組', battle: '果實補給' },
    modifiers: { seedRefundChance: 0.16, treeMaterialBonus: 0.2, forestScanRange: 25 },
    acquisition: { type: 'region_event', regionId: 'forest_ruins', eventCount: 3 }, homeDecorId: 'companion_bed_squirrel',
  },
  companion_chick: {
    id: 'companion_chick', name: '啾啾', species: '星星小雞', emoji: '🐥', starter: false, rarity: 'Green',
    modelAssetId: 'companion:chick', color: '#ffd75c', accent: '#fff4b7', personality: '樂觀又愛熱鬧，會讓農場動物比較安心。',
    favoriteItemIds: ['seed_05', 'mat_egg'], likedItemIds: ['mat_animal_feed', 'seed_01'],
    skills: { life: '動物好心情', exploration: '晨間叫醒', learning: '節奏數數', battle: '鼓舞鳴叫' },
    modifiers: { animalMoodBonus: 8, animalQualityBonus: 0.1, morningStaminaBonus: 10 },
    acquisition: { type: 'farm_activity', animalProducts: 5 }, homeDecorId: 'companion_bed_chick',
  },
  companion_red_panda: {
    id: 'companion_red_panda', name: '豆豆', species: '小熊貓', emoji: '🐾', starter: false, rarity: 'Orange',
    modelAssetId: 'companion:red_panda', color: '#a94832', accent: '#f5dfc5', personality: '手很巧、喜歡研究機器，看到齒輪就會停下來觀察。',
    favoriteItemIds: ['mat_ancient_gear', 'mat_cheese'], likedItemIds: ['mat_cloth', 'mat_wood'],
    skills: { life: '加工巧手', exploration: '機械診斷', learning: '步驟排序', battle: '工具支援' },
    modifiers: { processingMinutesReduction: 30, processingQualityChance: 0.12, craftMaterialRefundChance: 0.12 },
    acquisition: { type: 'boss', bossId: 'clockwork_boss' }, homeDecorId: 'companion_bed_red_panda',
  },
};

export const COMPANION_IDS = Object.freeze(Object.keys(COMPANION_PROFILES));
export const STARTER_COMPANION_IDS = Object.freeze(COMPANION_IDS.filter((id) => COMPANION_PROFILES[id].starter));

export const LEGACY_PET_COMPANION_MAP = Object.freeze({
  pet_01: 'companion_rabbit', pet_02: 'companion_red_panda', pet_03: 'companion_fox', pet_04: 'companion_otter',
  pet_05: 'companion_fox', pet_06: 'companion_chick', pet_07: 'companion_tanuki', pet_08: 'companion_squirrel',
  pet_09: 'companion_otter', pet_10: 'companion_cat',
});

export function getCompanionProfile(id) {
  return COMPANION_PROFILES[id] || null;
}
