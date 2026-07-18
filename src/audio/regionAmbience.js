// 八區環境音景：使用既有 Web Audio 合成器，不依賴外部音檔。
// 每次只排程一個低頻事件；場景切換、進入室內或元件卸載時會取消計時器。
import { isUnlocked, mtof, playNoise, playNote } from './AudioEngine.js';

export const REGION_MUSIC_THEME = Object.freeze({
  wind_highlands: 'heroic',
  snow_valley: 'cold',
  farm_plains: 'farm',
  star_village: 'village',
  crystal_lake: 'ethereal',
  sun_canyon: 'exotic',
  mushroom_grove: 'whimsical',
  clockwork_ruins: 'intense',
});

const AMBIENCE_PROFILE = Object.freeze({
  wind_highlands: { notes: [79, 83, 86], type: 'triangle', noise: ['bandpass', 950], interval: [4200, 7000] },
  snow_valley: { notes: [76, 81, 88], type: 'sine', noise: ['highpass', 2800], interval: [5600, 8500] },
  farm_plains: { notes: [72, 76, 79], type: 'triangle', noise: ['bandpass', 1700], interval: [4800, 7600] },
  star_village: { notes: [72, 79, 83], type: 'triangle', noise: ['highpass', 2300], interval: [5200, 8000] },
  crystal_lake: { notes: [76, 83, 88], type: 'sine', noise: ['bandpass', 1300], interval: [5000, 7800] },
  sun_canyon: { notes: [69, 73, 76], type: 'triangle', noise: ['bandpass', 650], interval: [4300, 6800] },
  mushroom_grove: { notes: [74, 78, 81], type: 'triangle', noise: ['lowpass', 900], interval: [4200, 6600] },
  clockwork_ruins: { notes: [64, 67, 71], type: 'square', noise: ['bandpass', 1200], interval: [3600, 5600] },
});

export function startRegionAmbience({ regionId, indoor = false, weather = 'sunny' } = {}) {
  const profile = AMBIENCE_PROFILE[regionId];
  if (!profile || typeof window === 'undefined') return () => {};
  let cancelled = false;
  let timerId = null;
  let step = 0;

  const schedule = () => {
    if (cancelled) return;
    const [minDelay, maxDelay] = profile.interval;
    const delay = minDelay + ((step * 977) % Math.max(1, maxDelay - minDelay));
    timerId = window.setTimeout(() => {
      if (!cancelled && isUnlocked()) {
        const note = profile.notes[step % profile.notes.length];
        const gain = indoor ? 0.025 : 0.045;
        playNote({ freq: mtof(note), dur: indoor ? 0.45 : 0.7, type: profile.type, gain, bus: 'sfx', attack: 0.04, release: 0.3, send: indoor ? 0.18 : 0.32 });
        if (!indoor && (step % 2 === 0 || weather === 'lightRain')) {
          playNoise({ dur: 0.3, gain: weather === 'lightRain' ? 0.035 : 0.018, bus: 'sfx', type: profile.noise[0], freq: profile.noise[1] });
        }
      }
      step += 1;
      schedule();
    }, delay);
  };
  schedule();
  return () => {
    cancelled = true;
    if (timerId !== null) window.clearTimeout(timerId);
  };
}
