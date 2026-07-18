// v0.27.0 農具快捷列：僅在農場顯示，提供智慧工具與七種正式農具。
import { useFarmStore } from '../../store/farmStore.js';
import { useStore } from '../../store/useStore.js';
import { FARM_TOOLS } from '../../services/FarmToolService.js';

const TOOL_ORDER = ['smart', 'hoe', 'seedBag', 'wateringCan', 'sickle', 'feed', 'hand', 'brush'];

export default function FarmToolHUD() {
  const scene = useStore((state) => state.currentScene);
  const stamina = useStore((state) => state.playerState.stamina);
  const maxStamina = useStore((state) => state.playerState.maxStamina);
  const selected = useFarmStore((state) => state.selectedTool);
  const select = useFarmStore((state) => state.setSelectedTool);
  if (scene !== 'farm') return null;
  return (
    <section className="fixed bottom-[max(5.8rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[min(94vw,720px)] -translate-x-1/2 rounded-2xl border-2 border-white/80 bg-[#fff5d8]/94 p-2 shadow-xl backdrop-blur">
      <div className="mb-1 flex items-center justify-between px-1 text-xs font-black text-[#5c4a39]"><span>農具</span><span>體力 {Math.round(stamina)}/{maxStamina}</span></div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TOOL_ORDER.map((toolId) => {
          const tool = FARM_TOOLS[toolId];
          return <button key={toolId} onClick={() => select(toolId)} className={`min-w-16 rounded-xl border-2 px-2 py-2 text-center text-xs font-black ${selected === toolId ? 'border-[#e58b45] bg-[#ffd37d] text-[#5a381d]' : 'border-white bg-white/75 text-[#66584c]'}`}><span className="block text-xl">{tool.icon}</span>{tool.label}</button>;
        })}
      </div>
    </section>
  );
}
