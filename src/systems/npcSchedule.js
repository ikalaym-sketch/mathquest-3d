// v0.28 NPC 日程：統一處理星期、時間、天氣、住家、工作與休閒位置。
import { getVillageResidentProfile, getVillageWeekday } from '../data/villageResidentProfiles.js';

const FARM_HOME_POINTS = {
  farmer_aya: [-14, 0, 20], helper_tom: [14, 0, 15], orchard_mia: [20, 0, -18],
};

export function isNightSegment(segment) {
  return ['evening', 'night', 'lateNight', 'dawn'].includes(segment);
}

export function isShopOpen(clock, npcId = 'merchant') {
  const minutes = clock?.minutes ?? 480;
  const weather = clock?.weather || 'sunny';
  const weekday = getVillageWeekday(clock?.dayIndex || 1).index;
  const profile = getVillageResidentProfile(npcId);
  return minutes >= 8 * 60 && minutes < 19 * 60 && weather !== 'lightRain' && !profile?.closedWeekdays?.includes(weekday);
}

export function resolveRoleNpcSchedule(def, clock) {
  const profile = getVillageResidentProfile(def.id);
  const weather = clock?.weather || 'sunny';
  const segment = clock?.segment || 'morning';
  const weekday = getVillageWeekday(clock?.dayIndex || 1);
  const closed = profile?.closedWeekdays?.includes(weekday.index);
  if (!profile) return { state: 'working', label: def.role, position: def.position, interactable: true, serviceOpen: true };
  if (isNightSegment(segment)) return { state: 'resting', label: '在家休息', position: profile.homePosition, interactable: true, serviceOpen: false };
  if (weather === 'lightRain' || weather === 'mist') return { state: 'sheltering', label: '屋簷下避雨', position: profile.rainPosition, interactable: true, serviceOpen: def.id === 'chief' };
  if (closed) return { state: 'leisure', label: `${weekday.label}休息日`, position: profile.leisurePosition, interactable: true, serviceOpen: false };
  const open = def.id === 'chief' || isShopOpen(clock, def.id);
  return { state: open ? 'working' : 'leisure', label: open ? def.role : '下班散步', position: open ? profile.workPosition : profile.leisurePosition, interactable: true, serviceOpen: open };
}

export function resolveLifeNpcRoute(def, clock, sceneId) {
  const weather = clock?.weather || 'sunny';
  const segment = clock?.segment || 'morning';
  if (sceneId === 'farm') {
    const home = FARM_HOME_POINTS[def.id] || def.route?.[0] || [0, 0, 0];
    if (isNightSegment(segment)) return { state: 'resting', label: '回棚休息', route: [home], speedMultiplier: 0.7 };
    if (weather === 'lightRain') return { state: 'sheltering', label: '屋簷下避雨', route: [home], speedMultiplier: 0.75 };
    return { state: 'working', label: '農場工作', route: def.route, speedMultiplier: 1 };
  }

  const profile = getVillageResidentProfile(def.id);
  if (!profile) return { state: 'walking', label: '村中散步', route: def.route, speedMultiplier: 1 };
  const weekday = getVillageWeekday(clock?.dayIndex || 1);
  const closed = profile.closedWeekdays?.includes(weekday.index);
  if (isNightSegment(segment)) return { state: 'resting', label: '回家休息', route: [profile.homePosition], speedMultiplier: 0.7 };
  if (weather === 'lightRain' || weather === 'mist') return { state: 'sheltering', label: '室內避雨', route: [profile.rainPosition], speedMultiplier: 0.75 };
  if (closed) return { state: 'leisure', label: `${weekday.label}休閒日`, route: [profile.homePosition, profile.leisurePosition], speedMultiplier: 0.85 };
  if (segment === 'morning') return { state: 'working', label: '晨間上工', route: [profile.homePosition, profile.workPosition], speedMultiplier: 1 };
  if (segment === 'evening') return { state: 'returning', label: '準備回家', route: [profile.workPosition, profile.leisurePosition, profile.homePosition], speedMultiplier: 0.9 };
  return { state: 'walking', label: profile.role, route: [profile.workPosition, profile.leisurePosition], speedMultiplier: 1 };
}

export function resolveAnimalRoutine(animalType, clock, defaultPosition) {
  const segment = clock?.segment || 'morning';
  const weather = clock?.weather || 'sunny';
  const shelterOffsets = { cow: [12.5, 0, 14.5], sheep: [14.5, 0, 14.5], chicken: [16.5, 0, 16.0] };
  if (isNightSegment(segment)) return { state: 'resting', label: '夜間休息', position: shelterOffsets[animalType] || defaultPosition };
  if (weather === 'lightRain') return { state: 'sheltering', label: '棚舍避雨', position: shelterOffsets[animalType] || defaultPosition };
  return { state: 'active', label: '戶外活動', position: defaultPosition };
}

export function matchesSpawnRule(rule, clock) {
  if (!rule) return true;
  const segment = clock?.segment || 'morning';
  const weather = clock?.weather || 'sunny';
  if (rule.segments?.length && !rule.segments.includes(segment)) return false;
  if (rule.excludeSegments?.includes(segment)) return false;
  if (rule.weather?.length && !rule.weather.includes(weather)) return false;
  if (rule.excludeWeather?.includes(weather)) return false;
  return true;
}
