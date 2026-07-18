// v0.27.0 四季與作物適種規則。
export const SEASONS = Object.freeze([
  { id: 'spring', label: '春季', icon: '🌸', startDay: 1 },
  { id: 'summer', label: '夏季', icon: '☀️', startDay: 29 },
  { id: 'autumn', label: '秋季', icon: '🍁', startDay: 57 },
  { id: 'winter', label: '冬季', icon: '❄️', startDay: 85 },
]);

export function getSeasonSnapshot(dayIndex = 1) {
  const normalizedDay = Math.max(1, Math.floor(Number(dayIndex) || 1));
  const yearDay = ((normalizedDay - 1) % 112) + 1;
  const seasonIndex = Math.floor((yearDay - 1) / 28);
  const season = SEASONS[seasonIndex];
  return { ...season, dayOfSeason: ((yearDay - 1) % 28) + 1, year: Math.floor((normalizedDay - 1) / 112) + 1 };
}

export function canPlantSeedInSeason(seed, seasonId, farmLevel = 1) {
  if (!seed) return false;
  if ((seed.seasons || []).includes(seasonId)) return true;
  return farmLevel >= 5 && seed.greenhouseAllowed !== false;
}
