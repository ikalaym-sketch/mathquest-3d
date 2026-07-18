// v0.2.0 氣球射擊小遊戲（獨立疊層 Canvas，鎖定相機）
import { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useStore } from '../../store/useStore.js';
import { generateQuestion } from '../../utils/MathEngine.js';
import { SFX } from '../../audio/sfx.js';

export default function BalloonShooter() {
  const open = useStore((s) => s.balloonGame);
  const close = useStore((s) => s.closeBalloonGame);
  const addGold = useStore((s) => s.addGold);
  const reportAnswer = useStore((s) => s.reportAnswer);
  const rank = useStore((s) => s.mathPerformance.currentRank);
  const difficulty = useStore((s) => s.gameProgress.unlockedDifficulty);

  const [round, setRound] = useState(0); // 換題用 key
  const [feedback, setFeedback] = useState(null);

  // 依目前難度出乘法為主的題（可再擴充）
  const q = useMemo(() => {
    const grade = ['kindergarten', 'grade1', 'grade3', 'grade5'][Math.max(0, Math.min(3, difficulty - 1))];
    return generateQuestion(grade, Math.max(rank, 2)); // 小遊戲稍難
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  if (!open) return null;

  const onShoot = (value) => {
    const correct = value === q.answer;
    reportAnswer(correct, q.dimension);
    SFX[correct ? "correct" : "wrong"]();
    if (correct) {
      addGold(20);
      setFeedback('Pop! +20 Gold');
    } else {
      setFeedback('Missed! Try the next one.');
    }
    setTimeout(() => {
      setFeedback(null);
      setRound((r) => r + 1); // 下一題
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0b1226] to-[#132043]">
      {/* 3D 氣球區（鎖定相機） */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 4]} intensity={1} />
          <BalloonField key={round} options={q.options} onShoot={onShoot} />
        </Canvas>
      </div>

      {/* 底部題目與離開鈕（DOM 疊層） */}
      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-3 pointer-events-none">
        <div className="px-6 py-3 rounded-xl bg-black/50 border border-hyrule-gold/60 pointer-events-auto">
          <span className="font-display text-2xl text-hyrule-gold">{q.question}</span>
        </div>
        {feedback && <p className="font-body text-white">{feedback}</p>}
        <button
          onClick={close}
          className="pointer-events-auto px-4 py-2 rounded-lg bg-hyrule-bronze/70 border border-white/30 text-white text-sm"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

// 5 顆緩慢飄動的球體，數字用 Html 標籤顯示
function BalloonField({ options, onShoot }) {
  // 由 4 個選項擴充成 5 顆（多一顆干擾）
  const numbers = useMemo(() => {
    const arr = [...options];
    // 補第 5 顆：與正解無關的干擾值
    arr.push(options[0] + options[1] + 1);
    return arr.slice(0, 5).map((n, i) => ({
      n,
      x: -6 + i * 3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [options]);

  return (
    <>
      {numbers.map((b, i) => (
        <Balloon key={i} data={b} onShoot={onShoot} />
      ))}
    </>
  );
}

function Balloon({ data, onShoot }) {
  const ref = useRef();
  // 緩慢上下飄動
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6 + data.phase) * 1.2;
    }
  });
  const color = `hsl(${(data.n * 47) % 360}, 70%, 60%)`;
  return (
    <group ref={ref} position={[data.x, 0, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onShoot(data.n);
        }}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* 數字標籤 */}
      <Html zIndexRange={[20, 0]} center>
        <div className="text-white font-display text-xl pointer-events-none select-none">{data.n}</div>
      </Html>
    </group>
  );
}
