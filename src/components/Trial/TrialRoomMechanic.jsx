// 試煉塔場景式機關：符文、護送信標、序列與配對均在 3D 場景內完成，不再自動彈出共用 Math Modal。
import { useMemo, useState } from 'react';
import { Html, Sparkles } from '@react-three/drei';
import Outlined from '../3D/Outlined.jsx';
import { useStore } from '../../store/useStore.js';

const NODE_POSITIONS = [[-6, .65, 2], [0, .65, -5], [6, .65, 2], [0, .65, 6]];

export default function TrialRoomMechanic({ scenario, config, onComplete }) {
  const [progress, setProgress] = useState([]);
  const [matched, setMatched] = useState([]);
  const [selected, setSelected] = useState(null);
  const showHint = useStore((state) => state.showWorldHint);
  const recordLearning = useStore((state) => state.recordLearningInteraction);
  const matchingValues = useMemo(() => ['◆', '●', '◆', '●'], [config.floor]);
  const nodeCount = scenario.interaction === 'matching' ? 4 : 3;

  const activate = (index) => {
    if (scenario.interaction === 'matching') {
      if (matched.includes(index)) return;
      if (selected == null) {
        setSelected(index);
        showHint('再選一個相同圖形。');
        return;
      }
      if (selected === index) return;
      if (matchingValues[selected] === matchingValues[index]) {
        const next = [...matched, selected, index];
        setMatched(next);
        setSelected(null);
        recordLearning?.({ source: 'trialTower', skillId: config.skillId, correct: true, context: 'matching' });
        if (next.length >= 4) onComplete();
      } else {
        setSelected(null);
        recordLearning?.({ source: 'trialTower', skillId: config.skillId, correct: false, context: 'matching' });
        showHint('圖形不同，先觀察形狀再配對。');
      }
      return;
    }

    const expected = scenario.targetOrder[progress.length] - 1;
    if (index !== expected) {
      setProgress([]);
      recordLearning?.({ source: 'trialTower', skillId: config.skillId, correct: false, context: scenario.interaction });
      showHint(`順序需要重新開始：${scenario.targetOrder.join(' → ')}`);
      return;
    }
    const next = [...progress, index];
    setProgress(next);
    if (next.length >= scenario.targetOrder.length) {
      recordLearning?.({ source: 'trialTower', skillId: config.skillId, correct: true, context: scenario.interaction });
      onComplete();
    }
  };

  return (
    <group name={`trial-mechanic-${scenario.interaction}`}>
      {NODE_POSITIONS.slice(0, nodeCount).map((position, index) => {
        const complete = scenario.interaction === 'matching' ? matched.includes(index) : progress.includes(index);
        const active = selected === index;
        return (
          <group key={index} position={position} onClick={(event) => { event.stopPropagation(); activate(index); }}>
            <Outlined color={complete ? '#60d394' : active ? '#ffd75e' : config.palette.accent} outlineScale={1.025}>
              {scenario.interaction === 'beacons' ? <coneGeometry args={[1.1, 2.4, 8]} /> : <cylinderGeometry args={[1.35, 1.55, .45, 12]} />}
            </Outlined>
            {(complete || active) && <Sparkles count={18} scale={3} size={4} speed={.5} color={complete ? '#9affc6' : '#ffe68a'} />}
            <Html zIndexRange={[24, 0]} position={[0, 1.6, 0]} center distanceFactor={12}>
              <button onClick={(event) => { event.stopPropagation(); activate(index); }} className="min-h-12 min-w-12 rounded-2xl border-2 border-white/90 bg-slate-900/88 px-3 text-base font-black text-white shadow-xl active:scale-95">
                {scenario.interaction === 'matching' ? matchingValues[index] : index + 1}
              </button>
            </Html>
          </group>
        );
      })}
      <Html zIndexRange={[24, 0]} position={[0, 4.8, 0]} center distanceFactor={15}>
        <div className="max-w-sm rounded-2xl border-2 border-white/85 bg-white/92 px-4 py-3 text-center text-sm font-black text-slate-800 shadow-xl">
          <div>{scenario.label}</div>
          <div className="mt-1 text-xs text-slate-600">{scenario.hint}</div>
        </div>
      </Html>
    </group>
  );
}
