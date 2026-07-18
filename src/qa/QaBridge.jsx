import { useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { useFarmStore } from '../store/farmStore.js';
import { getRuntimeAcceptanceSnapshot } from '../input/runtimeAcceptance.js';

// 僅在網址帶有 ?qa=1 時掛載，供自動化 Runtime QA 使用。
// 正常玩家流程不建立 window 全域介面，也不改變任何遊戲狀態。
export default function QaBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qa') !== '1') return undefined;

    const bridge = {
      setScene(sceneId) {
        const allowed = ['village', 'farm', 'wilderness', 'region', 'trialTower'];
        if (!allowed.includes(sceneId)) throw new Error(`Unsupported scene: ${sceneId}`);
        useStore.getState().setScene(sceneId);
      },
      enterRegion(regionId) {
        const current = useStore.getState();
        if (!current.worldProgress.unlockedRegionIds.includes(regionId)) {
          useStore.setState({
            worldProgress: {
              ...current.worldProgress,
              unlockedRegionIds: [...current.worldProgress.unlockedRegionIds, regionId],
            },
          });
        }
        const store = useStore.getState();
        store.enterRegion(regionId);
        store.setScene('region');
      },
      setWeather(weatherType) {
        useStore.getState().setWeatherType(weatherType, 'manual');
      },
      useAutomaticWeather() {
        useStore.getState().setWeatherMode('auto');
      },
      setWorldTime(totalMinutes) {
        const state = useStore.getState();
        const total = Math.max(0, Number(totalMinutes) || 0);
        state.publishWorldClock({ ...state.worldClock, totalMinutes: total, minutes: total % 1440 });
      },
      setFarmLevel(level) {
        const target = Math.max(1, Math.min(5, Number(level) || 1));
        const farm = useFarmStore.getState();
        if (target < farm.farmLevel) farm.resetFarm();
        for (let next = useFarmStore.getState().farmLevel + 1; next <= target; next += 1) useFarmStore.getState().expandFarm(next);
      },
      plantCenter(seedId = 'seed_01') {
        const farm = useFarmStore.getState();
        const clock = useStore.getState().worldClock;
        farm.plantSeed(24, seedId, clock.totalMinutes);
        farm.waterCell(24, clock.totalMinutes);
      },
      simulateFarm() {
        const main = useStore.getState();
        return useFarmStore.getState().advanceFarmSimulation(main.worldClock, main.weatherType);
      },
      openHomeInterior(tab = 'life') {
        useFarmStore.getState().setHomeInteriorTab(tab);
        useStore.getState().openPanel('homeInterior');
      },
      ensureCharacterReady() {
        const state = useStore.getState();
        if (!state.characterProfile?.created) {
          state.completeCharacterCreation({ ...state.characterProfile, created: true, name: 'QA 冒險者' });
        }
      },
      damagePlayer(amount = 999) {
        useStore.getState().modifyHp(-Math.abs(Number(amount) || 0));
      },
      respawn() {
        useStore.getState().requestRespawn();
      },
      snapshot() {
        const state = useStore.getState();
        return {
          currentScene: state.currentScene,
          currentRegionId: state.worldProgress?.currentRegionId || null,
          worldClock: state.worldClock,
          weatherType: state.weatherType,
          weatherMode: state.weatherMode,
          isPaused: state.isPaused,
          activePanel: state.activePanel,
          characterProfile: state.characterProfile,
          defeatState: state.defeatState,
          respawnToken: state.respawnToken,
          runtimeAcceptance: getRuntimeAcceptanceSnapshot(),
          farm: (() => {
            const farm = useFarmStore.getState();
            return {
              farmLevel: farm.farmLevel,
              unlockedPlots: farm.farmGrid.filter((cell) => cell.isUnlocked).length,
              centerCell: farm.farmGrid.find((cell) => cell.id === 24) || null,
              farmStats: farm.farmStats,
              homeStorage: farm.homeStorage,
            };
          })(),
        };
      },
    };

    window.__MQ_QA__ = bridge;
    window.dispatchEvent(new CustomEvent('mathquest:qa-ready'));
    return () => {
      delete window.__MQ_QA__;
    };
  }, []);

  return null;
}
