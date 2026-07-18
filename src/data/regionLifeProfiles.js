// v0.26 八區生活 NPC、環境動物與敘事節點 Canonical 設定。
// 每區三名 NPC，各自具有工作／休息子區、天氣行為與對話主題。
const npc = (id, name, role, homeSubareaId, workSubareaId, colors, topics) => ({
  id, name, role, homeSubareaId, workSubareaId,
  outfitColor: colors[0], trimColor: colors[1], topics,
});

const profile = (regionId, ambience, npcs, critters, storyProps) => ({ regionId, ambience, npcs, critters, storyProps });

export const REGION_LIFE_PROFILES = Object.freeze({
  wind_highlands: profile('wind_highlands', { daySound: 'wind-chimes', nightLight: '#ccecff' }, [
    npc('wind_keeper', '風輪守護員', 'mechanic', 'windmill_ridge', 'breeze_meadow', ['#5ca4c8', '#ffe18a'], ['風向', '風車', '高地安全']),
    npc('cloud_scout', '雲橋巡察員', 'scout', 'cloud_bridge', 'cloud_bridge', ['#7cbce0', '#ffffff'], ['雲橋', '上升氣流', '遠方天氣']),
    npc('sky_scholar', '天空觀測員', 'scholar', 'sky_observatory', 'sky_observatory', ['#577bbd', '#ffd777'], ['星象', '角度', '觀測紀錄']),
  ], ['sky-bird', 'cloud-moth'], ['broken-wind-vane', 'message-kite']),
  snow_valley: profile('snow_valley', { daySound: 'snow-bells', nightLight: '#bffaff' }, [
    npc('snow_ranger', '雪原巡守員', 'ranger', 'frostflower_meadow', 'mirror_lake', ['#75a9c8', '#f7ffff'], ['冰面安全', '足跡', '保暖']),
    npc('aurora_reader', '極光解讀員', 'scholar', 'aurora_observatory', 'aurora_observatory', ['#747fd3', '#bff6ff'], ['極光', '對稱', '夜空']),
    npc('shrine_tender', '雪光神殿照護員', 'caretaker', 'snowlight_shrine', 'snowlight_shrine', ['#a596d9', '#ffffff'], ['神殿', '冰晶', '古老故事']),
  ], ['snow-hare', 'ice-bird'], ['frozen-journal', 'aurora-prism']),
  farm_plains: profile('farm_plains', { daySound: 'field-birds', nightLight: '#ffd88a' }, [
    npc('orchard_grower', '果園農人', 'farmer', 'sunny_orchard', 'sunny_orchard', ['#7fb75d', '#ffd56f'], ['果樹', '收成', '行列計算']),
    npc('shepherd', '牧羊人', 'rancher', 'shepherd_hill', 'shepherd_hill', ['#b78b5a', '#f7df9a'], ['羊群', '草場', '天氣']),
    npc('harvest_trader', '豐收商人', 'merchant', 'harvest_square', 'riverside_field', ['#d07d4c', '#fff0ad'], ['市集', '重量', '訂單']),
  ], ['field-bird', 'butterfly'], ['lost-seed-bag', 'harvest-ledger']),
  star_village: profile('star_village', { daySound: 'village-chatter', nightLight: '#ffe9a0' }, [
    npc('garden_teacher', '學習花園老師', 'teacher', 'learning_garden', 'learning_garden', ['#6f86cf', '#ffe481'], ['學習遊戲', '圖形', '朋友']),
    npc('river_vendor', '河畔攤商', 'merchant', 'river_market', 'river_market', ['#c47465', '#fff0a0'], ['市集', '零錢', '旅行用品']),
    npc('lodge_host', '冒險旅舍主人', 'host', 'village_outskirts', 'adventure_meadow', ['#9a714f', '#f7d7a0'], ['旅人故事', '露營', '區域消息']),
  ], ['village-cat', 'garden-butterfly'], ['traveler-map', 'class-bell']),
  crystal_lake: profile('crystal_lake', { daySound: 'lake-waves', nightLight: '#a8ffff' }, [
    npc('dock_keeper', '水晶碼頭管理員', 'sailor', 'shimmering_shore', 'shimmering_shore', ['#4f9dc3', '#d8ffff'], ['游泳', '小船', '水位']),
    npc('prism_gardener', '稜鏡園丁', 'gardener', 'island_garden', 'island_garden', ['#72bfa8', '#dffff5'], ['水晶植物', '反射', '島嶼']),
    npc('grotto_listener', '回音洞窟研究員', 'scholar', 'echo_grotto', 'echo_grotto', ['#7671b9', '#bffff4'], ['回音', '洞窟', '光路']),
  ], ['crystal-fish', 'lake-dragonfly'], ['lost-dock-bell', 'echo-tablet']),
  sun_canyon: profile('sun_canyon', { daySound: 'dry-wind', nightLight: '#ffbd72' }, [
    npc('rope_inspector', '繩橋檢查員', 'builder', 'rope_bridge', 'rope_bridge', ['#b46a43', '#ffd17d'], ['繩橋', '距離', '安全結']),
    npc('cactus_healer', '仙人掌營地藥師', 'healer', 'cactus_camp', 'cactus_camp', ['#6f9d58', '#ffd884'], ['補水', '藥草', '熱浪']),
    npc('sun_smith', '太陽鍛造師', 'blacksmith', 'golden_ravine', 'sun_temple', ['#ad5d3e', '#ffbd4a'], ['礦石', '鍛造', '古代神殿']),
  ], ['canyon-lizard', 'sun-bird'], ['broken-rope-marker', 'sun-inscription']),
  mushroom_grove: profile('mushroom_grove', { daySound: 'wetland-bubbles', nightLight: '#d49cff' }, [
    npc('spore_herbalist', '孢子草藥師', 'herbalist', 'bubblecap_trail', 'glow_pond', ['#8e69b8', '#d9ffb0'], ['孢子', '濕地', '安全採集']),
    npc('fairy_musician', '妖精環樂手', 'musician', 'fairy_ring', 'fairy_ring', ['#d36ca6', '#baffdf'], ['節奏', '妖精環', '夜間音樂']),
    npc('cap_villager', '巨菇村居民', 'villager', 'giant_cap_village', 'giant_cap_village', ['#b5639f', '#ffe4c5'], ['巨菇屋', '村莊生活', '雨天']),
  ], ['glow-frog', 'spore-moth'], ['fairy-song-stone', 'herbal-note']),
  clockwork_ruins: profile('clockwork_ruins', { daySound: 'gear-rhythm', nightLight: '#ffd36f' }, [
    npc('gear_engineer', '齒輪工程師', 'engineer', 'gear_courtyard', 'gear_courtyard', ['#7f8e83', '#e3aa50'], ['齒輪', '維修', '序列']),
    npc('steam_operator', '蒸汽橋操作員', 'operator', 'steam_bridge', 'steam_bridge', ['#697b75', '#ffc66a'], ['蒸汽', '壓力', '冷卻液']),
    npc('clock_archivist', '時鐘檔案員', 'scholar', 'puzzle_hall', 'clock_core', ['#6b7771', '#ffe197'], ['時間', '檔案', '核心']),
  ], ['clockwork-beetle', 'steam-sparrow'], ['missing-gear', 'clock-record']),
});

export function getRegionLifeProfile(regionId) {
  return REGION_LIFE_PROFILES[regionId] || null;
}
