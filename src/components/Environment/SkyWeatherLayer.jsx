import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// 程序化雲層與月亮；低畫質降低雲塊數，不移除日夜辨識。
export default function SkyWeatherLayer({ cloudAmount = 0.2, weatherId = 'sunny', isNight = false, moonPosition = [-18, 20, -12], quality = 'high' }) {
  const cloudCount = { low: 4, medium: 6, high: 9, ultra: 12 }[quality] || 8;
  const opacity = Math.min(0.82, 0.18 + cloudAmount * 0.72);
  return (
    <>
      <CloudBand count={cloudCount} opacity={opacity} speed={weatherId === 'breeze' ? 1.35 : 0.55} />
      <group position={moonPosition} visible={isNight}>
        <mesh>
          <sphereGeometry args={[1.55, 20, 16]} />
          <meshStandardMaterial color="#fff4c7" emissive="#d9e2ff" emissiveIntensity={0.75} roughness={0.9} />
        </mesh>
        <pointLight intensity={0.35} distance={50} color="#c9d7ff" />
      </group>
    </>
  );
}

function CloudBand({ count, opacity, speed }) {
  const groupRef = useRef(null);
  const clouds = useMemo(() => Array.from({ length: count }, (_, index) => ({
    id: index,
    x: -44 + (index * 91 % 88),
    y: 17 + (index % 4) * 2.3,
    z: -32 + (index * 47 % 64),
    scale: 1.2 + (index % 5) * 0.24,
  })), [count]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.x += delta * speed;
    if (group.position.x > 18) group.position.x = -18;
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud) => (
        <group key={cloud.id} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}>
          {[
            [-1.4, 0, 0, 1.2],
            [0, 0.25, 0, 1.55],
            [1.45, 0, 0.1, 1.05],
            [0.3, -0.35, 0.2, 1.4],
          ].map(([x, y, z, scale], index) => (
            <mesh key={index} position={[x, y, z]} scale={[scale * 1.45, scale * 0.68, scale]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={opacity} depthWrite={false} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
