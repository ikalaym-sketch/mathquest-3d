// 星光村外圍：觀察數列規律並選出下一顆星。
export default function StarPatternChallenge({ challenge, disabled, onSuccess, onWrong }) {
  const choose = (value) => { if (value === challenge.answer) onSuccess(); else onWrong(); };
  return (
    <div className="rounded-3xl border-2 border-violet-200/60 bg-violet-500/15 p-4 text-center">
      <p className="text-sm font-black text-violet-50">{challenge.prompt}</p>
      <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4">{challenge.sequence.map((value) => <div key={value} className="grid h-16 w-16 place-items-center rounded-full border-2 border-yellow-100 bg-indigo-800 text-2xl font-black text-yellow-200 shadow-lg">{value}</div>)}<div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-3xl font-black text-white">?</div></div>
      <div className="mt-6 grid grid-cols-3 gap-3">{challenge.choices.map((choice) => <button key={choice} disabled={disabled} onClick={() => choose(choice)} className="rounded-2xl bg-indigo-600 px-3 py-3 text-xl font-black text-white shadow active:scale-95">⭐ {choice}</button>)}</div>
    </div>
  );
}
