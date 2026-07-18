// 家長可理解的學習報告：傳統題目與場景式操作分開呈現。
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore.js';

const LABELS = { Addition: '加法', Subtraction: '減法', Multiplication: '乘法', Division: '除法', Advanced: '進階', Geometry: '幾何', Money: '金錢', Measurement: '測量', Fractions: '分數', Logic: '邏輯' };

export default function LearningReport() {
  const show = useStore((s) => s.showReport);
  const close = useStore((s) => s.closeReport);
  const stats = useStore((s) => s.mathStats);
  const journal = useStore((s) => s.learningJournal);
  if (!show) return null;
  const data = Object.entries(stats).map(([dimension, value]) => ({ dimension: LABELS[dimension] || dimension, score: value.total > 0 ? Math.round(value.correct / value.total * 100) : 0, total: value.total }));
  const answered = data.filter((item) => item.total > 0);
  const weakest = answered.length ? answered.reduce((left, right) => right.score < left.score ? right : left) : null;
  const sceneAccuracy = journal.totalSceneInteractions > 0 ? Math.round(journal.correctSceneInteractions / journal.totalSceneInteractions * 100) : 0;

  return (
    <div className="mq-modal-safe fixed inset-0 z-50 flex items-center justify-center bg-[#17304b]/80 p-3 backdrop-blur-md">
      <section className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border-[4px] border-white bg-gradient-to-b from-[#fff8dc] to-[#dff4ff] text-slate-800 shadow-2xl">
        <header className="flex items-center justify-between bg-gradient-to-r from-[#ffd66f] to-[#ffad7c] px-5 py-4"><div><p className="text-xs font-black text-amber-800">家長與孩子共同查看</p><h2 className="text-xl font-black">學習成長報告</h2></div><button onClick={close} className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-xl font-black">×</button></header>
        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="選擇題練習" value={`${answered.reduce((sum, item) => sum + item.total, 0)} 次`} />
            <Metric label="場景式操作" value={`${journal.totalSceneInteractions} 次`} />
            <Metric label="場景操作正確率" value={`${sceneAccuracy}%`} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            <div className="h-80 rounded-3xl border-2 border-white bg-white/70 p-2"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="72%"><PolarGrid stroke="#6b8aa040" /><PolarAngleAxis dataKey="dimension" tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} /><Radar dataKey="score" stroke="#4e9dcc" fill="#65c8e8" fillOpacity={0.45} /></RadarChart></ResponsiveContainer></div>
            <div className="space-y-3"><div className="rounded-3xl border-2 border-white bg-white/75 p-4"><h3 className="font-black">學習建議</h3>{weakest ? <p className="mt-2 text-sm leading-6 text-slate-600">目前可優先加強「{weakest.dimension}」，已練習 {weakest.total} 次，正確率 {weakest.score}%。建議回到對應區域，用場景機關再操作一次。</p> : <p className="mt-2 text-sm leading-6 text-slate-600">完成場景挑戰後，這裡會產生具體建議。</p>}</div><div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4"><h3 className="font-black text-emerald-900">報告解讀</h3><p className="mt-2 text-sm leading-6 text-emerald-800">場景式操作代表孩子在風向、排序、對稱、測量等遊戲情境中的實際表現，不與彈窗題目混為同一項統計。</p></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) { return <div className="rounded-3xl border-2 border-white bg-white/75 p-4 text-center"><div className="text-sm font-bold text-slate-600">{label}</div><div className="mt-2 text-3xl font-black text-sky-700">{value}</div></div>; }
