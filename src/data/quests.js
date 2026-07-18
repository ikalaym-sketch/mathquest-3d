// v0.5.0 任務資料表（收集類，可資料化擴充）
export const QUEST_TEMPLATES = [
  { id: 'q_stone_5', type: 'collect', label: 'Collect 5 Stones', target: 5, materialId: 'mat_stone', rewardGold: 80 },
  { id: 'q_stone_10', type: 'collect', label: 'Collect 10 Stones', target: 10, materialId: 'mat_stone', rewardGold: 180 },
  { id: 'q_wood_5', type: 'collect', label: 'Collect 5 Wood', target: 5, materialId: 'mat_wood', rewardGold: 80 },
  { id: 'q_milk_3', type: 'collect', label: 'Collect 3 Milk', target: 3, materialId: 'mat_milk', rewardGold: 120 },
  { id: 'q_egg_3', type: 'collect', label: 'Collect 3 Eggs', target: 3, materialId: 'mat_egg', rewardGold: 120 },
];

// 學者任務（連答 N 題）
export const SCHOLAR_QUEST = { id: 'q_scholar', type: 'scholar', label: 'Answer 2 questions', count: 2, rewardItem: 'item_03' };

export function randomCollectQuest() {
  return QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
}
