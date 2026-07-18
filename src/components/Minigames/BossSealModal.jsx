// Boss 寬容封印：依 Boss 設定產生題數，答對達門檻即可成功，錯題會顯示進度而非立即全部失敗。
import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { generateQuestion } from '../../utils/MathEngine.js';

export default function BossSealModal() {
  const seal = useStore((s) => s.sealChallenge);
  const resolve = useStore((s) => s.resolveSealChallenge);
  const reportAnswer = useStore((s) => s.reportAnswer);
  const rank = useStore((s) => s.mathPerformance.currentRank);
  const difficulty = useStore((s) => s.gameProgress.unlockedDifficulty);
  const questionCount = seal?.questionCount || 3;
  const requiredCorrect = Math.min(questionCount, seal?.requiredCorrect || 2);
  const questions = useMemo(() => {
    if (!seal) return [];
    const grade = ['kindergarten', 'grade1', 'grade3', 'grade5'][Math.max(0, Math.min(3, difficulty - 1))];
    return Array.from({ length: questionCount }, () => generateQuestion(grade, Math.min(4, rank + 1)));
  }, [seal, questionCount, difficulty, rank]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState(null);
  useEffect(() => { setIndex(0); setCorrectCount(0); setPicked(null); }, [seal]);
  if (!seal || questions.length === 0) return null;
  const question = questions[index];

  const onPick = (option) => {
    if (picked != null) return;
    setPicked(option);
    const correct = option === question.answer;
    const nextCorrect = correctCount + (correct ? 1 : 0);
    reportAnswer(correct, question.dimension);
    window.setTimeout(() => {
      if (index >= questionCount - 1) resolve(nextCorrect >= requiredCorrect);
      else { setCorrectCount(nextCorrect); setIndex(index + 1); setPicked(null); }
    }, 800);
  };

  return (
    <div className="mq-modal-safe fixed inset-0 z-50 flex items-center justify-center bg-[#17304b]/86 p-3 backdrop-blur-md">
      <section className="w-full max-w-lg rounded-[32px] border-[5px] border-white/90 bg-gradient-to-b from-[#fff5cf] to-[#e7e4ff] p-5 text-slate-800 shadow-2xl">
        <header className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-violet-700">{seal.title || '守護者封印'}</p><h2 className="text-xl font-black">{seal.bossName || '區域守護者'}</h2></div><span className="rounded-full bg-violet-600 px-3 py-1 text-sm font-black text-white">答對 {requiredCorrect}/{questionCount} 題</span></header>
        <div className="mt-3 flex gap-2">{questions.map((_, itemIndex) => <span key={itemIndex} className={`h-3 flex-1 rounded-full ${itemIndex < index ? 'bg-emerald-400' : itemIndex === index ? 'bg-amber-400' : 'bg-slate-200'}`} />)}</div>
        <p className="mt-3 text-center text-sm font-bold text-slate-600">目前答對 {correctCount} 題。即使答錯一題，也能繼續完成封印。</p>
        <p className="mt-4 rounded-3xl bg-slate-800 px-4 py-6 text-center text-4xl font-black text-white">{question.question}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">{question.options.map((option) => { const answer = option === question.answer; const selected = option === picked; let style = 'border-white bg-white text-slate-800'; if (picked != null) style = answer ? 'border-emerald-300 bg-emerald-100 text-emerald-900' : selected ? 'border-red-300 bg-red-100 text-red-900' : 'border-white/70 bg-white/50 text-slate-500'; return <button key={String(option)} onClick={() => onPick(option)} className={`min-h-14 rounded-2xl border-[3px] text-xl font-black shadow-sm ${style}`}>{option}</button>; })}</div>
      </section>
    </div>
  );
}
