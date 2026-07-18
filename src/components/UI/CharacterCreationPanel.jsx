import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import {
  PLAYER_ACCESSORY_OPTIONS,
  PLAYER_FACE_OPTIONS,
  PLAYER_HAIR_OPTIONS,
  PLAYER_OUTFIT_OPTIONS,
} from '../../data/characterCompanionV031Catalog.js';

const SKINS = ['#f2c9a5', '#d9a77e', '#b97d58', '#84543d'];
const HAIR_COLORS = ['#47352b', '#6f4930', '#202538', '#d88b52', '#78549c'];
const BODY_TYPES = [
  { id: 'compact', label: '輕巧' },
  { id: 'balanced', label: '均衡' },
  { id: 'sturdy', label: '結實' },
];

export default function CharacterCreationPanel() {
  const profile = useStore((state) => state.characterProfile);
  const complete = useStore((state) => state.completeCharacterCreation);
  const editorOpen = useStore((state) => state.characterEditorOpen);
  const closeEditor = useStore((state) => state.closeCharacterEditor);
  const setPaused = useStore((state) => state.setPaused);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState('');
  const firstCreation = !profile?.created;
  const open = firstCreation || editorOpen;

  useEffect(() => {
    if (open) setPaused(true);
  }, [open, setPaused]);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const previewEmoji = useMemo(() => PLAYER_FACE_OPTIONS.find((item) => item.id === draft?.face)?.icon || '😊', [draft?.face]);
  if (!open || !draft) return null;

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    const name = String(draft.name || '').trim();
    if (name.length < 1 || name.length > 12) {
      setError('名字需要 1～12 個字。');
      return;
    }
    complete({ ...draft, name });
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#17304b]/88 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="character-title">
      <section className="my-4 w-full max-w-[820px] overflow-hidden rounded-[32px] border-[5px] border-white/80 bg-gradient-to-b from-[#fff8da] to-[#dff5ff] shadow-[0_18px_0_rgba(42,65,82,.28),0_28px_60px_rgba(8,28,45,.4)]">
        <header className="bg-gradient-to-r from-[#ffca62] via-[#ff9e72] to-[#76c8f4] px-5 py-4 text-center text-[#49351f]">
          <p className="text-xs font-black tracking-[0.2em]">{firstCreation ? '開始新的數學冒險' : '農舍更衣鏡'}</p>
          <h1 id="character-title" className="text-2xl font-black md:text-3xl">{firstCreation ? '創造你的星光冒險者' : '調整冒險者外觀'}</h1>
        </header>

        <div className="grid gap-4 p-4 md:grid-cols-[230px_1fr] md:p-6">
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[26px] border-4 border-white bg-gradient-to-b from-[#9de5ff] to-[#7ec987] shadow-inner">
            <div className="relative grid h-36 w-36 place-items-center rounded-full border-[8px] border-[#ffe08b] bg-white/75 text-7xl shadow-xl" style={{ color: draft.hairColor }}>
              {previewEmoji}
              <span className="absolute -right-3 -top-3 text-4xl">{PLAYER_ACCESSORY_OPTIONS.find((item) => item.id === draft.accessory)?.icon}</span>
            </div>
            <strong className="mt-4 rounded-full bg-white/85 px-5 py-2 text-lg text-[#47382c] shadow">{draft.name || '冒險者'}</strong>
            <span className="mt-2 rounded-full bg-[#47382c]/75 px-3 py-1 text-xs font-bold text-white">外觀會同步到 3D 角色與狀態欄</span>
          </div>

          <div className="space-y-4">
            <Field title="你的名字">
              <input value={draft.name || ''} onChange={(event) => update('name', event.target.value)} maxLength={12} className="h-12 w-full rounded-2xl border-2 border-[#85b9d5] bg-white px-4 text-lg font-black text-[#3c4c59] outline-none focus:border-[#ff9e52]" placeholder="輸入 1～12 個字" />
            </Field>
            <ChoiceRow title="身形" items={BODY_TYPES} value={draft.bodyType} onChange={(value) => update('bodyType', value)} />
            <ChoiceRow title="髮型" items={PLAYER_HAIR_OPTIONS} value={draft.hairStyle} onChange={(value) => update('hairStyle', value)} />
            <ChoiceRow title="表情" items={PLAYER_FACE_OPTIONS} value={draft.face} onChange={(value) => update('face', value)} />
            <ChoiceRow title="服裝風格" items={PLAYER_OUTFIT_OPTIONS} value={draft.outfitStyle || 'adventurer'} onChange={(value) => update('outfitStyle', value)} />
            <ChoiceRow title="特殊配件" items={PLAYER_ACCESSORY_OPTIONS} value={draft.accessory} onChange={(value) => update('accessory', value)} />
            <ColorRow title="膚色" colors={SKINS} value={draft.skinColor} onChange={(value) => update('skinColor', value)} />
            <ColorRow title="髮色" colors={HAIR_COLORS} value={draft.hairColor} onChange={(value) => update('hairColor', value)} />
            {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm font-black text-red-700">{error}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {!firstCreation && <button onClick={closeEditor} className="h-14 rounded-2xl border-b-4 border-[#748999] bg-[#a8bfce] text-base font-black text-[#30404d] active:translate-y-1 active:border-b-0">取消修改</button>}
              <button onClick={submit} className={`h-14 rounded-2xl border-b-[6px] border-[#ba6c27] bg-gradient-to-b from-[#ffc85f] to-[#f79542] text-lg font-black text-[#583516] active:translate-y-1 active:border-b-2 ${firstCreation ? 'sm:col-span-2' : ''}`}>{firstCreation ? '踏上冒險旅程' : '儲存外觀'}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ title, children }) {
  return <label className="block"><span className="mb-1 block text-sm font-black text-[#5b5148]">{title}</span>{children}</label>;
}

function ChoiceRow({ title, items, value, onChange }) {
  return (
    <Field title={title}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => <button key={item.id} type="button" onClick={() => onChange(item.id)} className={`min-h-12 rounded-xl border-2 px-2 py-2 text-sm font-black transition ${value === item.id ? 'border-[#ff9b48] bg-[#fff0c6] text-[#70421d] shadow' : 'border-white bg-white/70 text-[#5f6c74]'}`}><span className="mr-1">{item.icon}</span>{item.label}</button>)}
      </div>
    </Field>
  );
}

function ColorRow({ title, colors, value, onChange }) {
  return (
    <Field title={title}>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => <button key={color} type="button" aria-label={`${title} ${color}`} onClick={() => onChange(color)} className={`h-10 w-10 rounded-full border-4 shadow ${value === color ? 'scale-110 border-[#ff9b48]' : 'border-white'}`} style={{ backgroundColor: color }} />)}
      </div>
    </Field>
  );
}
