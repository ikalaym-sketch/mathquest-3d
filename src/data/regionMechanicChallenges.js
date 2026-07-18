// 八區核心機制的 Canonical 挑戰資料。
// 每個節點只對應一筆挑戰，UI 元件不得自行產生答案，避免題目與驗證規則漂移。

export const REGION_MECHANIC_CHALLENGES = {
  wind_vane_meadow: { type: 'wind', prompt: '把草原風向標轉到 45°。', startAngle: 0, targetAngle: 45, step: 15 },
  wind_vane_ridge: { type: 'wind', prompt: '把山脊葉片轉到 90°，讓風穿過葉片。', startAngle: 30, targetAngle: 90, step: 15 },
  wind_vane_cloud: { type: 'wind', prompt: '把雲橋氣流閥轉到 135°。', startAngle: 60, targetAngle: 135, step: 15 },

  snow_heat_flower: { type: 'snow', prompt: '把霜花周圍調到 -4°C。', startTemperature: 4, targetTemperature: -4, step: 2, min: -16, max: 10 },
  snow_mirror_crystal: { type: 'snow', prompt: '把鏡湖安全冰層調到 -8°C。', startTemperature: 0, targetTemperature: -8, step: 2, min: -18, max: 8 },
  snow_aurora_lens: { type: 'snow', prompt: '把極光鏡片冷卻到 -12°C。', startTemperature: -2, targetTemperature: -12, step: 2, min: -20, max: 6 },

  farm_orchard_rows: { type: 'farm', prompt: '果樹排成 3 排，每排 4 棵，共有幾棵？', rows: 3, columns: 4, answer: 12, choices: [7, 12, 14] },
  farm_hive_counter: { type: 'farm', prompt: '蜂箱排成 4 排，每排 5 個，共有幾個？', rows: 4, columns: 5, answer: 20, choices: [18, 20, 24] },
  farm_market_crates: { type: 'farm', prompt: '貨箱排成 5 排，每排 6 箱，共有幾箱？', rows: 5, columns: 6, answer: 30, choices: [28, 30, 35] },

  star_outskirts_marker: { type: 'star', prompt: '找出下一個數字。', sequence: [2, 4, 6], answer: 8, choices: [7, 8, 10] },
  star_learning_pattern: { type: 'star', prompt: '星光每次增加 3，下一個數字是？', sequence: [3, 6, 9], answer: 12, choices: [10, 11, 12] },
  star_meadow_constellation: { type: 'star', prompt: '星光依倍數排列，下一個數字是？', sequence: [2, 4, 8], answer: 16, choices: [12, 14, 16] },

  crystal_shore_prism: { type: 'crystal', prompt: '鏡面在中間，選出左右鏡像。', sourceShape: '◢', answer: '◣', choices: ['◣', '◤', '◥'], axis: '垂直' },
  crystal_island_prism: { type: 'crystal', prompt: '鏡面在中間，選出上下鏡像。', sourceShape: '◢', answer: '◥', choices: ['◥', '◣', '◤'], axis: '水平' },
  crystal_grotto_echo: { type: 'crystal', prompt: '光線穿過兩面鏡子後，選出正確方向。', sourceShape: '◢', answer: '◤', choices: ['◣', '◤', '◥'], axis: '雙重' },

  canyon_ravine_measure: { type: 'canyon', prompt: '兩段橋索長 12m 與 8m，總長多少？', segments: [12, 8], answer: 20, choices: [18, 20, 22] },
  canyon_bridge_anchor: { type: 'canyon', prompt: '三段繩索長 7m、9m、6m，總長多少？', segments: [7, 9, 6], answer: 22, choices: [20, 22, 24] },
  canyon_temple_shadow: { type: 'canyon', prompt: '日影分成 15m 與 12m，總長多少？', segments: [15, 12], answer: 27, choices: [25, 27, 30] },

  mushroom_bubblecap_beat: { type: 'mushroom', prompt: '節拍是 2、4、6，下一拍要敲幾下？', pattern: [2, 4, 6], targetTaps: 8 },
  mushroom_pond_beat: { type: 'mushroom', prompt: '節拍是 3、6、9，下一拍要敲幾下？', pattern: [3, 6, 9], targetTaps: 12 },
  mushroom_fairy_beat: { type: 'mushroom', prompt: '節拍是 4、8、12，下一拍要敲幾下？', pattern: [4, 8, 12], targetTaps: 16 },

  clockwork_courtyard_gear: { type: 'clockwork', prompt: '依序啟動：中齒輪 → 小齒輪 → 大齒輪。', gears: ['小齒輪', '中齒輪', '大齒輪'], sequence: ['中齒輪', '小齒輪', '大齒輪'] },
  clockwork_puzzle_sequence: { type: 'clockwork', prompt: '依序啟動：大齒輪 → 中齒輪 → 小齒輪。', gears: ['小齒輪', '中齒輪', '大齒輪'], sequence: ['大齒輪', '中齒輪', '小齒輪'] },
  clockwork_steam_valve: { type: 'clockwork', prompt: '依序啟動：小齒輪 → 大齒輪 → 中齒輪。', gears: ['小齒輪', '中齒輪', '大齒輪'], sequence: ['小齒輪', '大齒輪', '中齒輪'] },
};

export function getRegionMechanicChallenge(nodeId) {
  return REGION_MECHANIC_CHALLENGES[nodeId] || null;
}
