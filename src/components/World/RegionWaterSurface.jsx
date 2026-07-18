// v0.24 水域 Runtime：依 Canonical profile 建立淺水底、深水感測、冰面、急流與危險液體。
// 視覺 Mesh 與 Rapier Collider 分離，讓後續替換 GLB／Shader 時不改變通行規則。
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Sparkles } from '@react-three/drei';
import { getWaterEnvironmentProfile } from '../../data/waterEnvironmentProfiles.js';

export default function RegionWaterSurface({ water, palette }) {
  const profile = getWaterEnvironmentProfile(water);
  const surfaceRef = useRef(null);
  const flowRef = useRef(null);
  const [width, depth] = water.size;
  const surfaceY = Number.isFinite(water.surfaceY) ? water.surfaceY : 0.13;

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (surfaceRef.current && profile.mode !== 'ice') {
      surfaceRef.current.position.y = surfaceY + Math.sin(time * 1.45 + width) * 0.025;
    }
    if (flowRef.current) {
      flowRef.current.position.x = ((time * 0.22) % 1) - 0.5;
    }
  });

  const isShallow = profile.mode === 'wade';
  const isIce = profile.mode === 'ice';
  const isHazard = profile.mode === 'hazard';
  const floorY = surfaceY - (profile.shallowDepth || 0.6);

  return (
    <group position={[water.center[0], 0, water.center[1]]} rotation={[0, water.rotation || 0, 0]} name={`water-${water.id}`}>
      <RigidBody type="fixed" colliders={false} name={`${water.id}-water-physics`}>
        <CuboidCollider
          args={[width / 2, Math.max(1.2, profile.deepDepth || 1) / 2, depth / 2]}
          position={[0, surfaceY - Math.max(1.2, profile.deepDepth || 1) / 2, 0]}
          sensor
          userData={{ traversalKind: profile.mode, waterId: water.id, profileId: profile.profileId }}
        />
        {isShallow && (
          <CuboidCollider
            args={[width / 2, 0.12, depth / 2]}
            position={[0, floorY - 0.12, 0]}
            friction={profile.profileId === 'wetland' ? 1.5 : 0.92}
            userData={{ traversalKind: 'water-floor', waterId: water.id }}
          />
        )}
        {isIce && (
          <CuboidCollider
            args={[width / 2, 0.13, depth / 2]}
            position={[0, surfaceY - 0.13, 0]}
            friction={profile.traction || 0.22}
            userData={{ traversalKind: 'ice', waterId: water.id }}
          />
        )}
      </RigidBody>

      {isShallow && (
        <mesh position={[0, floorY - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width * 0.98, depth * 0.98, 4, 4]} />
          <meshToonMaterial color={profile.floorColor} />
        </mesh>
      )}

      <mesh ref={surfaceRef} position={[0, surfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth, 14, 14]} />
        <meshStandardMaterial
          color={profile.surfaceColor || palette.water}
          transparent
          opacity={isIce ? 0.78 : isHazard ? 0.9 : 0.76}
          roughness={isIce ? 0.22 : 0.48}
          metalness={isIce ? 0.08 : isHazard ? 0.15 : 0.02}
          emissive={isHazard ? '#7eff6c' : profile.profileId === 'wetland' ? '#2b7657' : '#1d6f8a'}
          emissiveIntensity={isHazard ? 0.25 : 0.05}
        />
      </mesh>

      {!isIce && (
        <mesh ref={flowRef} position={[0, surfaceY + 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.86, depth * 0.86, 1, 1]} />
          <meshBasicMaterial color={profile.foamColor} transparent opacity={isHazard ? 0.16 : 0.1} wireframe />
        </mesh>
      )}

      <ShoreFrame width={width} depth={depth} color={palette.shore} surfaceY={surfaceY} profile={profile} />
      {isIce && <IceDetail width={width} depth={depth} surfaceY={surfaceY} />}
      {profile.profileId === 'wetland' && <WetlandDetail width={width} depth={depth} surfaceY={surfaceY} />}
      {isHazard && <HazardDetail width={width} depth={depth} surfaceY={surfaceY} />}
    </group>
  );
}

function ShoreFrame({ width, depth, color, surfaceY, profile }) {
  const thickness = profile.mode === 'swim' ? 1.05 : 0.78;
  const height = profile.mode === 'swim' ? 0.36 : 0.22;
  return (
    <group name="shore-frame">
      <mesh position={[0, surfaceY - height / 2, -depth / 2 - thickness / 2]} receiveShadow><boxGeometry args={[width + thickness * 2, height, thickness]} /><meshToonMaterial color={color} /></mesh>
      <mesh position={[0, surfaceY - height / 2, depth / 2 + thickness / 2]} receiveShadow><boxGeometry args={[width + thickness * 2, height, thickness]} /><meshToonMaterial color={color} /></mesh>
      <mesh position={[-width / 2 - thickness / 2, surfaceY - height / 2, 0]} receiveShadow><boxGeometry args={[thickness, height, depth]} /><meshToonMaterial color={color} /></mesh>
      <mesh position={[width / 2 + thickness / 2, surfaceY - height / 2, 0]} receiveShadow><boxGeometry args={[thickness, height, depth]} /><meshToonMaterial color={color} /></mesh>
      {profile.mode === 'swim' && [
        [-width / 2 - 1.25, 0], [width / 2 + 1.25, 0], [0, -depth / 2 - 1.25], [0, depth / 2 + 1.25],
      ].map((position, index) => (
        <mesh key={index} position={[position[0], surfaceY + 0.03, position[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.55, 18]} /><meshBasicMaterial color="#f5ffff" transparent opacity={0.48} />
        </mesh>
      ))}
    </group>
  );
}

function IceDetail({ width, depth, surfaceY }) {
  const cracks = [
    [-0.22, 0.05, 0.45], [0.18, -0.24, -0.3], [0.31, 0.28, 0.18], [-0.35, -0.2, -0.12],
  ];
  return (
    <group position={[0, surfaceY + 0.025, 0]}>
      {cracks.map(([x, z, rotation], index) => (
        <mesh key={index} position={[x * width, 0, z * depth]} rotation={[-Math.PI / 2, 0, rotation]}>
          <planeGeometry args={[Math.min(3.6, width * 0.22), 0.065]} />
          <meshBasicMaterial color="#84bacc" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function WetlandDetail({ width, depth, surfaceY }) {
  const count = Math.max(8, Math.min(24, Math.round((width + depth) / 3)));
  return (
    <group name="wetland-detail">
      {Array.from({ length: count }).map((_, index) => {
        const x = -width * 0.42 + ((index * 37) % 100) / 100 * width * 0.84;
        const z = -depth * 0.42 + ((index * 61) % 100) / 100 * depth * 0.84;
        return <mesh key={index} position={[x, surfaceY + 0.08, z]} rotation={[-Math.PI / 2, 0, index * 0.4]}><circleGeometry args={[0.18 + (index % 3) * 0.06, 8]} /><meshToonMaterial color={index % 2 ? '#83c47b' : '#a4d887'} /></mesh>;
      })}
      <Sparkles count={18} scale={[width, 2, depth]} size={2.2} speed={0.22} color="#baffd8" position={[0, surfaceY + 0.6, 0]} />
    </group>
  );
}

function HazardDetail({ width, depth, surfaceY }) {
  return (
    <group name="hazard-liquid-detail">
      <Sparkles count={26} scale={[width, 2.5, depth]} size={3.2} speed={0.72} color="#dfff6e" position={[0, surfaceY + 0.5, 0]} />
      {[-0.28, 0.05, 0.31].map((x, index) => (
        <mesh key={index} position={[x * width, surfaceY + 0.06, (index - 1) * depth * 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.42 + index * 0.08, 18]} /><meshBasicMaterial color="#e5ff86" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}
