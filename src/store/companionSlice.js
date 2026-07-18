// v0.28 守護夥伴 Slice：名冊、同行、互動、取得與活動成長。
import { getCompanionProfile } from '../data/companionProfiles.js';
import { INITIAL_COMPANION_STATE, applyCompanionActivity, chooseStarterCompanion, getActiveCompanionRuntime, interactWithCompanion, normalizeCompanionState, unlockCompanion } from '../services/CompanionRuntimeService.js';

export function createCompanionSlice(set, get) {
  return {
    companionState: { ...INITIAL_COMPANION_STATE },
    companionEmote: null,

    ensureCompanionState: () => {
      const state = get();
      const next = normalizeCompanionState(state.companionState, null, state.petData);
      set({ companionState: next });
      return next;
    },

    chooseStarterCompanion: (id) => {
      const state = get();
      const result = chooseStarterCompanion(state.companionState, id);
      if (!result.ok) return result;
      set({ companionState: result.state, companionEmote: { animation: 'Greet', until: Date.now() + 2600 }, isPaused: false });
      return result;
    },

    setActiveCompanion: (id) => {
      const state = get();
      const current = normalizeCompanionState(state.companionState, null, state.petData);
      if (!current.ownedIds.includes(id) || !getCompanionProfile(id)) return { ok: false, reason: 'not-owned' };
      set({ companionState: { ...current, activeId: id }, companionEmote: { animation: 'Greet', until: Date.now() + 2200 } });
      return { ok: true };
    },

    unlockCompanion: (id, reason) => {
      const result = unlockCompanion(get().companionState, id, reason);
      if (!result.ok) return result;
      set({ companionState: result.state, companionEmote: { animation: 'Happy', until: Date.now() + 2800 }, quickItemMessage: `${getCompanionProfile(id)?.name || '新夥伴'}加入守護夥伴名冊！` });
      return result;
    },

    recordCompanionActivity: (type, payload = {}) => {
      const result = applyCompanionActivity(get().companionState, type, payload);
      set({ companionState: result.state });
      if (result.unlocks.length) set({ quickItemMessage: `${getCompanionProfile(result.unlocks[0])?.name || '新夥伴'}加入守護夥伴名冊！` });
      return result;
    },

    interactWithCompanion: (action) => {
      const state = get();
      const result = interactWithCompanion(state.companionState, action, state.worldClock?.dayIndex || 1);
      if (!result.ok) return result;
      const emotes = { pet: 'Happy', play: 'Happy', feed: 'Greet', rest: 'Sleep' };
      set({ companionState: result.state, companionEmote: { animation: emotes[action] || 'Happy', until: Date.now() + (action === 'rest' ? 3400 : 2500) } });
      return result;
    },

    triggerCompanionSkill: () => {
      if (!get().companionState?.activeId) return { ok: false, reason: 'missing-active-companion' };
      set({ companionEmote: { animation: 'Skill', until: Date.now() + 1250 } });
      return { ok: true };
    },

    getCompanionRuntime: () => getActiveCompanionRuntime(get()),
  };
}
