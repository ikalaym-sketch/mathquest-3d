// v0.2.0 場景導覽列（開發/測試用，含黑屏轉場）
import { useStore } from '../../store/useStore.js';
import { goToScene } from './TransitionManager.jsx';

const SCENES = [
  { key: 'village', label: '星光村' },
  { key: 'farm', label: '農場' },
  { key: 'wilderness', label: '每日秘境' },
];

export default function SceneNav() {
  const current = useStore((s) => s.currentScene);
  const isPaused = useStore((s) => s.isPaused);

  if (isPaused) return null; // 挑戰/小遊戲中隱藏

  return (
    <div className="fixed top-36 right-3 z-30 flex gap-2">
      {SCENES.map((s) => (
        <button
          key={s.key}
          onClick={() => goToScene(s.key)}
          className={`px-3 py-1 rounded-lg text-xs font-body border transition
            ${current === s.key
              ? 'bg-hyrule-gold text-black border-hyrule-gold'
              : 'bg-black/50 text-white border-white/25 hover:bg-black/70'}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
