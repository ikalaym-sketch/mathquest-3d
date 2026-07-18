// 風之高地：以角度旋轉風向標，讓孩子直接操作方向與角度。
import { useState } from 'react';

export default function WindAngleChallenge({ challenge, disabled, onSuccess }) {
  const [angle, setAngle] = useState(challenge.startAngle);
  const rotate = (delta) => setAngle((current) => (current + delta + 360) % 360);
  const verify = () => { if (angle === challenge.targetAngle) onSuccess(); };
  const correct = angle === challenge.targetAngle;

  return (
    <div className="rounded-3xl border-2 border-sky-200/50 bg-sky-500/15 p-4 text-center">
      <p className="text-sm font-black text-sky-100">{challenge.prompt}</p>
      <div className="relative mx-auto mt-5 h-44 w-44 rounded-full border-8 border-sky-100/70 bg-sky-950/55 shadow-inner">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((mark) => <span key={mark} className="absolute left-1/2 top-1/2 text-[10px] font-black text-sky-100" style={{ transform: `translate(-50%, -50%) rotate(${mark}deg) translateY(-70px) rotate(${-mark}deg)` }}>{mark}°</span>)}
        <div className="absolute left-1/2 top-1/2 h-16 w-2 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-amber-300 shadow-lg transition-transform" style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)`, transformOrigin: '50% 100%' }} />
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-400" />
      </div>
      <div className="mt-4 text-2xl font-black text-white">目前 {angle}°</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button disabled={disabled} onClick={() => rotate(-challenge.step)} className="rounded-2xl bg-sky-700 px-4 py-3 font-black text-white active:scale-95">↺ -{challenge.step}°</button>
        <button disabled={disabled} onClick={() => rotate(challenge.step)} className="rounded-2xl bg-sky-600 px-4 py-3 font-black text-white active:scale-95">↻ +{challenge.step}°</button>
      </div>
      <button disabled={disabled || !correct} onClick={verify} className={`mt-4 w-full rounded-2xl px-4 py-3 font-black text-white ${correct ? 'bg-emerald-500 active:scale-95' : 'cursor-not-allowed bg-slate-600'}`}>確認風向</button>
    </div>
  );
}
