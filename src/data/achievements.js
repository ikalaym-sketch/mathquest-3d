// v0.6.0 成就 + 每日任務資料
// 成就：達成 check(stats) 時解鎖，給 reward 金幣
export const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Defeat your first monster.', reward: 30, check: (s) => s.kills >= 1 },
  { id: 'hunter', name: 'Monster Hunter', desc: 'Defeat 25 monsters.', reward: 100, check: (s) => s.kills >= 25 },
  { id: 'slayer', name: 'Monster Slayer', desc: 'Defeat 100 monsters.', reward: 300, check: (s) => s.kills >= 100 },
  { id: 'boss1', name: 'Boss Breaker', desc: 'Seal your first boss.', reward: 150, check: (s) => s.bossKills >= 1 },
  { id: 'boss_all', name: 'Legend', desc: 'Seal 5 bosses.', reward: 500, check: (s) => s.bossKills >= 5 },
  { id: 'farmer', name: 'Green Thumb', desc: 'Harvest 20 crops.', reward: 80, check: (s) => s.harvests >= 20 },
  { id: 'scholar', name: 'Scholar', desc: 'Answer 50 questions correctly.', reward: 120, check: (s) => s.correctAnswers >= 50 },
  { id: 'genius', name: 'Math Genius', desc: 'Answer 200 questions correctly.', reward: 400, check: (s) => s.correctAnswers >= 200 },
];

// 每日任務池（每天隨機抽 3）
export const DAILY_POOL = [
  { id: 'd_kill5', label: 'Defeat 5 monsters', type: 'kills', target: 5, reward: 60 },
  { id: 'd_kill10', label: 'Defeat 10 monsters', type: 'kills', target: 10, reward: 120 },
  { id: 'd_harvest3', label: 'Harvest 3 crops', type: 'harvests', target: 3, reward: 60 },
  { id: 'd_answer10', label: 'Answer 10 questions', type: 'correctAnswers', target: 10, reward: 80 },
  { id: 'd_boss1', label: 'Seal 1 boss', type: 'bossKills', target: 1, reward: 150 },
  { id: 'd_stone8', label: 'Collect 8 stones', type: 'collect', materialId: 'mat_stone', target: 8, reward: 90 },
];

// 依日期種子挑 3 個每日任務（同一天穩定）
export function pickDailyQuests(dateStr) {
  const seed = dateStr.split('-').reduce((a, b) => a + parseInt(b, 10), 0);
  const pool = [...DAILY_POOL];
  const out = [];
  let s = seed;
  for (let i = 0; i < 3 && pool.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * pool.length);
    out.push({ ...pool[idx], progress: 0, done: false });
    pool.splice(idx, 1);
  }
  return out;
}
