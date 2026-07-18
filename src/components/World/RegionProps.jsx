// 大型區域專用場景物件：四個子區平台、道路、地標與分層裝飾。
// 物件以大型 / 中型 / 小型三種尺度混合，避免隨機地圖只出現同尺寸石頭。
import { Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import Outlined from '../3D/Outlined.jsx';
import { Barn, Fence, House, Lamp, Pond } from '../Scenes/SceneProps.jsx';

export const SUBAREA_LAYOUT = [
  { center: [-25, -22], height: 0.6, size: [34, 29] },
  { center: [24, -23], height: 1.4, size: [33, 28] },
  { center: [-24, 24], height: 2.2, size: [32, 29] },
  { center: [25, 24], height: 0.9, size: [34, 30] },
];

export function RegionTerrain({ region }) {
  return (
    <>
      {/* 大型基底確保子區之間仍可步行，不會因平台接縫直接掉落。 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
          <planeGeometry args={[118, 118]} />
          <meshToonMaterial color={region.ground} />
        </mesh>
      </RigidBody>

      {/* 十字主道路連接四個子區。 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[12, 108]} />
        <meshToonMaterial color={region.path} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[108, 12]} />
        <meshToonMaterial color={region.path} />
      </mesh>

      {SUBAREA_LAYOUT.map((area, index) => (
        <SubareaPlatform key={region.subareas[index]} area={area} name={region.subareas[index]} region={region} index={index} />
      ))}

      {/* 地圖外圈採明亮丘陵與柵欄形成自然邊界，Player 仍保有第二層空氣牆保護。 */}
      <BoundaryHills region={region} />
    </>
  );
}

function SubareaPlatform({ area, name, region, index }) {
  const [x, z] = area.center;
  const [width, depth] = area.size;
  const topY = area.height;
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[x, topY / 2 - 0.02, z]} receiveShadow>
          <boxGeometry args={[width, topY, depth]} />
          <meshToonMaterial color={mixColor(region.ground, index % 2 === 0 ? '#ffffff' : region.accent, 0.11)} />
        </mesh>
      </RigidBody>
      {/* 每區配置寬坡道，讓角色可跳躍或沿坡進入高處。 */}
      {topY > 0.7 && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[x - width / 2 + 2.2, topY / 2, z]} rotation={[0, 0, -Math.atan2(topY, 6)]} receiveShadow>
            <boxGeometry args={[6.5, 0.45, 5]} />
            <meshToonMaterial color={region.path} />
          </mesh>
        </RigidBody>
      )}
      <Html zIndexRange={[20, 0]} position={[x, topY + 3.4, z]} center distanceFactor={18}>
        <div className="rounded-2xl border-2 border-white/80 bg-white/82 px-3 py-1 text-xs font-black text-slate-800 shadow-lg backdrop-blur-sm">
          <span className="mr-1">{['①', '②', '③', '④'][index]}</span>{name}
        </div>
      </Html>
      <Landmark type={region.landmark} position={[x, topY, z]} color={region.accent} index={index} />
      <DecorationCluster region={region} area={area} index={index} />
    </group>
  );
}

function Landmark({ type, position, color, index }) {
  const [x, y, z] = position;
  const offset = index === 0 ? [-4, 0, -2] : index === 1 ? [4, 0, -3] : index === 2 ? [-4, 0, 3] : [4, 0, 3];
  const p = [x + offset[0], y + offset[1], z + offset[2]];

  if (type === 'greatTree') return <GreatTree position={p} color={color} />;
  if (type === 'windmill') return <Windmill position={p} color={color} />;
  if (type === 'iceSpire') return <CrystalSpire position={p} color={color} />;
  if (type === 'barn') return <Barn position={p} />;
  if (type === 'starTower') return <StarTower position={p} color={color} />;
  if (type === 'crystalArch') return <CrystalArch position={p} color={color} />;
  if (type === 'sunTemple') return <SunTemple position={p} color={color} />;
  if (type === 'giantMushroom') return <GiantMushroom position={p} color={color} />;
  return <GearTower position={p} color={color} />;
}

function GreatTree({ position, color }) {
  return (
    <group position={position}>
      <Outlined color="#79502e" position={[0, 2.1, 0]} outlineScale={1.018}><cylinderGeometry args={[0.8, 1.2, 4.2, 10]} /></Outlined>
      <Outlined color={color} position={[0, 5.2, 0]} outlineScale={1.012}><sphereGeometry args={[3.1, 14, 12]} /></Outlined>
      <Outlined color={color} position={[-2, 4.6, 0]} outlineScale={1.012}><sphereGeometry args={[1.8, 12, 10]} /></Outlined>
      <Outlined color={color} position={[2, 4.7, 0]} outlineScale={1.012}><sphereGeometry args={[1.7, 12, 10]} /></Outlined>
    </group>
  );
}

function Windmill({ position, color }) {
  return (
    <group position={position}>
      <Outlined color="#f0dfbb" position={[0, 2.2, 0]} outlineScale={1.012}><cylinderGeometry args={[1.4, 1.8, 4.4, 8]} /></Outlined>
      <Outlined color={color} position={[0, 4.7, 0]} rotation={[0, 0, Math.PI / 4]} outlineScale={1.012}><coneGeometry args={[2, 1.6, 4]} /></Outlined>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((r) => (
        <Outlined key={r} color="#ffffff" position={[0, 3.3, 1.5]} rotation={[0, 0, r]} outlineScale={1.01}>
          <boxGeometry args={[0.35, 5, 0.15]} />
        </Outlined>
      ))}
    </group>
  );
}

function CrystalSpire({ position, color }) {
  return (
    <group position={position}>
      {[[-1.2, 2.3, 0, 1.3], [0, 3.8, 0, 2], [1.4, 2.7, 0.3, 1.5]].map(([x, y, z, s], i) => (
        <Outlined key={i} color={color} position={[x, y, z]} rotation={[0, i * 0.4, 0]} outlineScale={1.015}>
          <octahedronGeometry args={[s, 0]} />
        </Outlined>
      ))}
      <pointLight position={[0, 3, 0]} intensity={1.8} distance={12} color={color} />
    </group>
  );
}

function StarTower({ position, color }) {
  return (
    <group position={position}>
      <Outlined color="#f4e4bc" position={[0, 2.2, 0]} outlineScale={1.012}><cylinderGeometry args={[1.5, 2, 4.4, 8]} /></Outlined>
      <Outlined color={color} position={[0, 5.2, 0]} rotation={[0, 0, Math.PI / 4]} outlineScale={1.014}><octahedronGeometry args={[1.5, 0]} /></Outlined>
      <pointLight position={[0, 5.2, 0]} intensity={1.4} distance={10} color={color} />
    </group>
  );
}

function CrystalArch({ position, color }) {
  return (
    <group position={position}>
      {[-1.8, 1.8].map((x) => <Outlined key={x} color={color} position={[x, 2, 0]} outlineScale={1.014}><octahedronGeometry args={[1.2, 0]} /></Outlined>)}
      <Outlined color={color} position={[0, 4, 0]} rotation={[0, 0, Math.PI / 2]} outlineScale={1.014}><torusGeometry args={[2, 0.35, 10, 24, Math.PI]} /></Outlined>
    </group>
  );
}

function SunTemple({ position, color }) {
  return (
    <group position={position}>
      <Outlined color="#efd58a" position={[0, 0.6, 0]} outlineScale={1.01}><boxGeometry args={[6, 1.2, 5]} /></Outlined>
      {[-2.2, 0, 2.2].map((x) => <Outlined key={x} color="#fff0b5" position={[x, 2.4, -1]} outlineScale={1.01}><cylinderGeometry args={[0.35, 0.45, 3.6, 8]} /></Outlined>)}
      <Outlined color={color} position={[0, 4.5, -1]} outlineScale={1.015}><sphereGeometry args={[1.2, 16, 12]} /></Outlined>
    </group>
  );
}

function GiantMushroom({ position, color }) {
  return (
    <group position={position}>
      <Outlined color="#f4e2c5" position={[0, 2, 0]} outlineScale={1.014}><cylinderGeometry args={[0.7, 1.1, 4, 10]} /></Outlined>
      <Outlined color={color} position={[0, 4.3, 0]} outlineScale={1.014}><sphereGeometry args={[2.8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></Outlined>
      <pointLight position={[0, 3.8, 0]} intensity={1.2} distance={9} color={color} />
    </group>
  );
}

function GearTower({ position, color }) {
  return (
    <group position={position}>
      <Outlined color="#b7a98b" position={[0, 2.2, 0]} outlineScale={1.012}><boxGeometry args={[3.4, 4.4, 3.4]} /></Outlined>
      <Outlined color={color} position={[0, 4.8, 0]} rotation={[Math.PI / 2, 0, 0]} outlineScale={1.014}><torusGeometry args={[1.5, 0.35, 10, 16]} /></Outlined>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Outlined key={i} color={color} position={[Math.cos(a) * 1.8, 4.8 + Math.sin(a) * 1.8, 0]} outlineScale={1.01}><boxGeometry args={[0.45, 0.45, 0.45]} /></Outlined>;
      })}
    </group>
  );
}

function DecorationCluster({ region, area, index }) {
  const [cx, cz] = area.center;
  const y = area.height;
  const offsets = [
    [-11, -8, 1.5], [-8, 8, 0.9], [10, -7, 1.1], [11, 8, 0.7],
    [-3, -10, 0.5], [5, 10, 0.65], [13, 0, 0.8], [-13, 2, 1.2],
  ];
  return (
    <group>
      {offsets.map(([dx, dz, scale], itemIndex) => (
        <DecorItem
          key={`${index}_${itemIndex}`}
          position={[cx + dx, y, cz + dz]}
          scale={scale}
          color={region.accent}
          type={(itemIndex + index) % 4}
        />
      ))}
      {index === 0 && <Pond position={[cx + 7, y, cz + 4]} />}
      {index === 1 && <Fence position={[cx, y, cz + 11]} length={12} />}
      {index === 2 && <Lamp position={[cx + 7, y, cz + 7]} />}
      {index === 3 && <House position={[cx - 7, y, cz + 6]} color={mixColor(region.ground, '#ffffff', 0.4)} roof={region.accent} />}
    </group>
  );
}

function DecorItem({ position, scale, color, type }) {
  if (type === 0) {
    return (
      <group position={position} scale={scale}>
        <Outlined color="#79502e" position={[0, 0.9, 0]} outlineScale={1.018}><cylinderGeometry args={[0.25, 0.35, 1.8, 8]} /></Outlined>
        <Outlined color={color} position={[0, 2.3, 0]} outlineScale={1.014}><sphereGeometry args={[1.15, 10, 9]} /></Outlined>
      </group>
    );
  }
  if (type === 1) {
    return <Outlined color={color} position={[position[0], position[1] + 0.6, position[2]]} scale={scale} outlineScale={1.012}><coneGeometry args={[0.8, 1.2, 8]} /></Outlined>;
  }
  if (type === 2) {
    return (
      <group position={position} scale={scale}>
        {[[-0.35, '#ff8eb5'], [0.2, '#ffe66d'], [0.55, '#8ad8ff']].map(([x, c], i) => (
          <Outlined key={i} color={c} position={[x, 0.35 + i * 0.08, 0]} outlineScale={1.03}><sphereGeometry args={[0.22, 8, 8]} /></Outlined>
        ))}
      </group>
    );
  }
  return <Outlined color={mixColor(color, '#ffffff', 0.35)} position={[position[0], position[1] + 0.55, position[2]]} scale={scale} outlineScale={1.014}><dodecahedronGeometry args={[0.6, 0]} /></Outlined>;
}

function BoundaryHills({ region }) {
  const points = [];
  for (let i = 0; i < 20; i += 1) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 55;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 2.2 + (i % 3)]);
  }
  return (
    <group>
      {points.map(([x, z, s], index) => (
        <Outlined key={index} color={mixColor(region.ground, region.accent, 0.28)} position={[x, s * 0.7, z]} rotation={[0, index * 0.4, 0]} outlineScale={1.006}>
          <coneGeometry args={[s * 1.8, s * 2.4, 8]} />
        </Outlined>
      ))}
    </group>
  );
}

function mixColor(a, b, ratio) {
  const parse = (hex) => hex.replace('#', '').match(/.{2}/g).map((v) => parseInt(v, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = [ar, ag, ab].map((value, index) => Math.round(value * (1 - ratio) + [br, bg, bb][index] * ratio));
  return `#${c.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
