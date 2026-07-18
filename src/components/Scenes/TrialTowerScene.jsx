import { Html, Sky, Sparkles } from '@react-three/drei';
import { useStore } from '../../store/useStore.js';
import { getTrialFloorConfig, TRIAL_TOWER_MAX_FLOOR } from '../../data/trialTower.js';
import TrialFloorController from '../Entities/TrialFloorController.jsx';
import TeleportGate from '../World/TeleportGate.jsx';
import TrialTowerArena from '../Trial/TrialTowerArena.jsx';

export default function TrialTowerScene() {
  const floor = useStore((state) => state.trialTower.currentFloor);
  const portalReady = useStore((state) => state.trialTower.portalReady);
  const advance = useStore((state) => state.advanceTrialFloor);
  const exitTrial = useStore((state) => state.exitTrialTower);
  const setScene = useStore((state) => state.setScene);
  const showHint = useStore((state) => state.showWorldHint);
  const config = getTrialFloorConfig(floor);

  const nextFloor = () => {
    const result = advance();
    if (result.completedTower) {
      showHint('完成 100 層試煉！星光村正在慶祝你的成就。');
      exitTrial();
      setScene('village');
      return;
    }
    if (result.rewardGranted && result.config.isMilestone) showHint(`第 ${result.floor} 層里程碑完成，獲得 ${result.config.rewardGold}G 與獎勵素材。`);
    else if (result.rewardGranted) showHint(`第 ${result.floor} 層完成，前往第 ${result.nextFloor} 層。`);
    else showHint(`第 ${result.floor} 層已完成過，直接前往第 ${result.nextFloor} 層。`);
  };

  const portalLabel = floor === TRIAL_TOWER_MAX_FLOOR ? '完成試煉並返回村莊' : config.isMilestone ? `領取第 ${floor} 層獎勵` : `前往第 ${floor + 1} 層`;

  return (
    <>
      <Sky sunPosition={[10, 15, 6]} turbidity={3.8} rayleigh={1.2} />
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[12, 20, 10]} intensity={1.5} castShadow color="#fff3cb" />
      <fog attach="fog" args={[config.palette.fog, 30, 72]} />

      <TrialTowerArena config={config} />

      <Html zIndexRange={[20, 0]} position={[0, 6.4, 0]} center distanceFactor={16}>
        <div className="min-w-72 rounded-3xl border-2 border-white/90 bg-white/92 px-5 py-3 text-center text-slate-800 shadow-xl backdrop-blur-sm">
          <div className="text-xs font-black text-slate-500">第 {floor} 層 · {config.theme.name}</div>
          <div className="mt-1 text-base font-black">{config.room.icon} {config.room.name}</div>
          <div className="mt-1 text-xs font-bold text-slate-600">{config.room.description}</div>
        </div>
      </Html>

      <TrialFloorController />

      {portalReady ? (
        <TeleportGate position={[0, 0, 0]} portalType="trial" color={config.isMilestone ? '#ffd84c' : config.palette.accent} icon={floor === TRIAL_TOWER_MAX_FLOOR ? '🏆' : config.isMilestone ? '🎁' : '⬆️'} label={portalLabel} onActivate={nextFloor} />
      ) : (
        <Html zIndexRange={[20, 0]} position={[0, 3.5, 0]} center distanceFactor={14}>
          <div className="whitespace-nowrap rounded-2xl border-2 border-white/90 bg-white/90 px-4 py-2 text-sm font-black text-slate-800 shadow-xl">{config.room.icon} {config.room.description}</div>
        </Html>
      )}

      <Sparkles count={45} scale={[30, 10, 30]} size={3} speed={0.35} color={config.palette.accent} position={[0, 4, 0]} />
    </>
  );
}
