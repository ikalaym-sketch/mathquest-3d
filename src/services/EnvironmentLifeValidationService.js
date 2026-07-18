// v0.24~v0.26 合併內容驗證器：水域、環境資產、生活 NPC 與室內 Pocket 共用。
import { REGION_PRODUCTION_LAYOUTS } from '../data/regionProductionLayouts.js';
import { REGION_ENVIRONMENT_KITS, REGION_ENVIRONMENT_ASSETS } from '../data/regionEnvironmentAssetCatalog.js';
import { REGION_LIFE_PROFILES } from '../data/regionLifeProfiles.js';
import { buildRegionInteriorDescriptor } from '../data/regionInteriorDefinitions.js';
import { createRegionAssetPlacements } from './RegionAssetPlacementService.js';
import { getWaterEnvironmentProfile } from '../data/waterEnvironmentProfiles.js';
import { resolveRegionLifeSchedule, validateRegionLifeRoute } from './RegionLifeScheduleService.js';
import { validateWaterEnvironment } from './WaterTraversalService.js';
import { sampleTraversalSurface } from './TraversalSurfaceService.js';

export function validateEnvironmentLifeContent() {
  const errors = [];
  const warnings = [];
  const summary = {
    regions: 0,
    waters: 0,
    waterModes: {},
    environmentAssets: Object.keys(REGION_ENVIRONMENT_ASSETS).length,
    lifeNpcs: 0,
    critters: 0,
    storyProps: 0,
    interiors: 0,
    furnitureItems: 0,
    interiorInteractions: 0,
  };

  for (const [regionId, layout] of Object.entries(REGION_PRODUCTION_LAYOUTS)) {
    summary.regions += 1;
    const kit = REGION_ENVIRONMENT_KITS[regionId];
    const life = REGION_LIFE_PROFILES[regionId];
    if (!kit) errors.push(`${regionId}: 缺少環境資產 Kit。`);
    if (!life) errors.push(`${regionId}: 缺少生活 Profile。`);
    if (kit?.assets.length !== 5) errors.push(`${regionId}: 環境資產必須固定 5 種，實際 ${kit?.assets.length || 0}。`);

    for (const water of layout.waters || []) {
      summary.waters += 1;
      const profile = getWaterEnvironmentProfile(water);
      summary.waterModes[profile.mode] = (summary.waterModes[profile.mode] || 0) + 1;
    }

    const waterResult = validateWaterEnvironment(layout);
    errors.push(...waterResult.errors);
    warnings.push(...waterResult.warnings);

    const placements = kit ? createRegionAssetPlacements(layout, kit) : [];
    const placementCounts = new Map();
    for (const placement of placements) placementCounts.set(placement.asset.id, (placementCounts.get(placement.asset.id) || 0) + 1);
    for (const asset of kit?.assets || []) {
      if ((placementCounts.get(asset.id) || 0) < 2) errors.push(`${regionId}/${asset.id}: 場景實例少於 2 個。`);
      if (asset.solid) {
        for (const placement of placements.filter((item) => item.asset.id === asset.id)) {
          const [x, y, z] = placement.position || [];
          if (![x, y, z].every(Number.isFinite)) {
            errors.push(`${regionId}/${placement.instanceId}: 實體資產位置無效。`);
            continue;
          }
          const surface = sampleTraversalSurface(layout, x, z);
          if (!surface.walkable) {
            errors.push(`${regionId}/${placement.instanceId}: 實體資產落在不可行走表面 ${surface.kind}。`);
            continue;
          }
          const heightDelta = Math.abs(y - surface.y);
          if (heightDelta > 0.65) {
            errors.push(`${regionId}/${placement.instanceId}: 資產高度與地表差 ${heightDelta.toFixed(2)}，可能懸空或埋入。`);
          }
        }
      }
    }

    const subareaIds = new Set(layout.subareas.map((area) => area.id));
    for (const [npcIndex, npc] of (life?.npcs || []).entries()) {
      summary.lifeNpcs += 1;
      if (!subareaIds.has(npc.homeSubareaId)) errors.push(`${regionId}/${npc.id}: homeSubareaId 不存在。`);
      if (!subareaIds.has(npc.workSubareaId)) errors.push(`${regionId}/${npc.id}: workSubareaId 不存在。`);
      for (const scenario of [
        [{ segment: 'morning', dayIndex: 1 }, 'sunny'],
        [{ segment: 'night', dayIndex: 1 }, 'sunny'],
        [{ segment: 'afternoon', dayIndex: 1 }, 'lightRain'],
      ]) {
        const schedule = resolveRegionLifeSchedule(npc, layout, scenario[0], scenario[1], npcIndex);
        const routeFinite = schedule.route.length >= 2
          && schedule.route.every((point) => point.length === 3 && point.every(Number.isFinite));
        const routeWalkable = validateRegionLifeRoute(npc, layout, scenario[0], scenario[1], npcIndex);
        if (!routeFinite || !routeWalkable) {
          errors.push(`${regionId}/${npc.id}: ${scenario[0].segment}/${scenario[1]} 排程路線無效或穿越禁行區。`);
        }
        const finalPoint = schedule.route[schedule.route.length - 1];
        const targetArea = layout.subareas.find((area) => area.id === schedule.targetAreaId);
        if (finalPoint && targetArea) {
          const dx = finalPoint[0] - targetArea.center[0];
          const dz = finalPoint[2] - targetArea.center[1];
          const tolerance = Math.hypot(targetArea.size[0], targetArea.size[1]) * 0.55;
          if (Math.hypot(dx, dz) > tolerance) {
            errors.push(`${regionId}/${npc.id}: ${scenario[0].segment}/${scenario[1]} 終點未到達目標子區。`);
          }
        }
      }
    }
    summary.critters += life?.critters?.length || 0;
    summary.storyProps += life?.storyProps?.length || 0;

    for (const structure of layout.structures) {
      const interior = buildRegionInteriorDescriptor(layout, structure);
      if (!interior) {
        errors.push(`${regionId}/${structure.id}: 無法建立室內描述。`);
        continue;
      }
      summary.interiors += 1;
      summary.furnitureItems += interior.furniture.length;
      summary.interiorInteractions += interior.interactions.length;
      if (interior.furniture.length < 10) errors.push(`${interior.id}: 家具少於 10 件。`);
      if (interior.interactions.length < 3) errors.push(`${interior.id}: 互動少於 3 個。`);
      if (![interior.returnPosition.x, interior.returnPosition.y, interior.returnPosition.z].every(Number.isFinite)) {
        errors.push(`${interior.id}: 返回位置無效。`);
      } else {
        const returnSurface = sampleTraversalSurface(layout, interior.returnPosition.x, interior.returnPosition.z);
        if (!returnSurface.walkable) errors.push(`${interior.id}: 返回位置落在不可行走表面 ${returnSurface.kind}。`);
        if (Math.abs(interior.returnPosition.y - (returnSurface.y + 0.95)) > 0.15) {
          errors.push(`${interior.id}: 返回高度未對齊地表。`);
        }
      }
    }
  }

  if (summary.regions !== 8) errors.push(`正式區域應為 8，實際 ${summary.regions}。`);
  if (summary.environmentAssets !== 40) errors.push(`環境 GLB 目錄應為 40，實際 ${summary.environmentAssets}。`);
  if (summary.lifeNpcs !== 24) errors.push(`生活 NPC 應為 24，實際 ${summary.lifeNpcs}。`);
  if (summary.interiors !== 32) errors.push(`主要結構室內應為 32，實際 ${summary.interiors}。`);

  return { ok: errors.length === 0, summary, errors, warnings };
}
