// 雪光谷：升降溫度，理解正負數與安全溫度區間。
import { useState } from 'react';

export default function SnowTemperatureChallenge({ challenge, disabled, onSuccess }) {
  const [temperature, setTemperature] = useState(challenge.startTemperature);
  const adjust = (delta) => setTemperature((current) => Math.min(challenge.max, Math.max(challenge.min, current + delta)));
  const correct = temperature === challenge.targetTemperature;
  const range = challenge.max - challenge.min;
  const level = ((temperature - challenge.min) / range) * 100;

  return (
    <div className="rounded-3xl border-2 border-cyan-100/60 bg-cyan-500/15 p-4 text-center">
      <p className="text-sm font-black text-cyan-50">{challenge.prompt}</p>
      <div className="mx-auto mt-5 flex h-48 w-28 items-end justify-center rounded-[36px] border-4 border-white/70 bg-slate-950/45 p-3">
        <div className="relative h-full w-8 overflow-hidden rounded-full bg-white/20"><div className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-blue-600 to-cyan-200 transition-[height]" style={{ height: `${level}%` }} /></div>
      </div>
      <div className="mt-3 text-3xl font-black text-white">{temperature}°C</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button disabled={disabled} onClick={() => adjust(-challenge.step)} className="rounded-2xl bg-blue-700 px-4 py-3 font-black text-white active:scale-95">❄️ 降 {challenge.step}°</button>
        <button disabled={disabled} onClick={() => adjust(challenge.step)} className="rounded-2xl bg-orange-500 px-4 py-3 font-black text-white active:scale-95">🔥 升 {challenge.step}°</button>
      </div>
      <button disabled={disabled || !correct} onClick={onSuccess} className={`mt-4 w-full rounded-2xl px-4 py-3 font-black text-white ${correct ? 'bg-emerald-500 active:scale-95' : 'cursor-not-allowed bg-slate-600'}`}>確認安全溫度</button>
    </div>
  );
}
