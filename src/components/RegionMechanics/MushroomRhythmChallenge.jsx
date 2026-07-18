// 蘑菇濕地：以實際敲擊次數完成倍數節拍。
import { useState } from 'react';

export default function MushroomRhythmChallenge({ challenge, disabled, onSuccess, onWrong }) {
  const [taps, setTaps] = useState(0);
  const tap = () => { if (!disabled && taps < challenge.targetTaps + 3) setTaps((current) => current + 1); };
  const verify = () => { if (taps === challenge.targetTaps) onSuccess(); else { onWrong(); setTaps(0); } };
  return (
    <div className="rounded-3xl border-2 border-pink-200/60 bg-pink-500/15 p-4 text-center">
      <p className="text-sm font-black text-pink-50">{challenge.prompt}</p>
      <div className="mt-4 flex justify-center gap-2">{challenge.pattern.map((value) => <span key={value} className="rounded-full bg-violet-700 px-4 py-2 font-black text-white">{value}</span>)}<span className="rounded-full border-2 border-dashed border-white/70 px-4 py-2 font-black text-white">?</span></div>
      <button disabled={disabled} onClick={tap} className="mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full border-8 border-pink-100 bg-gradient-to-b from-pink-400 to-violet-700 text-7xl shadow-2xl active:scale-90">🍄</button>
      <div className="mt-4 text-2xl font-black text-white">已敲 {taps} 下</div>
      <div className="mt-4 grid grid-cols-2 gap-3"><button disabled={disabled} onClick={() => setTaps(0)} className="rounded-2xl bg-slate-600 px-4 py-3 font-black text-white active:scale-95">重新開始</button><button disabled={disabled || taps === 0} onClick={verify} className="rounded-2xl bg-violet-600 px-4 py-3 font-black text-white active:scale-95">確認節拍</button></div>
    </div>
  );
}
