export const TIME_SCALE = {
  slow: 5,
  normal: 10,
  fast: 15,
};

export const WEATHER_TYPES = {
  sunny: { id: 'sunny', label: '晴天', icon: '☀️', light: 1, cloud: 0.12, rain: 0, fog: 0.05 },
  cloudy: { id: 'cloudy', label: '多雲', icon: '☁️', light: 0.82, cloud: 0.52, rain: 0, fog: 0.12 },
  lightRain: { id: 'lightRain', label: '小雨', icon: '🌦️', light: 0.72, cloud: 0.72, rain: 0.55, fog: 0.18 },
  breeze: { id: 'breeze', label: '微風', icon: '🍃', light: 0.94, cloud: 0.24, rain: 0, fog: 0.08 },
  mist: { id: 'mist', label: '薄霧', icon: '🌫️', light: 0.78, cloud: 0.38, rain: 0, fog: 0.35 },
};

export function getTimeSegment(minutes) {
  const h = ((minutes % 1440) + 1440) % 1440 / 60;
  if (h < 5) return 'lateNight';
  if (h < 7) return 'dawn';
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 17.5) return 'afternoon';
  if (h < 19.5) return 'sunset';
  if (h < 22) return 'evening';
  return 'night';
}

export function formatGameTime(minutes) {
  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
