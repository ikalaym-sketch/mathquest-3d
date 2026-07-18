// v0.28 NPC 對話：關係階段、記憶、送禮、關係事件與服務入口共用單一面板。
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { DB } from '../../data/index.js';
import { getVillageResidentProfile } from '../../data/villageResidentProfiles.js';

export default function NPCDialoguePanel() {
  const dialogue = useStore((state) => state.activeDialogue);
  const inventory = useStore((state) => state.inventory);
  const close = useStore((state) => state.closeNpcDialogue);
  const openPanel = useStore((state) => state.openPanel);
  const openReport = useStore((state) => state.openReport);
  const giveGift = useStore((state) => state.giveGiftToNpc);
  const completeEvent = useStore((state) => state.completeNpcRelationEvent);
  const [mode, setMode] = useState('talk');
  const [message, setMessage] = useState('');
  const [eventStep, setEventStep] = useState(0);
  useEffect(() => { setMode('talk'); setMessage(''); setEventStep(0); }, [dialogue?.npcId, dialogue?.event?.id]);
  const gifts = useMemo(() => buildGiftCandidates(inventory), [inventory]);
  if (!dialogue) return null;
  const profile = getVillageResidentProfile(dialogue.npcId);

  const openService = () => {
    const panel = dialogue.servicePanel;
    close();
    if (panel === 'learningReport') openReport();
    else if (panel) openPanel(panel);
    else if (dialogue.serviceAction) dialogue.serviceAction();
  };
  const sendGift = (gift) => {
    const result = giveGift(dialogue.npcId, gift);
    const labels = { 'gifted-today': '今天已經送過禮物了。', 'not-owned': '背包中已沒有這份物品。' };
    setMessage(result.ok ? '禮物已送出，這段記憶會被保存。' : labels[result.reason] || '目前無法送出這份禮物。');
    if (result.ok) setMode('talk');
  };
  const eventSteps = dialogue.event?.steps || [dialogue.event?.summary].filter(Boolean);
  const finishEvent = () => {
    const result = completeEvent(dialogue.npcId, dialogue.event.id);
    setMessage(result.ok ? `完成關係事件「${dialogue.event.title}」，好感增加。` : '這個事件尚未解鎖或已完成。');
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border-[4px] border-white bg-gradient-to-b from-[#fff8dd] to-[#e5f6ff] p-5 text-slate-800 shadow-[0_14px_0_rgba(37,68,88,.25),0_24px_60px_rgba(5,23,38,.35)]">
        <header className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-sky-300 text-3xl shadow-md">{dialogue.emoji || profile?.emoji || '🙂'}</div>
          <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black">{dialogue.name}</h2><p className="text-xs font-bold text-slate-600">{dialogue.role} · {dialogue.tierLabel || '初次認識'} · 好感 {Math.round(dialogue.affinity)}/100</p></div>
        </header>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/75"><div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-amber-400" style={{ width: `${dialogue.affinity}%` }}/></div>

        <div className="mt-4 flex gap-2"><button onClick={() => setMode('talk')} className={`rounded-xl px-4 py-2 text-xs font-black ${mode === 'talk' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600'}`}>交談</button><button onClick={() => setMode('gift')} className={`rounded-xl px-4 py-2 text-xs font-black ${mode === 'gift' ? 'bg-pink-500 text-white' : 'bg-white text-slate-600'}`}>送禮</button></div>

        {mode === 'talk' ? <>
          <div className="mt-3 space-y-2">{dialogue.lines.map((line, index) => <p key={`${index}:${line}`} className="rounded-2xl border-2 border-white bg-white/75 p-3 text-sm font-bold leading-6">{line}</p>)}</div>
          <div className="mt-3 rounded-2xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-900">本次話題：{dialogue.topic || '村莊生活'}</div>
          {dialogue.event && <div className="mt-3 rounded-2xl border-2 border-violet-200 bg-violet-50 p-3"><p className="font-black text-violet-900">關係事件：{dialogue.event.title}</p><p className="mt-2 rounded-xl bg-white/75 p-3 text-xs font-bold leading-5 text-violet-700">{eventSteps[eventStep] || dialogue.event.summary}</p><p className="mt-1 text-right text-[10px] font-black text-violet-500">{eventStep + 1}/{eventSteps.length}</p>{eventStep < eventSteps.length - 1 ? <button onClick={() => setEventStep((value) => value + 1)} className="mt-2 h-10 w-full rounded-xl bg-violet-400 text-xs font-black text-white">繼續事件</button> : <button onClick={finishEvent} className="mt-2 h-10 w-full rounded-xl bg-violet-500 text-xs font-black text-white">完成並保存共同回憶</button>}</div>}
        </> : <div className="mt-3"><p className="mb-2 text-xs font-black text-slate-600">每天每位村民只能收一份禮物。喜好會成為長期記憶。</p><div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">{gifts.length ? gifts.map((gift) => <button key={gift.key} onClick={() => sendGift(gift)} className="rounded-2xl border-2 border-white bg-white/80 p-3 text-left shadow"><span className="block truncate text-sm font-black">{gift.label}</span><span className="text-[10px] font-bold text-slate-500">{gift.category === 'farmProducts' ? `品質 ${gift.quality}` : '背包物品'}</span></button>) : <p className="col-span-full py-8 text-center text-sm font-bold text-slate-500">目前沒有適合送出的物品。</p>}</div></div>}

        {message && <p className="mt-3 rounded-xl bg-white/80 p-2 text-center text-xs font-black text-slate-600">{message}</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{dialogue.servicePanel && <button onClick={openService} className="min-h-12 rounded-2xl border-b-4 border-sky-700 bg-sky-500 font-black text-white active:translate-y-1 active:border-b-0">開啟服務</button>}<button onClick={close} className="min-h-12 rounded-2xl border-2 border-slate-300 bg-white font-black text-slate-700">結束交談</button></div>
      </section>
    </div>
  );
}

function buildGiftCandidates(inventory) {
  const result = [];
  for (const category of ['items', 'materials', 'seeds']) {
    const seen = new Set();
    for (const itemId of inventory[category] || []) {
      if (seen.has(itemId) || !DB[itemId]) continue;
      seen.add(itemId);
      const item = DB[itemId];
      result.push({ key: `${category}:${itemId}`, category, itemId, label: item.nameZh || item.crop || item.name });
    }
  }
  for (const product of inventory.farmProducts || []) {
    const item = DB[product.itemId];
    if (!item) continue;
    result.push({ key: `farm:${product.instanceId}`, category: 'farmProducts', itemId: product.itemId, instanceId: product.instanceId, quality: product.quality, label: item.nameZh || item.crop || item.name });
  }
  return result.slice(0, 18);
}
