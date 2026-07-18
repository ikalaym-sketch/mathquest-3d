// 八個非森林大區的專屬生產配置。
// 每區使用不同道路拓樸、地形平台、水域、橋梁與結構物，不再共用固定四方平台。

const sub = (id, name, center, size, elevation, structureType, structureOffset = [0, 0]) => ({
  id, name, center, size, elevation, structureType, structureOffset,
});
const road = (id, from, to, width = 5.5, kind = 'main') => ({ id, from, to, width, kind });
const water = (id, center, size, rotation = 0, kind = 'pond') => ({ id, center, size, rotation, kind });
const bridge = (id, center, length, width, rotation, waterId) => ({ id, center, length, width, rotation, waterId });
const structure = (id, type, position, rotation = 0, scale = 1, subareaId = null) => ({ id, type, position, rotation, scale, subareaId });

export const REGION_PRODUCTION_LAYOUTS = {
  wind_highlands: {
    id: 'wind_highlands', size: [126, 122], spawn: [0.7, 0.8, 11.3], boundary: 'rolling_hills',
    palette: { base: '#8fd068', patch: '#a7dc7c', path: '#e8d59b', water: '#85d9ec', shore: '#bedfbc', accent: '#67b8df' },
    subareas: [
      sub('breeze_meadow', 'Breeze Meadow', [-31, -20], [31, 27], 0.35, 'windmill_station', [-4, -2]),
      sub('windmill_ridge', 'Windmill Ridge', [27, -27], [32, 25], 1.15, 'windmill_station', [4, -1]),
      sub('cloud_bridge', 'Cloud Bridge', [28, 22], [31, 27], 1.8, 'cloud_observatory', [2, 2]),
      sub('sky_observatory', 'Sky Observatory', [-27, 28], [31, 28], 2.35, 'cloud_observatory', [-2, 1]),
    ],
    roads: [
      road('wind_main_south', [0, 15], [-26, -17], 6.5), road('wind_ridge_curve', [-2, 15], [25, -24], 5.3),
      road('wind_north_arc', [2, 15], [24, 20], 5.5), road('wind_observatory_path', [-4, 15], [-25, 26], 5.2),
      road('wind_cross_link', [-22, -17], [21, -23], 4.2, 'secondary'), road('wind_high_link', [-22, 24], [22, 18], 4.0, 'secondary'),
    ],
    waters: [water('sky_stream', [2, -8], [8, 36], -0.24, 'stream')],
    bridges: [bridge('wind_stream_bridge', [0.5, -6], 9, 4.4, -0.24, 'sky_stream')],
    structures: [
      structure('wind_station_a', 'windmill_station', [-35, 0.35, -22], 0.3, 1, 'breeze_meadow'),
      structure('wind_station_b', 'windmill_station', [31, 1.15, -29], -0.4, 1.08, 'windmill_ridge'),
      structure('cloud_station', 'cloud_observatory', [30, 1.8, 24], 0.4, 0.92, 'cloud_bridge'),
      structure('sky_observatory_main', 'cloud_observatory', [-29, 2.35, 30], -0.2, 1.15, 'sky_observatory'),
    ],
    decoration: { family: 'wind', density: 34 },
  },
  snow_valley: {
    id: 'snow_valley', size: [124, 124], spawn: [-0.7, 0.8, 12.3], boundary: 'snow_peaks',
    palette: { base: '#d9f3f8', patch: '#edfaff', path: '#b9dbe8', water: '#77c9e7', shore: '#dff6fa', accent: '#68d5df' },
    subareas: [
      sub('frostflower_meadow', 'Frostflower Meadow', [-30, -25], [30, 28], 0.25, 'aurora_shrine', [-4, 0]),
      sub('mirror_lake', 'Mirror Lake', [28, -22], [31, 29], 0.55, 'aurora_shrine', [4, -2]),
      sub('aurora_observatory', 'Aurora Observatory', [-24, 27], [29, 29], 2.1, 'cloud_observatory', [-2, 2]),
      sub('snowlight_shrine', 'Snowlight Shrine', [30, 28], [31, 29], 1.35, 'aurora_shrine', [2, 2]),
    ],
    roads: [
      road('snow_south_path', [-7, 10], [-27, -21], 6.2), road('snow_lake_path', [-7, 8], [25, -18], 5.7),
      road('snow_observatory_path', [-7, 6], [-22, 24], 5.0), road('snow_shrine_path', [-7, 4], [27, 24], 5.3),
      road('snow_lake_ring', [18, -29], [41, -8], 3.8, 'secondary'), road('snow_north_link', [-20, 24], [25, 24], 4.0, 'secondary'),
    ],
    waters: [water('mirror_lake_water', [29, -18], [20, 16], 0.06, 'lake'), water('frozen_river', [2, 0], [7, 64], 0.12, 'frozen')],
    bridges: [bridge('snow_river_bridge', [2, 1], 9.5, 4.2, 0.12, 'frozen_river')],
    structures: [
      structure('frostflower_altar', 'aurora_shrine', [-34, 0.25, -25], 0.15, 0.8, 'frostflower_meadow'),
      structure('mirror_lake_gate', 'aurora_shrine', [39, 0.55, -30], -0.3, 0.82, 'mirror_lake'),
      structure('aurora_observatory_main', 'cloud_observatory', [-26, 2.1, 30], 0.35, 1.08, 'aurora_observatory'),
      structure('snowlight_shrine_main', 'aurora_shrine', [33, 1.35, 30], -0.25, 1.15, 'snowlight_shrine'),
    ],
    decoration: { family: 'snow', density: 31 },
  },
  farm_plains: {
    id: 'farm_plains', size: [128, 122], spawn: [0, 0.8, 10], boundary: 'orchard_fence',
    palette: { base: '#91ce67', patch: '#acd77c', path: '#dfbf78', water: '#69c6db', shore: '#b3d58f', accent: '#e5a43c' },
    subareas: [
      sub('sunny_orchard', 'Sunny Orchard', [-33, -22], [34, 28], 0.2, 'orchard_barn', [-4, -1]),
      sub('shepherd_hill', 'Shepherd Hill', [28, -27], [31, 26], 0.85, 'beekeeper_pavilion', [3, -2]),
      sub('riverside_field', 'Riverside Field', [-28, 27], [33, 29], 0.4, 'beekeeper_pavilion', [-3, 2]),
      sub('harvest_square', 'Harvest Square', [30, 26], [32, 30], 0.25, 'orchard_barn', [3, 2]),
    ],
    roads: [
      road('farm_plains_main', [0, 9], [-29, -18], 7.0), road('farm_plains_market', [0, 8], [27, 22], 6.4),
      road('farm_shepherd_path', [1, 6], [25, -24], 5.0), road('farm_river_path', [-2, 5], [-25, 24], 5.3),
      road('farm_south_link', [-25, -18], [22, -23], 4.2, 'secondary'), road('farm_north_link', [-23, 23], [25, 21], 4.4, 'secondary'),
    ],
    waters: [water('plains_river', [-4, 11], [9, 70], -0.12, 'river'), water('orchard_pond', [-40, -8], [13, 10], 0.2, 'pond')],
    bridges: [bridge('plains_river_bridge', [-3.5, 9], 10, 4.8, -0.12, 'plains_river')],
    structures: [
      structure('sunny_orchard_barn', 'orchard_barn', [-37, 0.2, -23], 0.18, 1, 'sunny_orchard'),
      structure('shepherd_bee_pavilion', 'beekeeper_pavilion', [31, 0.85, -29], -0.25, 1, 'shepherd_hill'),
      structure('river_bee_pavilion', 'beekeeper_pavilion', [-31, 0.4, 30], 0.2, 0.9, 'riverside_field'),
      structure('harvest_barn', 'orchard_barn', [33, 0.25, 28], -0.15, 1.08, 'harvest_square'),
    ],
    decoration: { family: 'farm', density: 38 },
  },
  star_village: {
    id: 'star_village', size: [124, 122], spawn: [0, 0.8, 10], boundary: 'garden_wall',
    palette: { base: '#7dca62', patch: '#9ad476', path: '#e6c680', water: '#6fc8de', shore: '#b5dc9c', accent: '#f1c34c' },
    subareas: [
      sub('village_outskirts', 'Village Outskirts', [-32, -24], [32, 28], 0.2, 'adventure_lodge', [-4, -2]),
      sub('learning_garden', 'Learning Garden', [28, -24], [32, 28], 0.35, 'star_learning_hall', [3, -1]),
      sub('river_market', 'River Market', [-29, 27], [31, 29], 0.25, 'crystal_dock', [-2, 2]),
      sub('adventure_meadow', 'Adventure Meadow', [29, 28], [32, 29], 0.65, 'adventure_lodge', [3, 2]),
    ],
    roads: [
      road('star_outskirts_road', [0, 9], [-29, -20], 6.8), road('star_learning_road', [0, 8], [25, -20], 6.2),
      road('star_market_road', [-2, 5], [-26, 24], 5.4), road('star_meadow_road', [3, 5], [26, 24], 5.4),
      road('star_south_boulevard', [-25, -19], [22, -19], 4.4, 'secondary'), road('star_north_boulevard', [-23, 23], [24, 23], 4.4, 'secondary'),
    ],
    waters: [water('market_river', [-18, 27], [10, 33], 0.05, 'river')],
    bridges: [bridge('market_bridge', [-18, 24], 10, 4.5, 0.05, 'market_river')],
    structures: [
      structure('outskirts_lodge', 'adventure_lodge', [-36, 0.2, -26], 0.15, 1, 'village_outskirts'),
      structure('learning_hall', 'star_learning_hall', [31, 0.35, -25], -0.15, 1.05, 'learning_garden'),
      structure('river_market_dock', 'crystal_dock', [-30, 0.25, 29], 0.1, 0.95, 'river_market'),
      structure('meadow_lodge', 'adventure_lodge', [32, 0.65, 30], -0.25, 1.02, 'adventure_meadow'),
    ],
    decoration: { family: 'star', density: 36 },
  },
  crystal_lake: {
    id: 'crystal_lake', size: [126, 124], spawn: [0, 0.8, 10], boundary: 'crystal_ridge',
    palette: { base: '#65c6a2', patch: '#81d2b5', path: '#b7d7b4', water: '#5fd1de', shore: '#a4e2d2', accent: '#3dd4dc' },
    subareas: [
      sub('shimmering_shore', 'Shimmering Shore', [-31, -24], [31, 27], 0.25, 'crystal_dock', [-3, -1]),
      sub('island_garden', 'Island Garden', [27, -24], [30, 27], 0.55, 'prism_sanctuary', [2, -1]),
      sub('crystal_bridge', 'Crystal Bridge', [-25, 28], [31, 28], 1.0, 'crystal_dock', [-2, 2]),
      sub('echo_grotto', 'Echo Grotto', [30, 29], [31, 28], 1.55, 'prism_sanctuary', [2, 2]),
    ],
    roads: [
      road('crystal_shore_path', [0, 8], [-28, -20], 6.2), road('crystal_island_path', [1, 7], [24, -20], 5.8),
      road('crystal_bridge_path', [-2, 5], [-22, 24], 5.0), road('crystal_grotto_path', [3, 4], [27, 25], 5.0),
      road('crystal_south_link', [-23, -18], [20, -18], 4.0, 'secondary'), road('crystal_north_link', [-19, 22], [23, 23], 4.0, 'secondary'),
    ],
    waters: [water('crystal_main_lake', [2, -5], [34, 22], 0.12, 'lake'), water('crystal_stream', [-8, 19], [8, 45], -0.18, 'river')],
    bridges: [bridge('crystal_lake_bridge', [1, -4], 18, 4.6, 0.12, 'crystal_main_lake'), bridge('crystal_stream_bridge', [-8, 19], 9, 4.2, -0.18, 'crystal_stream')],
    structures: [
      structure('shimmering_dock', 'crystal_dock', [-34, 0.25, -25], 0.2, 1, 'shimmering_shore'),
      structure('island_prism', 'prism_sanctuary', [30, 0.55, -25], -0.2, 0.95, 'island_garden'),
      structure('bridge_dock', 'crystal_dock', [-27, 1.0, 30], 0.15, 0.9, 'crystal_bridge'),
      structure('grotto_sanctuary', 'prism_sanctuary', [33, 1.55, 31], -0.1, 1.08, 'echo_grotto'),
    ],
    decoration: { family: 'crystal', density: 35 },
  },
  sun_canyon: {
    id: 'sun_canyon', size: [128, 124], spawn: [-0.7, 0.8, 11.3], boundary: 'canyon_walls',
    palette: { base: '#e8bb69', patch: '#efca84', path: '#f4d28f', water: '#66c7d0', shore: '#e6c98d', accent: '#e67838' },
    subareas: [
      sub('golden_ravine', 'Golden Ravine', [-34, -22], [34, 27], 0.35, 'canyon_forge', [-4, -1]),
      sub('rope_bridge', 'Rope Bridge', [28, -27], [31, 26], 1.5, 'rope_bridge_station', [2, -1]),
      sub('cactus_camp', 'Cactus Camp', [-27, 28], [32, 29], 0.75, 'rope_bridge_station', [-2, 2]),
      sub('sun_temple', 'Sun Temple', [31, 29], [32, 29], 2.1, 'canyon_forge', [3, 2]),
    ],
    roads: [
      road('canyon_ravine_path', [0, 8], [-30, -18], 6.2), road('canyon_rope_path', [2, 7], [25, -23], 5.2),
      road('canyon_camp_path', [-3, 5], [-24, 25], 5.0), road('canyon_temple_path', [4, 4], [28, 25], 5.0),
      road('canyon_south_ridge', [-26, -17], [22, -21], 4.0, 'secondary'), road('canyon_north_ridge', [-21, 23], [24, 23], 4.0, 'secondary'),
    ],
    waters: [water('canyon_oasis', [-18, 4], [15, 11], 0.2, 'oasis'), water('ravine_gap', [6, 7], [12, 48], -0.05, 'ravine')],
    bridges: [bridge('canyon_rope_bridge', [6, 6], 14, 4.2, -0.05, 'ravine_gap')],
    structures: [
      structure('ravine_forge', 'canyon_forge', [-38, 0.35, -23], 0.2, 1, 'golden_ravine'),
      structure('rope_station', 'rope_bridge_station', [31, 1.5, -29], -0.3, 1.02, 'rope_bridge'),
      structure('camp_station', 'rope_bridge_station', [-29, 0.75, 30], 0.2, 0.9, 'cactus_camp'),
      structure('sun_forge_temple', 'canyon_forge', [35, 2.1, 31], -0.15, 1.12, 'sun_temple'),
    ],
    decoration: { family: 'canyon', density: 30 },
  },
  mushroom_grove: {
    id: 'mushroom_grove', size: [124, 124], spawn: [0, 0.8, 10], boundary: 'root_ring',
    palette: { base: '#7dc979', patch: '#9ad18b', path: '#d6b2d9', water: '#77c8c6', shore: '#a9d7ad', accent: '#d45fa2' },
    subareas: [
      sub('bubblecap_trail', 'Bubblecap Trail', [-31, -25], [31, 28], 0.25, 'mushroom_house', [-3, -1]),
      sub('glow_pond', 'Glow Pond', [28, -24], [31, 28], 0.45, 'glow_pavilion', [2, -1]),
      sub('fairy_ring', 'Fairy Ring', [-26, 28], [30, 29], 0.8, 'glow_pavilion', [-2, 2]),
      sub('giant_cap_village', 'Giant Cap Village', [30, 29], [32, 29], 1.0, 'mushroom_house', [3, 2]),
    ],
    roads: [
      road('mushroom_trail', [0, 8], [-28, -21], 6.0), road('mushroom_pond_path', [1, 7], [25, -20], 5.4),
      road('mushroom_fairy_path', [-3, 5], [-23, 25], 5.0), road('mushroom_village_path', [3, 4], [27, 25], 5.2),
      road('mushroom_south_arc', [-24, -18], [21, -18], 4.0, 'secondary'), road('mushroom_north_arc', [-20, 23], [23, 23], 4.0, 'secondary'),
    ],
    waters: [water('glow_pond_water', [29, -15], [18, 15], 0.08, 'pond'), water('spore_stream', [-6, 9], [7, 54], 0.15, 'stream')],
    bridges: [bridge('spore_stream_bridge', [-6, 8], 9, 4.2, 0.15, 'spore_stream')],
    structures: [
      structure('bubblecap_house', 'mushroom_house', [-34, 0.25, -27], 0.2, 0.95, 'bubblecap_trail'),
      structure('glow_pond_pavilion', 'glow_pavilion', [31, 0.45, -28], -0.2, 1, 'glow_pond'),
      structure('fairy_ring_pavilion', 'glow_pavilion', [-28, 0.8, 30], 0.25, 1.05, 'fairy_ring'),
      structure('giant_cap_home', 'mushroom_house', [33, 1.0, 31], -0.15, 1.12, 'giant_cap_village'),
    ],
    decoration: { family: 'mushroom', density: 40 },
  },
  clockwork_ruins: {
    id: 'clockwork_ruins', size: [126, 124], spawn: [0, 0.8, 10], boundary: 'machine_wall',
    palette: { base: '#9bbf96', patch: '#aec8a8', path: '#c9b68d', water: '#78b9bf', shore: '#a8b9a3', accent: '#d99b42' },
    subareas: [
      sub('gear_courtyard', 'Gear Courtyard', [-32, -24], [32, 28], 0.35, 'gear_workshop', [-3, -1]),
      sub('puzzle_hall', 'Puzzle Hall', [28, -25], [31, 28], 0.65, 'clock_core', [2, -1]),
      sub('steam_bridge', 'Steam Bridge', [-27, 28], [31, 29], 1.2, 'gear_workshop', [-2, 2]),
      sub('clock_core', 'Clock Core', [30, 29], [32, 29], 2.0, 'clock_core', [3, 2]),
    ],
    roads: [
      road('gear_courtyard_path', [0, 8], [-29, -20], 6.2), road('puzzle_hall_path', [1, 7], [25, -21], 5.8),
      road('steam_bridge_path', [-3, 5], [-24, 25], 5.1), road('clock_core_path', [4, 4], [30, 19], 5.1),
      road('clock_south_link', [-24, -18], [22, -19], 4.0, 'secondary'), road('clock_north_link', [-21, 23], [24, 28], 4.0, 'secondary'),
    ],
    waters: [water('coolant_channel', [5, 5], [9, 61], -0.08, 'channel')],
    bridges: [bridge('steam_channel_bridge', [5, 8], 10, 4.4, -0.08, 'coolant_channel')],
    structures: [
      structure('gear_workshop_main', 'gear_workshop', [-35, 0.35, -25], 0.2, 1, 'gear_courtyard'),
      structure('puzzle_clock', 'clock_core', [31, 0.65, -27], -0.2, 0.9, 'puzzle_hall'),
      structure('steam_workshop', 'gear_workshop', [-29, 1.2, 30], 0.2, 0.92, 'steam_bridge'),
      structure('clock_core_main', 'clock_core', [34, 2.0, 31], -0.15, 1.12, 'clock_core'),
    ],
    decoration: { family: 'clockwork', density: 32 },
  },
};

export const REGION_PRODUCTION_IDS = Object.keys(REGION_PRODUCTION_LAYOUTS);

export function getRegionProductionLayout(regionId) {
  return REGION_PRODUCTION_LAYOUTS[regionId] || null;
}
