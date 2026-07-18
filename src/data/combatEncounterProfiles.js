// 正式戰鬥內容設定：區域 Boss、試煉塔 Boss 與精英特性皆由單一 Canonical 資料驅動。
const phase = (id, label, threshold, movement, skills, extra = {}) => ({ id, label, threshold, movement, skills, ...extra });
const skill = (id, label, kind, color, telegraphMs, damage, radius = 5, extra = {}) => ({ id, label, kind, color, telegraphMs, damage, radius, ...extra });

const REGION_BOSS_CONTENT = {
  wind_highlands: {
    phases: [
      phase('breeze', '微風盤旋', 1, 'orbit', [skill('gust_ring', '旋風環', 'ring', '#79dcf3', 1150, 10, 5.5)]),
      phase('crosswind', '交叉氣流', 0.66, 'strafe', [skill('wind_lane', '風刃走廊', 'line', '#b8f0ff', 950, 13, 3.2, { length: 15 })]),
      phase('tempest', '暴風核心', 0.32, 'chase', [skill('storm_burst', '暴風爆發', 'targetCircle', '#4fa8dc', 850, 17, 4.5)], { speedMultiplier: 1.22 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '風之封印' },
  },
  snow_valley: {
    phases: [
      phase('frost', '霜晶守勢', 1, 'anchor', [skill('frost_field', '冰霜領域', 'ring', '#c7f2ff', 1250, 10, 5.2)]),
      phase('mirror', '鏡湖折返', 0.66, 'strafe', [skill('ice_path', '寒冰直線', 'line', '#8edfff', 1100, 13, 3.4, { length: 16 })]),
      phase('aurora', '極光降臨', 0.32, 'orbit', [skill('aurora_drop', '極光落點', 'targetCircle', '#8dd8ef', 900, 17, 4.7)], { speedMultiplier: 1.15 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '極光封印' },
  },
  farm_plains: {
    phases: [
      phase('guard', '田野守衛', 1, 'chase', [skill('hoof_stomp', '重踏震波', 'ring', '#e8c466', 1200, 11, 5)]),
      phase('charge', '金角衝鋒', 0.66, 'strafe', [skill('harvest_lane', '收穫衝線', 'line', '#ffd777', 900, 14, 3.6, { length: 17 })]),
      phase('golden', '黃金豐收', 0.32, 'chase', [skill('seed_burst', '種子爆發', 'targetCircle', '#dca64d', 850, 18, 4.8)], { speedMultiplier: 1.28 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '豐收封印' },
  },
  star_village: {
    phases: [
      phase('starlight', '星光巡行', 1, 'orbit', [skill('star_orbit', '星環擴散', 'ring', '#ffe57d', 1100, 10, 5.4)]),
      phase('comet', '彗星追跡', 0.66, 'chase', [skill('comet_lane', '彗星航道', 'line', '#f6b7ff', 900, 14, 3.2, { length: 16 })]),
      phase('constellation', '星座覺醒', 0.32, 'strafe', [skill('starfall', '星落標記', 'targetCircle', '#d98ee6', 800, 18, 4.5)], { speedMultiplier: 1.2 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '星座封印' },
  },
  crystal_lake: {
    phases: [
      phase('reflection', '水鏡反射', 1, 'anchor', [skill('prism_ring', '稜鏡波紋', 'ring', '#74eee7', 1250, 10, 5.6)]),
      phase('refraction', '折射游移', 0.66, 'orbit', [skill('prism_beam', '水晶光束', 'line', '#b9ffff', 1050, 14, 3, { length: 18 })]),
      phase('leviathan', '湖心覺醒', 0.32, 'chase', [skill('echo_drop', '回音落點', 'targetCircle', '#52b9dc', 850, 18, 5)], { speedMultiplier: 1.16 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '稜鏡封印' },
  },
  sun_canyon: {
    phases: [
      phase('sand', '流沙巡獵', 1, 'orbit', [skill('sand_quake', '砂岩震波', 'ring', '#e9a15d', 1150, 11, 5.2)]),
      phase('rope', '峽谷穿刺', 0.66, 'strafe', [skill('sun_lane', '日耀裂線', 'line', '#ffc36d', 900, 15, 3.5, { length: 18 })]),
      phase('solar', '太陽熾熱', 0.32, 'chase', [skill('solar_mark', '太陽落印', 'targetCircle', '#e65f37', 780, 19, 4.8)], { speedMultiplier: 1.3 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '日耀封印' },
  },
  mushroom_grove: {
    phases: [
      phase('spore', '孢子呼吸', 1, 'anchor', [skill('spore_ring', '孢子漣漪', 'ring', '#ef8ec9', 1300, 10, 5.8)]),
      phase('dance', '菌傘舞步', 0.66, 'orbit', [skill('glow_lane', '螢光菌道', 'line', '#9dffe1', 1000, 13, 3.4, { length: 15 })]),
      phase('mooncap', '月帽盛放', 0.32, 'strafe', [skill('fairy_mark', '妖精環標記', 'targetCircle', '#b889eb', 850, 18, 5.2)], { speedMultiplier: 1.18 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '月帽封印' },
  },
  clockwork_ruins: {
    phases: [
      phase('tick', '齒輪啟動', 1, 'anchor', [skill('gear_ring', '齒輪震環', 'ring', '#d6a45e', 1200, 11, 5.3)]),
      phase('steam', '蒸汽校時', 0.66, 'strafe', [skill('steam_lane', '蒸汽軌道', 'line', '#d8e2df', 950, 15, 3.6, { length: 17 })]),
      phase('chrono', '時間超載', 0.32, 'chase', [skill('time_mark', '時序落點', 'targetCircle', '#7d9694', 760, 19, 4.6)], { speedMultiplier: 1.25 }),
    ],
    seal: { questionCount: 3, requiredCorrect: 2, recoveryPercent: 0.2, title: '時序封印' },
  },
};

export const ELITE_COMBAT_PROFILES = {
  wind_highlands: { label: '風盾', barrierHits: 2, pulseDamage: 5, pulseRadius: 4.5, pulseEvery: 5.5, enrageThreshold: 0.35 },
  snow_valley: { label: '冰鏡', barrierHits: 3, pulseDamage: 4, pulseRadius: 5, pulseEvery: 6.2, enrageThreshold: 0.4 },
  farm_plains: { label: '豐收護甲', barrierHits: 2, pulseDamage: 6, pulseRadius: 4, pulseEvery: 5.8, enrageThreshold: 0.3 },
  star_village: { label: '星光護符', barrierHits: 2, pulseDamage: 5, pulseRadius: 5.2, pulseEvery: 5.2, enrageThreshold: 0.35 },
  crystal_lake: { label: '稜鏡護盾', barrierHits: 3, pulseDamage: 5, pulseRadius: 4.8, pulseEvery: 5.8, enrageThreshold: 0.4 },
  sun_canyon: { label: '日耀狂熱', barrierHits: 1, pulseDamage: 7, pulseRadius: 4.4, pulseEvery: 4.8, enrageThreshold: 0.45 },
  mushroom_grove: { label: '孢子脈衝', barrierHits: 2, pulseDamage: 6, pulseRadius: 5.4, pulseEvery: 5.5, enrageThreshold: 0.38 },
  clockwork_ruins: { label: '超載裝甲', barrierHits: 3, pulseDamage: 6, pulseRadius: 4.6, pulseEvery: 5, enrageThreshold: 0.42 },
};

const TOWER_PROFILE_BY_TIER = [
  'wind_highlands', 'clockwork_ruins', 'crystal_lake', 'farm_plains', 'star_village',
  'sun_canyon', 'wind_highlands', 'clockwork_ruins', 'mushroom_grove', 'crystal_lake',
];

export function getBossCombatProfile(definition) {
  if (!definition) return null;
  if (definition.regionId && REGION_BOSS_CONTENT[definition.regionId]) return REGION_BOSS_CONTENT[definition.regionId];
  const match = String(definition.id || '').match(/tower_boss_(\d+)/);
  if (match) {
    const tier = Math.max(0, Math.min(9, Math.floor(Number(match[1]) / 10) - 1));
    const base = REGION_BOSS_CONTENT[TOWER_PROFILE_BY_TIER[tier]];
    return {
      ...base,
      phases: base.phases.map((item, index) => ({ ...item, label: `第 ${tier + 1} 主題 · ${item.label}`, speedMultiplier: (item.speedMultiplier || 1) + tier * 0.025 })),
      seal: { ...base.seal, title: `第 ${(tier + 1) * 10} 層里程碑封印`, requiredCorrect: tier >= 7 ? 3 : 2 },
    };
  }
  return REGION_BOSS_CONTENT.star_village;
}

export function getEliteCombatProfile(regionId) {
  return ELITE_COMBAT_PROFILES[regionId] || { label: '精英護甲', barrierHits: 2, pulseDamage: 5, pulseRadius: 4.5, pulseEvery: 6, enrageThreshold: 0.35 };
}

export const BOSS_PROFILE_REGION_IDS = Object.keys(REGION_BOSS_CONTENT);
