// 試煉塔場景生成器：十套主題不再共用單一圓形場地，障礙、平台與輪廓依 Theme 分離。
import { RigidBody } from '@react-three/rapier';
import Outlined from '../3D/Outlined.jsx';
import { getTrialArenaTheme } from '../../data/trialTowerRooms.js';
import TrialTowerAssetLayer from './TrialTowerAssetLayer.jsx';

export default function TrialTowerArena({ config }) {
  const arena = getTrialArenaTheme(config.tier);
  return (
    <group name={`trial-arena-${arena.id}-${config.roomType}`}>
      <TrialTowerAssetLayer config={config} />
      <ArenaBase arena={arena} palette={config.palette} />
      {arena.obstacles.map((item, index) => <ArenaObstacle key={`${item.shape}-${index}`} item={item} color={item.color || config.palette.accent} />)}
      <ArenaBoundary arena={arena} color={config.palette.accent} />
    </group>
  );
}

function ArenaBase({ arena, palette }) {
  if (arena.baseShape === 'bridges') return (
    <>
      <FixedBox position={[-8, -0.35, 0]} scale={[7, .7, 14]} color={palette.floor} />
      <FixedBox position={[8, -0.35, 0]} scale={[7, .7, 14]} color={palette.floor} />
      <FixedBox position={[0, -0.2, 0]} scale={[10, .4, 3]} color={palette.accent} />
    </>
  );
  if (arena.baseShape === 'terraces') return (
    <>
      <FixedBox position={[0, -0.35, 4]} scale={[24, .7, 16]} color={palette.floor} />
      <FixedBox position={[0, 0.1, -7]} scale={[15, 1.2, 6]} color={palette.accent} />
    </>
  );
  if (arena.baseShape === 'rectangle') return <FixedBox position={[0, -0.45, 0]} scale={[32, .9, 24]} color={palette.floor} />;
  if (arena.baseShape === 'square') return <FixedBox position={[0, -0.45, 0]} scale={[28, .9, 28]} color={palette.floor} />;
  if (arena.baseShape === 'diamond') return <FixedBox position={[0, -0.45, 0]} scale={[25, .9, 25]} color={palette.floor} rotation={Math.PI / 4} />;
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[arena.baseShape === 'hexagon' ? 17 : 18, arena.baseShape === 'hexagon' ? 18 : 20, 1, arena.baseShape === 'hexagon' ? 6 : 32]} />
        <meshToonMaterial color={palette.floor} />
      </mesh>
    </RigidBody>
  );
}

function ArenaBoundary({ arena, color }) {
  const count = arena.baseShape === 'square' || arena.baseShape === 'rectangle' ? 16 : 24;
  return Array.from({ length: count }).map((_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radius = arena.baseShape === 'rectangle' ? 17 : 18;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = arena.edgeStyle === 'crystals' ? 3.4 : arena.edgeStyle === 'books' ? 2.8 : 2.2;
    return (
      <RigidBody key={index} type="fixed" colliders="cuboid">
        <group position={[x, height / 2, z]} rotation={[0, -angle, 0]}>
          <Outlined color={color} outlineScale={1.012}><boxGeometry args={[4.5, height, 0.5]} /></Outlined>
        </group>
      </RigidBody>
    );
  });
}

function ArenaObstacle({ item, color }) {
  const [x, y, z] = item.position;
  const [sx, sy, sz] = item.scale;
  if (['wall', 'shelf', 'hedge', 'desk', 'stall', 'platform', 'bridge', 'furnace'].includes(item.shape)) return <FixedBox position={[x, y, z]} scale={[sx, sy, sz]} color={color} rotation={item.rotation || 0} />;
  return (
    <RigidBody type="fixed" colliders="hull" position={[x, y, z]} rotation={[0, item.rotation || 0, 0]}>
      <Outlined color={color} outlineScale={1.018}>
        {item.shape === 'pillar' && <cylinderGeometry args={[sx / 2, sx / 2, sy, 10]} />}
        {item.shape === 'gear' && <torusGeometry args={[sx / 2, Math.max(.18, sy / 3), 8, 20]} />}
        {item.shape === 'crystal' && <octahedronGeometry args={[Math.max(sx, sy * .4), 0]} />}
        {item.shape === 'fountain' && <cylinderGeometry args={[sx / 2, sx / 1.6, sy, 18]} />}
        {item.shape === 'flower' && <dodecahedronGeometry args={[sx / 2, 0]} />}
        {item.shape === 'dome' && <sphereGeometry args={[sx / 2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />}
        {item.shape === 'star' && <icosahedronGeometry args={[sx / 2, 0]} />}
      </Outlined>
    </RigidBody>
  );
}

function FixedBox({ position, scale, color, rotation = 0 }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotation, 0]}>
      <mesh receiveShadow castShadow><boxGeometry args={scale} /><meshToonMaterial color={color} /></mesh>
    </RigidBody>
  );
}
