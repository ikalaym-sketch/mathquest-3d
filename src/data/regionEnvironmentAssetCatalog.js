// v0.25 八區環境 Kit Canonical 目錄。
// 每區固定五種 GLB，包含 LOD0/LOD1/LOD2、Collider 與 Story Socket 契約；場景只配置 ID，不直接硬編 URL。

const kit = (regionId, accent, shore, entries) => ({ regionId, accent, shore, assets: entries.map((entry) => ({
  ...entry,
  assetId: `region-environment:${entry.id}`,
  requiredNodes: ['LOD0', 'LOD1', 'LOD2', 'COLLIDER_Main', 'SOCKET_Story'],
})) });

export const REGION_ENVIRONMENT_KITS = Object.freeze({
  wind_highlands: kit('wind_highlands', '#67b8df', '#bedfbc', [
    { id: 'wind_grass_patch', role: 'ground-detail', solid: false, scale: 1.1 },
    { id: 'wind_banner', role: 'landmark-detail', solid: true, collider: [0.3, 1.8, 0.3], scale: 1 },
    { id: 'wind_rock_arch', role: 'boundary-detail', solid: true, collider: [1.5, 1.8, 0.8], scale: 1.05 },
    { id: 'wind_cloud_crystal', role: 'story-detail', solid: false, scale: 0.9 },
    { id: 'wind_fence', role: 'path-detail', solid: true, collider: [1.5, 0.55, 0.18], scale: 1 },
  ]),
  snow_valley: kit('snow_valley', '#68d5df', '#dff6fa', [
    { id: 'snow_bank', role: 'ground-detail', solid: false, scale: 1.2 },
    { id: 'ice_crystal_cluster', role: 'story-detail', solid: false, scale: 1 },
    { id: 'snow_lantern', role: 'path-detail', solid: true, collider: [0.28, 1.25, 0.28], scale: 1 },
    { id: 'snow_pine_cluster', role: 'boundary-detail', solid: true, collider: [0.65, 1.8, 0.65], scale: 1.05 },
    { id: 'frozen_marker', role: 'landmark-detail', solid: true, collider: [0.55, 1.2, 0.45], scale: 0.95 },
  ]),
  farm_plains: kit('farm_plains', '#e5a43c', '#b3d58f', [
    { id: 'orchard_row', role: 'ground-detail', solid: true, collider: [1.25, 1.2, 0.65], scale: 1 },
    { id: 'field_crate', role: 'path-detail', solid: true, collider: [0.7, 0.55, 0.55], scale: 1 },
    { id: 'hay_cart', role: 'landmark-detail', solid: true, collider: [1.3, 0.75, 0.8], scale: 1 },
    { id: 'irrigation_gate', role: 'shore-detail', solid: true, collider: [1.4, 0.75, 0.25], scale: 1 },
    { id: 'scarecrow', role: 'story-detail', solid: true, collider: [0.35, 1.35, 0.35], scale: 1 },
  ]),
  star_village: kit('star_village', '#d99bdb', '#b7d9c0', [
    { id: 'garden_arch', role: 'path-detail', solid: true, collider: [1.45, 1.7, 0.35], scale: 1 },
    { id: 'market_stall', role: 'landmark-detail', solid: true, collider: [1.35, 1.05, 0.9], scale: 1 },
    { id: 'star_lamp_cluster', role: 'ground-detail', solid: false, scale: 1 },
    { id: 'traveler_camp', role: 'story-detail', solid: true, collider: [1.25, 0.75, 1.0], scale: 1 },
    { id: 'study_marker', role: 'story-detail', solid: true, collider: [0.7, 1.0, 0.35], scale: 1 },
  ]),
  crystal_lake: kit('crystal_lake', '#78dfe3', '#aee3d3', [
    { id: 'shoreline_crystal', role: 'shore-detail', solid: false, scale: 1 },
    { id: 'prism_reed', role: 'ground-detail', solid: false, scale: 1 },
    { id: 'dock_supply', role: 'path-detail', solid: true, collider: [0.9, 0.55, 0.65], scale: 1 },
    { id: 'cave_stalagmite', role: 'boundary-detail', solid: true, collider: [0.65, 1.35, 0.65], scale: 1 },
    { id: 'water_lily', role: 'water-detail', solid: false, scale: 1 },
  ]),
  sun_canyon: kit('sun_canyon', '#e67838', '#e6c98d', [
    { id: 'canyon_strata', role: 'boundary-detail', solid: true, collider: [1.35, 1.0, 0.8], scale: 1.1 },
    { id: 'rope_anchor', role: 'path-detail', solid: true, collider: [0.55, 0.8, 0.55], scale: 1 },
    { id: 'cactus_cluster', role: 'ground-detail', solid: true, collider: [0.65, 1.25, 0.65], scale: 1 },
    { id: 'camp_supply', role: 'story-detail', solid: true, collider: [0.9, 0.6, 0.7], scale: 1 },
    { id: 'sun_obelisk', role: 'landmark-detail', solid: true, collider: [0.75, 1.8, 0.75], scale: 1 },
  ]),
  mushroom_grove: kit('mushroom_grove', '#d45fa2', '#a9d7ad', [
    { id: 'giant_mushroom_cluster', role: 'boundary-detail', solid: true, collider: [0.85, 1.5, 0.85], scale: 1 },
    { id: 'spore_lantern', role: 'path-detail', solid: true, collider: [0.28, 1.1, 0.28], scale: 1 },
    { id: 'fairy_stone', role: 'story-detail', solid: true, collider: [0.7, 0.65, 0.7], scale: 1 },
    { id: 'wetland_reeds', role: 'shore-detail', solid: false, scale: 1 },
    { id: 'mushroom_fence', role: 'ground-detail', solid: true, collider: [1.4, 0.55, 0.2], scale: 1 },
  ]),
  clockwork_ruins: kit('clockwork_ruins', '#d99b42', '#a8b9a3', [
    { id: 'gear_console', role: 'story-detail', solid: true, collider: [0.75, 0.8, 0.55], scale: 1 },
    { id: 'steam_pipe_cluster', role: 'boundary-detail', solid: true, collider: [0.7, 1.2, 0.7], scale: 1 },
    { id: 'coolant_barrier', role: 'shore-detail', solid: true, collider: [1.4, 0.7, 0.2], scale: 1 },
    { id: 'clock_pillar', role: 'landmark-detail', solid: true, collider: [0.65, 1.65, 0.65], scale: 1 },
    { id: 'scrap_crate', role: 'ground-detail', solid: true, collider: [0.75, 0.55, 0.65], scale: 1 },
  ]),
});

export const REGION_ENVIRONMENT_ASSETS = Object.freeze(Object.fromEntries(
  Object.values(REGION_ENVIRONMENT_KITS).flatMap((entry) => entry.assets.map((asset) => [asset.id, { ...asset, regionId: entry.regionId }])),
));

export function getRegionEnvironmentKit(regionId) {
  return REGION_ENVIRONMENT_KITS[regionId] || null;
}
