// v0.28 村民手冊：集中顯示 10 名居民關係、記憶與事件完成度。
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { VILLAGE_RESIDENT_IDS, VILLAGE_RESIDENT_PROFILES } from '../../data/villageResidentProfiles.js';
import { getRelationTier, normalizeNpcRelation } from '../../services/VillageRelationshipService.js';

export default function VillageRelationsPanel() {
  const relations = useStore((state) => state.npcRelations);
  return <Panel title="星光村居民手冊" wide><div className="grid gap-3 sm:grid-cols-2">{VILLAGE_RESIDENT_IDS.map((id) => {
    const profile = VILLAGE_RESIDENT_PROFILES[id];
    const relation = normalizeNpcRelation(relations[id]);
    const tier = getRelationTier(relation.affinity);
    return <article key={id} className="rounded-2xl border-2 border-white bg-white/75 p-3 shadow"><div className="flex items-center gap-3"><span className="text-4xl">{profile.emoji}</span><div><h3 className="font-black text-slate-800">{profile.name}</h3><p className="text-xs font-bold text-slate-500">{profile.role} · {tier.label}</p></div></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-amber-400" style={{ width: `${relation.affinity}%` }}/></div><div className="mt-2 flex justify-between text-[11px] font-black text-slate-600"><span>好感 {Math.round(relation.affinity)}/100</span><span>送禮 {relation.giftsGiven} 次</span><span>事件 {relation.completedEventIds.length}/3</span></div></article>;
  })}</div></Panel>;
}
