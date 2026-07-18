// v0.27.0 農具與體力規則。
// 所有農務操作必須先解析工具與體力成本，禁止由場景元件自行寫死。
export const FARM_TOOLS = Object.freeze({
  smart: { id: 'smart', label: '智慧工具', icon: '✨', staminaCost: 0 },
  hoe: { id: 'hoe', label: '鋤頭', icon: '⛏️', staminaCost: 2 },
  seedBag: { id: 'seedBag', label: '種子袋', icon: '🌱', staminaCost: 1 },
  wateringCan: { id: 'wateringCan', label: '澆水壺', icon: '💧', staminaCost: 1 },
  sickle: { id: 'sickle', label: '收成鐮刀', icon: '🌾', staminaCost: 1 },
  brush: { id: 'brush', label: '動物刷', icon: '🪮', staminaCost: 2 },
  feed: { id: 'feed', label: '飼料袋', icon: '🥣', staminaCost: 1 },
  hand: { id: 'hand', label: '撫摸', icon: '🤲', staminaCost: 1 },
});

export const FARM_ACTION_TOOL = Object.freeze({
  prepare: 'hoe',
  plant: 'seedBag',
  water: 'wateringCan',
  harvest: 'sickle',
  clear: 'hoe',
  animalFeed: 'feed',
  animalPet: 'hand',
  animalBrush: 'brush',
});

export function resolveFarmToolAction({ selectedTool = 'smart', action, toolLevels = {} }) {
  const requiredTool = FARM_ACTION_TOOL[action];
  if (!requiredTool) return { ok: false, reason: 'unknown-action' };
  const resolvedTool = selectedTool === 'smart' ? requiredTool : selectedTool;
  if (resolvedTool !== requiredTool) return { ok: false, reason: 'wrong-tool', requiredTool, resolvedTool };
  const level = Math.max(1, Number(toolLevels[resolvedTool]) || 1);
  const baseCost = FARM_TOOLS[resolvedTool]?.staminaCost || 0;
  const staminaCost = Math.max(0, Math.ceil(baseCost * Math.max(0.55, 1 - (level - 1) * 0.1)));
  return { ok: true, toolId: resolvedTool, level, staminaCost };
}
