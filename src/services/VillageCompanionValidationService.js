// v0.28 階段 C/D 強制驗證器。
// 驗證村民關係、星期／天氣日程、動態經濟、季節活動、夥伴取得與八種實際能力契約。
import { DB } from '../data/index.js';
import { VILLAGE_RESIDENT_IDS, VILLAGE_RESIDENT_PROFILES } from '../data/villageResidentProfiles.js';
import { COMPANION_IDS, COMPANION_PROFILES, STARTER_COMPANION_IDS } from '../data/companionProfiles.js';
import { applyNpcTalk, completeNpcRelationEvent, evaluateNpcGift, normalizeNpcRelation } from './VillageRelationshipService.js';
import { ensureWeeklyCommissions, getVillageShopStock, recordVillageShipment } from './VillageEconomyService.js';
import { canCompleteVillageFestival, getVillageFestival } from './VillageFestivalService.js';
import { applyCompanionActivity, chooseStarterCompanion, getActiveCompanionRuntime, interactWithCompanion, normalizeCompanionState } from './CompanionRuntimeService.js';
import { resolveLifeNpcRoute, resolveRoleNpcSchedule } from '../systems/npcSchedule.js';

export function validateVillageCompanionContent() {
  const errors = []; const warnings = []; const cases = [];
  const run = (id, callback) => {
    try { callback(); cases.push({ id, status: 'PASSED' }); }
    catch (error) { errors.push(`${id}: ${error.message || error}`); cases.push({ id, status: 'FAILED', error: String(error) }); }
  };

  run('ten_named_residents_have_30_dialogue_lines_and_three_events', () => {
    assert(VILLAGE_RESIDENT_IDS.length === 10, `居民應為 10，實際 ${VILLAGE_RESIDENT_IDS.length}`);
    const names = new Set();
    for (const id of VILLAGE_RESIDENT_IDS) {
      const profile = VILLAGE_RESIDENT_PROFILES[id];
      assert(profile?.name && !names.has(profile.name), `${id} 姓名缺漏或重複`); names.add(profile.name);
      assert(profile.events?.length === 3, `${id} 關係事件不是 3`);
      profile.events.forEach((event) => assert(event.steps?.length >= 3, `${event.id} 缺少多步驟事件`));
      const dialogueCount = Object.values(profile.dialogue.weatherLines).flat().length
        + Object.values(profile.dialogue.segmentLines).flat().length
        + Object.values(profile.dialogue.seasonLines).flat().length
        + profile.dialogue.relationLines.length
        + Object.values(profile.weeklyNotes).length;
      assert(dialogueCount >= 30, `${id} 條件式對話僅 ${dialogueCount}`);
    }
  });

  run('resident_gift_preferences_reference_real_items', () => {
    for (const profile of Object.values(VILLAGE_RESIDENT_PROFILES)) {
      for (const itemId of Object.values(profile.giftPreferences).flat()) assert(DB[itemId], `${profile.id} 禮物 ${itemId} 不存在`);
    }
  });

  run('daily_talk_gift_and_relation_event_are_defensive', () => {
    const first = applyNpcTalk({ npcId: 'resident_02', relation: {}, worldClock: { dayIndex: 2, segment: 'morning', weather: 'sunny' }, companionModifiers: { firstTalkAffinityBonus: 1 } });
    assert(first.ok && first.affinityGain === 3, '首次交談與小貓加成錯誤');
    const repeated = applyNpcTalk({ npcId: 'resident_02', relation: first.relation, worldClock: { dayIndex: 2, segment: 'afternoon', weather: 'sunny' } });
    assert(repeated.affinityGain === 0, '同日重複交談仍增加好感');
    const relationBeforeSecondEvent = { ...first.relation, affinity: 45, lastGiftDay: 0, unlockedEventIds: ['resident_02_event_1'], completedEventIds: ['resident_02_event_1'] };
    const gifted = evaluateNpcGift({ npcId: 'resident_02', relation: relationBeforeSecondEvent, itemId: 'seed_09', worldClock: { dayIndex: 2 } });
    assert(gifted.ok && gifted.preference === 'loved' && gifted.event?.id === 'resident_02_event_2', '喜愛禮物或事件解鎖錯誤');
    assert(!evaluateNpcGift({ npcId: 'resident_02', relation: gifted.relation, itemId: 'seed_09', worldClock: { dayIndex: 2 } }).ok, '同日可重複送禮');
    const completed = completeNpcRelationEvent(gifted.relation, gifted.event.id);
    assert(completed.ok, '已解鎖事件無法完成');
    assert(!completeNpcRelationEvent(completed.relation, gifted.event.id).ok, '已完成事件可重複領取');
  });

  run('weekly_weather_schedules_cover_work_rest_and_shelter', () => {
    const role = { id: 'merchant', role: '商人', position: [14,0,0] };
    assert(resolveRoleNpcSchedule(role, { dayIndex: 1, minutes: 600, segment: 'morning', weather: 'sunny' }).serviceOpen, '工作日商店未開門');
    assert(!resolveRoleNpcSchedule(role, { dayIndex: 4, minutes: 600, segment: 'morning', weather: 'sunny' }).serviceOpen, '休息日商店錯誤開門');
    assert(resolveRoleNpcSchedule(role, { dayIndex: 1, minutes: 600, segment: 'morning', weather: 'lightRain' }).state === 'sheltering', '雨天未避雨');
    const def = { id: 'resident_01', route: [[8,0,9],[10,0,8]], speed: 1.5 };
    assert(resolveLifeNpcRoute(def, { dayIndex: 1, segment: 'night', weather: 'sunny' }, 'village').state === 'resting', '生活 NPC 夜間未回家');
  });

  run('shipment_changes_market_tier_stock_and_weekly_commissions', () => {
    let economy = ensureWeeklyCommissions({}, 1);
    assert(economy.commissions.length === 4, '每週委託不是 4 項');
    const tier1 = getVillageShopStock({ economy, dayIndex: 1, unlockedBlueprints: [] });
    economy = recordVillageShipment(economy, [{ itemId: 'seed_01', quantity: 50 }], 7000, 2);
    const tier4 = getVillageShopStock({ economy, dayIndex: 2, unlockedBlueprints: [] });
    assert(economy.marketTier === 4 && tier4.length > tier1.length, '大量出貨未提升市場與貨架');
    assert(ensureWeeklyCommissions(economy, 8).activeWeek === 2, '第二週委託未輪替');
  });

  run('four_season_festivals_have_active_window_and_requirements', () => {
    for (const day of [20, 48, 76, 104]) {
      const festival = getVillageFestival(day);
      assert(festival.active && festival.quantity > 0 && DB[festival.itemId], `第 ${day} 天活動契約錯誤`);
      assert(!canCompleteVillageFestival(festival, {}), `${festival.id} 無物品仍可完成`);
      const inventory = { seeds: Array(festival.quantity).fill(festival.itemId), materials: [], items: [], farmProducts: [] };
      assert(canCompleteVillageFestival(festival, inventory), `${festival.id} 物品足夠仍無法完成`);
    }
  });

  run('eight_companions_have_three_starters_unique_acquisition_and_four_skills', () => {
    assert(COMPANION_IDS.length === 8, `夥伴應為 8，實際 ${COMPANION_IDS.length}`);
    assert(STARTER_COMPANION_IDS.length === 3, `初始夥伴應為 3，實際 ${STARTER_COMPANION_IDS.length}`);
    const models = new Set();
    for (const profile of Object.values(COMPANION_PROFILES)) {
      assert(profile.modelAssetId && !models.has(profile.modelAssetId), `${profile.id} 模型資產 ID 缺漏或重複`); models.add(profile.modelAssetId);
      assert(Object.keys(profile.skills || {}).length === 4, `${profile.id} 不具生活／探索／學習／戰鬥四能力`);
      assert(profile.acquisition?.type, `${profile.id} 無取得方式`);
    }
  });

  run('starter_selection_legacy_migration_and_daily_interaction_are_safe', () => {
    const chosen = chooseStarterCompanion({}, 'companion_rabbit');
    assert(chosen.ok && chosen.state.activeId === 'companion_rabbit', '初始兔子選擇失敗');
    assert(!chooseStarterCompanion(chosen.state, 'companion_fox').ok, '初始夥伴可重複選擇');
    const legacy = normalizeCompanionState({}, 'pet_07', { pet_07: { level: 3, exp: 20 } });
    assert(legacy.activeId === 'companion_tanuki' && legacy.records.companion_tanuki.level === 3, '舊寵物遷移錯誤');
    const pet = interactWithCompanion(chosen.state, 'pet', 3);
    assert(pet.ok && !interactWithCompanion(pet.state, 'pet', 3).ok, '夥伴同日互動防重複失效');
  });

  run('all_five_nonstarter_acquisition_routes_unlock_only_on_matching_event', () => {
    let state = chooseStarterCompanion({}, 'companion_tanuki').state;
    state = applyCompanionActivity(state, 'relationship', { npcId: 'resident_02', affinity: 50 }).state;
    assert(state.ownedIds.includes('companion_cat'), '小貓關係取得失敗');
    state = applyCompanionActivity(state, 'boss', { bossId: 'crystal_boss' }).state;
    assert(state.ownedIds.includes('companion_otter'), '水獺 Boss 取得失敗');
    for (let index = 0; index < 5; index += 1) state = applyCompanionActivity(state, 'animalProduct', {}).state;
    assert(state.ownedIds.includes('companion_chick'), '小雞農場取得失敗');
    for (let index = 1; index <= 3; index += 1) state = applyCompanionActivity(state, 'explore', { regionId: 'forest_ruins', eventCount: index }).state;
    assert(state.ownedIds.includes('companion_squirrel'), '松鼠森林取得失敗');
    state = applyCompanionActivity(state, 'boss', { bossId: 'clockwork_boss' }).state;
    assert(state.ownedIds.includes('companion_red_panda'), '小熊貓 Boss 取得失敗');
  });

  run('active_companion_runtime_scales_numeric_modifiers', () => {
    const state = { companionState: { ...chooseStarterCompanion({}, 'companion_fox').state, records: { companion_fox: { level: 5, exp: 0, affinity: 40 } } } };
    const runtime = getActiveCompanionRuntime(state);
    assert(runtime.profile.id === 'companion_fox' && runtime.modifiers.moveSpeedBonus > COMPANION_PROFILES.companion_fox.modifiers.moveSpeedBonus, '夥伴等級未提升能力');
  });

  return { ok: errors.length === 0, residentCount: VILLAGE_RESIDENT_IDS.length, companionCount: COMPANION_IDS.length, caseCount: cases.length, cases, errors, warnings };
}

function assert(condition, message) { if (!condition) throw new Error(message); }
