// v0.28 新遊戲守護夥伴三選一。舊存檔已由 migration 自動映射，不會重複要求選擇。
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { COMPANION_PROFILES, STARTER_COMPANION_IDS } from '../../data/companionProfiles.js';

export default function StarterCompanionPanel() {
  const characterCreated = useStore((state) => state.characterProfile.created);
  const companionState = useStore((state) => state.companionState);
  const choose = useStore((state) => state.chooseStarterCompanion);

  const visible = characterCreated && !companionState?.starterChosen;
  useEffect(() => {
    if (!visible) return undefined;
    useStore.setState({ isPaused: true });
    return () => {};
  }, [visible]);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[108] grid place-items-center overflow-y-auto bg-[#18364f]/85 p-4 backdrop-blur-md">
      <section className="w-full max-w-4xl rounded-[36px] border-4 border-white bg-gradient-to-b from-[#fff8dc] to-[#dff4ff] p-5 text-slate-800 shadow-2xl">
        <header className="text-center">
          <p className="text-sm font-black text-sky-700">守護夥伴相遇日</p>
          <h2 className="mt-1 text-2xl font-black">選擇第一位同行的動物朋友</h2>
          <p className="mt-2 text-sm font-bold text-slate-600">夥伴不是裝備。牠會陪你生活、探索、學習與冒險；其他夥伴可在世界事件中加入。</p>
        </header>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {STARTER_COMPANION_IDS.map((id) => {
            const profile = COMPANION_PROFILES[id];
            return (
              <article key={id} className="flex flex-col rounded-[28px] border-4 border-white bg-white/80 p-4 shadow-lg">
                <div className="text-center text-7xl">{profile.emoji}</div>
                <h3 className="mt-2 text-center text-xl font-black">{profile.name}・{profile.species}</h3>
                <p className="mt-2 min-h-16 text-sm font-bold leading-6 text-slate-600">{profile.personality}</p>
                <div className="mt-3 space-y-1 rounded-2xl bg-sky-50 p-3 text-xs font-black text-sky-900">
                  <p>生活：{profile.skills.life}</p><p>探索：{profile.skills.exploration}</p>
                  <p>學習：{profile.skills.learning}</p><p>戰鬥：{profile.skills.battle}</p>
                </div>
                <button onClick={() => choose(id)} className="mt-4 min-h-12 rounded-2xl border-b-4 border-sky-700 bg-sky-500 font-black text-white active:translate-y-1 active:border-b-0">選擇 {profile.name}</button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
