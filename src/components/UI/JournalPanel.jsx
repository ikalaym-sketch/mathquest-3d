// 冒險手冊：主線、成就、天賦、夥伴與紀錄統一以繁體中文呈現。
import { useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';
import { SFX } from '../../audio/sfx.js';
import { getCompanionProfile } from '../../data/companionProfiles.js';
import StoryJournalSection from '../Story/StoryJournalSection.jsx';

const TABS = [['Story', '主線'], ['Achievements', '成就'], ['Talents', '天賦'], ['Pet', '夥伴'], ['Records', '紀錄']];

export default function JournalPanel() {
  const [tab, setTab] = useState('Story');
  return (
    <Panel title="冒險手冊" wide>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TABS.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`min-h-11 rounded-2xl border-2 px-3 text-sm font-black ${tab === key ? 'border-sky-400 bg-sky-100 text-sky-900' : 'border-white bg-white/70 text-slate-700'}`}>{label}</button>)}
      </div>
      {tab === 'Story' && <StoryJournalSection />}
      {tab === 'Achievements' && <Achievements />}
      {tab === 'Talents' && <Talents />}
      {tab === 'Pet' && <Pet />}
      {tab === 'Records' && <Records />}
    </Panel>
  );
}

function Achievements() {
  const achievements = useStore((s) => s.achievements);
  const unlocked = Object.keys(achievements).length;
  return <><p className="mb-3 text-sm font-bold text-slate-600">已完成 {unlocked}/{ACHIEVEMENTS.length}</p><div className="space-y-2">{ACHIEVEMENTS.map((item) => { const got = achievements[item.id]; return <div key={item.id} className={`rounded-2xl border-2 p-3 ${got ? 'border-amber-300 bg-amber-50' : 'border-white bg-white/65'}`}><div className="flex items-center justify-between gap-3"><span className="font-black text-slate-800">{got ? '★ ' : '☆ '}{item.name}</span><span className="text-xs font-black text-amber-700">+{item.reward}G</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{item.desc}</p></div>; })}</div></>;
}

function Talents() {
  const talents = useStore((s) => s.talents);
  const wisdom = useStore((s) => s.wisdomPoints);
  const unlock = useStore((s) => s.unlockTalent);
  const [message, setMessage] = useState(null);
  const list = [
    ['power', '力量', '攻擊傷害提高 20%。'], ['swift', '迅捷', '移動速度提高 15%。'], ['fortune', '幸運', '擊倒怪物時有機會取得額外素材。'],
    ['vitality', '活力', '最大生命提高 30。'], ['guardian', '守護', '受到的傷害降低 25%。'], ['greed', '聚寶', '擊倒怪物取得的金幣提高 50%。'], ['scholar', '學者', '數學題會移除一個錯誤選項。'],
  ];
  const onUnlock = (key) => { const ok = unlock(key); if (ok) SFX.levelUp(); setMessage(ok ? '天賦已解鎖。' : '需要 5 點智慧點。'); };
  return <><div className="mb-3 rounded-2xl bg-amber-100 p-3 font-black text-amber-900">智慧點：{wisdom}</div>{message && <p className="mb-3 text-center text-sm font-black text-sky-800">{message}</p>}<div className="space-y-2">{list.map(([key, name, desc]) => <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-white bg-white/70 p-3"><div><div className="font-black text-slate-800">{name}</div><p className="mt-1 text-xs text-slate-600">{desc}</p></div>{talents[key] ? <span className="shrink-0 text-sm font-black text-emerald-700">已解鎖</span> : <button onClick={() => onUnlock(key)} className="min-h-11 shrink-0 rounded-2xl bg-amber-400 px-3 text-sm font-black text-amber-950">5 點</button>}</div>)}</div></>;
}

function Pet() {
  const companionState = useStore((state) => state.companionState);
  const profile = getCompanionProfile(companionState?.activeId);
  const runtime = profile ? (companionState.records?.[profile.id] || { level: 1, exp: 0, affinity: 0 }) : null;
  if (!profile) return <p className="py-8 text-center font-bold text-slate-600">目前沒有同行中的守護夥伴。</p>;
  const nextLevelExp = Math.max(60, runtime.level * 60);
  const skillText = Object.values(profile.skills || {}).join('、');
  return <div className="rounded-3xl border-2 border-white bg-white/75 p-5"><div className="flex justify-between"><span className="text-lg font-black text-slate-800">{profile.emoji} {profile.name}・{profile.species}</span><span className="font-black text-sky-700">Lv {runtime.level}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">能力：{skillText}</p><p className="mt-1 text-xs font-bold text-rose-600">親密度 {runtime.affinity || 0}/100</p><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${Math.min(100, ((runtime.exp || 0) / nextLevelExp) * 100)}%` }} /></div><p className="mt-1 text-xs font-bold text-slate-500">經驗 {runtime.exp || 0}/{nextLevelExp}</p></div>;
}

function Records() {
  const records = useStore((s) => s.records);
  const items = [['最高金幣', records.maxGold], ['累積擊倒', records.totalKills], ['完成封印', records.bossKills], ['最佳連續答對', records.bestMathStreak]];
  return <div className="grid grid-cols-2 gap-3">{items.map(([label, value]) => <div key={label} className="rounded-3xl border-2 border-white bg-white/75 p-5 text-center"><div className="text-sm font-bold text-slate-600">{label}</div><div className="mt-2 text-3xl font-black text-sky-700">{value}</div></div>)}</div>;
}
