// v0.8.0 音樂主題（每個場景/生態系的作曲設定）
// 以音樂理論定義：root 主音、scale 音階、progression 和弦進行、voices 配器、tempo 速度。
// 和弦型別音程：
export const CHORD = {
  maj: [0, 4, 7], min: [0, 3, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10], sus: [0, 5, 7], add9: [0, 4, 7, 14], dim: [0, 3, 6],
};

// 音階（半音位移）
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentaMajor: [0, 2, 4, 7, 9],
  pentaMinor: [0, 3, 5, 7, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  phrygianDom: [0, 1, 4, 5, 7, 8, 10], // 異國/沙漠
  lydian: [0, 2, 4, 6, 7, 9, 11],       // 奇幻/蘑菇
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

// 主題定義。root 為 midi 主音；progression 每項 {deg 和弦根(半音), type}
// voices：bass/arp/lead/pad/drums 開關與音色
export const THEMES = {
  // 村莊：溫暖田園大調，中速
  village: {
    tempo: 96, root: 60, scale: SCALES.major, beatsPerChord: 4,
    progression: [ {deg:0,type:'maj7'}, {deg:5,type:'min7'}, {deg:-4,type:'maj7'}, {deg:7,type:'dom7'} ], // I vi IV V
    voices: { bass:true, arp:true, lead:true, pad:false, drums:false },
    timbre: { bass:'triangle', arp:'triangle', lead:'triangle' }, leadDensity:0.4, send:0.25,
  },
  // 牧場：明亮五聲大調，輕快有鼓
  farm: {
    tempo: 112, root: 65, scale: SCALES.pentaMajor, beatsPerChord: 2,
    progression: [ {deg:0,type:'maj'}, {deg:7,type:'maj'}, {deg:5,type:'min'}, {deg:5,type:'maj'} ],
    voices: { bass:true, arp:true, lead:true, pad:false, drums:true },
    timbre: { bass:'triangle', arp:'square', lead:'triangle' }, leadDensity:0.5, send:0.15,
  },
  // 平原/浮空島：英雄大調，有鼓
  heroic: {
    tempo: 122, root: 62, scale: SCALES.major, beatsPerChord: 2,
    progression: [ {deg:0,type:'maj'}, {deg:-4,type:'maj'}, {deg:5,type:'min'}, {deg:7,type:'maj'} ],
    voices: { bass:true, arp:true, lead:true, pad:false, drums:true },
    timbre: { bass:'sawtooth', arp:'square', lead:'square' }, leadDensity:0.5, send:0.2,
  },
  // 沙漠/遺跡：異國和聲小調
  exotic: {
    tempo: 100, root: 57, scale: SCALES.phrygianDom, beatsPerChord: 4,
    progression: [ {deg:0,type:'min'}, {deg:1,type:'maj'}, {deg:0,type:'min'}, {deg:8,type:'maj'} ],
    voices: { bass:true, arp:true, lead:true, pad:true, drums:false },
    timbre: { bass:'triangle', arp:'sawtooth', lead:'square' }, leadDensity:0.45, send:0.35,
  },
  // 極地：寒冷小調，慢，有 pad
  cold: {
    tempo: 82, root: 59, scale: SCALES.minor, beatsPerChord: 4,
    progression: [ {deg:0,type:'min7'}, {deg:-4,type:'maj7'}, {deg:5,type:'min7'}, {deg:3,type:'maj7'} ],
    voices: { bass:true, arp:false, lead:true, pad:true, drums:false },
    timbre: { bass:'sine', arp:'triangle', lead:'triangle' }, leadDensity:0.3, send:0.45,
  },
  // 沼澤/幽暗：陰森小調，稀疏 pad
  eerie: {
    tempo: 76, root: 55, scale: SCALES.minor, beatsPerChord: 4,
    progression: [ {deg:0,type:'min'}, {deg:1,type:'dim'}, {deg:0,type:'min'}, {deg:6,type:'min'} ],
    voices: { bass:true, arp:false, lead:true, pad:true, drums:false },
    timbre: { bass:'sine', arp:'triangle', lead:'sawtooth' }, leadDensity:0.25, send:0.5,
  },
  // 火山/混沌：激烈快速小調，驅動貝斯+鼓
  intense: {
    tempo: 142, root: 50, scale: SCALES.minor, beatsPerChord: 2,
    progression: [ {deg:0,type:'min'}, {deg:0,type:'min'}, {deg:8,type:'maj'}, {deg:7,type:'maj'} ],
    voices: { bass:true, arp:true, lead:true, pad:false, drums:true },
    timbre: { bass:'sawtooth', arp:'square', lead:'sawtooth' }, leadDensity:0.55, send:0.2,
  },
  // 蘑菇林：奇幻 Lydian，俏皮
  whimsical: {
    tempo: 118, root: 60, scale: SCALES.lydian, beatsPerChord: 2,
    progression: [ {deg:0,type:'maj'}, {deg:2,type:'maj'}, {deg:7,type:'maj'}, {deg:9,type:'min'} ],
    voices: { bass:true, arp:true, lead:true, pad:false, drums:true },
    timbre: { bass:'triangle', arp:'square', lead:'triangle' }, leadDensity:0.5, send:0.3,
  },
  // 水晶洞：空靈大調加九，慢，shimmer
  ethereal: {
    tempo: 88, root: 64, scale: SCALES.major, beatsPerChord: 4,
    progression: [ {deg:0,type:'add9'}, {deg:5,type:'add9'}, {deg:-3,type:'maj7'}, {deg:7,type:'sus'} ],
    voices: { bass:true, arp:true, lead:true, pad:true, drums:false },
    timbre: { bass:'sine', arp:'triangle', lead:'triangle' }, leadDensity:0.35, send:0.55,
  },
  // Boss/試煉：緊張激烈
  boss: {
    tempo: 150, root: 48, scale: SCALES.harmonicMinor, beatsPerChord: 2,
    progression: [ {deg:0,type:'min'}, {deg:8,type:'maj'}, {deg:0,type:'min'}, {deg:7,type:'dom7'} ],
    voices: { bass:true, arp:true, lead:true, pad:true, drums:true },
    timbre: { bass:'sawtooth', arp:'sawtooth', lead:'square' }, leadDensity:0.6, send:0.25,
  },
  // 數學挑戰：專注輕緊張
  math: {
    tempo: 104, root: 60, scale: SCALES.dorian, beatsPerChord: 2,
    progression: [ {deg:0,type:'min7'}, {deg:5,type:'min7'} ],
    voices: { bass:true, arp:true, lead:false, pad:false, drums:false },
    timbre: { bass:'sine', arp:'triangle', lead:'triangle' }, leadDensity:0.2, send:0.2,
  },
  // 氣球小遊戲：俏皮上揚
  balloon: {
    tempo: 126, root: 67, scale: SCALES.pentaMajor, beatsPerChord: 2,
    progression: [ {deg:0,type:'maj'}, {deg:5,type:'maj'}, {deg:7,type:'maj'}, {deg:0,type:'maj'} ],
    voices: { bass:true, arp:true, lead:true, pad:false, drums:true },
    timbre: { bass:'triangle', arp:'square', lead:'square' }, leadDensity:0.55, send:0.2,
  },
};

// 生態系 id → 主題鍵
export const BIOME_THEME = {
  1: 'heroic',    // 平原
  2: 'exotic',    // 荒漠
  3: 'cold',      // 極地
  4: 'eerie',     // 沼澤
  5: 'intense',   // 火山
  6: 'exotic',    // 遺跡
  7: 'whimsical', // 蘑菇林
  8: 'ethereal',  // 水晶洞
  9: 'heroic',    // 浮空島
  10: 'intense',  // 混沌裂隙
};
