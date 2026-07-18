// v0.27.0 道具效果解析服務。
// Store 只負責提交狀態；效果規則集中在本檔案，讓驗證器可以逐項證明十種道具都有 Handler。
import { ITEM_EFFECT_IDS } from '../data/runtimeEffects.js';

export function resolveItemUse(item, state) {
  const effectId = item?.effectId || ITEM_EFFECT_IDS[item?.id];
  if (!item || !effectId) return { ok: false, reason: 'unsupported' };
  const nowMinute = Number(state.worldClock?.totalMinutes) || 0;

  switch (effectId) {
    case 'item.heal.hp':
      if (state.playerState.hp >= state.playerState.maxHp) return { ok: false, reason: 'fullHp' };
      return { ok: true, consume: true, playerPatch: { hp: clamp(state.playerState.hp + state.playerState.maxHp * (item.stats.healPercent / 100), 0, state.playerState.maxHp) }, message: `使用 ${item.nameZh || item.name}：恢復生命` };
    case 'item.heal.mp':
      if (state.playerState.mp >= state.playerState.maxMp) return { ok: false, reason: 'fullMp' };
      return { ok: true, consume: true, playerPatch: { mp: clamp(state.playerState.mp + state.playerState.maxMp * (item.stats.healPercent / 100), 0, state.playerState.maxMp) }, nextSpellDiscount: 0.5, message: `使用 ${item.nameZh || item.name}：恢復魔力，下一次魔法消耗減半` };
    case 'item.buff.speed':
      return { ok: true, consume: true, activeEffect: { key: 'speed', amount: item.stats.amount, expiresAtWorldMinute: nowMinute + item.stats.duration }, message: `移動速度提升 ${item.stats.duration} 個遊戲分鐘` };
    case 'item.buff.attack':
      return { ok: true, consume: true, activeEffect: { key: 'attack', amount: item.stats.amount, criticalChance: 0.2, expiresAtWorldMinute: nowMinute + item.stats.duration }, message: `攻擊力提升 ${item.stats.duration} 個遊戲分鐘` };
    case 'item.buff.guardian':
      return { ok: true, consume: true, activeEffect: { key: 'guardian', expiresAtWorldMinute: nowMinute + item.stats.duration, reflectDamage: 0.5 }, message: `守護結界啟動 ${item.stats.duration} 個遊戲分鐘` };
    case 'item.teleport.village':
      return { ok: true, consume: true, transitionScene: 'village', restoreStamina: true, message: '正在返回星光村' };
    case 'item.fishing.rare_guarantee':
      return { ok: true, consume: true, fishingBuff: { guarantee: item.stats.guarantee || 'rare', legendaryChance: 0.08, uses: 1 }, message: '下一次釣魚至少獲得稀有魚' };
    case 'item.farm.instant_grow':
      return { ok: true, consume: true, farmCommand: { type: 'instantGrowFirstCrop', radius: 0 }, message: '成長粉已讓一株作物立即成熟' };
    case 'item.math_heal.basic':
    case 'item.math_heal.advanced':
      return { ok: true, consume: true, mathChallenge: { baseGrade: item.stats?.difficulty === 'hard' ? 5 : 2, healPercent: item.stats.healPercent, wrongHealPercent: effectId.endsWith('advanced') ? 40 : 0, restoreMpPercent: effectId.endsWith('basic') ? 15 : 0 }, message: '完成數學挑戰即可獲得恢復效果' };
    default:
      return { ok: false, reason: 'unsupported' };
  }
}

export function pruneExpiredEffects(activeEffects = {}, worldMinute = 0) {
  return Object.fromEntries(Object.entries(activeEffects).filter(([, effect]) => !Number.isFinite(effect.expiresAtWorldMinute) || effect.expiresAtWorldMinute > worldMinute));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
