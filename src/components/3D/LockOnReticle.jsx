// v0.5.0 鎖定準星：跟隨目前鎖定的敵人顯示旋轉環
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { lockState } from '../../input/combat.js';
import { useStore } from '../../store/useStore.js';

export default function LockOnReticle() {
  const ref = useRef();
  const isPaused = useStore((s) => s.isPaused);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // 暫停或無鎖定 → 隱藏
    ref.current.visible = lockState.active && !isPaused;
    if (lockState.active) {
      ref.current.position.set(lockState.x, 0.6, lockState.z);
      ref.current.rotation.z += delta * 2; // 旋轉動畫
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.7, 0.85, 24]} />
      <meshBasicMaterial color="#ffd24a" transparent opacity={0.9} />
    </mesh>
  );
}
