// v0.8.0 Web Audio 核心引擎（無外部檔案，執行期合成音樂與音效）
// 設計：master → music/sfx 兩條匯流排；提供合成音符、噪音、簡易回授延遲殘響。
let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let reverb = null; // 回授延遲（模擬空間感）
let unlocked = false;

// 音量狀態（可由設定調整）
export const audioState = { musicVol: 0.5, sfxVol: 0.7, musicMuted: false, sfxMuted: false };

// 建立/取得 AudioContext（瀏覽器需使用者互動後才能播放）
function ensureCtx() {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  musicBus = ctx.createGain();
  musicBus.gain.value = audioState.musicMuted ? 0 : audioState.musicVol;
  musicBus.connect(master);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = audioState.sfxMuted ? 0 : audioState.sfxVol;
  sfxBus.connect(master);

  // 簡易回授延遲殘響（送 music 用，營造空間）
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.22;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.25;
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(master);
  reverb = delay;

  return ctx;
}

// 首次使用者互動時解鎖音訊
export function unlockAudio() {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  unlocked = true;
}

export function isUnlocked() {
  return unlocked;
}

export function getCtx() {
  return ensureCtx();
}
export function getMusicBus() {
  ensureCtx();
  return musicBus;
}
export function getSfxBus() {
  ensureCtx();
  return sfxBus;
}
export function getReverb() {
  ensureCtx();
  return reverb;
}

// 套用音量設定
export function applyVolumes() {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(audioState.musicMuted ? 0 : audioState.musicVol, ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(audioState.sfxMuted ? 0 : audioState.sfxVol, ctx.currentTime, 0.05);
}

// A4=440 等律；midi 音高 → 頻率
export function mtof(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * 合成一個帶 ADSR 包絡的音符（避免爆音）。
 * opts: { freq, start, dur, type, gain, bus('music'|'sfx'), attack, release, detune, filter, filterFreq, send(0~1) }
 */
export function playNote(opts) {
  const c = ensureCtx();
  if (!c) return;
  const {
    freq = 440,
    start = c.currentTime,
    dur = 0.3,
    type = 'triangle',
    gain = 0.2,
    bus = 'music',
    attack = 0.01,
    release = 0.12,
    detune = 0,
    filterFreq = 0,
    send = 0,
  } = opts;

  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;

  const env = c.createGain();
  env.gain.value = 0;

  let node = osc;
  // 選用低通濾波器（柔化）
  if (filterFreq > 0) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filterFreq;
    osc.connect(lp);
    node = lp;
  }
  node.connect(env);

  const target = bus === 'sfx' ? sfxBus : musicBus;
  env.connect(target);
  // 殘響送
  if (send > 0 && reverb) {
    const s = c.createGain();
    s.gain.value = send;
    env.connect(s);
    s.connect(reverb);
  }

  const sustain = Math.max(0.0001, gain);
  const t0 = start;
  const t1 = t0 + attack;
  const t2 = t0 + dur;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(sustain, t1);
  env.gain.setValueAtTime(sustain, Math.max(t1, t2 - release));
  env.gain.exponentialRampToValueAtTime(0.0001, t2 + release);

  osc.start(t0);
  osc.stop(t2 + release + 0.02);
}

// 產生噪音 buffer（打擊/風聲用，快取）
let _noise = null;
export function noiseBuffer() {
  const c = ensureCtx();
  if (!c) return null;
  if (_noise) return _noise;
  const len = c.sampleRate * 1;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  _noise = buf;
  return _noise;
}

// 播放一段噪音（帶包絡與帶通/低通），用於打擊與 whoosh
export function playNoise(opts) {
  const c = ensureCtx();
  if (!c) return;
  const { start = c.currentTime, dur = 0.15, gain = 0.2, bus = 'sfx', type = 'highpass', freq = 2000, sweepTo = 0 } = opts;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer();
  const flt = c.createBiquadFilter();
  flt.type = type;
  flt.frequency.value = freq;
  if (sweepTo > 0) flt.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
  const env = c.createGain();
  env.gain.value = 0;
  src.connect(flt);
  flt.connect(env);
  env.connect(bus === 'sfx' ? sfxBus : musicBus);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.start(start);
  src.stop(start + dur + 0.02);
}
