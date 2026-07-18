// v0.8.0 音訊控制器（無畫面）：首互動解鎖音訊，依遊戲狀態選擇音樂主題
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { unlockAudio, isUnlocked } from '../../audio/AudioEngine.js';
import { setMusicTheme, start } from '../../audio/music.js';
import { BIOME_THEME } from '../../audio/themes.js';
import { REGION_MUSIC_THEME, startRegionAmbience } from '../../audio/regionAmbience.js';

export default function AudioController() {
  const scene = useStore((s) => s.currentScene);
  const biomeId = useStore((s) => s.currentBiomeId);
  const balloon = useStore((s) => s.balloonGame);
  const seal = useStore((s) => s.sealChallenge);
  const math = useStore((s) => s.mathChallenge);
  const trial = useStore((s) => s.trialActive);
  const regionId = useStore((s) => s.worldProgress.currentRegionId);
  const activeRegionInterior = useStore((s) => s.activeRegionInterior);
  const weatherType = useStore((s) => s.weatherType);

  // 首次使用者互動 → 解鎖音訊並開始播放
  useEffect(() => {
    const onFirst = () => {
      unlockAudio();
      start();
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
      window.removeEventListener('touchstart', onFirst);
    };
    window.addEventListener('pointerdown', onFirst);
    window.addEventListener('keydown', onFirst);
    window.addEventListener('touchstart', onFirst);
    return () => {
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
      window.removeEventListener('touchstart', onFirst);
    };
  }, []);

  // 依狀態決定音樂主題（覆蓋優先序：氣球 > Boss封印 > 試煉 > 數學 > 場景/生態系）
  useEffect(() => {
    let key;
    if (balloon) key = 'balloon';
    else if (seal) key = 'boss';
    else if (trial || scene === 'trialTower') key = 'boss';
    else if (math) key = 'math';
    else if (scene === 'village') key = 'village';
    else if (scene === 'farm') key = 'farm';
    else if (scene === 'wilderness') key = BIOME_THEME[biomeId] || 'heroic';
    else if (scene === 'region') key = REGION_MUSIC_THEME[regionId] || 'heroic';
    else key = 'village';
    setMusicTheme(key);
    if (isUnlocked()) start();
  }, [scene, biomeId, balloon, seal, math, trial, regionId]);

  // 區域環境音景與主音樂分離；進入室內時降低密度，切區時完整取消舊排程。
  useEffect(() => {
    if (scene !== 'region') return undefined;
    return startRegionAmbience({ regionId, indoor: Boolean(activeRegionInterior), weather: weatherType });
  }, [scene, regionId, activeRegionInterior?.id, weatherType]);

  return null;
}
