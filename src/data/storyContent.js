// 八區主線與四十條正式任務。每區固定五條：探索、機制、結構、精英、Boss。
const quest = (id, chapterId, title, description, objective, rewardGold, learningFocus) => ({ id, chapterId, title, description, objective, rewardGold, learningFocus });

const CHAPTER_SEEDS = [
  {
    id: 'chapter_wind', regionId: 'wind_highlands', order: 3, title: '第三章｜風之方向', summary: '修復風車航線，找出雲橋失去平衡的原因。', guideNpcId: 'guide_wind_highlands',
    subarea: 'breeze_meadow', mechanic: 'wind_vane_meadow', structure: 'wind_station_a:entry', elite: 'wind_elite', boss: 'wind_boss', focus: '角度與方向', unlocksRegionId: 'crystal_lake', unlockReason: '完成風之高地章節，風向航線將帶你前往水晶湖。',
  },
  {
    id: 'chapter_snow', regionId: 'snow_valley', order: 7, title: '第七章｜極光之鏡', summary: '追查鏡湖異常，讓雪光神殿重新映出極光。', guideNpcId: 'guide_snow_valley',
    subarea: 'frostflower_meadow', mechanic: 'snow_heat_flower', structure: 'frostflower_altar:altar', elite: 'snow_elite', boss: 'snow_boss', focus: '溫度與負數', unlocksRegionId: 'clockwork_ruins', unlockReason: '完成雪光谷章節，極光座標將指出機械遺跡。',
  },
  {
    id: 'chapter_farm', regionId: 'farm_plains', order: 2, title: '第二章｜豐收方陣', summary: '協助平原居民恢復灌溉與收穫秩序。', guideNpcId: 'guide_farm_plains',
    subarea: 'sunny_orchard', mechanic: 'farm_orchard_rows', structure: 'sunny_orchard_barn:entry', elite: 'farm_elite', boss: 'farm_boss', focus: '乘法與陣列', unlocksRegionId: 'wind_highlands', unlockReason: '完成農業平原章節，修好的運貨路將開通風之高地。',
  },
  {
    id: 'chapter_star', regionId: 'star_village', order: 1, title: '第一章｜星圖課堂', summary: '完成學習花園星圖，守護村外的冒險道路。', guideNpcId: 'guide_star_village',
    subarea: 'village_outskirts', mechanic: 'star_outskirts_marker', structure: 'learning_hall:entry', elite: 'star_elite', boss: 'star_boss', focus: '規律與序列', unlocksRegionId: 'farm_plains', unlockReason: '完成星光村外圍章節，村民將開放通往農業平原的道路。',
  },
  {
    id: 'chapter_crystal', regionId: 'crystal_lake', order: 4, title: '第四章｜稜鏡回聲', summary: '利用對稱與折射，修復湖心的水晶航道。', guideNpcId: 'guide_crystal_lake',
    subarea: 'shimmering_shore', mechanic: 'crystal_shore_prism', structure: 'shimmering_dock:fishing', elite: 'crystal_elite', boss: 'crystal_boss', focus: '對稱與幾何', unlocksRegionId: 'mushroom_grove', unlockReason: '完成水晶湖章節，湖光航道將通往蘑菇濕地。',
  },
  {
    id: 'chapter_canyon', regionId: 'sun_canyon', order: 6, title: '第六章｜峽谷測量', summary: '量測橋索與岩壁距離，打開太陽神殿。', guideNpcId: 'guide_sun_canyon',
    subarea: 'golden_ravine', mechanic: 'canyon_ravine_measure', structure: 'rope_station:bridge_entry', elite: 'canyon_elite', boss: 'canyon_boss', focus: '長度與估算', unlocksRegionId: 'snow_valley', unlockReason: '完成日光峽谷章節，太陽神殿將開啟前往雪光谷的山道。',
  },
  {
    id: 'chapter_mushroom', regionId: 'mushroom_grove', order: 5, title: '第五章｜孢子節拍', summary: '跟隨倍數節拍，讓巨菇村重新發光。', guideNpcId: 'guide_mushroom_grove',
    subarea: 'bubblecap_trail', mechanic: 'mushroom_bubblecap_beat', structure: 'bubblecap_house:entry', elite: 'mushroom_elite', boss: 'mushroom_boss', focus: '倍數與節奏', unlocksRegionId: 'sun_canyon', unlockReason: '完成蘑菇濕地章節，妖精環將指引日光峽谷。',
  },
  {
    id: 'chapter_clockwork', regionId: 'clockwork_ruins', order: 8, title: '第八章｜時序核心', summary: '依正確順序啟動齒輪，阻止時間核心超載。', guideNpcId: 'guide_clockwork_ruins',
    subarea: 'gear_courtyard', mechanic: 'clockwork_courtyard_gear', structure: 'clock_core_main:clock_console', elite: 'clockwork_elite', boss: 'clockwork_boss', focus: '邏輯與時序', unlocksRegionId: null, unlockReason: '完成時序核心，八區主線正式結束。',
  },
];

export const STORY_CHAPTERS = CHAPTER_SEEDS.map((seed) => ({
  id: seed.id,
  regionId: seed.regionId,
  order: seed.order,
  title: seed.title,
  summary: seed.summary,
  guideNpcId: seed.guideNpcId,
  unlocksRegionId: seed.unlocksRegionId,
  unlockReason: seed.unlockReason,
  questIds: [`${seed.id}_explore`, `${seed.id}_mechanic`, `${seed.id}_structure`, `${seed.id}_elite`, `${seed.id}_boss`],
})).sort((left, right) => left.order - right.order);

export const STORY_QUESTS = CHAPTER_SEEDS.flatMap((seed) => [
  quest(`${seed.id}_explore`, seed.id, '找到第一個線索', `探索指定子區，了解${seed.summary}`, { type: 'visit', regionId: seed.regionId, targetId: seed.subarea, target: 1 }, 80, seed.focus),
  quest(`${seed.id}_mechanic`, seed.id, '完成場景機關', `以${seed.focus}完成第一座區域機關。`, { type: 'mechanic', regionId: seed.regionId, targetId: seed.mechanic, target: 1 }, 100, seed.focus),
  quest(`${seed.id}_structure`, seed.id, '回報區域據點', '前往重要建築的互動 Socket，取得居民留下的資訊。', { type: 'structure', regionId: seed.regionId, targetId: seed.structure, target: 1 }, 120, seed.focus),
  quest(`${seed.id}_elite`, seed.id, '突破精英封鎖', '觀察精英特性，避開脈衝並擊敗守衛。', { type: 'defeat', regionId: seed.regionId, targetId: seed.elite, tier: 'elite', target: 1 }, 160, '戰術觀察與數量'),
  quest(`${seed.id}_boss`, seed.id, '完成章節封印', '完成區域 Boss 多階段戰鬥與寬容封印。', { type: 'defeat', regionId: seed.regionId, targetId: seed.boss, tier: 'boss', target: 1 }, 260, seed.focus),
]);

export const STORY_QUEST_BY_ID = Object.fromEntries(STORY_QUESTS.map((item) => [item.id, item]));
export const STORY_CHAPTER_BY_ID = Object.fromEntries(STORY_CHAPTERS.map((item) => [item.id, item]));

export function getChapterForRegion(regionId) {
  return STORY_CHAPTERS.find((item) => item.regionId === regionId) || null;
}

export function getChapterQuests(chapterId) {
  return STORY_CHAPTERS.find((item) => item.id === chapterId)?.questIds.map((id) => STORY_QUEST_BY_ID[id]).filter(Boolean) || [];
}


export function getUnlockChapterForRegion(regionId) {
  return STORY_CHAPTERS.find((chapter) => chapter.unlocksRegionId === regionId) || null;
}

export function getStoryUnlockedRegionIds(completedChapterIds = []) {
  const completed = new Set(completedChapterIds || []);
  return STORY_CHAPTERS.filter((chapter) => completed.has(chapter.id) && chapter.unlocksRegionId).map((chapter) => chapter.unlocksRegionId);
}
