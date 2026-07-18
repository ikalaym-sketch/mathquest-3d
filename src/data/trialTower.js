// 試煉之塔 100 層正式內容規則：10 套主題、8 種房型、每 10 層專屬 Boss 與數學進程。
export const TRIAL_TOWER_MAX_FLOOR = 100;

export const TOWER_THEMES = [
  { id: 'starlight_courtyard', name: '星光庭院', skillDomain: 'numberSense', sky: '#9fdcff', floor: '#eadb9c', accent: '#55c8e8', fog: '#e9f8ff' },
  { id: 'gear_workshop', name: '齒輪工坊', skillDomain: 'addSub', sky: '#a8e8ca', floor: '#b9db91', accent: '#53bd7e', fog: '#e8fff1' },
  { id: 'crystal_gallery', name: '水晶長廊', skillDomain: 'mulDiv', sky: '#d5c1ff', floor: '#d7c2e8', accent: '#a36ce3', fog: '#f4ecff' },
  { id: 'golden_market', name: '黃金市集', skillDomain: 'fractions', sky: '#ffd2aa', floor: '#e7c98e', accent: '#ed8d47', fog: '#fff2dd' },
  { id: 'geometry_garden', name: '幾何花園', skillDomain: 'geometry', sky: '#b7ecff', floor: '#b9dcce', accent: '#45a5c7', fog: '#ecfbff' },
  { id: 'measure_foundry', name: '測量鑄造場', skillDomain: 'measurement', sky: '#ffe0b8', floor: '#c6aa8a', accent: '#db7954', fog: '#fff2e5' },
  { id: 'ratio_skybridge', name: '比例天橋', skillDomain: 'ratioPercent', sky: '#b9d8ff', floor: '#a7c7df', accent: '#5e86d8', fog: '#edf5ff' },
  { id: 'logic_library', name: '邏輯圖書館', skillDomain: 'dataLogic', sky: '#d7c6ff', floor: '#c4b0d7', accent: '#875fc4', fog: '#f5efff' },
  { id: 'story_observatory', name: '應用題天文台', skillDomain: 'wordProblems', sky: '#ffd3e5', floor: '#d7b3c4', accent: '#d7679c', fog: '#fff0f6' },
  { id: 'algebra_summit', name: '代數之巔', skillDomain: 'preAlgebra', sky: '#9ddbcf', floor: '#9ebeb3', accent: '#397e74', fog: '#e7faf5' },
];

export const ROOM_ARCHETYPES = {
  battle: { name: '標準戰鬥', icon: '⚔️', description: '擊倒所有怪物。' },
  swarm: { name: '群落挑戰', icon: '🐾', description: '面對數量較多但較弱的怪物。' },
  elite: { name: '精英對決', icon: '🛡️', description: '擊倒少量高耐久精英。' },
  trap: { name: '安全符文', icon: '🔶', description: '依提示踩亮安全符文。' },
  escort: { name: '星光護送', icon: '🌠', description: '依序啟動三座星光信標。' },
  puzzle: { name: '場景序列', icon: '🧩', description: '在場景內完成本層規律機關。' },
  sequence: { name: '時序機關', icon: '🔢', description: '觀察並依正確順序啟動節點。' },
  endurance: { name: '耐力挑戰', icon: '⏳', description: '連續擊倒強化怪物。' },
  treasure: { name: '寶物房', icon: '🎁', description: '完成小測驗後領取額外獎勵。' },
  rest: { name: '星光休息站', icon: '🌟', description: '恢復生命與魔力。' },
  boss: { name: '里程碑守護者', icon: '👑', description: '每十層的主題 Boss。' },
};

const TOWER_BOSSES = [
  ['tower_boss_10', '算珠巨像', '#51b9d4'],
  ['tower_boss_20', '雙環齒輪獸', '#52b879'],
  ['tower_boss_30', '稜鏡水晶龍', '#9d72d7'],
  ['tower_boss_40', '金幣守門王', '#e79043'],
  ['tower_boss_50', '多角花園獸', '#42a5b7'],
  ['tower_boss_60', '度量熔爐魔像', '#cc7052'],
  ['tower_boss_70', '比例天空鯨', '#5d85d1'],
  ['tower_boss_80', '邏輯書頁精靈王', '#815ab7'],
  ['tower_boss_90', '星象故事獅', '#ca6592'],
  ['tower_boss_100', '代數星冠守護者', '#34796f'],
].map(([id, name, color], index) => ({ id, name, color, hp: 420 + index * 150, atk: 12 + index * 3 }));

const SKILL_PREFIX_BY_TIER = ['numberSense', 'addSub', 'mulDiv', 'fractions', 'geometry', 'measurement', 'ratioPercent', 'dataLogic', 'wordProblems', 'preAlgebra'];

export function getTrialFloorConfig(floor) {
  const normalizedFloor = Math.max(1, Math.min(TRIAL_TOWER_MAX_FLOOR, Number(floor) || 1));
  const tier = Math.floor((normalizedFloor - 1) / 10);
  const localFloor = ((normalizedFloor - 1) % 10) + 1;
  const isMilestone = localFloor === 10;
  const roomType = resolveRoomType(localFloor, tier);
  const theme = TOWER_THEMES[tier];
  const skillIndex = Math.min(11, Math.max(1, localFloor + (tier % 2)));
  const skillId = `${SKILL_PREFIX_BY_TIER[tier]}_${String(skillIndex).padStart(2, '0')}`;
  const baseCount = roomType === 'swarm' ? 7 : roomType === 'elite' ? 2 : roomType === 'endurance' ? 6 : 3 + Math.floor(localFloor / 2);
  return {
    floor: normalizedFloor,
    tier,
    localFloor,
    theme,
    palette: theme,
    roomType,
    room: ROOM_ARCHETYPES[roomType],
    skillId,
    enemyCount: ['trap', 'escort', 'puzzle', 'sequence', 'treasure', 'rest', 'boss'].includes(roomType) ? 0 : Math.min(baseCount, 9),
    hpMultiplier: 1 + normalizedFloor * 0.095 + (roomType === 'elite' ? 0.75 : 0),
    attackMultiplier: 1 + normalizedFloor * 0.055 + (roomType === 'endurance' ? 0.25 : 0),
    isMilestone,
    boss: isMilestone ? TOWER_BOSSES[tier] : null,
    rewardGold: isMilestone ? 700 + tier * 250 : roomType === 'treasure' ? 180 + normalizedFloor * 10 : 40 + normalizedFloor * 15,
    rewardMaterial: isMilestone ? 'mat_stone' : null,
  };
}

export function getAllTrialFloorConfigs() {
  return Array.from({ length: TRIAL_TOWER_MAX_FLOOR }, (_, index) => getTrialFloorConfig(index + 1));
}

function resolveRoomType(localFloor, tier) {
  if (localFloor === 10) return 'boss';
  // 每個十層主題在首層交替使用標準戰鬥與耐力戰，讓兩種房型都進入正式 100 層配置。
  if (localFloor === 1) return tier % 2 === 0 ? 'battle' : 'endurance';
  if (localFloor === 2) return 'trap';
  if (localFloor === 3) return 'swarm';
  if (localFloor === 4) return 'escort';
  if (localFloor === 5) return 'puzzle';
  if (localFloor === 6) return 'elite';
  if (localFloor === 7) return 'rest';
  if (localFloor === 8) return 'sequence';
  if (localFloor === 9) return 'treasure';
  return 'battle';
}
