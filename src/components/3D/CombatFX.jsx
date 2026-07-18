// v0.32 戰鬥特效渲染：傷害跳字、相機震動、攻擊載體GLB與命中特效GLB。
import { useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { fxState, pruneDamages } from '../../input/fx.js';
import Model from './Model.jsx';
import {
  combatVisualState,
  getCombatVisualPose,
  updateCombatVisualState,
} from '../../services/CombatExecutionService.js';

export default function CombatFX() {
  const [, force] = useState(0);
  const { camera } = useThree();
  const baseOffset = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const now = performance.now();
    pruneDamages(now);
    const previousRevision = combatVisualState.revision;
    updateCombatVisualState(now);
    // 觸發重繪（節流：有跳字才頻繁刷）
    if (fxState.damages.length > 0
      || combatVisualState.deliveries.length > 0
      || combatVisualState.impacts.length > 0
      || combatVisualState.revision !== previousRevision) force((n) => (n + 1) % 100000);

    // 相機震動：以隨機微幅位移疊加，並衰減
    if (fxState.shake > 0.001) {
      const s = fxState.shake * 0.25;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      fxState.shake *= Math.pow(0.02, delta); // 快速衰減
    } else {
      fxState.shake = 0;
    }
  });

  return (
    <>
      {combatVisualState.deliveries.map((event) => <CombatAssetVisual key={event.id} event={event} kind="combat-delivery" />)}
      {combatVisualState.impacts.map((event) => <CombatAssetVisual key={event.id} event={event} kind="combat-impact" />)}
      {fxState.damages.map((d) => {
        const age = (performance.now() - d.born) / 1000; // 0~1
        return (
          <Html zIndexRange={[20, 0]} key={d.id} position={[d.x, d.y + age * 1.2, d.z]} center style={{ pointerEvents: 'none' }}>
            <div
              className={`font-display font-bold select-none ${d.crit ? 'text-hyrule-gold text-2xl' : 'text-white text-lg'}`}
              style={{ opacity: 1 - age, textShadow: '0 1px 3px #000' }}
            >
              {d.crit ? `${d.amount}!` : d.amount}
            </div>
          </Html>
        );
      })}
    </>
  );
}

function CombatAssetVisual({ event, kind }) {
  if (!event.assetId && !event.effectAssetId) return null;
  const pose = getCombatVisualPose(event, performance.now());
  return (
    <group position={pose.position} rotation={pose.rotation} scale={pose.scale}>
      {event.assetId && <Model assetId={event.assetId} instanceId={event.id} kind={kind} materialQuality="medium" />}
      {event.effectAssetId && <Model assetId={event.effectAssetId} instanceId={`${event.id}-v035`} kind="combat-vfx" scale={1.12} materialQuality="medium" />}
    </group>
  );
}
