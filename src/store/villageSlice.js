// v0.28 村莊生活 Slice：關係、送禮、事件、委託與市場經濟集中管理。
import { DB } from '../data/index.js';
import { VILLAGE_RESIDENT_IDS, getVillageResidentProfile } from '../data/villageResidentProfiles.js';
import { applyNpcTalk, completeNpcRelationEvent, evaluateNpcGift, getRelationTier, normalizeNpcRelation } from '../services/VillageRelationshipService.js';
import { INITIAL_VILLAGE_ECONOMY, canCompleteCommission, ensureWeeklyCommissions, normalizeVillageEconomy, recordVillageShipment } from '../services/VillageEconomyService.js';
import { getActiveCompanionRuntime } from '../services/CompanionRuntimeService.js';
import { removeFarmProductByInstance } from '../services/FarmInventoryService.js';
import { canCompleteVillageFestival, getVillageFestival } from '../services/VillageFestivalService.js';

export function createVillageSlice(set, get) {
  return {
    npcRelations: {},
    villageEconomy: { ...INITIAL_VILLAGE_ECONOMY },
    npcEmote: null,

    ensureVillageWeek: () => {
      const state = get();
      const next = ensureWeeklyCommissions(state.villageEconomy, state.worldClock?.dayIndex || 1);
      if (next !== state.villageEconomy) set({ villageEconomy: next });
      return next;
    },

    talkToNpc: (npcId, options = {}) => {
      const state = get();
      const profile = getVillageResidentProfile(npcId);
      if (!profile) return { ok: false, reason: 'missing-npc' };
      const companion = getActiveCompanionRuntime(state);
      const result = applyNpcTalk({
        npcId,
        relation: state.npcRelations[npcId],
        worldClock: state.worldClock,
        companionModifiers: companion.modifiers,
      });
      if (!result.ok) return result;
      const chapter = options.chapterTitle || null;
      const lines = [...result.dialogue];
      if (chapter) lines.splice(1, 0, `目前主線進度：${chapter}`);
      const tier = getRelationTier(result.relation.affinity);
      set({
        npcRelations: { ...state.npcRelations, [npcId]: result.relation },
        activeDialogue: {
          npcId,
          name: profile.name,
          role: profile.role,
          emoji: profile.emoji,
          lines,
          affinity: result.relation.affinity,
          tierLabel: tier.label,
          topic: result.relation.lastTopic,
          event: result.event,
          servicePanel: options.servicePanel ?? resolveServicePanel(npcId),
          serviceAction: options.serviceAction || null,
        },
        npcEmote: { npcId, animation: 'Talk', until: Date.now() + 3200 },
        isPaused: true,
      });
      get().recordCompanionActivity?.('talk', { npcId, affinity: result.relation.affinity });
      if (result.relation.affinity >= 50) get().recordCompanionActivity?.('relationship', { npcId, affinity: result.relation.affinity });
      return result;
    },

    giveGiftToNpc: (npcId, gift) => {
      const state = get();
      const itemId = gift?.itemId;
      const result = evaluateNpcGift({ npcId, relation: state.npcRelations[npcId], itemId, worldClock: state.worldClock });
      if (!result.ok) return result;
      const removal = removeGiftFromInventory(state.inventory, gift);
      if (!removal.ok) return removal;
      const profile = getVillageResidentProfile(npcId);
      const response = result.preference === 'loved'
        ? `${profile.name}非常喜歡這份禮物！`
        : result.preference === 'liked'
          ? `${profile.name}開心地收下禮物。`
          : result.preference === 'disliked'
            ? `${profile.name}禮貌地收下，但看起來不太適合。`
            : `${profile.name}謝謝你的心意。`;
      const tier = getRelationTier(result.relation.affinity);
      set({
        inventory: removal.inventory,
        npcRelations: { ...state.npcRelations, [npcId]: result.relation },
        activeDialogue: state.activeDialogue?.npcId === npcId ? {
          ...state.activeDialogue,
          affinity: result.relation.affinity,
          tierLabel: tier.label,
          lines: [response, `好感變化：${result.affinityGain >= 0 ? '+' : ''}${result.affinityGain}`, ...(result.event ? [`新事件「${result.event.title}」已解鎖。`] : [])],
          event: result.event || state.activeDialogue.event,
        } : state.activeDialogue,
        npcEmote: { npcId, animation: 'Gift', until: Date.now() + 2200 },
      });
      get().recordCompanionActivity?.('gift', { npcId, itemId });
      if (result.relation.affinity >= 50) get().recordCompanionActivity?.('relationship', { npcId, affinity: result.relation.affinity });
      return result;
    },

    completeNpcRelationEvent: (npcId, eventId) => {
      const state = get();
      const result = completeNpcRelationEvent(state.npcRelations[npcId], eventId);
      if (!result.ok) return result;
      set({
        npcRelations: { ...state.npcRelations, [npcId]: result.relation },
        activeDialogue: state.activeDialogue?.npcId === npcId ? { ...state.activeDialogue, event: null, lines: [`關係事件已完成，這段共同回憶已保存。`] } : state.activeDialogue,
        npcEmote: { npcId, animation: 'Celebrate', until: Date.now() + 2600 },
      });
      return result;
    },

    recordVillageShipment: (products, totalGold) => {
      const state = get();
      const next = recordVillageShipment(state.villageEconomy, products, totalGold, state.worldClock?.dayIndex || 1);
      set({ villageEconomy: ensureWeeklyCommissions(next, state.worldClock?.dayIndex || 1) });
      return next;
    },

    acceptVillageCommission: (runId) => {
      const state = get();
      const economy = ensureWeeklyCommissions(state.villageEconomy, state.worldClock?.dayIndex || 1);
      const commission = economy.commissions.find((entry) => entry.runId === runId);
      if (!commission) return { ok: false, reason: 'missing-commission' };
      if (economy.completedCommissionIds.includes(runId)) return { ok: false, reason: 'completed' };
      if (economy.acceptedCommissionIds.includes(runId)) return { ok: false, reason: 'accepted' };
      set({ villageEconomy: { ...economy, acceptedCommissionIds: [...economy.acceptedCommissionIds, runId] } });
      return { ok: true, commission };
    },


    completeVillageFestival: () => {
      const state = get();
      const festival = getVillageFestival(state.worldClock?.dayIndex || 1);
      const economy = normalizeVillageEconomy(state.villageEconomy);
      if (!festival.active) return { ok: false, reason: 'not-active', festival };
      if (economy.attendedFestivalIds.includes(festival.runId)) return { ok: false, reason: 'completed', festival };
      if (!canCompleteVillageFestival(festival, state.inventory)) return { ok: false, reason: 'missing-items', festival };
      const removal = removeCommissionItems(state.inventory, festival.itemId, festival.quantity);
      if (!removal.ok) return removal;
      const npcRelations = Object.fromEntries(VILLAGE_RESIDENT_IDS.map((id) => {
        const current = normalizeNpcRelation(state.npcRelations?.[id]);
        return [id, { ...current, affinity: Math.min(100, current.affinity + 2), memoryFlags: { ...current.memoryFlags, [`festival_${festival.runId}`]: true } }];
      }));
      set({
        inventory: removal.inventory,
        playerState: { ...state.playerState, gold: state.playerState.gold + festival.rewardGold },
        npcRelations,
        villageEconomy: { ...economy, attendedFestivalIds: [...economy.attendedFestivalIds, festival.runId] },
        npcEmote: { npcId: null, animation: 'Celebrate', until: Date.now() + 3600 },
      });
      get().recordCompanionActivity?.('festival', { festivalId: festival.id, seasonId: festival.seasonId });
      return { ok: true, festival, rewardGold: festival.rewardGold };
    },

    turnInVillageCommission: (runId) => {
      const state = get();
      const economy = ensureWeeklyCommissions(state.villageEconomy, state.worldClock?.dayIndex || 1);
      const commission = economy.commissions.find((entry) => entry.runId === runId);
      if (!commission) return { ok: false, reason: 'missing-commission' };
      if (!economy.acceptedCommissionIds.includes(runId)) return { ok: false, reason: 'not-accepted' };
      if (!canCompleteCommission(commission, state.inventory)) return { ok: false, reason: 'missing-items' };
      const removal = removeCommissionItems(state.inventory, commission.itemId, commission.quantity);
      if (!removal.ok) return removal;
      const relation = normalizeNpcRelation(state.npcRelations[commission.requesterId]);
      const nextRelation = { ...relation, affinity: Math.min(100, relation.affinity + 5), memoryFlags: { ...relation.memoryFlags, [`commission_${runId}`]: true } };
      set({
        inventory: removal.inventory,
        playerState: { ...state.playerState, gold: state.playerState.gold + commission.rewardGold },
        npcRelations: { ...state.npcRelations, [commission.requesterId]: nextRelation },
        villageEconomy: {
          ...economy,
          completedCommissionIds: [...economy.completedCommissionIds, runId],
        },
      });
      return { ok: true, commission, rewardGold: commission.rewardGold };
    },
  };
}

function resolveServicePanel(npcId) {
  if (npcId === 'chief') return 'learningReport';
  if (npcId === 'merchant') return 'shop';
  if (npcId === 'blacksmith') return 'blacksmith';
  if (npcId === 'carpenter') return 'carpenter';
  return null;
}

function removeGiftFromInventory(inventory, gift) {
  if (!gift?.itemId) return { ok: false, reason: 'missing-item' };
  if (gift.category === 'farmProducts') {
    const result = removeFarmProductByInstance(inventory.farmProducts || [], gift.instanceId, 1);
    return result.removed ? { ok: true, inventory: { ...inventory, farmProducts: result.next } } : { ok: false, reason: 'not-owned' };
  }
  const category = gift.category;
  if (!['items', 'materials', 'seeds'].includes(category)) return { ok: false, reason: 'wrong-category' };
  const values = [...(inventory[category] || [])];
  const index = values.indexOf(gift.itemId);
  if (index < 0) return { ok: false, reason: 'not-owned' };
  values.splice(index, 1);
  return { ok: true, inventory: { ...inventory, [category]: values } };
}

function removeCommissionItems(inventory, itemId, quantity) {
  let remaining = quantity;
  let farmProducts = [...(inventory.farmProducts || [])];
  for (const product of [...farmProducts]) {
    if (remaining <= 0 || product.itemId !== itemId) continue;
    const result = removeFarmProductByInstance(farmProducts, product.instanceId, remaining);
    if (result.removed) {
      remaining -= result.removed.quantity || 1;
      farmProducts = result.next;
    }
  }
  const next = { ...inventory, farmProducts };
  for (const category of ['materials', 'seeds', 'items']) {
    if (remaining <= 0) break;
    const values = [...(next[category] || [])];
    for (let index = values.length - 1; index >= 0 && remaining > 0; index -= 1) {
      if (values[index] !== itemId) continue;
      values.splice(index, 1);
      remaining -= 1;
    }
    next[category] = values;
  }
  return remaining <= 0 ? { ok: true, inventory: next } : { ok: false, reason: 'missing-items' };
}
