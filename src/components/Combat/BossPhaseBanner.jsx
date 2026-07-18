import { Html } from '@react-three/drei';

export default function BossPhaseBanner({ phase, vulnerable }) {
  if (!phase) return null;
  return (
    <Html zIndexRange={[24, 0]} position={[0, 3.3, 0]} center distanceFactor={14}>
      <div className={`rounded-2xl border-2 px-3 py-1.5 text-center text-xs font-black shadow-xl ${vulnerable ? 'border-yellow-100 bg-amber-500 text-amber-950' : 'border-white/80 bg-slate-900/82 text-white'}`}>
        <div>{phase.label}</div>
        <div className="text-[10px] opacity-80">{vulnerable ? '破綻出現：現在攻擊效果最佳' : '觀察技能預警並準備閃避'}</div>
      </div>
    </Html>
  );
}
