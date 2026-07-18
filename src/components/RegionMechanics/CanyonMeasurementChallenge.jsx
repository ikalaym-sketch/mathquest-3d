// 日光峽谷：把橋索分段長度加總，建立實際測量感。
export default function CanyonMeasurementChallenge({ challenge, disabled, onSuccess, onWrong }) {
  const choose = (value) => { if (value === challenge.answer) onSuccess(); else onWrong(); };
  return (
    <div className="rounded-3xl border-2 border-orange-200/60 bg-orange-500/15 p-4 text-center">
      <p className="text-sm font-black text-orange-50">{challenge.prompt}</p>
      <div className="mt-6 flex items-center justify-center gap-1">{challenge.segments.map((segment, index) => <div key={`${segment}-${index}`} className="relative flex h-10 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-700 font-black text-white shadow" style={{ width: `${Math.max(72, segment * 7)}px` }}>{segment}m</div>)}</div>
      <div className="mt-5 text-sm font-black text-amber-100">總長 = ?</div>
      <div className="mt-4 grid grid-cols-3 gap-3">{challenge.choices.map((choice) => <button key={choice} disabled={disabled} onClick={() => choose(choice)} className="rounded-2xl bg-orange-600 px-3 py-3 text-xl font-black text-white shadow active:scale-95">{choice}m</button>)}</div>
    </div>
  );
}
