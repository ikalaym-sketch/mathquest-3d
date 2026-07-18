// v0.8.0 音效庫（全部即時合成，無音檔）
import { getCtx, playNote, playNoise, mtof } from './AudioEngine.js';

// 取得目前時間（安全）
function now() {
  const c = getCtx();
  return c ? c.currentTime : 0;
}

export const SFX = {
  // 揮擊：向下掃頻的 whoosh
  attack() {
    playNoise({ start: now(), dur: 0.18, gain: 0.18, type: 'bandpass', freq: 1800, sweepTo: 400 });
  },
  // v0.32：十二種Base Archetype共用有限音色族，不再為20件武器複製音效邏輯。
  weaponAttack(profileId = 'audio:blade') {
    const family = String(profileId).replace(/^audio:/, '');
    const t = now();
    if (['bow', 'crossbow'].includes(family)) {
      playNoise({ start: t, dur: family === 'crossbow' ? 0.12 : 0.18, gain: 0.13, type: 'bandpass', freq: family === 'crossbow' ? 1250 : 1850, sweepTo: 520 });
      playNote({ freq: family === 'crossbow' ? 150 : 220, start: t, dur: 0.09, type: 'triangle', gain: 0.1, bus: 'sfx', attack: 0.001 });
      return;
    }
    if (['arcane', 'grimoire', 'focus'].includes(family)) {
      const notes = family === 'grimoire' ? [55, 62, 67] : family === 'focus' ? [67, 74] : [60, 67, 72];
      notes.forEach((note, index) => playNote({ freq: mtof(note), start: t + index * 0.025, dur: 0.2, type: 'sine', gain: 0.08, bus: 'sfx', attack: 0.004, send: 0.2 }));
      return;
    }
    if (['heavy', 'polearm', 'scythe'].includes(family)) {
      playNoise({ start: t, dur: 0.24, gain: 0.2, type: 'bandpass', freq: family === 'heavy' ? 1050 : 1450, sweepTo: 260 });
      playNote({ freq: family === 'heavy' ? 90 : 130, start: t + 0.025, dur: 0.15, type: 'triangle', gain: 0.12, bus: 'sfx', attack: 0.002 });
      return;
    }
    playNoise({ start: t, dur: family === 'dual' || family === 'thrown' ? 0.12 : 0.18, gain: 0.16, type: 'bandpass', freq: family === 'dual' ? 2300 : 1800, sweepTo: 420 });
  },
  weaponImpact(profileId = 'audio:blade', crit = false) {
    const family = String(profileId).replace(/^audio:/, '');
    const t = now();
    const magical = ['arcane', 'grimoire', 'focus'].includes(family);
    const heavy = ['heavy', 'polearm', 'scythe'].includes(family);
    playNote({ freq: crit ? 340 : magical ? 280 : heavy ? 120 : 210, start: t, dur: heavy ? 0.14 : 0.1, type: magical ? 'sine' : 'square', gain: crit ? 0.24 : 0.17, bus: 'sfx', attack: 0.001, release: 0.06 });
    playNoise({ start: t, dur: heavy ? 0.12 : 0.075, gain: heavy ? 0.18 : 0.12, type: 'lowpass', freq: heavy ? 850 : 1250 });
    if (crit) playNote({ freq: 680, start: t + 0.02, dur: 0.12, type: 'triangle', gain: 0.16, bus: 'sfx', attack: 0.001 });
  },
  // 命中敵人：短促方波 + 噪音撞擊
  hit(crit = false) {
    const t = now();
    playNote({ freq: crit ? 320 : 220, start: t, dur: 0.1, type: 'square', gain: crit ? 0.28 : 0.2, bus: 'sfx', attack: 0.001, release: 0.06 });
    playNoise({ start: t, dur: 0.08, gain: 0.15, type: 'lowpass', freq: 1200 });
    if (crit) playNote({ freq: 660, start: t + 0.02, dur: 0.12, type: 'square', gain: 0.18, bus: 'sfx', attack: 0.001 });
  },
  // 敵人死亡：向下滑音
  enemyDeath() {
    const t = now();
    playNote({ freq: 300, start: t, dur: 0.28, type: 'sawtooth', gain: 0.2, bus: 'sfx', attack: 0.001, release: 0.2, filterFreq: 1500 });
    playNote({ freq: 150, start: t + 0.04, dur: 0.3, type: 'triangle', gain: 0.16, bus: 'sfx' });
  },
  // 受傷（玩家）：低沉衝擊
  playerHurt() {
    const t = now();
    playNote({ freq: 140, start: t, dur: 0.22, type: 'square', gain: 0.24, bus: 'sfx', attack: 0.001, filterFreq: 800 });
    playNoise({ start: t, dur: 0.12, gain: 0.14, type: 'lowpass', freq: 600 });
  },
  // 拾取/金幣：兩個上行方波
  pickup() {
    const t = now();
    playNote({ freq: mtof(84), start: t, dur: 0.08, type: 'square', gain: 0.18, bus: 'sfx', attack: 0.001 });
    playNote({ freq: mtof(88), start: t + 0.07, dur: 0.1, type: 'square', gain: 0.18, bus: 'sfx', attack: 0.001 });
  },
  // 翻滾：短 whoosh
  dodge() {
    playNoise({ start: now(), dur: 0.22, gain: 0.14, type: 'bandpass', freq: 700, sweepTo: 2400 });
  },
  // UI 點擊
  click() {
    playNote({ freq: 880, start: now(), dur: 0.05, type: 'square', gain: 0.12, bus: 'sfx', attack: 0.001, release: 0.03 });
  },
  // 傳送門／室內切換：柔和上行音，避免突兀驚嚇。
  portal() {
    const t = now();
    [67, 72, 79].forEach((n, i) => playNote({ freq: mtof(n), start: t + i * 0.055, dur: 0.18, type: 'triangle', gain: 0.12, bus: 'sfx', attack: 0.005, send: 0.28 }));
  },
  // 入水／上岸：低音水花噪音。
  waterSplash() {
    const t = now();
    playNoise({ start: t, dur: 0.18, gain: 0.08, type: 'lowpass', freq: 950 });
    playNote({ freq: 180, start: t, dur: 0.14, type: 'sine', gain: 0.07, bus: 'sfx', attack: 0.005 });
  },
  // 危險環境警告：短促但不尖銳。
  environmentWarning() {
    const t = now();
    [220, 165].forEach((freq, i) => playNote({ freq, start: t + i * 0.08, dur: 0.13, type: 'square', gain: 0.1, bus: 'sfx', attack: 0.003, filterFreq: 900 }));
  },
  // 數學答對：上行大三和弦琶音
  correct() {
    const t = now();
    [60, 64, 67, 72].forEach((n, i) => playNote({ freq: mtof(n), start: t + i * 0.07, dur: 0.18, type: 'triangle', gain: 0.2, bus: 'sfx', attack: 0.005, send: 0.2 }));
  },
  // 數學答錯：下行減音
  wrong() {
    const t = now();
    [60, 58, 55].forEach((n, i) => playNote({ freq: mtof(n), start: t + i * 0.1, dur: 0.16, type: 'sawtooth', gain: 0.16, bus: 'sfx', attack: 0.005, filterFreq: 1400 }));
  },
  // 升級/成就：號角式上行 + 亮音
  levelUp() {
    const t = now();
    [60, 64, 67, 72, 76].forEach((n, i) => playNote({ freq: mtof(n), start: t + i * 0.09, dur: 0.25, type: 'triangle', gain: 0.22, bus: 'sfx', attack: 0.005, send: 0.3 }));
  },
  // Boss 封印成功：華麗和弦
  seal() {
    const t = now();
    [48, 55, 60, 64, 67].forEach((n) => playNote({ freq: mtof(n), start: t, dur: 1.2, type: 'sawtooth', gain: 0.12, bus: 'sfx', attack: 0.02, release: 0.8, filterFreq: 2000, send: 0.4 }));
    [72, 76, 79].forEach((n, i) => playNote({ freq: mtof(n), start: t + 0.3 + i * 0.12, dur: 0.4, type: 'triangle', gain: 0.18, bus: 'sfx', send: 0.4 }));
  },
  // 種植/收成
  harvest() {
    const t = now();
    [67, 72, 76].forEach((n, i) => playNote({ freq: mtof(n), start: t + i * 0.06, dur: 0.14, type: 'triangle', gain: 0.18, bus: 'sfx', attack: 0.004 }));
  },
  // 開寶箱
  chest() {
    const t = now();
    playNoise({ start: t, dur: 0.1, gain: 0.1, type: 'highpass', freq: 3000 });
    [72, 76, 79, 84].forEach((n, i) => playNote({ freq: mtof(n), start: t + 0.05 + i * 0.06, dur: 0.16, type: 'square', gain: 0.16, bus: 'sfx', send: 0.3 }));
  },
};
