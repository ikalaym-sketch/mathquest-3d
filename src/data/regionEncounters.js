// 八大區域正式遭遇配置。
import { getRegionGameplayProfile } from './regionGameplayProfiles.js';
import { getEliteCombatProfile } from './combatEncounterProfiles.js';
// 每區固定三種一般怪物、一種精英與一名區域 Boss；資料與 Runtime 元件分離，方便直接替換 GLB 與數值。
const REGION_THEME = {
  wind_highlands: {
    prefix: 'wind', color: '#72d7ef', weak: 'lightning',
    names: ['Gale Puff', 'Kite Raider', 'Cloud Manta'],
    behaviors: ['hop', 'kite', 'weave'],
    elite: ['Storm Warden', 'tank'], boss: ['Tempest Roc', '#4ea8d8'],
  },
  snow_valley: {
    prefix: 'snow', color: '#bfeeff', weak: 'fire',
    names: ['Frost Wisp', 'Ice Tusk', 'Aurora Sentinel'],
    behaviors: ['weave', 'shield', 'weeping'],
    elite: ['Mirror Lake Knight', 'tank'], boss: ['Aurora Stag', '#75cdec'],
  },
  farm_plains: {
    prefix: 'farm', color: '#e3bd55', weak: 'fire',
    names: ['Hay Sprout', 'Orchard Bandit', 'Burrow Mole'],
    behaviors: ['hop', 'flee', 'burrow'],
    elite: ['Harvest Guardian', 'shield'], boss: ['Golden Horn Boar', '#bd7a3f'],
  },
  star_village: {
    prefix: 'star', color: '#f5cc58', weak: 'lightning',
    names: ['Star Jelly', 'Book Mimic', 'Meadow Rascal'],
    behaviors: ['hop', 'lure', 'flee'],
    elite: ['Learning Garden Keeper', 'tank'], boss: ['Comet Lion', '#d789d7'],
  },
  crystal_lake: {
    prefix: 'crystal', color: '#53ddd8', weak: 'lightning',
    names: ['Prism Slime', 'Lake Skimmer', 'Echo Shell'],
    behaviors: ['hop', 'weave', 'shield'],
    elite: ['Prism Warden', 'tank'], boss: ['Crystal Leviathan', '#4fb5dc'],
  },
  sun_canyon: {
    prefix: 'canyon', color: '#e18a45', weak: 'ice',
    names: ['Cactus Hopper', 'Sand Scorpion', 'Sun Bomb'],
    behaviors: ['hop', 'burrow', 'explode'],
    elite: ['Rope Bridge Marauder', 'shield'], boss: ['Solar Sandwyrm', '#cc5d32'],
  },
  mushroom_grove: {
    prefix: 'mushroom', color: '#dc72bd', weak: 'fire',
    names: ['Bubblecap Slime', 'Spore Dancer', 'Glow Maw'],
    behaviors: ['hop', 'weave', 'lure'],
    elite: ['Fairy Ring Guardian', 'tank'], boss: ['Elder Mooncap', '#9b68d1'],
  },
  clockwork_ruins: {
    prefix: 'clockwork', color: '#c28c48', weak: 'lightning',
    names: ['Gearling', 'Steam Drone', 'Clock Knight'],
    behaviors: ['flee', 'kite', 'tank'],
    elite: ['Puzzle Hall Executor', 'weeping'], boss: ['Chrono Colossus', '#7a8582'],
  },
};


const ELITE_SPAWNS = {
  mushroom_grove: [-18, 0.8, 34],
  clockwork_ruins: [17, 0.8, 34],
};

const SPAWN_SETS = {
  wind_highlands: [[-35, -24], [-21, -15], [29, -28], [35, 18], [24, 28], [-27, 31], [-14, 20], [16, 13]],
  snow_valley: [[-32, -27], [-18, -18], [25, -29], [34, 18], [24, 30], [-27, 26], [-12, 20], [16, 9]],
  farm_plains: [[-34, -25], [-21, -12], [29, -26], [35, 19], [20, 31], [-29, 28], [-11, 20], [14, 12]],
  star_village: [[-31, -24], [-19, -13], [28, -24], [34, 17], [20, 30], [-26, 29], [-12, 19], [14, 10]],
  crystal_lake: [[-35, -26], [-23, -14], [30, -25], [36, 17], [24, 29], [-28, 30], [-13, 22], [16, 11]],
  sun_canyon: [[-36, -26], [-24, -13], [28, -29], [37, 18], [24, 31], [-30, 28], [-13, 20], [17, 11]],
  mushroom_grove: [[-33, -25], [-21, -14], [27, -27], [35, 18], [23, 30], [-28, 28], [-12, 21], [15, 11]],
  clockwork_ruins: [[-34, -28], [-22, -15], [29, -29], [36, 19], [25, 31], [-29, 29], [-14, 21], [17, 10]],
};

export const REGION_ENCOUNTERS = Object.fromEntries(Object.entries(REGION_THEME).map(([regionId, theme], regionIndex) => {
  const regionMaterialId = getRegionGameplayProfile(regionId)?.materialId || null;
  const normal = theme.names.map((name, index) => ({
    id: `${theme.prefix}_monster_${index + 1}`,
    name,
    tier: 'normal',
    behavior: theme.behaviors[index],
    hp: 34 + regionIndex * 7 + index * 8,
    atk: 6 + regionIndex + index * 2,
    speed: Math.max(0.9, 1.55 + index * 0.3 - regionIndex * 0.03),
    color: shiftColor(theme.color, index * 0.08),
    aggroRange: 7 + index * 1.5,
    atkRange: theme.behaviors[index] === 'kite' ? 7 : theme.behaviors[index] === 'lure' ? 3 : 1.5,
    ranged: theme.behaviors[index] === 'kite',
    weak: theme.weak,
    modelAssetId: `encounter:${theme.prefix}_monster_${index + 1}`,
    modelScale: 0.9 + index * 0.05,
    modelPosition: [0, -0.5, 0],
    regionId,
    regionMaterialId,
  }));
  const elite = {
    id: `${theme.prefix}_elite`, name: theme.elite[0], tier: 'elite', behavior: theme.elite[1],
    hp: 135 + regionIndex * 28, atk: 14 + regionIndex * 2, speed: 1.05 + regionIndex * 0.03,
    color: shiftColor(theme.color, -0.14), aggroRange: 10, atkRange: 1.8, ranged: false, weak: theme.weak,
    modelAssetId: `encounter:${theme.prefix}_elite`, modelScale: 1.25, modelPosition: [0, -0.65, 0],
    regionId, regionMaterialId, eliteTraits: getEliteCombatProfile(regionId),
  };
  const boss = {
    id: `${theme.prefix}_boss`, name: theme.boss[0], tier: 'boss', hp: 340 + regionIndex * 55,
    atk: 21 + regionIndex * 3, color: theme.boss[1],
    modelAssetId: `encounter:${theme.prefix}_boss`, modelScale: 1.65, modelPosition: [0, -1.15, 0],
    regionId, regionMaterialId,
  };
  return [regionId, {
    regionId,
    normal,
    elite,
    boss,
    normalSpawns: SPAWN_SETS[regionId],
    eliteSpawn: ELITE_SPAWNS[regionId] || [0, 0.8, 34],
    bossSpawn: [0, 1.2, -43],
    respawnMs: 11000,
    eliteRespawnMs: 65000,
  }];
}));

export const REGION_ENCOUNTER_IDS = Object.keys(REGION_ENCOUNTERS);

export function getRegionEncounter(regionId) {
  return REGION_ENCOUNTERS[regionId] || null;
}

function shiftColor(hex, ratio) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  const adjusted = channels.map((channel) => {
    const target = ratio >= 0 ? 255 : 0;
    return Math.max(0, Math.min(255, Math.round(channel + (target - channel) * Math.abs(ratio))));
  });
  return `#${adjusted.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
