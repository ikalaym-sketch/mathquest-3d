// v0.28 守護夥伴跟隨層：以正式 Companion Profile / GLB 取代舊裝備欄程序化小精靈。
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { playerPos } from '../../input/playerPos.js';
import CompanionActor from './CompanionActor.jsx';

const target = new THREE.Vector3();
const direction = new THREE.Vector3();

export default function FairyCompanion() {
  const group = useRef(null);
  const previous = useRef(new THREE.Vector3());
  const animationRef = useRef('Idle');
  const [animation, setAnimation] = useState('Idle');
  const activeId = useStore((s) => s.companionState?.activeId);
  const profile = useStore((s) => activeId ? s.getCompanionRuntime?.().profile : null);
  const isPaused = useStore((s) => s.isPaused);
  const waterState = useStore((s) => s.waterRuntime?.state || 'ground');
  const companionEmote = useStore((s) => s.companionEmote);

  useFrame(({ clock }, delta) => {
    if (!group.current || !profile || isPaused) return;
    const behind = 1.35;
    const side = 0.72;
    const sideX = Math.cos(playerPos.yaw) * side;
    const sideZ = -Math.sin(playerPos.yaw) * side;
    const backX = Math.sin(playerPos.yaw) * behind;
    const backZ = Math.cos(playerPos.yaw) * behind;
    const swimming = waterState === 'swim';
    target.set(playerPos.x + sideX + backX, playerPos.y + (swimming ? 0.25 : 0.08), playerPos.z + sideZ + backZ);
    previous.current.copy(group.current.position);
    group.current.position.lerp(target, 1 - Math.pow(0.0015, delta));
    direction.subVectors(group.current.position, previous.current);
    const moving = direction.lengthSq() > 0.000012;
    if (moving) group.current.rotation.y = Math.atan2(direction.x, direction.z);
    const activeEmote = companionEmote?.until > Date.now() ? companionEmote.animation : null;
    const nextAnimation = activeEmote || (swimming ? 'Swim' : moving ? 'Walk' : 'Idle');
    if (animationRef.current !== nextAnimation) {
      animationRef.current = nextAnimation;
      // 將動畫名稱掛在 group，子元件以 key 重新取得最新狀態；不每幀寫 Zustand。
      group.current.userData.animation = nextAnimation;
      setAnimation(nextAnimation);
    }
    group.current.position.y += swimming ? Math.sin(clock.elapsedTime * 3.2) * 0.025 : 0;
  });

  if (!profile) return null;
  return (
    <group ref={group} position={[1, 1, 1]}>
      <CompanionActor key={activeId} profile={profile} animation={animation} />
      <pointLight intensity={0.35} distance={3.2} color={profile.accent} />
      <Sparkles count={6} scale={1.3} size={2} speed={0.2} color={profile.accent} />
    </group>
  );
}
