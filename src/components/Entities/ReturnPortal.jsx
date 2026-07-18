// v0.5.0 回村傳送點：點擊回到村莊；註冊 POI
import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import Outlined from '../3D/Outlined.jsx';
import { registerPOI } from '../../input/pois.js';
import { goToScene } from '../UI/TransitionManager.jsx';
import { useStore } from '../../store/useStore.js';

export function ReturnPortal({ position = [0, 0, 6] }) {
  const stopTrial = useStore((s) => s.stopTrial);
  const api = useRef({
    id: 'portal_village',
    type: 'portal',
    label: '返回星光村',
    getPos: () => ({ x: position[0], z: position[2] }),
  });
  useEffect(() => registerPOI(api.current), []);

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <group onClick={(e) => { e.stopPropagation(); stopTrial(); goToScene('village'); }}>
        {/* 傳送門環 */}
        <Outlined color="#5adfff" position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.8, 0.15, 12, 24]} />
        </Outlined>
        <pointLight position={[0, 1, 0]} intensity={1.5} distance={4} color="#5adfff" />
        <Html zIndexRange={[20, 0]} position={[0, 2.1, 0]} center>
          <div className="text-hyrule-sky text-xs whitespace-nowrap select-none">返回星光村</div>
        </Html>
      </group>
    </RigidBody>
  );
}
