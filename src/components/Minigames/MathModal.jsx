import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { generateQuestion, generateContextQuestion, generateSkillQuestion } from '../../utils/MathEngine.js';
import { resolveSkillIdFromContext } from '../../data/skillGraph.js';
import { SFX } from '../../audio/sfx.js';

export default function MathModal() {
  const challenge = useStore((state) => state.mathChallenge);
  const resolve = useStore((state) => state.resolveMathChallenge);
  const reportAnswer = useStore((state) => state.reportAnswer);
  const reportSkillAttempt = useStore((state) => state.reportSkillAttempt);
  const mathPerf = useStore((state) => state.mathPerformance);
  const unlockedDifficulty = useStore((state) => state.gameProgress.unlockedDifficulty);

  const baseGrade = challenge?.baseGrade || gradeFromDifficulty(unlockedDifficulty);
  const question = useMemo(() => {
    if (!challenge) return null;
    const skillId = challenge.skillId || resolveSkillIdFromContext(challenge.skillContext);
    let generated;
    if (skillId) generated = generateSkillQuestion(skillId, mathPerf.currentRank);
    else if (challenge.skillContext) generated = generateContextQuestion(challenge.skillContext, mathPerf.currentRank);
    else generated = generateQuestion(baseGrade, mathPerf.currentRank, mathPerf.showVisualHint);
    const runtimeState = useStore.getState();
    const equipmentRuntime = runtimeState.getEquipmentRuntime?.() || { answerWrongOptionsRemoved: 0 };
    const removeCount = Math.max(runtimeState.talents?.scholar ? 1 : 0, equipmentRuntime.answerWrongOptionsRemoved || 0);
    for (let index = 0; index < removeCount && generated.options.length > 2; index += 1) {
      const wrongs = generated.options.filter((option) => option !== generated.answer);
      if (!wrongs.length) break;
      const remove = wrongs[Math.floor(Math.random() * wrongs.length)];
      generated.options = generated.options.filter((option) => option !== remove);
    }
    return generated;
    // 僅在新挑戰建立時產生題目，避免 UI 狀態改變重抽題。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge]);

  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    setPicked(null);
    setResult(null);
    setWrongAttempts(0);
  }, [challenge]);

  if (!challenge || !question) return null;

  const onPick = (option) => {
    if (picked != null) return;
    setPicked(option);
    const correct = option === question.answer;
    setResult(correct ? 'correct' : 'wrong');
    SFX[correct ? 'correct' : 'wrong']();
    reportAnswer(correct, question.dimension);
    reportSkillAttempt(question.skillId, correct);
    if (correct) window.setTimeout(() => resolve(true), 1300);
    else setWrongAttempts((count) => count + 1);
  };

  const retry = () => {
    setPicked(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#17304b]/82 p-3 backdrop-blur-md">
      <section className="my-4 w-[94%] max-w-lg overflow-hidden rounded-[30px] border-[5px] border-white/80 bg-gradient-to-b from-[#fff8dc] to-[#dff4ff] text-[#493e35] shadow-[0_18px_0_rgba(41,62,77,.28),0_26px_60px_rgba(8,28,45,.42)]">
        <header className="flex items-center justify-between bg-gradient-to-r from-[#ffd264] to-[#ff9f75] px-5 py-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-[#7a4b21]">數學挑戰</p>
            <h2 className="text-lg font-black">{question.domainLabel || question.title || '動動腦時間'}</h2>
          </div>
          <span className="rounded-full border-2 border-white/80 bg-white/65 px-3 py-1 text-xs font-black">階段 {mathPerf.currentRank + 1}</span>
        </header>

        <div className="p-5">
          {question.skillLabel && <div className="mb-2 text-center text-sm font-black text-[#b5652e]">學習重點：{question.skillLabel}</div>}
          {question.title && !question.domainLabel && <div className="mb-2 text-center text-sm font-black text-[#b5652e]">{question.title}</div>}
          {question.prompt && <p className="mb-3 rounded-2xl border-2 border-white bg-white/75 p-3 text-center text-sm font-bold leading-6 text-[#5e554e]">{question.prompt}</p>}
          <p className="rounded-2xl bg-[#335f7f] px-4 py-5 text-center text-3xl font-black text-white shadow-inner md:text-4xl">{question.question}</p>

          {question.visualHint && <VisualHint hint={question.visualHint} />}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {question.options.map((option) => {
              const selected = picked === option;
              const answer = option === question.answer;
              let style = 'border-white bg-white/80 text-[#45515a] shadow-[0_5px_0_rgba(58,82,97,.18)] hover:bg-white';
              if (picked != null) {
                if (answer) style = 'border-[#80d69a] bg-[#c8f4d4] text-[#28643b] shadow-none';
                else if (selected) style = 'border-[#ff9a93] bg-[#ffd4d1] text-[#8d3c36] shadow-none';
                else style = 'border-white/70 bg-white/45 text-[#8b9398] opacity-70 shadow-none';
              }
              return <button key={String(option)} onClick={() => onPick(option)} className={`min-h-14 rounded-2xl border-[3px] px-3 text-xl font-black transition active:translate-y-1 ${style}`}>{option}</button>;
            })}
          </div>

          {result === 'correct' && <Feedback tone="correct" title="答對了！" text={question.explanation || '你找到了正確方法。'} />}
          {result === 'wrong' && (
            <div className="mt-4 rounded-2xl border-2 border-[#ffc2a0] bg-[#fff0df] p-4">
              <h3 className="font-black text-[#a95531]">先看提示，再試一次</h3>
              <ol className="mt-2 space-y-1 text-sm font-bold leading-6 text-[#6b5b4d]">
                {(question.hintSteps || ['圈出已知資訊。', '選擇正確運算。', '算完後回到題目檢查。']).map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
              </ol>
              {wrongAttempts >= 2 && <p className="mt-2 rounded-xl bg-white/75 p-2 text-sm font-black text-[#7c4a2e]">正確答案是 {question.answer}。{question.explanation || ''}</p>}
              <button onClick={wrongAttempts >= 2 ? () => resolve(false) : retry} className="mt-3 h-12 w-full rounded-xl border-b-4 border-[#3477a8] bg-[#61bcec] font-black text-white active:translate-y-1 active:border-b-0">{wrongAttempts >= 2 ? '記住方法，繼續冒險' : '看懂了，再試一次'}</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Feedback({ title, text }) {
  return <div className="mt-4 rounded-2xl border-2 border-[#8ddeaa] bg-[#d9f8e2] p-4 text-center"><strong className="block text-lg text-[#2f7847]">{title}</strong><span className="text-sm font-bold text-[#53725c]">{text}</span></div>;
}

function VisualHint({ hint }) {
  const dots = (count, color) => Array.from({ length: count }).map((_, index) => <span key={index} className="m-0.5 inline-block h-4 w-4 rounded-full" style={{ background: color }} />);
  return <div className="mt-3 rounded-2xl border-2 border-white bg-white/70 p-3 text-center"><div className="mb-1 text-xs font-black text-[#6b625b]">圖像提示</div><div className="flex flex-wrap items-center justify-center">{dots(hint.a, '#ee6a65')}<span className="mx-2 text-xl font-black">{hint.op}</span>{dots(hint.b, '#4d9fe8')}</div></div>;
}

function gradeFromDifficulty(difficulty) {
  return ['kindergarten', 'grade1', 'grade3', 'grade5'][Math.max(0, Math.min(3, difficulty - 1))];
}
