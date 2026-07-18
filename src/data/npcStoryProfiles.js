// NPC 對話、關係與記憶設定。對話會依章節、好感與最近互動主題切換。
const profile = (id, name, role, greetings, topics, servicePanel = null) => ({ id, name, role, greetings, topics, servicePanel });

export const NPC_STORY_PROFILES = {
  chief: profile('chief', '村長莉亞', '村莊引導者', ['歡迎回來，星光村一直記得你的努力。', '今天也先看清楚目標，再踏上旅程吧。'], ['主線章節', '學習成長', '區域安全'], 'learningReport'),
  merchant: profile('merchant', '商人米洛', '旅行商人', ['你帶回來的區域素材，能說出一路上的故事。', '先比較需要與價格，再決定要買什麼。'], ['區域素材', '裝備補給', '價格比較'], 'shop'),
  blacksmith: profile('blacksmith', '鐵匠布魯諾', '裝備工匠', ['真正可靠的裝備，需要測量、比較與反覆調整。', '守護者的攻擊有規律，先觀察再出手。'], ['裝備強化', 'Boss 弱點', '材料需求'], 'blacksmith'),
  carpenter: profile('carpenter', '木匠艾瑪', '建築工匠', ['一間舒服的小屋，是由尺寸與順序慢慢搭起來的。', '先畫好配置，再開始建造會更省材料。'], ['建造配置', '空間測量', '農場設施'], 'carpenter'),
};

export function getNpcStoryProfile(npcId, fallbackName = '冒險夥伴') {
  if (NPC_STORY_PROFILES[npcId]) return NPC_STORY_PROFILES[npcId];
  if (String(npcId).startsWith('guide_')) {
    return profile(npcId, fallbackName, '區域引導員', ['這個區域的機關和道路都有自己的規律。', '完成探索後，我會把新的線索記進你的冒險手冊。'], ['區域故事', '場景機關', '探索進度']);
  }
  return profile(npcId, fallbackName, '村民', ['很高興再次見到你。', '今天的村莊也有新的小故事。'], ['日常生活']);
}

export function chooseNpcLine(npcProfile, relation = {}, context = {}) {
  const talkCount = Number(relation.talkCount) || 0;
  const chapterLabel = context.chapterTitle ? `目前故事進度是「${context.chapterTitle}」。` : '';
  const affinityLine = (relation.affinity || 0) >= 5 ? '我已經很信任你，遇到困難可以再來找我。' : '';
  const base = npcProfile.greetings[talkCount % npcProfile.greetings.length];
  return [base, chapterLabel, affinityLine].filter(Boolean);
}
