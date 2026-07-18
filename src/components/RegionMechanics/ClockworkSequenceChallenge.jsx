// 機械遺跡：依指定順序啟動齒輪；按錯即重置，模擬機械時序鎖。
import { useState } from 'react';

export default function ClockworkSequenceChallenge({ challenge, disabled, onSuccess, onWrong }) {
  const [progress, setProgress] = useState([]);
  const press = (gear) => {
    if (disabled) return;
    const expected = challenge.sequence[progress.length];
    if (gear !== expected) {
      setProgress([]);
      onWrong();
      return;
    }
    const next = [...progress, gear];
    setProgress(next);
    if (next.length === challenge.sequence.length) onSuccess();
  };
  return (
    <div className="rounded-3xl border-2 border-amber-200/60 bg-slate-700/60 p-4 text-center">
      <p className="text-sm font-black text-amber-50">{challenge.prompt}</p>
      <div className="mt-4 flex justify-center gap-2">{challenge.sequence.map((gear, index) => <span key={`${gear}-${index}`} className={`rounded-xl px-3 py-2 text-xs font-black ${progress[index] === gear ? 'bg-emerald-500 text-white' : 'bg-black/35 text-amber-100'}`}>{index + 1}. {gear}</span>)}</div>
      <div className="mt-7 grid grid-cols-3 gap-3">{challenge.gears.map((gear, index) => <button key={gear} disabled={disabled} onClick={() => press(gear)} className="aspect-square rounded-full border-8 border-amber-200/70 bg-gradient-to-br from-slate-400 to-slate-800 p-2 text-xs font-black text-white shadow-xl active:rotate-12 active:scale-95"><span className="block text-4xl">⚙️</span>{gear}<span className="mt-1 block text-[10px] text-amber-200">{[8, 12, 16][index]} 齒</span></button>)}</div>
      <div className="mt-4 text-sm font-black text-white/70">已完成 {progress.length}/{challenge.sequence.length}</div>
    </div>
  );
}
