import { useStore } from '../../store/useStore.js';

export default function DefeatPanel() {
  const defeatState = useStore((state) => state.defeatState);
  const requestRespawn = useStore((state) => state.requestRespawn);
  if (!defeatState) return null;

  return (
    <div className="fixed inset-0 z-[105] grid place-items-center bg-[#17304b]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
      <section className="w-full max-w-md rounded-[30px] border-4 border-white/80 bg-gradient-to-b from-[#fff6d9] to-[#dff4ff] p-6 text-center shadow-[0_18px_0_rgba(42,65,82,.3),0_25px_55px_rgba(8,28,45,.4)]">
        <div className="text-7xl">🌟</div>
        <h2 id="defeat-title" className="mt-2 text-2xl font-black text-[#493b31]">先休息一下</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6b5b4d]">冒險者暫時沒有力氣了。小精靈會把你安全送回這個區域的檢查點，生命與魔力都會恢復。</p>
        <button onClick={requestRespawn} className="mt-5 h-14 w-full rounded-2xl border-b-[6px] border-[#3477a8] bg-gradient-to-b from-[#78d2ff] to-[#3b9fe0] text-lg font-black text-white active:translate-y-1 active:border-b-2">回到安全點</button>
      </section>
    </div>
  );
}
