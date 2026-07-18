// v0.28 守護夥伴名冊：同行切換、取得條件、好感、等級與每日互動。
import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { COMPANION_IDS, COMPANION_PROFILES } from '../../data/companionProfiles.js';

export default function CompanionRosterPanel() {
  const state = useStore((s) => s.companionState);
  const setActive = useStore((s) => s.setActiveCompanion);
  const interact = useStore((s) => s.interactWithCompanion);
  const [selectedId, setSelectedId] = useState(state.activeId || state.ownedIds?.[0] || COMPANION_IDS[0]);
  const [message, setMessage] = useState('');
  const selected = COMPANION_PROFILES[selectedId];
  const owned = state.ownedIds?.includes(selectedId);
  const record = state.records?.[selectedId] || { level: 1, exp: 0, affinity: 0, mood: 'calm' };
  const acquisitionLabel = useMemo(() => describeAcquisition(selected?.acquisition), [selected]);

  const doInteract = (action, label) => {
    const result = interact(action);
    setMessage(result.ok ? `${selected.name}${label}，好感增加。` : '今天已經完成過這項互動。');
  };

  return (
    <Panel title="守護夥伴名冊" wide>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COMPANION_IDS.map((id) => {
            const profile = COMPANION_PROFILES[id];
            const isOwned = state.ownedIds?.includes(id);
            const isActive = state.activeId === id;
            return <button key={id} onClick={() => setSelectedId(id)} className={`relative min-h-28 rounded-2xl border-2 p-2 text-center shadow ${selectedId === id ? 'border-sky-500 bg-sky-50' : 'border-white bg-white/70'}`}>
              <span className={`block text-4xl ${isOwned ? '' : 'grayscale opacity-35'}`}>{profile.emoji}</span>
              <span className="mt-1 block text-xs font-black text-slate-700">{isOwned ? profile.name : '尚未加入'}</span>
              <span className="block text-[10px] font-bold text-slate-500">{profile.species}</span>
              {isActive && <span className="absolute right-1 top-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-white">同行</span>}
            </button>;
          })}
        </div>
        <article className="rounded-[28px] border-4 border-white bg-gradient-to-b from-white/90 to-[#e4f6ff]/90 p-4 shadow-lg">
          <div className="flex items-center gap-3"><div className="text-6xl">{selected.emoji}</div><div><h3 className="text-xl font-black">{selected.name}・{selected.species}</h3><p className="text-xs font-bold text-slate-500">{owned ? `Lv ${record.level} · 好感 ${Math.round(record.affinity)}/100 · ${moodLabel(record.mood)}` : acquisitionLabel}</p></div></div>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{selected.personality}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
            <Skill label="生活" value={selected.skills.life}/><Skill label="探索" value={selected.skills.exploration}/><Skill label="學習" value={selected.skills.learning}/><Skill label="戰鬥" value={selected.skills.battle}/>
          </div>
          {owned ? <>
            <button disabled={state.activeId === selectedId} onClick={() => setActive(selectedId)} className="mt-3 h-12 w-full rounded-2xl bg-emerald-500 font-black text-white disabled:bg-emerald-200">{state.activeId === selectedId ? '目前同行中' : '邀請同行'}</button>
            {state.activeId === selectedId && <div className="mt-2 grid grid-cols-3 gap-2"><button onClick={() => doInteract('pet', '接受了撫摸')} className="rounded-xl bg-amber-100 py-2 text-xs font-black">撫摸</button><button onClick={() => doInteract('play', '和你玩了一會兒')} className="rounded-xl bg-sky-100 py-2 text-xs font-black">玩耍</button><button onClick={() => doInteract('rest', '陪你安靜休息')} className="rounded-xl bg-violet-100 py-2 text-xs font-black">休息</button></div>}
          </> : <div className="mt-3 rounded-2xl bg-amber-100 p-3 text-sm font-black text-amber-900">取得方式：{acquisitionLabel}</div>}
          {message && <p className="mt-3 rounded-xl bg-white p-2 text-center text-xs font-black text-slate-600">{message}</p>}
        </article>
      </div>
    </Panel>
  );
}
function Skill({ label, value }) { return <div className="rounded-xl bg-white/80 p-2"><span className="text-sky-700">{label}</span>：{value}</div>; }
function moodLabel(mood) { return ({ calm: '安心', happy: '開心', excited: '興奮' })[mood] || '安心'; }
function describeAcquisition(rule) {
  if (!rule) return '世界事件';
  if (rule.type === 'starter') return '新遊戲初始三選一';
  if (rule.type === 'boss') return rule.bossId === 'crystal_boss' ? '完成水晶湖守護者事件' : '完成機械遺跡守護者事件';
  if (rule.type === 'relationship') return '與花匠露露成為可靠朋友';
  if (rule.type === 'farm_activity') return `收集 ${rule.animalProducts} 次動物農產品`;
  if (rule.type === 'region_event') return '完成森林遺跡三項事件';
  return '特殊事件';
}
