// 九宮格世界區域設定。
// 每一個大區都包含四個可探索子區、專屬地標、怪物池、素材與隨機事件池。
export const WORLD_REGIONS = [
  {
    id: 'forest_ruins', grid: [0, 0], icon: '🌳', name: '森林遺跡', level: 2,
    sky: '#9ed8ff', fog: '#ccefd9', ground: '#72c66a', path: '#d8bd82', accent: '#44a66a',
    landmark: 'greatTree', monsterIds: ['mon_slime', 'mon_gob_war', 'mon_flytrap'], material: '藥草',
    subareas: ['低語林地', '瀑布小徑', '古代之門', '苔蘚神殿'],
    events: ['迷路精靈', '古代種子', '森林救援'],
  },
  {
    id: 'wind_highlands', grid: [1, 0], icon: '🌬️', name: '風之高地', level: 4,
    sky: '#9fdcff', fog: '#dff5ff', ground: '#8fd068', path: '#e6cf8d', accent: '#67b8df',
    landmark: 'windmill', monsterIds: ['mon_gob_arch', 'mon_ghost', 'mon_thief'], material: '風羽',
    subareas: ['微風草原', '風車山脊', '雲端橋梁', '天空觀測站'],
    events: ['逃走的風箏', '風之水晶', '雲端接力'],
  },
  {
    id: 'snow_valley', grid: [2, 0], icon: '❄️', name: '雪光谷', level: 8,
    sky: '#b6e4ff', fog: '#eef9ff', ground: '#d9f3f8', path: '#b9dbe8', accent: '#5bc5df',
    landmark: 'iceSpire', monsterIds: ['mon_ghost', 'mon_gargoyle', 'mon_knight'], material: '冰晶',
    subareas: ['霜花草原', '鏡湖', '極光觀測站', '雪光神殿'],
    events: ['溫暖小獸', '冰封鐘聲', '極光寶藏'],
  },
  {
    id: 'farm_plains', grid: [0, 1], icon: '🌾', name: '農業平原', level: 1,
    sky: '#aee4ff', fog: '#e8f6d8', ground: '#91ce67', path: '#dfbf78', accent: '#e5a43c',
    landmark: 'barn', monsterIds: ['mon_slime', 'mon_thief', 'mon_gob_war'], material: '豐收作物',
    subareas: ['陽光果園', '牧羊山丘', '河畔農田', '豐收廣場'],
    events: ['走失的小雞', '金色蕪菁', '修理運貨車'],
  },
  {
    id: 'star_village', grid: [1, 1], icon: '⭐', name: '星光村外圍', level: 1,
    sky: '#9bd7ff', fog: '#d7f0dd', ground: '#7dca62', path: '#e6c680', accent: '#f1c34c',
    landmark: 'starTower', monsterIds: ['mon_slime', 'mon_gob_war', 'mon_thief'], material: '星塵',
    subareas: ['村莊外圍', '學習花園', '河畔市場', '冒險草原'],
    events: ['星光包裹', '數學野餐', '隱藏之星'],
  },
  {
    id: 'crystal_lake', grid: [2, 1], icon: '💎', name: '水晶湖', level: 5,
    sky: '#9fe7ff', fog: '#d9f8ff', ground: '#65c6a2', path: '#b7d7b4', accent: '#3dd4dc',
    landmark: 'crystalArch', monsterIds: ['mon_ghost', 'mon_flytrap', 'mon_gob_arch'], material: '湖光水晶',
    subareas: ['閃耀湖岸', '島嶼花園', '水晶橋', '回音洞窟'],
    events: ['歌唱水晶', '迷失小船', '彩虹魚'],
  },
  {
    id: 'sun_canyon', grid: [0, 2], icon: '🏜️', name: '日光峽谷', level: 7,
    sky: '#8fd7ff', fog: '#ffe8bd', ground: '#e8bb69', path: '#f4d28f', accent: '#e67838',
    landmark: 'sunTemple', monsterIds: ['mon_scorpion', 'mon_bomb', 'mon_gob_arch'], material: '日耀礦',
    subareas: ['黃金峽谷', '繩橋區', '仙人掌營地', '太陽神殿'],
    events: ['綠洲救援', '滾動巨石', '沙漠羅盤'],
  },
  {
    id: 'mushroom_grove', grid: [1, 2], icon: '🍄', name: '蘑菇濕地', level: 6,
    sky: '#b7ddff', fog: '#f1dcff', ground: '#7dc979', path: '#d6b2d9', accent: '#d45fa2',
    landmark: 'giantMushroom', monsterIds: ['mon_flytrap', 'mon_ghost', 'mon_slime'], material: '螢光孢子',
    subareas: ['泡泡菇小徑', '螢光池', '妖精環', '巨菇村'],
    events: ['跳舞孢子', '妖精茶會', '巨菇遊行'],
  },
  {
    id: 'clockwork_ruins', grid: [2, 2], icon: '⚙️', name: '機械遺跡', level: 10,
    sky: '#a9dcff', fog: '#e6edf2', ground: '#9bbf96', path: '#c9b68d', accent: '#d99b42',
    landmark: 'gearTower', monsterIds: ['mon_gargoyle', 'mon_knight', 'mon_bomb'], material: '古代齒輪',
    subareas: ['齒輪庭院', '謎題大廳', '蒸汽橋', '時鐘核心'],
    events: ['故障機器人', '時間謎題', '齒輪風暴'],
  },
];

export const WORLD_REGION_MAP = Object.fromEntries(WORLD_REGIONS.map((region) => [region.id, region]));

export const STARTER_REGION_IDS = ['forest_ruins', 'star_village'];

export function getWorldRegion(regionId) {
  return WORLD_REGION_MAP[regionId] || WORLD_REGION_MAP.star_village;
}
