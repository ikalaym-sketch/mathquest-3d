// 八區生活 NPC 排程服務。
// 只接受 Canonical 子區資料，並使用道路尋路將工作／返家節點展開成安全折線。
import { findNearestWalkablePoint, resolveRoadPolyline, sampleTraversalSurface } from './TraversalSurfaceService.js';

const NIGHT_SEGMENTS = new Set(['night', 'lateNight']);
const RAIN_WEATHER = new Set(['lightRain', 'rain', 'storm']);

function getSubareaMap(layout) {
  return new Map((layout?.subareas || []).map((area) => [area.id, area]));
}

function resolveAreaPoint(layout, area, offsetSeed = 0) {
  if (!area) return findNearestWalkablePoint(layout, layout.spawn[0], layout.spawn[2]);
  const angle = ((offsetSeed * 137.5) % 360) * (Math.PI / 180);
  const radius = Math.min(area.size[0], area.size[1]) * (0.12 + (offsetSeed % 3) * 0.035);
  return findNearestWalkablePoint(layout, area.center[0] + Math.cos(angle) * radius, area.center[1] + Math.sin(angle) * radius, 10, 1.1);
}

function routeBetween(layout, from, to, routeId) {
  const points = resolveRoadPolyline(layout, { id: routeId, from: [from.x, from.z], to: [to.x, to.z], width: 1.05 }, 1.6);
  return points.map(([x, z]) => {
    const surface = sampleTraversalSurface(layout, x, z);
    return [x, surface.walkable ? surface.y : from.y, z];
  });
}

function expandSafeRoute(layout, waypoints, npcId) {
  const expanded = [];
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const segment = routeBetween(layout, waypoints[index], waypoints[index + 1], `npc:${npcId}:${index}`);
    expanded.push(...(index === 0 ? segment : segment.slice(1)));
  }
  return expanded.length ? expanded : waypoints.map((point) => [point.x, point.y, point.z]);
}

export function resolveRegionLifeSchedule(npc, layout, worldClock = {}, weatherType = 'sunny', npcIndex = 0) {
  const subareas = getSubareaMap(layout);
  const segment = worldClock.segment || 'morning';
  const isNight = NIGHT_SEGMENTS.has(segment);
  const isEvening = segment === 'evening';
  const isRain = RAIN_WEATHER.has(weatherType || worldClock.weather);
  const homeArea = subareas.get(npc.homeSubareaId) || layout.subareas[0];
  const workArea = subareas.get(npc.workSubareaId) || homeArea;
  const homePoints = [1, 4, 7].map((seed) => resolveAreaPoint(layout, homeArea, npcIndex + seed));
  const workPoints = [2, 5, 8].map((seed) => resolveAreaPoint(layout, workArea, npcIndex + seed));

  let waypoints;
  let label;
  let speed;
  if (isRain) {
    waypoints = homePoints;
    label = '雨天避雨中';
    speed = 1.5;
  } else if (isNight) {
    waypoints = homePoints;
    label = '夜間休息';
    speed = 1.35;
  } else if (isEvening) {
    waypoints = [workPoints[0], homePoints[0], homePoints[1]];
    label = '下班返家';
    speed = 1.65;
  } else if (segment === 'morning') {
    waypoints = [homePoints[0], workPoints[0], workPoints[1]];
    label = '晨間上工';
    speed = 1.8;
  } else {
    waypoints = workPoints;
    label = '區域工作中';
    speed = 1.75;
  }

  return {
    targetAreaId: isRain || isNight ? homeArea.id : workArea.id,
    label,
    speed,
    route: expandSafeRoute(layout, waypoints, npc.id),
    isSheltering: isRain,
    isNight,
  };
}

export function validateRegionLifeRoute(npc, layout, worldClock, weatherType, npcIndex = 0) {
  const schedule = resolveRegionLifeSchedule(npc, layout, worldClock, weatherType, npcIndex);
  return schedule.route.length >= 2 && schedule.route.every((point) => {
    const surface = sampleTraversalSurface(layout, point[0], point[2]);
    return point.every(Number.isFinite) && surface.walkable;
  });
}
