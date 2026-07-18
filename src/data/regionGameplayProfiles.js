// 八大正式區域的玩法差異化設定。
// 本檔只保存 Canonical 資料：區域素材、核心機制、互動 Socket、引導 NPC、事件步驟與製作配方。
// Runtime 元件不得在內部再複製另一份區域規則，以避免資料漂移。

const node = (id, label, position, subareaId, icon, color, order) => ({ id, label, position, subareaId, icon, color, order });
const step = (id, type, targetId, label, target = 1, position = null) => ({ id, type, targetId, label, target, position });
const event = (id, name, description, rewardGold, steps) => ({ id, name, description, rewardGold, steps });
const socket = (structureId, socketId, label, icon, action = 'workshop') => ({ structureId, socketId, label, icon, action, targetId: `${structureId}:${socketId}` });

export const REGION_MATERIALS = [
  { id: 'mat_wind_feather', name: '風羽', type: 'region', sellPrice: 18, icon: '🪶', regionId: 'wind_highlands' },
  { id: 'mat_ice_crystal', name: '冰晶', type: 'region', sellPrice: 22, icon: '❄️', regionId: 'snow_valley' },
  { id: 'mat_fresh_produce', name: '豐收作物', type: 'region', sellPrice: 16, icon: '🥕', regionId: 'farm_plains' },
  { id: 'mat_star_dust', name: '星塵', type: 'region', sellPrice: 20, icon: '✨', regionId: 'star_village' },
  { id: 'mat_lake_crystal', name: '湖光水晶', type: 'region', sellPrice: 24, icon: '💎', regionId: 'crystal_lake' },
  { id: 'mat_sun_ore', name: '日耀礦', type: 'region', sellPrice: 26, icon: '☀️', regionId: 'sun_canyon' },
  { id: 'mat_glow_spore', name: '螢光孢子', type: 'region', sellPrice: 21, icon: '🍄', regionId: 'mushroom_grove' },
  { id: 'mat_ancient_gear', name: '古代齒輪', type: 'region', sellPrice: 28, icon: '⚙️', regionId: 'clockwork_ruins' },
];

export const REGION_CRAFTS = [
  { id: 'item_wind_compass', name: '風向羅盤', type: 'keepsake', rarity: 'Blue', regionId: 'wind_highlands', description: '記錄高地風向的冒險紀念品。' },
  { id: 'item_aurora_lantern', name: '極光提燈', type: 'keepsake', rarity: 'Blue', regionId: 'snow_valley', description: '以冰晶保存柔和極光。' },
  { id: 'item_harvest_badge', name: '豐收徽章', type: 'keepsake', rarity: 'Blue', regionId: 'farm_plains', description: '完成農業平原探索後製作的徽章。' },
  { id: 'item_star_notebook', name: '星光學習冊', type: 'keepsake', rarity: 'Blue', regionId: 'star_village', description: '會記住冒險規律的星光筆記本。' },
  { id: 'item_prism_charm', name: '稜鏡吊飾', type: 'keepsake', rarity: 'Blue', regionId: 'crystal_lake', description: '能把日光分成七色的水晶吊飾。' },
  { id: 'item_canyon_measure', name: '峽谷測距尺', type: 'keepsake', rarity: 'Blue', regionId: 'sun_canyon', description: '用來測量峽谷與橋索距離。' },
  { id: 'item_spore_music_box', name: '孢子音樂盒', type: 'keepsake', rarity: 'Blue', regionId: 'mushroom_grove', description: '輕觸後會發出森林節拍。' },
  { id: 'item_clockwork_token', name: '時序代幣', type: 'keepsake', rarity: 'Blue', regionId: 'clockwork_ruins', description: '刻有正確齒輪序列的古代代幣。' },
];

export const REGION_GAMEPLAY_PROFILES = {
  wind_highlands: {
    regionId: 'wind_highlands', materialId: 'mat_wind_feather', keepsakeId: 'item_wind_compass', skillContext: 'region_wind_angles',
    mechanic: {
      id: 'wind_alignment', variant: 'wind', title: '風向校準', description: '依序校準三座風向標，讓上升氣流重新連通。',
      nodes: [
        node('wind_vane_meadow', '草原風向標', [-34, 0.4, -21], 'breeze_meadow', '🌬️', '#78d7ef', 1),
        node('wind_vane_ridge', '山脊葉片角度', [30, 1.1, -24], 'windmill_ridge', '🌀', '#4fb7dc', 2),
        node('wind_vane_cloud', '雲橋氣流閥', [28, 1.8, 23], 'cloud_bridge', '☁️', '#bdeeff', 3),
      ],
    },
    guide: { name: '風語員小嵐', position: [-30, 0.5, -24], outfitColor: '#4fa9cf', trimColor: '#fff0a5', role: 'guide' },
    structureInteractions: [
      socket('wind_station_a', 'entry', '風車補給台', '🪶', 'workshop'),
      socket('sky_observatory_main', 'telescope', '天空觀測任務', '🔭', 'challenge'),
    ],
    events: [
      event('runaway_kite', '逃走的風箏', '先找到風箏，再校準草原風向標並蒐集風羽。', 120, [
        step('find_kite', 'beacon', 'runaway_kite', '在微風草原找到風箏', 1, [-27, 0.6, -15]),
        step('align_meadow', 'mechanic', 'wind_vane_meadow', '完成草原風向校準'),
        step('collect_feather', 'collect', 'mat_wind_feather', '蒐集風羽', 2),
      ]),
      event('wind_crystal', '風之水晶', '觀測風向、啟動山脊葉片，再回報天空觀測站。', 135, [
        step('find_crystal', 'beacon', 'wind_crystal', '找到漂浮的風之水晶', 1, [24, 1.4, -18]),
        step('align_ridge', 'mechanic', 'wind_vane_ridge', '校準山脊葉片'),
        step('report_telescope', 'structure', 'sky_observatory_main:telescope', '使用天空望遠鏡完成觀測'),
      ]),
      event('sky_race', '雲端接力', '穿越雲橋，啟動氣流閥並擊退高地怪物。', 150, [
        step('start_race', 'beacon', 'sky_race', '在雲橋起點開始接力', 1, [-18, 1.7, 25]),
        step('align_cloud', 'mechanic', 'wind_vane_cloud', '啟動雲橋氣流閥'),
        step('defeat_wind', 'defeat', 'normal', '擊退高地怪物', 2),
      ]),
    ],
  },
  snow_valley: {
    regionId: 'snow_valley', materialId: 'mat_ice_crystal', keepsakeId: 'item_aurora_lantern', skillContext: 'region_snow_temperature',
    mechanic: {
      id: 'thermal_crystals', variant: 'snow', title: '冰晶溫度平衡', description: '依序調整三枚冰晶，使道路維持安全溫度。',
      nodes: [
        node('snow_heat_flower', '霜花保溫晶', [-32, 0.5, -22], 'frostflower_meadow', '🌡️', '#bcefff', 1),
        node('snow_mirror_crystal', '鏡湖冰層晶', [28, 0.6, -28], 'mirror_lake', '🧊', '#8dd8ef', 2),
        node('snow_aurora_lens', '極光折射晶', [-25, 1.4, 28], 'aurora_observatory', '🌌', '#b8a9ff', 3),
      ],
    },
    guide: { name: '雪谷巡護員米雅', position: [-29, 0.5, -25], outfitColor: '#7cc6df', trimColor: '#e9fbff', role: 'guide' },
    structureInteractions: [
      socket('frostflower_altar', 'altar', '冰晶工坊', '❄️', 'workshop'),
      socket('aurora_observatory_main', 'telescope', '極光觀測任務', '🌌', 'challenge'),
    ],
    events: [
      event('warm_the_cub', '溫暖小獸', '找出迷路小獸、啟動保溫晶並取得冰晶。', 120, [
        step('find_cub', 'beacon', 'warm_the_cub', '在霜花草原找到小獸', 1, [-23, 0.5, -15]),
        step('heat_flower', 'mechanic', 'snow_heat_flower', '調整霜花保溫晶'),
        step('collect_ice', 'collect', 'mat_ice_crystal', '蒐集冰晶', 2),
      ]),
      event('frozen_bell', '冰封鐘聲', '修正鏡湖冰層後，前往神殿敲響安全鐘。', 135, [
        step('find_bell', 'beacon', 'frozen_bell', '找到被冰封的鐘槌', 1, [23, 0.7, -10]),
        step('mirror_safe', 'mechanic', 'snow_mirror_crystal', '計算鏡湖安全冰層'),
        step('shrine_altar', 'structure', 'frostflower_altar:altar', '回到神殿回報'),
      ]),
      event('aurora_treasure', '極光寶藏', '校準極光折射晶，再完成觀測站記錄。', 150, [
        step('find_aurora_map', 'beacon', 'aurora_treasure', '取得極光座標圖', 1, [-19, 1.3, 24]),
        step('aurora_lens', 'mechanic', 'snow_aurora_lens', '校準極光折射晶'),
        step('aurora_report', 'structure', 'aurora_observatory_main:telescope', '完成極光觀測記錄'),
      ]),
    ],
  },
  farm_plains: {
    regionId: 'farm_plains', materialId: 'mat_fresh_produce', keepsakeId: 'item_harvest_badge', skillContext: 'region_farm_arrays',
    mechanic: {
      id: 'harvest_planning', variant: 'farm', title: '田列規劃', description: '依序計算果樹、蜂箱與市集貨箱的行列數量。',
      nodes: [
        node('farm_orchard_rows', '果園行列牌', [-35, 0.5, -20], 'sunny_orchard', '🍎', '#efb64c', 1),
        node('farm_hive_counter', '蜂箱數量台', [29, 0.9, -20], 'shepherd_hill', '🐝', '#ffd95c', 2),
        node('farm_market_crates', '豐收貨箱表', [29, 0.5, 26], 'harvest_square', '📦', '#dc9443', 3),
      ],
    },
    guide: { name: '農務隊長阿禾', position: [-31, 0.5, -24], outfitColor: '#76ad55', trimColor: '#ffd46b', role: 'farmer' },
    structureInteractions: [
      socket('sunny_orchard_barn', 'entry', '農產加工台', '🌾', 'workshop'),
      socket('shepherd_bee_pavilion', 'honey_counter', '蜂蜜分裝任務', '🍯', 'challenge'),
    ],
    events: [
      event('runaway_chicken', '走失的小雞', '找到小雞、完成果園行列計算並蒐集作物。', 110, [
        step('find_chicken', 'beacon', 'runaway_chicken', '在果園找到小雞', 1, [-27, 0.5, -14]),
        step('orchard_rows', 'mechanic', 'farm_orchard_rows', '完成果園行列牌'),
        step('collect_produce', 'collect', 'mat_fresh_produce', '蒐集豐收作物', 2),
      ]),
      event('golden_turnip', '金色蕪菁', '完成蜂箱計數，並在蜂亭確認安全存放。', 130, [
        step('find_turnip', 'beacon', 'golden_turnip', '找到金色蕪菁', 1, [22, 0.8, -18]),
        step('count_hives', 'mechanic', 'farm_hive_counter', '完成蜂箱數量台'),
        step('honey_counter', 'structure', 'shepherd_bee_pavilion:honey_counter', '在蜂亭完成分裝'),
      ]),
      event('cart_repair', '修理運貨車', '確認市集貨箱數量，並擊退妨礙運輸的怪物。', 145, [
        step('find_cart', 'beacon', 'cart_repair', '在豐收廣場找到貨車', 1, [22, 0.5, 23]),
        step('count_crates', 'mechanic', 'farm_market_crates', '完成貨箱表'),
        step('clear_road', 'defeat', 'normal', '清除道路怪物', 2),
      ]),
    ],
  },
  star_village: {
    regionId: 'star_village', materialId: 'mat_star_dust', keepsakeId: 'item_star_notebook', skillContext: 'region_star_patterns',
    mechanic: {
      id: 'constellation_learning', variant: 'star', title: '星座規律連線', description: '依照規律點亮三座學習星標。',
      nodes: [
        node('star_outskirts_marker', '外圍第一星', [-33, 0.5, -20], 'village_outskirts', '⭐', '#ffd458', 1),
        node('star_learning_pattern', '學習花園星圖', [29, 0.7, -20], 'learning_garden', '📚', '#f6b94b', 2),
        node('star_meadow_constellation', '冒險草原星座', [28, 1.0, 26], 'adventure_meadow', '🌟', '#e68cff', 3),
      ],
    },
    guide: { name: '星圖老師露露', position: [26, 0.6, -24], outfitColor: '#786fd0', trimColor: '#ffd65e', role: 'scholar' },
    structureInteractions: [
      socket('learning_hall', 'entry', '星光學習工坊', '📘', 'workshop'),
      socket('meadow_lodge', 'quest_board', '冒險任務板', '📜', 'challenge'),
    ],
    events: [
      event('parcel_delivery', '星光包裹', '找到包裹、點亮外圍星標並收集星塵。', 110, [
        step('find_parcel', 'beacon', 'parcel_delivery', '在村莊外圍找到包裹', 1, [-25, 0.5, -14]),
        step('light_outskirts', 'mechanic', 'star_outskirts_marker', '點亮外圍第一星'),
        step('collect_stardust', 'collect', 'mat_star_dust', '蒐集星塵', 2),
      ]),
      event('math_picnic', '數學野餐', '完成學習花園星圖，再到冒險旅舍取得野餐清單。', 130, [
        step('find_picnic', 'beacon', 'math_picnic', '找到野餐籃', 1, [22, 0.7, -12]),
        step('learning_pattern', 'mechanic', 'star_learning_pattern', '完成學習花園星圖'),
        step('quest_board', 'structure', 'meadow_lodge:quest_board', '讀取冒險任務板'),
      ]),
      event('hidden_star', '隱藏之星', '完成草原星座後，擊退守在附近的怪物。', 145, [
        step('find_hidden_star', 'beacon', 'hidden_star', '在冒險草原尋找隱藏之星', 1, [21, 1.0, 22]),
        step('meadow_constellation', 'mechanic', 'star_meadow_constellation', '完成草原星座'),
        step('defeat_star', 'defeat', 'normal', '擊退草原怪物', 2),
      ]),
    ],
  },
  crystal_lake: {
    regionId: 'crystal_lake', materialId: 'mat_lake_crystal', keepsakeId: 'item_prism_charm', skillContext: 'region_crystal_symmetry',
    mechanic: {
      id: 'prism_light_path', variant: 'crystal', title: '稜鏡光路', description: '利用對稱與角度讓三道光束抵達洞窟。',
      nodes: [
        node('crystal_shore_prism', '湖岸稜鏡', [-32, 0.6, -20], 'shimmering_shore', '🔷', '#64e4e0', 1),
        node('crystal_island_prism', '島嶼折射鏡', [29, 0.9, -18], 'island_garden', '🌈', '#78c7ff', 2),
        node('crystal_grotto_echo', '回音洞光門', [29, 1.9, 27], 'echo_grotto', '💠', '#8c8cff', 3),
      ],
    },
    guide: { name: '湖光研究員希雅', position: [-29, 0.6, -24], outfitColor: '#4cb8b3', trimColor: '#d8ffff', role: 'scholar' },
    structureInteractions: [
      socket('shimmering_dock', 'fishing', '湖光素材工坊', '💎', 'workshop'),
      socket('grotto_sanctuary', 'core_interaction', '稜鏡核心任務', '🔮', 'challenge'),
    ],
    events: [
      event('singing_crystal', '歌唱水晶', '找到聲音來源、調整湖岸稜鏡並蒐集水晶。', 125, [
        step('find_singing', 'beacon', 'singing_crystal', '找到歌唱水晶', 1, [-24, 0.6, -13]),
        step('shore_prism', 'mechanic', 'crystal_shore_prism', '調整湖岸稜鏡'),
        step('collect_lake_crystal', 'collect', 'mat_lake_crystal', '蒐集湖光水晶', 2),
      ]),
      event('lost_boat', '迷航小船', '修正島嶼折射鏡，並在碼頭確認航線。', 140, [
        step('find_boat', 'beacon', 'lost_boat', '在島嶼花園找到航線圖', 1, [20, 0.9, -11]),
        step('island_prism', 'mechanic', 'crystal_island_prism', '調整島嶼折射鏡'),
        step('dock_report', 'structure', 'shimmering_dock:fishing', '回碼頭確認航線'),
      ]),
      event('rainbow_fish', '彩虹魚群', '打開洞窟光門，並擊退影響魚群的怪物。', 155, [
        step('find_fish', 'beacon', 'rainbow_fish', '在回音洞附近找到魚群', 1, [21, 1.8, 23]),
        step('grotto_echo', 'mechanic', 'crystal_grotto_echo', '打開回音洞光門'),
        step('defeat_lake', 'defeat', 'normal', '擊退湖畔怪物', 2),
      ]),
    ],
  },
  sun_canyon: {
    regionId: 'sun_canyon', materialId: 'mat_sun_ore', keepsakeId: 'item_canyon_measure', skillContext: 'region_canyon_measurement',
    mechanic: {
      id: 'bridge_tension', variant: 'canyon', title: '繩橋張力測量', description: '測量三個橋索錨點，避免繩橋在熱風中失衡。',
      nodes: [
        node('canyon_ravine_measure', '峽谷距離樁', [-35, 0.7, -19], 'golden_ravine', '📏', '#efad54', 1),
        node('canyon_bridge_anchor', '繩橋張力錨', [29, 1.8, -22], 'rope_bridge', '🪢', '#d96d39', 2),
        node('canyon_temple_shadow', '神殿日影尺', [31, 2.4, 26], 'sun_temple', '☀️', '#ffd05a', 3),
      ],
    },
    guide: { name: '峽谷測量員塔克', position: [-31, 0.7, -23], outfitColor: '#bd7040', trimColor: '#ffd178', role: 'carpenter' },
    structureInteractions: [
      socket('ravine_forge', 'forge', '日耀礦工坊', '🔥', 'workshop'),
      socket('rope_station', 'bridge_entry', '繩橋安全任務', '🌉', 'challenge'),
    ],
    events: [
      event('oasis_rescue', '綠洲救援', '找到求救信號、完成距離樁測量並蒐集日耀礦。', 130, [
        step('find_oasis', 'beacon', 'oasis_rescue', '找到綠洲求救信號', 1, [-25, 0.7, -12]),
        step('ravine_measure', 'mechanic', 'canyon_ravine_measure', '完成峽谷距離測量'),
        step('collect_sun_ore', 'collect', 'mat_sun_ore', '蒐集日耀礦', 2),
      ]),
      event('rolling_boulder', '滾石警報', '調整繩橋張力，並在橋站確認封鎖。', 145, [
        step('find_boulder', 'beacon', 'rolling_boulder', '發現滾石路線', 1, [21, 1.8, -14]),
        step('bridge_anchor', 'mechanic', 'canyon_bridge_anchor', '調整繩橋張力'),
        step('bridge_report', 'structure', 'rope_station:bridge_entry', '在橋站完成安全確認'),
      ]),
      event('desert_compass', '沙漠羅盤', '利用神殿日影定向，並擊退守護怪物。', 160, [
        step('find_compass', 'beacon', 'desert_compass', '在太陽神殿找到羅盤', 1, [24, 2.4, 22]),
        step('temple_shadow', 'mechanic', 'canyon_temple_shadow', '完成神殿日影計算'),
        step('defeat_canyon', 'defeat', 'normal', '擊退峽谷怪物', 2),
      ]),
    ],
  },
  mushroom_grove: {
    regionId: 'mushroom_grove', materialId: 'mat_glow_spore', keepsakeId: 'item_spore_music_box', skillContext: 'region_mushroom_multiples',
    mechanic: {
      id: 'mushroom_rhythm', variant: 'mushroom', title: '蘑菇節拍', description: '依倍數規律敲響三座彈跳菇。',
      nodes: [
        node('mushroom_bubblecap_beat', '泡泡菇第一拍', [-32, 0.6, -20], 'bubblecap_trail', '🍄', '#ea79bd', 1),
        node('mushroom_pond_beat', '螢光池倍數拍', [29, 0.8, -26], 'glow_pond', '🫧', '#7ce6cf', 2),
        node('mushroom_fairy_beat', '妖精環節奏門', [-25, 1.1, 27], 'fairy_ring', '🧚', '#c395ff', 3),
      ],
    },
    guide: { name: '孢子樂師波波', position: [-29, 0.6, -24], outfitColor: '#b65a9b', trimColor: '#c8ffe8', role: 'guide' },
    structureInteractions: [
      socket('bubblecap_house', 'entry', '孢子素材工坊', '🍄', 'workshop'),
      socket('fairy_ring_pavilion', 'glow_orb', '妖精環任務', '🧚', 'challenge'),
    ],
    events: [
      event('dancing_spores', '跳舞孢子', '找到節拍、敲響泡泡菇並蒐集孢子。', 125, [
        step('find_spores', 'beacon', 'dancing_spores', '找到跳舞孢子', 1, [-24, 0.6, -13]),
        step('bubblecap_beat', 'mechanic', 'mushroom_bubblecap_beat', '完成泡泡菇第一拍'),
        step('collect_spore', 'collect', 'mat_glow_spore', '蒐集螢光孢子', 2),
      ]),
      event('fairy_tea', '妖精茶會', '完成螢光池倍數拍，再到妖精亭回報。', 140, [
        step('find_tea', 'beacon', 'fairy_tea', '找到茶會邀請', 1, [21, 0.8, -27]),
        step('pond_beat', 'mechanic', 'mushroom_pond_beat', '完成螢光池倍數拍'),
        step('fairy_orb', 'structure', 'fairy_ring_pavilion:glow_orb', '啟動妖精亭光球'),
      ]),
      event('mushroom_parade', '巨菇遊行', '開啟妖精環節奏門，並擊退阻擋遊行的怪物。', 155, [
        step('find_parade', 'beacon', 'mushroom_parade', '找到遊行起點', 1, [-18, 1.1, 22]),
        step('fairy_beat', 'mechanic', 'mushroom_fairy_beat', '開啟妖精環節奏門'),
        step('defeat_mushroom', 'defeat', 'normal', '擊退濕地怪物', 2),
      ]),
    ],
  },
  clockwork_ruins: {
    regionId: 'clockwork_ruins', materialId: 'mat_ancient_gear', keepsakeId: 'item_clockwork_token', skillContext: 'region_clockwork_sequence',
    mechanic: {
      id: 'gear_sequence', variant: 'clockwork', title: '齒輪時序', description: '依正確時序啟動三組齒輪與蒸汽閥。',
      nodes: [
        node('clockwork_courtyard_gear', '庭院主齒輪', [-33, 0.7, -20], 'gear_courtyard', '⚙️', '#d7a24e', 1),
        node('clockwork_puzzle_sequence', '謎題大廳序列盤', [29, 1.0, -20], 'puzzle_hall', '🔢', '#aebcbe', 2),
        node('clockwork_steam_valve', '蒸汽橋時間閥', [-26, 1.5, 27], 'steam_bridge', '♨️', '#e58a4f', 3),
      ],
    },
    guide: { name: '機械修復師柯格', position: [-30, 0.7, -24], outfitColor: '#7c8c86', trimColor: '#e5ad52', role: 'blacksmith' },
    structureInteractions: [
      socket('gear_workshop_main', 'gear_console', '齒輪零件工坊', '⚙️', 'workshop'),
      socket('clock_core_main', 'clock_console', '時鐘核心任務', '🕰️', 'challenge'),
    ],
    events: [
      event('broken_automaton', '故障機器人', '找到零件、啟動庭院主齒輪並蒐集古代齒輪。', 135, [
        step('find_automaton', 'beacon', 'broken_automaton', '找到故障機器人', 1, [-25, 0.7, -13]),
        step('courtyard_gear', 'mechanic', 'clockwork_courtyard_gear', '啟動庭院主齒輪'),
        step('collect_gear', 'collect', 'mat_ancient_gear', '蒐集古代齒輪', 2),
      ]),
      event('time_puzzle', '時間謎題', '完成序列盤，並在時鐘核心輸入答案。', 150, [
        step('find_time_note', 'beacon', 'time_puzzle', '找到時間筆記', 1, [21, 1.0, -12]),
        step('puzzle_sequence', 'mechanic', 'clockwork_puzzle_sequence', '完成謎題大廳序列盤'),
        step('clock_console', 'structure', 'clock_core_main:clock_console', '操作時鐘核心控制台'),
      ]),
      event('gearstorm', '齒輪風暴', '關閉蒸汽橋時間閥，並擊退失控機械怪物。', 165, [
        step('find_gearstorm', 'beacon', 'gearstorm', '找到齒輪風暴源頭', 1, [-19, 1.5, 23]),
        step('steam_valve', 'mechanic', 'clockwork_steam_valve', '關閉蒸汽橋時間閥'),
        step('defeat_clockwork', 'defeat', 'normal', '擊退機械怪物', 2),
      ]),
    ],
  },
};

export const REGION_GAMEPLAY_IDS = Object.keys(REGION_GAMEPLAY_PROFILES);
export const REGION_MATERIAL_BY_ID = Object.fromEntries(REGION_MATERIALS.map((item) => [item.id, item]));
export const REGION_CRAFT_BY_ID = Object.fromEntries(REGION_CRAFTS.map((item) => [item.id, item]));

export function getRegionGameplayProfile(regionId) {
  return REGION_GAMEPLAY_PROFILES[regionId] || null;
}

export function getRegionEventDefinition(regionId, eventId) {
  return getRegionGameplayProfile(regionId)?.events.find((item) => item.id === eventId) || null;
}
