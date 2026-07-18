// v0.5.0 場景道具庫（薩爾達 toon 風，降低空曠感）
import Outlined from '../3D/Outlined.jsx';

// 小屋：屋身 + 三角屋頂
export function House({ position = [0, 0, 0], rotation = [0, 0, 0], color = '#c9a06a', roof = '#8a3a2a' }) {
  return (
    <group position={position} rotation={rotation}>
      <Outlined color={color} position={[0, 1, 0]}>
        <boxGeometry args={[2.4, 2, 2.4]} />
      </Outlined>
      <Outlined color={roof} position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2, 1.2, 4]} />
      </Outlined>
      {/* 門 */}
      <mesh position={[0, 0.6, 1.21]}>
        <planeGeometry args={[0.7, 1.2]} />
        <meshToonMaterial color="#5a3a1a" />
      </mesh>
    </group>
  );
}

// 水井
export function Well({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Outlined color="#8a8a80" position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.8, 12]} />
      </Outlined>
      <Outlined color="#6a4a2a" position={[0, 1.4, 0]}>
        <coneGeometry args={[0.8, 0.6, 4]} />
      </Outlined>
    </group>
  );
}

// 路燈（帶光源）
export function Lamp({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Outlined color="#4a4a4a" position={[0, 1, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2, 6]} />
      </Outlined>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#ffe6a0" />
      </mesh>
      <pointLight position={[0, 2.1, 0]} intensity={0.8} distance={5} color="#ffdf9a" />
    </group>
  );
}

// 柵欄段
export function Fence({ position = [0, 0, 0], rotation = [0, 0, 0], length = 3 }) {
  const posts = Math.max(2, Math.round(length));
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: posts }).map((_, i) => (
        <Outlined key={i} color="#8a6a3a" position={[i * (length / (posts - 1)) - length / 2, 0.35, 0]}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
        </Outlined>
      ))}
      <Outlined color="#a07a4a" position={[0, 0.5, 0]}>
        <boxGeometry args={[length, 0.08, 0.08]} />
      </Outlined>
    </group>
  );
}

// 穀倉
export function Barn({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Outlined color="#b03a2a" position={[0, 1.2, 0]}>
        <boxGeometry args={[3.5, 2.4, 3]} />
      </Outlined>
      <Outlined color="#8a2a1a" position={[0, 2.8, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 1.9, 1.4, 4, 1, false, Math.PI / 4, Math.PI / 2]} />
      </Outlined>
    </group>
  );
}

// 稻草人
export function Scarecrow({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Outlined color="#8a6a3a" position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.8, 6]} />
      </Outlined>
      <Outlined color="#a07a4a" position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
      </Outlined>
      <Outlined color="#e8c86a" position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
      </Outlined>
    </group>
  );
}

// 池塘
export function Pond({ position = [0, 0, 0] }) {
  return (
    <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2, 24]} />
      <meshToonMaterial color="#3a8ae8" transparent opacity={0.85} />
    </mesh>
  );
}

// 灌木叢
export function Bush({ position = [0, 0, 0], color = '#4f9a3a' }) {
  return (
    <Outlined color={color} position={[position[0], 0.3, position[2]]}>
      <sphereGeometry args={[0.45, 8, 8]} />
    </Outlined>
  );
}
