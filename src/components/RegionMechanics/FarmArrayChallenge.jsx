// 農業平原：用可視化行列直接理解乘法陣列。
export default function FarmArrayChallenge({ challenge, disabled, onSuccess, onWrong }) {
  const choose = (value) => { if (value === challenge.answer) onSuccess(); else onWrong(); };
  return (
    <div className="rounded-3xl border-2 border-lime-200/60 bg-lime-500/15 p-4 text-center">
      <p className="text-sm font-black text-lime-50">{challenge.prompt}</p>
      <div className="mx-auto mt-5 grid w-fit gap-2 rounded-2xl bg-emerald-950/45 p-4" style={{ gridTemplateColumns: `repeat(${challenge.columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: challenge.rows * challenge.columns }).map((_, index) => <div key={index} className="grid h-8 w-8 place-items-center rounded-lg bg-amber-300 text-lg shadow">🌱</div>)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">{challenge.choices.map((choice) => <button key={choice} disabled={disabled} onClick={() => choose(choice)} className="rounded-2xl bg-emerald-600 px-3 py-3 text-xl font-black text-white shadow active:scale-95">{choice}</button>)}</div>
    </div>
  );
}
