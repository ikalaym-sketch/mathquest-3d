// 兒童遊戲 UI 正規設定，所有裝置與可及性選項均由此處定義。
export const UI_DEFAULTS = {
  textScale: 'normal',
  hudScale: 'normal',
  handedness: 'right',
  compactHud: false,
  showMinimap: true,
  reducedMotion: false,
  highContrast: false,
  colorVision: 'standard',
  subtitles: true,
  voiceGuidance: false,
};

export const UI_OPTION_VALUES = {
  textScale: ['normal', 'large', 'xlarge'],
  hudScale: ['small', 'normal', 'large'],
  handedness: ['left', 'right'],
  colorVision: ['standard', 'deuteranopia', 'protanopia', 'tritanopia'],
};

export function sanitizeUiPreferences(input = {}) {
  const next = { ...UI_DEFAULTS };
  Object.entries(UI_OPTION_VALUES).forEach(([key, allowed]) => {
    if (allowed.includes(input[key])) next[key] = input[key];
  });
  ['compactHud', 'showMinimap', 'reducedMotion', 'highContrast', 'subtitles', 'voiceGuidance'].forEach((key) => {
    if (typeof input[key] === 'boolean') next[key] = input[key];
  });
  return next;
}
