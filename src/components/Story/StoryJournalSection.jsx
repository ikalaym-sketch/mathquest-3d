import { useStore } from '../../store/useStore.js';
import { STORY_CHAPTERS, STORY_QUEST_BY_ID } from '../../data/storyContent.js';

export default function StoryJournalSection() {
  const progress = useStore((state) => state.storyProgress);
  return (
    <div className="space-y-3">
      {STORY_CHAPTERS.map((chapter) => {
        const chapterDone = progress.completedChapterIds.includes(chapter.id);
        const accepted = chapter.questIds.some((id) => progress.acceptedQuestIds.includes(id));
        return (
          <section key={chapter.id} className={`rounded-3xl border-2 p-4 ${chapterDone ? 'border-emerald-300 bg-emerald-50' : accepted ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white/60'}`}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{chapter.title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{chapter.summary}</p></div><span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600">{chapterDone ? '完成' : accepted ? '進行中' : '未開始'}</span></div>
            {chapterDone && chapter.unlocksRegionId && <div className="mt-3 rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-black leading-5 text-emerald-900">✓ {chapter.unlockReason}</div>}
            {accepted && <div className="mt-3 space-y-2">{chapter.questIds.map((questId) => { const quest = STORY_QUEST_BY_ID[questId]; const done = progress.completedQuestIds.includes(questId); const current = progress.questProgress[questId] || 0; return <div key={questId} className="rounded-2xl border border-white bg-white/75 p-3"><div className="flex justify-between gap-3 text-sm font-black text-slate-800"><span>{done ? '✓' : '○'} {quest.title}</span><span>{Math.min(current, quest.objective.target)}/{quest.objective.target}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{quest.description}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${Math.min(100, current / quest.objective.target * 100)}%` }} /></div></div>; })}</div>}
          </section>
        );
      })}
    </div>
  );
}
