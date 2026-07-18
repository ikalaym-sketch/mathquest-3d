// v0.2.0 App 主組件：Physics(Time Freeze) + Player + 場景路由 + 疊層 UI
import { lazy, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { useStore } from './store/useStore.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import { useGamepad } from './hooks/useGamepad.js';

import LoadingScreen from './components/UI/LoadingScreen.jsx';
import TransitionManager from './components/UI/TransitionManager.jsx';
import SceneTransitionRequestController from './components/UI/SceneTransitionRequestController.jsx';
import HUD from './components/UI/HUD.jsx';
import Joystick from './components/UI/Joystick.jsx';
import GameMenu from './components/UI/GameMenu.jsx';
import PanelHost from './components/UI/PanelHost.jsx';
import QuestTracker from './components/UI/QuestTracker.jsx';
import Minimap from './components/UI/Minimap.jsx';
import DailyReward from './components/UI/DailyReward.jsx';
import { BiomeEventBanner } from './components/Scenes/BiomeEvent.jsx';
import AudioController from './components/UI/AudioController.jsx';
import AudioToggle from './components/UI/AudioToggle.jsx';
import MathModal from './components/Minigames/MathModal.jsx';
import BalloonShooter from './components/Minigames/BalloonShooter.jsx';
import BossSealModal from './components/Minigames/BossSealModal.jsx';
import LearningReport from './components/UI/LearningReport.jsx';
import CameraInput from './components/UI/CameraInput.jsx';
import WorldHint from './components/UI/WorldHint.jsx';
import WorldMapPanel from './components/UI/WorldMapPanel.jsx';
import RegionHUD from './components/UI/RegionHUD.jsx';
import TrialTowerHUD from './components/UI/TrialTowerHUD.jsx';
import FairyGuide from './components/UI/FairyGuide.jsx';
import QuickItemBar from './components/UI/QuickItemBar.jsx';
import WorldClockWidget from './components/UI/WorldClockWidget.jsx';
import CharacterCreationPanel from './components/UI/CharacterCreationPanel.jsx';
import DefeatPanel from './components/UI/DefeatPanel.jsx';
import DailyRiftHUD from './components/UI/DailyRiftHUD.jsx';
import HUDLayoutManager from './components/UI/HUDLayoutManager.jsx';
import VoiceGuidanceController from './components/UI/VoiceGuidanceController.jsx';
import NPCDialoguePanel from './components/Story/NPCDialoguePanel.jsx';
import WaterStatusWidget from './components/UI/WaterStatusWidget.jsx';
import FarmToolHUD from './components/UI/FarmToolHUD.jsx';
import FarmCommandController from './components/UI/FarmCommandController.jsx';
import UnderwaterOverlay from './components/UI/UnderwaterOverlay.jsx';
import StarterCompanionPanel from './components/UI/StarterCompanionPanel.jsx';

import Player from './components/3D/Player.jsx';
import ReadyProbe from './components/3D/ReadyProbe.jsx';
import PhysicsReadyProbe from './components/3D/PhysicsReadyProbe.jsx';
import { setStep } from './input/loadProgress.js';
import LockOnReticle from './components/3D/LockOnReticle.jsx';
import CombatFX from './components/3D/CombatFX.jsx';
import FairyCompanion from './components/3D/FairyCompanion.jsx';
import VillageScene from './components/Scenes/VillageScene.jsx';
import SceneChunkFallback from './components/3D/SceneChunkFallback.jsx';
import SceneLoadOverlay from './components/UI/SceneLoadOverlay.jsx';
import { getRenderQualityProfile } from './utils/renderQuality.js';
import WorldEnvironment from './components/Environment/WorldEnvironment.jsx';
import QaBridge from './qa/QaBridge.jsx';
import RuntimeAcceptanceProbe from './components/3D/RuntimeAcceptanceProbe.jsx';

// 大型場景使用程式區塊分段載入；村莊保留常駐，讓返回主 Hub 不需等待。
const FarmScene = lazy(() => import('./components/Farm/FarmScene.jsx'));
const WildernessScene = lazy(() => import('./components/Scenes/WildernessScene.jsx'));
const RegionScene = lazy(() => import('./components/Scenes/RegionScene.jsx'));
const TrialTowerScene = lazy(() => import('./components/Scenes/TrialTowerScene.jsx'));

// 場景路由：依 currentScene 渲染對應場景（Player 為共用，於外層掛載）
function SceneRouter() {
  const scene = useStore((s) => s.currentScene);
  switch (scene) {
    case 'farm':
      return <Suspense fallback={<SceneChunkFallback />}><FarmScene /></Suspense>;
    case 'wilderness':
      return <Suspense fallback={<SceneChunkFallback />}><WildernessScene /></Suspense>;
    case 'region':
      return <Suspense fallback={<SceneChunkFallback />}><RegionScene /></Suspense>;
    case 'trialTower':
      return <Suspense fallback={<SceneChunkFallback />}><TrialTowerScene /></Suspense>;
    case 'village':
    default:
      return <VillageScene />;
  }
}

export default function App() {
  // 掛載鍵盤輸入
  useKeyboard();
  useGamepad();
  // 初始化今日每日任務
  const ensureDailyQuests = useStore((s) => s.ensureDailyQuests);
  const ensureStarterEquipment = useStore((s) => s.ensureStarterEquipment);
  const ensureStoryProgress = useStore((s) => s.ensureStoryProgress);
  const ensureVillageWeek = useStore((s) => s.ensureVillageWeek);
  const ensureCompanionState = useStore((s) => s.ensureCompanionState);
  useEffect(() => {
    ensureDailyQuests();
    ensureStarterEquipment();
    ensureStoryProgress();
    ensureVillageWeek();
    ensureCompanionState();
  }, [ensureDailyQuests, ensureStarterEquipment, ensureStoryProgress, ensureVillageWeek, ensureCompanionState]);
  // Time Freeze：數學題/UI 開啟時暫停物理世界
  const isPaused = useStore((s) => s.isPaused);
  const qualityId = useStore((s) => s.renderQuality || 'high');
  const currentScene = useStore((s) => s.currentScene);
  const quality = getRenderQualityProfile(qualityId);

  return (
    <div className="relative h-full w-full">
      <HUDLayoutManager />
      <VoiceGuidanceController />
      <SceneTransitionRequestController />
      <FarmCommandController />
      <Canvas
        shadows={quality.shadows}
        camera={{ position: [0, 5, 10], fov: 50 }}
        dpr={quality.dpr}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          setStep('gl', 1);
        }}
      >
        <Suspense fallback={null}>
          {/* 首幀探針：回報實際算圖完成 */}
          <ReadyProbe />
          <RuntimeAcceptanceProbe />
          {/* 全域唯一環境：跨場景維持時間/天氣，不因 SceneRouter 重掛而重設。 */}
          {currentScene !== 'trialTower' && <WorldEnvironment sceneId={currentScene} />}
          {/* paused 直接凍結整個 Rapier 世界（world.step 停止） */}
          <Physics paused={isPaused} gravity={[0, -9.81, 0]}>
            <PhysicsReadyProbe />
            <SceneRouter />
            <Player />
            <FairyCompanion />
            <LockOnReticle />
          </Physics>
          {/* 傷害跳字/震動 */}
          <CombatFX />
        </Suspense>
      </Canvas>

      {/* ── DOM 疊層 UI（獨立於 3D 渲染樹）── */}
      <CharacterCreationPanel /> {/* z-110 初次角色建立 */}
      <StarterCompanionPanel />  {/* z-108 守護夥伴初始三選一 */}
      <DefeatPanel />         {/* z-105 兒童友善失敗與復活 */}
      <LoadingScreen />      {/* z-100 初始載入 */}
      <SceneLoadOverlay />   {/* z-92 場景分段載入 */}
      <MathModal />          {/* z-50 數學挑戰 */}
      <BalloonShooter />     {/* z-50 氣球小遊戲 */}
      <BossSealModal />      {/* z-50 Boss 封印連環問答 */}
      <LearningReport />     {/* z-50 雷達圖報表 */}
      <PanelHost />          {/* z-50 背包/裝備/商店/鐵匠/木匠/建造/加工 */}
      <NPCDialoguePanel />   {/* z-65 NPC 對話與記憶 */}
      <WorldMapPanel />      {/* z-50 九宮格世界地圖 */}
      <TransitionManager />  {/* z-40 轉場黑屏 */}
      <DailyReward />        {/* z-40 每日獎勵 */}
      <HUD />                {/* z-30 角色狀態 */}
      <WorldClockWidget />   {/* z-30 時間與天氣 */}
      <Minimap />            {/* z-30 小地圖 */}
      <RegionHUD />         {/* z-30 大區與事件資訊 */}
      <TrialTowerHUD />     {/* z-30 試煉之塔樓層資訊 */}
      <DailyRiftHUD />       {/* z-30 每日秘境資訊 */}
      <UnderwaterOverlay />    {/* z-20 水下色調與氣泡 */}
      <WaterStatusWidget />   {/* z-30 涉水／游泳／冰面／危險液體 */}
      <BiomeEventBanner />   {/* z-30 生態系事件橫幅 */}
      <AudioController />    {/* 無畫面：音樂主題控制 */}
      <AudioToggle />        {/* z-30 音樂/音效開關 */}
      <CameraInput />        {/* z-30 鏡頭控制提示與輸入 */}
      <WorldHint />          {/* z-40 世界提示 */}
      <FairyGuide />         {/* z-30 小精靈能力與探索感應 */}
      <QuickItemBar />       {/* z-30 五格快捷道具 */}
      <FarmToolHUD />        {/* z-30 農具與體力 */}
      <GameMenu />           {/* z-30 背包/裝備/建造入口 */}
      <QuestTracker />       {/* z-30 任務追蹤器 */}
      <Joystick />           {/* z-30 搖桿+攻擊 */}
      <QaBridge />            {/* 僅 ?qa=1 啟用的 Runtime 驗證橋接 */}
    </div>
  );
}
