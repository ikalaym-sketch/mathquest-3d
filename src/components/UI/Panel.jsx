// 共用兒童遊戲面板：統一淺色設計、可讀字級、安全區與大型觸控目標。
import { useStore } from '../../store/useStore.js';
import GameIcon from './GameIcon.jsx';

export default function Panel({ title, children, wide, extraWide }) {
  const close = useStore((s) => s.closePanel);
  const gold = useStore((s) => s.playerState.gold);

  return (
    <div className="mq-modal-safe fixed inset-0 z-50 flex items-center justify-center bg-[#17304b]/72 p-3 backdrop-blur-md">
      <section className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-[32px] border-[4px] border-white bg-gradient-to-b from-[#fff8dc] to-[#dff4ff] text-slate-800 shadow-[0_16px_0_rgba(43,69,84,.24),0_28px_70px_rgba(6,26,43,.38)] ${extraWide ? 'max-w-7xl' : wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <header className="flex min-h-16 items-center justify-between gap-3 border-b-2 border-white/90 bg-gradient-to-r from-[#ffd979] to-[#ffb07a] px-5 py-3">
          <h2 className="text-lg font-black tracking-wide text-[#583d29]">{title}</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-white bg-white/70 px-3 py-1 text-sm font-black text-amber-800">{gold} G</span>
            <button onClick={close} aria-label="關閉面板" className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-white/80 text-slate-700 shadow active:translate-y-0.5"><GameIcon name="close" size={22} /></button>
          </div>
        </header>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </section>
    </div>
  );
}
