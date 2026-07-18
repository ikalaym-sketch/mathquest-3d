// 八大區域多步驟事件控制器。
// 事件不再以單次點擊直接完成，而是由 Beacon、核心機制、結構 Socket、素材與戰鬥 Signal 逐步推進。
import { useEffect, useMemo } from 'react';
import { Html, Sparkles } from '@react-three/drei';
import Outlined from '../3D/Outlined.jsx';
import { useStore } from '../../store/useStore.js';
import { getRegionGameplayProfile } from '../../data/regionGameplayProfiles.js';
import { getRegionEventView } from '../../services/RegionGameplayService.js';

export default function RegionalEvent({ region }) {
  const profile = getRegionGameplayProfile(region.id);
  const ensureEvent = useStore((state) => state.ensureRegionEvent);
  const recordSignal = useStore((state) => state.recordRegionEventSignal);
  const setActive = useStore((state) => state.setActiveRegionEvent);
  const run = useStore((state) => state.worldProgress.regionEventRuns?.[region.id] || null);

  useEffect(() => {
    ensureEvent(region.id);
  }, [ensureEvent, region.id]);

  const view = useMemo(() => getRegionEventView(profile, run), [profile, run]);

  useEffect(() => {
    if (!view || view.completed || !view.currentStep) {
      setActive(null);
      return;
    }
    setActive({
      regionId: region.id,
      eventId: view.eventDefinition.id,
      name: view.eventDefinition.name,
      description: view.eventDefinition.description,
      stepLabel: view.currentStep.label,
      stepNumber: view.stepNumber,
      totalSteps: view.totalSteps,
      progress: view.progress,
      target: view.target,
    });
    return () => setActive(null);
  }, [region.id, setActive, view]);

  if (!view || view.completed || !view.currentStep) return null;
  const currentStep = view.currentStep;
  if (currentStep.type !== 'beacon' || !currentStep.position) return null;

  const activateBeacon = () => recordSignal({ regionId: region.id, type: 'beacon', targetId: currentStep.targetId, amount: 1 });

  return (
    <group position={currentStep.position} name={`region-event-beacon-${view.eventDefinition.id}`} onClick={(event) => { event.stopPropagation(); activateBeacon(); }}>
      <Outlined color="#ffd84c" position={[0, 1.2, 0]} rotation={[0, 0.5, 0]} outlineScale={1.02}>
        <octahedronGeometry args={[0.9, 0]} />
      </Outlined>
      <Sparkles count={30} scale={4.5} size={5} speed={0.6} color="#fff18c" position={[0, 1.5, 0]} />
      <pointLight position={[0, 1.5, 0]} intensity={1.8} distance={8} color="#ffd84c" />
      <Html zIndexRange={[24, 0]} position={[0, 3.0, 0]} center distanceFactor={13}>
        <button onClick={(event) => { event.stopPropagation(); activateBeacon(); }} className="whitespace-nowrap rounded-2xl border-2 border-yellow-100 bg-amber-500/94 px-3 py-1.5 text-xs font-black text-white shadow-xl active:scale-95">
          ✨ {view.eventDefinition.name} · 開始
        </button>
      </Html>
    </group>
  );
}
