// 轉場黑屏遮罩：場景切換時快速淡入黑屏 → 掛載完成 → 淡出
import { useStore } from '../../store/useStore.js';

export default function TransitionManager() {
  const isTransitioning = useStore((s) => s.isTransitioning);

  return (
    <div
      // pointer-events-none 讓非轉場時不擋操作
      className={`fixed inset-0 z-40 bg-black transition-opacity duration-300
        ${isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    />
  );
}

// 輔助函式：安全切換場景（先黑屏 → 換場景 → 解除黑屏）
// 於任何傳送點呼叫：await goToScene('farm')
export async function goToScene(scene) {
  const { setTransitioning, setScene } = useStore.getState();
  setTransitioning(true);
  await wait(300);        // 等黑屏淡入
  setScene(scene);        // 切換場景（新場景開始掛載）
  await wait(400);        // 給新場景掛載緩衝
  setTransitioning(false); // 淡出黑屏
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
