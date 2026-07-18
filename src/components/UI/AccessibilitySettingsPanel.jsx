import Panel from './Panel.jsx';
import GameIcon from './GameIcon.jsx';
import { useStore } from '../../store/useStore.js';

export default function AccessibilitySettingsPanel() {
  const preferences = useStore((state) => state.uiPreferences);
  const setPreference = useStore((state) => state.setUiPreference);
  const reset = useStore((state) => state.resetUiPreferences);

  return (
    <Panel title="介面與輔助設定" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionGroup title="文字大小" icon="book" value={preferences.textScale} options={[['normal', '標準'], ['large', '大字'], ['xlarge', '特大字']]} onChange={(value) => setPreference('textScale', value)} />
        <OptionGroup title="HUD 大小" icon="settings" value={preferences.hudScale} options={[['small', '精簡'], ['normal', '標準'], ['large', '大型']]} onChange={(value) => setPreference('hudScale', value)} />
        <OptionGroup title="慣用手" icon="accessibility" value={preferences.handedness} options={[['right', '右手操作'], ['left', '左手操作']]} onChange={(value) => setPreference('handedness', value)} />
        <OptionGroup title="色覺模式" icon="spark" value={preferences.colorVision} options={[['standard', '標準'], ['deuteranopia', '綠色辨識輔助'], ['protanopia', '紅色辨識輔助'], ['tritanopia', '藍色辨識輔助']]} onChange={(value) => setPreference('colorVision', value)} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Toggle label="精簡 HUD" description="減少非必要卡片，保留戰鬥與任務資訊。" value={preferences.compactHud} onChange={(value) => setPreference('compactHud', value)} />
        <Toggle label="顯示小地圖" description="可在小螢幕關閉，增加可視範圍。" value={preferences.showMinimap} onChange={(value) => setPreference('showMinimap', value)} />
        <Toggle label="減少動態效果" description="降低彈跳、閃爍與介面轉場。" value={preferences.reducedMotion} onChange={(value) => setPreference('reducedMotion', value)} />
        <Toggle label="高對比" description="加深文字與邊框，提高辨識度。" value={preferences.highContrast} onChange={(value) => setPreference('highContrast', value)} />
        <Toggle label="顯示字幕" description="保留角色與提示文字。" value={preferences.subtitles} onChange={(value) => setPreference('subtitles', value)} />
        <Toggle label="語音引導" description="使用裝置內建語音朗讀重要提示與 NPC 對話。" value={preferences.voiceGuidance} onChange={(value) => setPreference('voiceGuidance', value)} />
      </div>
      <button onClick={reset} className="mt-5 min-h-12 w-full rounded-2xl border-2 border-sky-200 bg-sky-100 font-black text-sky-900 active:translate-y-0.5">恢復預設設定</button>
    </Panel>
  );
}

function OptionGroup({ title, icon, value, options, onChange }) {
  return (
    <section className="rounded-3xl border-2 border-white bg-white/75 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-black text-slate-800"><GameIcon name={icon} size={20} />{title}</h3>
      <div className="mt-3 grid gap-2">
        {options.map(([optionValue, label]) => <button key={optionValue} onClick={() => onChange(optionValue)} className={`min-h-11 rounded-2xl border-2 px-3 text-left text-sm font-black ${value === optionValue ? 'border-sky-400 bg-sky-100 text-sky-900' : 'border-slate-200 bg-white text-slate-700'}`}>{label}</button>)}
      </div>
    </section>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <button type="button" aria-pressed={value} onClick={() => onChange(!value)} className={`flex min-h-20 items-center justify-between gap-3 rounded-3xl border-2 p-4 text-left ${value ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white/75'}`}>
      <span><strong className="block text-sm text-slate-800">{label}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span></span>
      <span className={`grid h-8 w-14 shrink-0 rounded-full p-1 transition ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`h-6 w-6 rounded-full bg-white shadow transition ${value ? 'translate-x-6' : ''}`} /></span>
    </button>
  );
}
