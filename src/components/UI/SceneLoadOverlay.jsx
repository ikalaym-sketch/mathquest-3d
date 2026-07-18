// 場景分段載入畫面。
// 顯示 React 程式區塊與 Three.js LoadingManager 的真實狀態，並搭配場景相關數學教學。
import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useStore } from '../../store/useStore.js';

const SCENE_LESSONS = {
  farm: [
    { icon: '🌾', title: '田地面積', text: '田地長 4 公尺、寬 3 公尺，面積是 4 × 3 = 12 平方公尺。' },
    { icon: '🥕', title: '作物產量', text: '有 5 排作物，每排 6 株，總數是 5 × 6 = 30 株。' },
    { icon: '🪙', title: '農產售價', text: '每顆果實 8G，賣 4 顆可以得到 8 × 4 = 32G。' },
  ],
  region: [
    { icon: '🧭', title: '探索方向', text: '把方向、距離與地標組合，可以找到最短探索路徑。' },
  ],
  forest_ruins: [
    { icon: '🔢', title: '數列規律', text: '2、4、6、8 每次增加 2，下一個數字是 10。' },
    { icon: '🌉', title: '路徑加法', text: '走 7 步到木橋，再走 5 步到瀑布，共走 12 步。' },
    { icon: '🧩', title: '圖形規律', text: '三角形、四邊形、五邊形依序增加一條邊。' },
  ],
  trialTower: [
    { icon: '🏰', title: '樓層規律', text: '每 10 層有一次重要獎勵；20、30、40 都是 10 的倍數。' },
  ],
};

export default function SceneLoadOverlay() {
  const currentScene = useStore((state) => state.currentScene);
  const currentRegionId = useStore((state) => state.worldProgress.currentRegionId);
  const chunkLoading = useStore((state) => state.sceneChunkLoading);
  const { active, progress, loaded, total, item, errors } = useProgress();
  const [visible, setVisible] = useState(false);

  const lesson = useMemo(() => {
    const lessonKey = currentScene === 'region' && currentRegionId === 'forest_ruins' ? 'forest_ruins' : currentScene;
    const lessons = SCENE_LESSONS[lessonKey] || SCENE_LESSONS.region;
    return lessons[Math.floor(Math.random() * lessons.length)];
  }, [currentRegionId, currentScene]);

  useEffect(() => {
    if (chunkLoading || active) {
      setVisible(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setVisible(false), 260);
    return () => window.clearTimeout(timer);
  }, [chunkLoading, active]);

  if (!visible || currentScene === 'village') return null;

  const realProgress = chunkLoading && total === 0 ? 8 : Math.max(8, Math.round(progress));
  const shortItem = item ? item.split('/').slice(-2).join('/') : 'scene module';

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-gradient-to-b from-sky-300 via-cyan-100 to-emerald-200 px-5">
      <div className="w-full max-w-2xl rounded-[30px] border-4 border-white/80 bg-white/90 p-6 shadow-2xl backdrop-blur-md md:p-8">
        <div className="grid gap-5 md:grid-cols-[1fr_.85fr] md:items-center">
          <section>
            <div className="text-xs font-black tracking-[.22em] text-emerald-700">REAL SCENE LOADING</div>
            <h2 className="mt-2 text-3xl font-black text-slate-800">正在準備{currentScene === 'farm' ? '星光農莊' : currentScene === 'trialTower' ? '試煉之塔' : currentRegionId === 'forest_ruins' ? '森林遺跡' : '冒險區域'}</h2>
            <p className="mt-2 truncate text-xs font-semibold text-slate-500">目前物件：{shortItem}</p>
            <div className="mt-5 h-5 overflow-hidden rounded-full border-2 border-white bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-sky-400 transition-[width] duration-200"
                style={{ width: `${realProgress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs font-black text-slate-500">
              <span>{realProgress}%</span>
              <span>{total > 0 ? `${loaded}/${total} assets` : 'loading module'}</span>
            </div>
            {errors.length > 0 && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700">
                有 {errors.length} 個資產載入失敗，系統將使用備援模型。
              </div>
            )}
          </section>
          <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
            <div className="text-5xl">{lesson.icon}</div>
            <div className="mt-2 text-xs font-black tracking-wider text-amber-700">LOADING MATH</div>
            <h3 className="mt-1 text-xl font-black text-slate-800">{lesson.title}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{lesson.text}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
