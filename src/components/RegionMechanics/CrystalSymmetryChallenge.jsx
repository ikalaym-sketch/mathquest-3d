// 水晶湖：選擇鏡像方向，讓折射光路形成對稱。
export default function CrystalSymmetryChallenge({ challenge, disabled, onSuccess, onWrong }) {
  const choose = (value) => { if (value === challenge.answer) onSuccess(); else onWrong(); };
  return (
    <div className="rounded-3xl border-2 border-fuchsia-100/60 bg-fuchsia-500/15 p-4 text-center">
      <p className="text-sm font-black text-fuchsia-50">{challenge.prompt}</p>
      <div className="mt-5 flex items-center justify-center gap-5"><div className="grid h-28 w-28 place-items-center rounded-3xl border-2 border-cyan-100 bg-cyan-900/55 text-7xl text-cyan-200">{challenge.sourceShape}</div><div className="h-28 w-1 rounded-full bg-white shadow-[0_0_18px_white]" /><div className="grid h-28 w-28 place-items-center rounded-3xl border-2 border-dashed border-white/60 bg-white/10 text-sm font-black text-white">{challenge.axis}鏡面</div></div>
      <div className="mt-6 grid grid-cols-3 gap-3">{challenge.choices.map((choice) => <button key={choice} disabled={disabled} onClick={() => choose(choice)} className="rounded-2xl border-2 border-cyan-100/60 bg-cyan-700 px-3 py-4 text-5xl text-cyan-50 shadow active:scale-95">{choice}</button>)}</div>
    </div>
  );
}
