// 132 節點數學 Skill Graph：支援前置技能、常見錯誤、提示、場景映射與複習規則。
const DOMAIN_DEFINITIONS = [
  { id: 'numberSense', label: '數感與位值', dimension: 'Advanced', grades: [1, 2, 3], scenes: ['village', 'learning_hall'], topics: ['數量比較', '數線定位', '奇偶數', '十位與個位', '百位值', '估算', '四捨五入', '倍數概念', '因數概念', '質數初步', '負數初步'] },
  { id: 'addSub', label: '加法與減法', dimension: 'Addition', grades: [1, 2, 3], scenes: ['village', 'forest'], topics: ['10 內加法', '10 內減法', '20 內進位', '20 內退位', '兩位數加法', '兩位數減法', '三位數加法', '三位數減法', '估算驗算', '連加連減', '混合應用'] },
  { id: 'mulDiv', label: '乘法與除法', dimension: 'Multiplication', grades: [2, 3, 4], scenes: ['farm', 'trialTower'], topics: ['重複加法', '2 與 5 乘法', '3 與 4 乘法', '6 與 7 乘法', '8 與 9 乘法', '乘法交換律', '等分除法', '包含除法', '有餘數除法', '兩位數乘法', '乘除應用'] },
  { id: 'fractions', label: '分數', dimension: 'Fractions', grades: [3, 4, 5], scenes: ['crystal_river', 'farm', 'learning_hall'], topics: ['整體與部分', '單位分數', '同分母比較', '同分母加法', '同分母減法', '等值分數', '約分', '擴分', '異分母比較', '帶分數', '分數應用'] },
  { id: 'decimalsMoney', label: '小數與金錢', dimension: 'Money', grades: [3, 4, 5], scenes: ['market', 'farm', 'sunflower_plains'], topics: ['元角分', '找零', '小數位值', '小數比較', '小數加法', '小數減法', '單價與總價', '折扣初步', '預算規劃', '平均單價', '金錢應用'] },
  { id: 'geometry', label: '幾何與空間', dimension: 'Geometry', grades: [2, 3, 4], scenes: ['forest', 'village', 'snowlight_valley'], topics: ['基本平面圖形', '邊與角', '對稱', '周長', '長方形面積', '正方形面積', '三角形分類', '角度', '座標', '立體形體', '空間推理'] },
  { id: 'measurement', label: '測量與單位', dimension: 'Measurement', grades: [2, 3, 4], scenes: ['farm', 'colorstone_canyon', 'crystal_river'], topics: ['公分與公尺', '公克與公斤', '毫升與公升', '時間單位', '長度換算', '重量換算', '容量換算', '面積單位', '體積初步', '速度初步', '綜合測量'] },
  { id: 'ratioPercent', label: '比例與百分比', dimension: 'Advanced', grades: [5, 6, 7], scenes: ['ember_highlands', 'sky_machine_isles', 'market'], topics: ['比的意義', '等比', '比例尺', '單位率', '百分比意義', '百分比換算', '折扣', '增加率', '減少率', '比例分配', '比例應用'] },
  { id: 'dataLogic', label: '資料、規律與邏輯', dimension: 'Logic', grades: [2, 3, 4], scenes: ['mushroom_wetlands', 'forest', 'sky_machine_isles'], topics: ['重複規律', '數列', '圖形規律', '分類', '表格讀取', '長條圖', '折線圖初步', '平均數初步', '可能性', '邏輯排除', '綜合推理'] },
  { id: 'wordProblems', label: '生活應用題', dimension: 'Advanced', grades: [2, 3, 4, 5], scenes: ['village', 'farm', 'all_regions'], topics: ['一步加法題', '一步減法題', '一步乘法題', '一步除法題', '兩步驟問題', '多餘資訊', '比較問題', '分配問題', '行程問題', '購物問題', '綜合應用'] },
  { id: 'timeWeather', label: '時間與天氣', dimension: 'Measurement', grades: [2, 3, 4], scenes: ['village', 'farm', 'forest'], topics: ['整點半點', '時分讀取', '經過時間', '營業時間', '作物成熟時間', '日夜週期', '一週天氣統計', '降雨機率初步', '溫度比較', '影子與時間', '時間規劃'] },
  { id: 'preAlgebra', label: '國中先修', dimension: 'Advanced', grades: [6, 7], scenes: ['trialTower', 'sky_machine_isles'], topics: ['未知數概念', '一步方程', '兩步方程', '代入求值', '運算順序', '正負數', '座標平面', '簡單函數表', '比例方程', '模式一般化', '綜合先修'] },
];

const REPRESENTATIONS = ['symbolic', 'visual', 'manipulative', 'contextual'];
const REVIEW_INTERVALS = [1, 2, 4, 7, 14, 30];

export const SKILL_GRAPH = DOMAIN_DEFINITIONS.flatMap((domain) => domain.topics.map((topic, index) => {
  const id = `${domain.id}_${String(index + 1).padStart(2, '0')}`;
  const previousId = index > 0 ? `${domain.id}_${String(index).padStart(2, '0')}` : null;
  const grade = domain.grades[Math.min(domain.grades.length - 1, Math.floor(index / Math.ceil(domain.topics.length / domain.grades.length)))];
  return {
    id,
    domainId: domain.id,
    domainLabel: domain.label,
    dimension: domain.dimension,
    topic,
    grade,
    prerequisites: previousId ? [previousId] : [],
    difficulty: 1 + Math.floor(index / 3),
    representations: REPRESENTATIONS,
    misconceptionCodes: [`${domain.id}_operation_choice`, `${domain.id}_place_value`, `${domain.id}_unit_or_structure`],
    visualHint: `先用圖像或實物表示「${topic}」，再連到算式。`,
    hintSteps: ['圈出題目中的已知資訊。', '選擇正確的數學關係。', '逐步計算並用情境檢查答案。'],
    sceneMappings: domain.scenes,
    reviewIntervalsDays: REVIEW_INTERVALS,
    masteryThreshold: 0.8,
    templateBlueprints: [
      { type: 'numeric', difficulty: 'foundation' },
      { type: 'visual', difficulty: 'foundation' },
      { type: 'context', difficulty: 'standard' },
      { type: 'challenge', difficulty: 'advanced' },
    ],
  };
}));

export const SKILL_BY_ID = Object.fromEntries(SKILL_GRAPH.map((skill) => [skill.id, skill]));
export const SKILL_DOMAINS = DOMAIN_DEFINITIONS.map(({ topics, ...domain }) => ({ ...domain, skillCount: topics.length }));

const CONTEXT_SKILL_MAP = {
  forest_sequence: 'dataLogic_02',
  forest_pattern: 'dataLogic_03',
  forest_path: 'wordProblems_05',
  forest_addition: 'addSub_05',
  farm_yield: 'mulDiv_03',
  farm_area: 'geometry_05',
  farm_market: 'decimalsMoney_07',
  animal_feed: 'mulDiv_08',
  time_reading: 'timeWeather_02',
  weather_statistics: 'timeWeather_07',
  region_wind_angles: 'geometry_08',
  region_snow_temperature: 'timeWeather_09',
  region_farm_arrays: 'mulDiv_03',
  region_star_patterns: 'dataLogic_03',
  region_crystal_symmetry: 'geometry_03',
  region_canyon_measurement: 'measurement_01',
  region_mushroom_multiples: 'mulDiv_04',
  region_clockwork_sequence: 'dataLogic_02',
};

export function resolveSkillIdFromContext(context) {
  return CONTEXT_SKILL_MAP[context] || null;
}

export function getSkillsForScene(sceneId) {
  return SKILL_GRAPH.filter((skill) => skill.sceneMappings.includes(sceneId) || skill.sceneMappings.includes('all_regions'));
}
