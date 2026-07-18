// v0.3.0 生態系 / 怪物 / Boss 資料定義

// 10 種生態系（ambientLight 色、地面色、裝飾物類型/色、霧色）
export const BIOMES = [
  { id: 1, name: 'Plains',       ambient: '#cfe0ff', ground: '#7ac74f', fog: '#bcd6e8', deco: 'tree',      decoColor: '#4f9a3a', decoCount: 40 },
  { id: 2, name: 'Desert',       ambient: '#ffe6b0', ground: '#e0c680', fog: '#e8d8a0', deco: 'deadtree',  decoColor: '#8a7a4a', decoCount: 25 },
  { id: 3, name: 'Tundra',       ambient: '#eaf4ff', ground: '#eef4f8', fog: '#dfeaf2', deco: 'snowrock',  decoColor: '#cfe0ea', decoCount: 30, particle: 'snow' },
  { id: 4, name: 'Swamp',        ambient: '#8aa080', ground: '#3a4a2a', fog: '#4a5a3a', deco: 'tree',      decoColor: '#2a3a1a', decoCount: 35, particle: 'mist' },
  { id: 5, name: 'Volcano',      ambient: '#ff9a7a', ground: '#3a1a1a', fog: '#5a2a2a', deco: 'rock',      decoColor: '#6a2a1a', decoCount: 30, particle: 'ember' },
  { id: 6, name: 'Ruins',        ambient: '#d0d0d0', ground: '#8a8a80', fog: '#b0b0a8', deco: 'pillar',    decoColor: '#a0a098', decoCount: 20 },
  { id: 7, name: 'Mushroom',     ambient: '#e0c0ff', ground: '#5a3a6a', fog: '#7a5a8a', deco: 'mushroom',  decoColor: '#c04a8a', decoCount: 35 },
  { id: 8, name: 'Crystal Cave', ambient: '#5a6a8a', ground: '#1a1a2a', fog: '#2a2a4a', deco: 'crystal',   decoColor: '#5adfff', decoCount: 30, particle: 'glow' },
  { id: 9, name: 'Sky Island',   ambient: '#dfeaff', ground: '#9ac0e8', fog: '#cfe0f8', deco: 'tree',      decoColor: '#6fb0d0', decoCount: 20 },
  { id: 10, name: 'Chaos Rift',  ambient: '#ff6a6a', ground: '#2a0a1a', fog: '#4a0a2a', deco: 'crystal',   decoColor: '#ff3a6a', decoCount: 30, particle: 'glow' },
];

// 由 1~10 隨機抽一個生態系
export function randomBiome() {
  return BIOMES[Math.floor(Math.random() * BIOMES.length)];
}

// 10 種小怪：behavior 對應 AI 行為樹分支；aggroRange 發現玩家範圍、atkRange 攻擊範圍
export const MONSTERS = [
  { id: 'mon_slime',    name: 'Slime',          behavior: 'hop',      hp: 20, atk: 5,  speed: 1.5, color: '#5ac74f', aggroRange: 6,  atkRange: 1.3, ranged: false, weak: 'fire' },
  { id: 'mon_gob_war',  name: 'Goblin Warrior', behavior: 'shield',   hp: 40, atk: 8,  speed: 1.8, color: '#3a8a3a', aggroRange: 8,  atkRange: 1.5, ranged: false, weak: 'lightning' },
  { id: 'mon_gob_arch', name: 'Goblin Archer',  behavior: 'kite',     hp: 25, atk: 7,  speed: 2.2, color: '#6a8a3a', aggroRange: 11, atkRange: 7,   ranged: true,  weak: 'lightning' },
  { id: 'mon_scorpion', name: 'Desert Scorpion',behavior: 'burrow',   hp: 30, atk: 9,  speed: 2.0, color: '#c08a3a', aggroRange: 5,  atkRange: 1.4, ranged: false, weak: 'ice' },
  { id: 'mon_ghost',    name: 'Frost Ghost',    behavior: 'weave',    hp: 22, atk: 6,  speed: 2.5, color: '#a0d0ff', aggroRange: 9,  atkRange: 1.3, ranged: false, weak: 'fire' },
  { id: 'mon_gargoyle', name: 'Gargoyle',       behavior: 'weeping',  hp: 50, atk: 10, speed: 3.0, color: '#8a8a90', aggroRange: 7,  atkRange: 1.5, ranged: false, weak: 'ice' },
  { id: 'mon_flytrap',  name: 'Man-Eating Plant',behavior: 'lure',    hp: 45, atk: 8,  speed: 0,   color: '#c04a6a', aggroRange: 4,  atkRange: 3,   ranged: false, weak: 'fire' },
  { id: 'mon_bomb',     name: 'Bomb Creature',  behavior: 'explode',  hp: 15, atk: 15, speed: 1.6, color: '#4a4a4a', aggroRange: 8,  atkRange: 1.6, ranged: false, weak: 'ice' },
  { id: 'mon_thief',    name: 'Thief Goblin',   behavior: 'flee',     hp: 18, atk: 3,  speed: 4.0, color: '#c0a03a', aggroRange: 12, atkRange: 0,   ranged: false, weak: 'lightning' },
  { id: 'mon_knight',   name: 'Heavy Knight',   behavior: 'tank',     hp: 90, atk: 12, speed: 0.8, color: '#6a6a8a', aggroRange: 6,  atkRange: 1.6, ranged: false, weak: 'fire' },
];

// 5 種區域首領
export const BOSSES = [
  { id: 'boss_bull',   name: 'Earthen Bull',   hp: 300, atk: 20, color: '#8a5a3a', biome: 1 },
  { id: 'boss_dragon', name: 'Hellfire Dragon',hp: 350, atk: 25, color: '#c03a1a', biome: 5 },
  { id: 'boss_lich',   name: 'Frost Lich',     hp: 280, atk: 22, color: '#5adfff', biome: 3 },
  { id: 'boss_golem',  name: 'Clockwork Golem',hp: 400, atk: 18, color: '#8a8a70', biome: 6 },
  { id: 'boss_chaos',  name: 'Chaos Overlord', hp: 500, atk: 30, color: '#ff3a6a', biome: 10 },
];
