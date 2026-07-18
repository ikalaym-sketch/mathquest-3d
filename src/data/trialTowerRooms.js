// 試煉塔正式空間內容：十套主題場景、每套六種可組合房間結構與場景式互動規則。
const obstacle = (shape, position, scale, color = null, rotation = 0) => ({ shape, position, scale, color, rotation });

export const TRIAL_ARENA_THEMES = [
  { id: 'courtyard', label: '星光庭院', baseShape: 'octagon', edgeStyle: 'arches', obstacles: [obstacle('pillar', [-7, 1.4, -5], [1.2, 2.8, 1.2]), obstacle('pillar', [7, 1.4, -5], [1.2, 2.8, 1.2]), obstacle('star', [0, .35, 5], [3, .7, 3])] },
  { id: 'workshop', label: '齒輪工坊', baseShape: 'square', edgeStyle: 'gears', obstacles: [obstacle('gear', [-6, .7, 0], [2.5, .7, 2.5]), obstacle('gear', [6, .7, 0], [2.5, .7, 2.5]), obstacle('wall', [0, 1.1, -7], [8, 2.2, .7])] },
  { id: 'gallery', label: '水晶長廊', baseShape: 'diamond', edgeStyle: 'crystals', obstacles: [obstacle('crystal', [-7, 1.4, -4], [1.5, 3, 1.5]), obstacle('crystal', [7, 1.4, 4], [1.5, 3, 1.5]), obstacle('wall', [0, .8, 0], [.7, 1.6, 10], null, Math.PI / 4)] },
  { id: 'market', label: '黃金市集', baseShape: 'square', edgeStyle: 'stalls', obstacles: [obstacle('stall', [-7, 1, -5], [3, 2, 2]), obstacle('stall', [7, 1, -5], [3, 2, 2]), obstacle('fountain', [0, .6, 4], [3, 1.2, 3])] },
  { id: 'garden', label: '幾何花園', baseShape: 'hexagon', edgeStyle: 'hedges', obstacles: [obstacle('hedge', [-5, .8, 0], [1.2, 1.6, 8]), obstacle('hedge', [5, .8, 0], [1.2, 1.6, 8]), obstacle('flower', [0, .4, 0], [4, .8, 4])] },
  { id: 'foundry', label: '測量鑄造場', baseShape: 'rectangle', edgeStyle: 'pipes', obstacles: [obstacle('furnace', [-7, 1.5, -4], [3, 3, 3]), obstacle('furnace', [7, 1.5, 4], [3, 3, 3]), obstacle('wall', [0, 1, 0], [10, 2, .8])] },
  { id: 'skybridge', label: '比例天橋', baseShape: 'bridges', edgeStyle: 'clouds', obstacles: [obstacle('platform', [-8, .6, 0], [6, 1.2, 8]), obstacle('platform', [8, .6, 0], [6, 1.2, 8]), obstacle('bridge', [0, .7, 0], [10, .5, 2.2])] },
  { id: 'library', label: '邏輯圖書館', baseShape: 'square', edgeStyle: 'books', obstacles: [obstacle('shelf', [-7, 1.8, 0], [2, 3.6, 10]), obstacle('shelf', [7, 1.8, 0], [2, 3.6, 10]), obstacle('desk', [0, .8, -5], [5, 1.6, 2.5])] },
  { id: 'observatory', label: '應用題天文台', baseShape: 'circle', edgeStyle: 'telescopes', obstacles: [obstacle('dome', [0, 1.2, -6], [6, 2.4, 4]), obstacle('pillar', [-8, 1.4, 4], [1.2, 2.8, 1.2]), obstacle('pillar', [8, 1.4, 4], [1.2, 2.8, 1.2])] },
  { id: 'summit', label: '代數之巔', baseShape: 'terraces', edgeStyle: 'runes', obstacles: [obstacle('platform', [0, .7, -7], [10, 1.4, 5]), obstacle('platform', [-7, .45, 5], [5, .9, 5]), obstacle('platform', [7, .45, 5], [5, .9, 5])] },
];

export const TRIAL_ROOM_VARIANTS = {
  battle: { interaction: 'combat', layout: 'open', label: '戰鬥房' },
  swarm: { interaction: 'combat', layout: 'ring', label: '群落房' },
  elite: { interaction: 'combat', layout: 'duel', label: '精英房' },
  trap: { interaction: 'safeRunes', layout: 'hazards', label: '安全符文' },
  escort: { interaction: 'beacons', layout: 'route', label: '護送星光' },
  puzzle: { interaction: 'sequence', layout: 'nodes', label: '數學機關' },
  endurance: { interaction: 'combat', layout: 'gauntlet', label: '耐力房' },
  treasure: { interaction: 'matching', layout: 'treasure', label: '寶物配對' },
  rest: { interaction: 'rest', layout: 'sanctuary', label: '休息站' },
  boss: { interaction: 'boss', layout: 'arena', label: '守護者房' },
};

export function getTrialArenaTheme(tier) {
  return TRIAL_ARENA_THEMES[Math.max(0, Math.min(TRIAL_ARENA_THEMES.length - 1, Number(tier) || 0))];
}

export function getTrialRoomScenario(config) {
  const variant = TRIAL_ROOM_VARIANTS[config.roomType] || TRIAL_ROOM_VARIANTS.battle;
  const seed = config.floor * 37 + config.tier * 11;
  const targetOrder = [1, 2, 3].sort((a, b) => ((seed + a * 17) % 7) - ((seed + b * 17) % 7));
  return {
    ...variant,
    floor: config.floor,
    themeId: getTrialArenaTheme(config.tier).id,
    targetOrder,
    requiredNodes: config.roomType === 'treasure' ? 4 : 3,
    hint: getScenarioHint(config.roomType, targetOrder),
  };
}

function getScenarioHint(roomType, order) {
  if (roomType === 'trap') return `依序踩亮安全符文：${order.join(' → ')}`;
  if (roomType === 'escort') return '依道路順序啟動三座星光信標。';
  if (roomType === 'puzzle') return `觀察規律後依序啟動：${order.join(' → ')}`;
  if (roomType === 'treasure') return '找出成對圖形，完成兩組配對。';
  return '';
}
