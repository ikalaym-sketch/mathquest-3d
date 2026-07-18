// v0.8.0 音樂播放器（前瞻式排程，依主題即時演奏 bass/arp/lead/pad/drums）
import { getCtx, playNote, playNoise, mtof, isUnlocked, getMusicBus } from './AudioEngine.js';
import { THEMES, CHORD } from './themes.js';

let current = null;      // 目前主題鍵
let theme = null;        // 目前主題物件
let timer = null;        // 排程 interval
let step16 = 0;          // 16 分音符步進
let nextTime = 0;        // 下個排程時間
const LOOKAHEAD = 0.1;   // 排程提前量(秒)
const TICK = 25;         // 排程檢查間隔(ms)

// 取得和弦音符（midi）
function chordNotes(root, chord) {
  const intervals = CHORD[chord.type] || CHORD.maj;
  return intervals.map((iv) => root + chord.deg + iv);
}

// 依步進排程一個 16 分音符的所有聲部
function scheduleStep(t) {
  if (!theme) return;
  const prog = theme.progression;
  const beatsPerChord = theme.beatsPerChord;
  const stepsPerChord = beatsPerChord * 4; // 每拍 4 個 16 分音符
  const totalSteps = prog.length * stepsPerChord;
  const s = step16 % totalSteps;
  const chordIndex = Math.floor(s / stepsPerChord) % prog.length;
  const chord = prog[chordIndex];
  const inChordStep = s % stepsPerChord;
  const beat = Math.floor(inChordStep / 4); // 該和弦內第幾拍
  const sub = inChordStep % 4;              // 拍內 16 分位置
  const notes = chordNotes(theme.root, chord);
  const v = theme.voices;
  const tim = theme.timbre;
  const stepDur = 60 / theme.tempo / 4;

  // 低音：每拍根音（+第 3 拍五度）
  if (v.bass && sub === 0) {
    const bassNote = notes[0] - 12 + (beat === 2 ? 7 : 0);
    playNote({ freq: mtof(bassNote), start: t, dur: stepDur * 3.6, type: tim.bass, gain: 0.22, attack: 0.005, release: 0.1 });
  }

  // 琶音：每個 8 分音符走一個和弦音
  if (v.arp && sub % 2 === 0) {
    const idx = (Math.floor(s / 2)) % notes.length;
    const arpNote = notes[idx] + 12;
    playNote({ freq: mtof(arpNote), start: t, dur: stepDur * 1.6, type: tim.arp, gain: 0.12, attack: 0.004, release: 0.08, send: theme.send * 0.5 });
  }

  // pad：每個和弦起始鋪長音（低音量）
  if (v.pad && inChordStep === 0) {
    notes.forEach((n) => playNote({ freq: mtof(n), start: t, dur: stepsPerChord * stepDur * 0.95, type: 'sawtooth', gain: 0.05, attack: 0.4, release: 0.6, filterFreq: 1200, send: theme.send }));
  }

  // 主旋律：機率性從音階挑一個音（落在拍點）
  if (v.lead && sub === 0 && Math.random() < theme.leadDensity) {
    const scale = theme.scale;
    const deg = scale[Math.floor(Math.random() * scale.length)];
    const octave = Math.random() < 0.5 ? 12 : 24;
    const leadNote = theme.root + chord.deg + deg + octave;
    playNote({ freq: mtof(leadNote), start: t, dur: stepDur * (Math.random() < 0.5 ? 1.8 : 3.5), type: tim.lead, gain: 0.13, attack: 0.01, release: 0.15, send: theme.send });
  }

  // 鼓組：kick(1,3拍) + hat(每8分) + snare(2,4拍)
  if (v.drums) {
    if (sub === 0 && (beat === 0 || beat === 2)) kick(t);
    if (sub === 0 && (beat === 1 || beat === 3)) snare(t);
    if (sub % 2 === 0) hat(t, beat % 2 === 1 ? 0.06 : 0.04);
  }
}

// 合成打擊
function kick(t) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.connect(g);
  g.connect(getMusicBus());
  osc.start(t);
  osc.stop(t + 0.18);
}
function snare(t) {
  playNoise({ start: t, dur: 0.12, gain: 0.12, bus: 'music', type: 'highpass', freq: 1800 });
}
function hat(t, gain) {
  playNoise({ start: t, dur: 0.04, gain, bus: 'music', type: 'highpass', freq: 7000 });
}

// 排程迴圈
function scheduler() {
  const c = getCtx();
  if (!c || !theme) return;
  const stepDur = 60 / theme.tempo / 4;
  while (nextTime < c.currentTime + LOOKAHEAD) {
    scheduleStep(nextTime);
    step16 += 1;
    nextTime += stepDur;
  }
}

// 設定主題（切換時淡入下個循環）
export function setMusicTheme(key) {
  if (key === current) return;
  current = key;
  theme = THEMES[key] || null;
  if (!theme) return;
  const c = getCtx();
  if (!c || !isUnlocked()) return; // 未解鎖則等 start() 被呼叫
  start();
}

// 啟動播放（音訊解鎖後呼叫）
export function start() {
  const c = getCtx();
  if (!c || !theme) return;
  if (timer) return; // 已在播放
  step16 = 0;
  nextTime = c.currentTime + 0.1;
  timer = setInterval(scheduler, TICK);
}

// 停止
export function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function getCurrentTheme() {
  return current;
}
