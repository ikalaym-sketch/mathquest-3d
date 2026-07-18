// 星光農莊場景元件套件。
// 建築與動物優先使用正式 GLB；道路、花草、農田邊框等高重複物件使用程序化幾何與 Instancing。
import { useMemo, useRef, useState } from 'react';
import { Html, Instance, Instances, Sparkles } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import Model from '../3D/Model.jsx';
import { FARM_MODEL_ASSETS } from '../../services/FarmAssetService.js';
import { playerPos } from '../../input/playerPos.js';
import { rotatePointToLocal } from '../../utils/placementGeometry.js';
import { createFarmInterior } from '../../data/interiorDefinitions.js';
import { useStore } from '../../store/useStore.js';
import { useFarmStore } from '../../store/farmStore.js';

export function FarmGround() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[88, 80]} />
        <meshStandardMaterial color="#9fd273" roughness={1} />
      </mesh>
    </RigidBody>
  );
}

export function FarmRoad({ from, to, width = 3.4 }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, 0.01, (from[2] + to[2]) / 2]}
      rotation={[-Math.PI / 2, 0, -angle]}
      receiveShadow
    >
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial color="#e2ca8e" roughness={1} />
    </mesh>
  );
}

export function FarmBuilding({ id, model, position, rotation = [0, 0, 0], scale = 1, onClick = null }) {
  if (model === 'farmhouse' || model === 'barn') {
    return <EnterableFarmBuilding id={id} model={model} position={position} rotation={rotation} scale={scale} onClick={onClick} />;
  }
  const colliderSize = [1.4, 3.2, 1.4];
  const colliderY = model === 'windmill' ? 3.2 : model === 'water_tower' ? 2.6 : 2.1;
  return (
    <group position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={colliderSize} position={[0, colliderY, 0]} />
      </RigidBody>
      <Model assetId={FARM_MODEL_ASSETS[model]} />
    </group>
  );
}

function EnterableFarmBuilding({ id, model, position, rotation, scale, onClick }) {
  const [inside, setInside] = useState(false);
  const openPanel = useStore((state) => state.openPanel);
  const openCharacterEditor = useStore((state) => state.openCharacterEditor);
  const setHomeInteriorTab = useFarmStore((state) => state.setHomeInteriorTab);
  const elapsed = useRef(0);
  const isBarn = model === 'barn';
  const width = isBarn ? 7.2 : 6.1;
  const depth = isBarn ? 6.0 : 5.2;
  const height = isBarn ? 4.4 : 3.8;
  const wall = 0.3;
  const interior = useMemo(() => createFarmInterior({ id, model, position, rotation }), [id, model, position, rotation]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 0.12) return;
    elapsed.current = 0;
    const local = rotatePointToLocal({ x: playerPos.x, z: playerPos.z }, position, rotation?.[1] || 0);
    const next = Math.abs(local.x) < width * 0.44 && Math.abs(local.z) < depth * 0.42;
    setInside((current) => current === next ? current : next);
  });

  return (
    <group position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[width / 2, 0.18, depth / 2]} position={[0, 0.18, 0]} />
        <CuboidCollider args={[width / 2, height / 2, wall / 2]} position={[0, height / 2, -depth / 2]} />
        <CuboidCollider args={[wall / 2, height / 2, depth / 2]} position={[-width / 2, height / 2, 0]} />
        <CuboidCollider args={[wall / 2, height / 2, depth / 2]} position={[width / 2, height / 2, 0]} />
        <CuboidCollider args={[width * 0.31, height / 2, wall / 2]} position={[-width * 0.34, height / 2, depth / 2]} />
        <CuboidCollider args={[width * 0.31, height / 2, wall / 2]} position={[width * 0.34, height / 2, depth / 2]} />
      </RigidBody>
      {!inside && <Model assetId={FARM_MODEL_ASSETS[model]} instanceId={`farm-building:${id}`} />}
      <FarmInteriorFurniture interior={interior} />
      {inside && <FarmInteriorHotspots model={model} openPanel={openPanel} openCharacterEditor={openCharacterEditor} setHomeInteriorTab={setHomeInteriorTab} />}
      {inside && <pointLight position={[0, 2.6, 0]} intensity={1.0} distance={7} color="#ffd79a" />}
    </group>
  );
}

function FarmInteriorHotspots({ model, openPanel, openCharacterEditor, setHomeInteriorTab }) {
  if (model === 'barn') {
    return (
      <>
        <Html position={[-1.7, 1.5, -1.3]} center distanceFactor={10}><button onClick={() => openPanel('build')} className="rounded-xl border-2 border-white/70 bg-amber-600/95 px-3 py-2 text-xs font-black text-white shadow-xl">🔨 設施建造</button></Html>
        <Html position={[1.7, 1.5, -1.3]} center distanceFactor={10}><button onClick={() => openPanel('machine')} className="rounded-xl border-2 border-white/70 bg-sky-700/95 px-3 py-2 text-xs font-black text-white shadow-xl">⚙️ 加工設備</button></Html>
      </>
    );
  }
  const openHome = (tab) => { setHomeInteriorTab(tab); openPanel('homeInterior'); };
  return (
    <>
      <Html position={[-1.8, 1.35, -1.2]} center distanceFactor={10}><button onClick={() => openHome('life')} className="rounded-xl border-2 border-white/70 bg-sky-700/95 px-3 py-2 text-xs font-black text-white shadow-xl">🛏️ 休息</button></Html>
      <Html position={[0, 1.35, -1.65]} center distanceFactor={10}><button onClick={() => openHome('storage')} className="rounded-xl border-2 border-white/70 bg-amber-700/95 px-3 py-2 text-xs font-black text-white shadow-xl">📦 收納</button></Html>
      <Html position={[1.8, 1.35, -1.2]} center distanceFactor={10}><button onClick={openCharacterEditor} className="rounded-xl border-2 border-white/70 bg-fuchsia-700/95 px-3 py-2 text-xs font-black text-white shadow-xl">🪞 更衣</button></Html>
    </>
  );
}

function FarmWall({ position, size, color }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>;
}

function FarmInteriorFurniture({ interior }) {
  if (!interior) return null;
  return <>{interior.furniture.map((item) => {
    const [width, height, depth] = item.size;
    return <RigidBody key={item.id} type="fixed" colliders={false} position={item.position}>
      <CuboidCollider args={[width / 2, height / 2, depth / 2]} position={[0, height / 2, 0]} />
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[width, height, depth]} /><meshStandardMaterial color={item.color} roughness={0.95} /></mesh>
    </RigidBody>;
  })}</>;
}

export function FarmProp({ model, position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Model assetId={FARM_MODEL_ASSETS[model]} />
    </group>
  );
}

export function PondBridge({ position }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[6.3, 40]} />
        <meshPhysicalMaterial color="#6dcce5" roughness={0.25} transmission={0.08} clearcoat={0.35} />
      </mesh>
      {Array.from({ length: 22 }).map((_, index) => {
        const angle = (index / 22) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 6.05, 0.2, Math.sin(angle) * 6.05]} castShadow>
            <dodecahedronGeometry args={[0.5 + (index % 3) * 0.08, 0]} />
            <meshStandardMaterial color="#b2af98" roughness={1} />
          </mesh>
        );
      })}
      <group position={[0, 0.05, 0]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[2.3, 0.2, 0.95]} position={[0, 0.32, 0]} />
        </RigidBody>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 0.4, 1.9]} />
          <meshStandardMaterial color="#c66c38" roughness={0.85} />
        </mesh>
        {[-2.05, -0.7, 0.7, 2.05].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            {[-0.82, 0.82].map((z) => (
              <mesh key={z} position={[0, 1.0, z]} castShadow>
                <boxGeometry args={[0.18, 1.5, 0.18]} />
                <meshStandardMaterial color="#d84f36" roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}
        {[-0.82, 0.82].map((z) => (
          <mesh key={z} position={[0, 1.45, z]} castShadow>
            <boxGeometry args={[4.5, 0.16, 0.16]} />
            <meshStandardMaterial color="#d84f36" roughness={0.9} />
          </mesh>
        ))}
      </group>
      <Sparkles count={24} scale={[10, 2.2, 10]} size={2.6} speed={0.25} color="#dcfbff" position={[0, 0.8, 0]} />
    </group>
  );
}

export function ShippingYard({ position }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[5.2, 32]} />
        <meshStandardMaterial color="#d8c38a" roughness={1} />
      </mesh>
      {[
        [-2.1, 0.6, 0],
        [-0.8, 0.6, 0.5],
        [0.5, 0.6, -0.2],
        [1.7, 0.6, 0.6],
      ].map((p, index) => (
        <mesh key={index} position={p} castShadow>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshStandardMaterial color={index % 2 ? '#a96f3f' : '#c18a4d'} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, -2.1]} castShadow>
        <boxGeometry args={[4.8, 2.1, 0.22]} />
        <meshStandardMaterial color="#875632" roughness={1} />
      </mesh>
      <Html position={[0, 2.5, -2.1]} center distanceFactor={11}>
        <div className="rounded-xl border border-white/50 bg-[#4d3825]/85 px-3 py-1 text-xs font-black text-amber-100 whitespace-nowrap">
          今日出貨區
        </div>
      </Html>
    </group>
  );
}

export function FarmFence({ center, size = [12, 9], gateSide = 'south' }) {
  const [width, depth] = size;
  const posts = useMemo(() => {
    const values = [];
    const spacing = 2;
    for (let x = -width / 2; x <= width / 2; x += spacing) {
      if (!(gateSide === 'south' && Math.abs(x) < 1.5)) values.push([x, -depth / 2]);
      if (!(gateSide === 'north' && Math.abs(x) < 1.5)) values.push([x, depth / 2]);
    }
    for (let z = -depth / 2 + spacing; z < depth / 2; z += spacing) {
      values.push([-width / 2, z], [width / 2, z]);
    }
    return values;
  }, [width, depth, gateSide]);

  return (
    <group position={center}>
      {posts.map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.18, 1.5, 0.18]} />
            <meshStandardMaterial color="#9f6a39" roughness={1} />
          </mesh>
        </group>
      ))}
      {[-depth / 2, depth / 2].map((z) => (
        <group key={z} position={[0, 0, z]}>
          {[0.55, 1.05].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[width, 0.12, 0.12]} />
              <meshStandardMaterial color="#9f6a39" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {[-width / 2, width / 2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[0.55, 1.05].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.12, 0.12, depth]} />
              <meshStandardMaterial color="#9f6a39" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function FarmVegetation({ density = 1 }) {
  const blades = useMemo(() => {
    const result = [];
    const count = Math.round(360 * density);
    for (let index = 0; index < count; index += 1) {
      const x = ((index * 47) % 8200) / 100 - 41;
      const z = ((index * 83) % 7400) / 100 - 37;
      if (Math.abs(x) < 5 || Math.abs(z - 18) < 4) continue;
      result.push({ x, z, scale: 0.55 + (index % 5) * 0.08, rotation: (index % 19) * 0.31 });
    }
    return result;
  }, [density]);

  return (
    <Instances limit={blades.length + 1} range={blades.length}>
      <coneGeometry args={[0.1, 0.58, 4]} />
      <meshStandardMaterial color="#4ca555" roughness={1} />
      {blades.map((blade, index) => (
        <Instance
          key={index}
          position={[blade.x, 0.29, blade.z]}
          scale={blade.scale}
          rotation={[0, blade.rotation, 0]}
        />
      ))}
    </Instances>
  );
}

export function HomeYardDecor({ placed = [] }) {
  return (
    <group position={[-14, 0, 20]}>
      {placed.includes('flowerBox') && (
        <group position={[0, 0, 3.1]}>
          {[-1.5, 1.5].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[1.3, 0.55, 0.65]} /><meshStandardMaterial color="#9b633e" /></mesh>
              {[-0.35, 0, 0.35].map((fx, index) => (
                <mesh key={fx} position={[fx, 0.78, 0]} castShadow><sphereGeometry args={[0.17, 8, 7]} /><meshStandardMaterial color={['#ff9fbd','#fff0a0','#bca8ff'][index]} /></mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      {placed.includes('picnicTable') && (
        <group position={[-5, 0, 1.5]}>
          <mesh position={[0, 0.85, 0]} castShadow><boxGeometry args={[2.8, 0.25, 1.2]} /><meshStandardMaterial color="#b47943" /></mesh>
          {[-1, 1].map((x) => <mesh key={x} position={[x, 0.4, 0]} castShadow><boxGeometry args={[0.18, 0.8, 0.18]} /><meshStandardMaterial color="#7c5436" /></mesh>)}
          {[-1.15, 1.15].map((z) => <mesh key={z} position={[0, 0.5, z]} castShadow><boxGeometry args={[2.8, 0.2, 0.45]} /><meshStandardMaterial color="#a96d3c" /></mesh>)}
        </group>
      )}
      {placed.includes('trophyStand') && (
        <group position={[4.8, 0, 1.5]}>
          <mesh position={[0, 0.65, 0]} castShadow><cylinderGeometry args={[0.7, 0.9, 1.3, 10]} /><meshStandardMaterial color="#c8b075" /></mesh>
          <mesh position={[0, 1.55, 0]} castShadow><octahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color="#ffd75a" emissive="#c78f1a" emissiveIntensity={0.35} /></mesh>
        </group>
      )}
      {placed.includes('lanternArch') && (
        <group position={[0, 0, 5.2]}>
          {[-2.1, 2.1].map((x) => <mesh key={x} position={[x, 1.7, 0]} castShadow><boxGeometry args={[0.24, 3.4, 0.24]} /><meshStandardMaterial color="#9b633e" /></mesh>)}
          <mesh position={[0, 3.25, 0]} castShadow><boxGeometry args={[4.5, 0.25, 0.25]} /><meshStandardMaterial color="#9b633e" /></mesh>
          {[-1.5, 1.5].map((x) => <mesh key={x} position={[x, 2.85, 0]} castShadow><sphereGeometry args={[0.28, 10, 8]} /><meshStandardMaterial color="#ffe492" emissive="#ffb62f" emissiveIntensity={0.7} /></mesh>)}
        </group>
      )}
    </group>
  );
}

export function FarmEntryDecor() {
  const zPoints = [30, 26, 22];
  return (
    <group>
      {[-3.3, 3.3].map((x) => (
        <group key={x}>
          {zPoints.map((z, index) => (
            <group key={z} position={[x, 0, z]}>
              <mesh position={[0, 0.65, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.15, 1.3, 8]} />
                <meshStandardMaterial color="#8d6239" roughness={1} />
              </mesh>
              <mesh position={[0, 1.45, 0]} castShadow>
                <sphereGeometry args={[0.25, 9, 7]} />
                <meshStandardMaterial color={index % 2 ? '#fff2a4' : '#ffb8ca'} emissive={index % 2 ? '#c79a32' : '#bc5d78'} emissiveIntensity={0.15} />
              </mesh>
            </group>
          ))}
          <mesh position={[x, 0.62, 26]} castShadow>
            <boxGeometry args={[0.12, 0.12, 8]} />
            <meshStandardMaterial color="#9d6b3b" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function FarmBoundaryGrove() {
  const trees = [
    [-38, -31, 1.2], [-30, -34, 1.0], [-20, -36, 1.15], [-9, -36, 0.9],
    [10, -36, 1.05], [22, -34, 1.2], [34, -30, 1.0], [39, -18, 1.15],
    [40, -4, 0.95], [40, 13, 1.1], [37, 31, 1.05], [-38, 29, 1.1],
    [-40, 13, 0.95], [-40, -7, 1.15],
  ];
  return (
    <>
      {trees.map(([x, z, scale], index) => (
        <group key={index} position={[x, 0, z]} scale={scale}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.58, 3.6, 8]} />
            <meshStandardMaterial color="#825632" roughness={1} />
          </mesh>
          <mesh position={[0, 4.35, 0]} castShadow>
            <sphereGeometry args={[2.05, 12, 9]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#65b765' : '#78c86f'} roughness={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.5, -41]} scale={[26, 7, 3]}>
        <coneGeometry args={[1, 1, 5]} />
        <meshStandardMaterial color="#8bbd79" roughness={1} />
      </mesh>
    </>
  );
}

export function FarmScarecrow({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.4, 8]} /><meshStandardMaterial color="#765037" /></mesh>
      <mesh position={[0, 1.65, 0]} castShadow><boxGeometry args={[2.0, 0.12, 0.12]} /><meshStandardMaterial color="#765037" /></mesh>
      <mesh position={[0, 2.25, 0]} castShadow><sphereGeometry args={[0.32, 10, 8]} /><meshStandardMaterial color="#e3bc69" /></mesh>
      <mesh position={[0, 2.65, 0]} castShadow><coneGeometry args={[0.55, 0.5, 10]} /><meshStandardMaterial color="#795133" /></mesh>
      <mesh position={[0, 1.35, 0]} castShadow><boxGeometry args={[0.8, 0.9, 0.25]} /><meshStandardMaterial color="#4f83b8" /></mesh>
    </group>
  );
}

export function FarmCart({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[2.4, 1.1, 1.5]} /><meshStandardMaterial color="#a96d3c" roughness={1} /></mesh>
      {[-0.9, 0.9].map((x) => <mesh key={x} position={[x, 0.35, 0.82]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.42, 0.12, 8, 16]} /><meshStandardMaterial color="#57402f" /></mesh>)}
      <mesh position={[0, 0.82, -1.5]} castShadow><boxGeometry args={[0.18, 0.18, 2.2]} /><meshStandardMaterial color="#7c5637" /></mesh>
    </group>
  );
}

export function FarmFlowerBeds() {
  const beds = [
    [-12, 0, 26],
    [-22, 0, 19],
    [3, 0, 22],
    [9, 0, 15],
    [27, 0, 18],
    [-25, 0, -20],
  ];
  return (
    <>
      {beds.map((bed, bedIndex) => (
        <group key={bedIndex} position={bed}>
          {Array.from({ length: 14 }).map((_, index) => {
            const x = ((index * 37) % 100) / 100 * 4 - 2;
            const z = ((index * 61) % 100) / 100 * 2.6 - 1.3;
            const color = ['#ffb2c7', '#fff09b', '#ffffff', '#c2a8ff'][index % 4];
            return (
              <group key={index} position={[x, 0, z]}>
                <mesh position={[0, 0.25, 0]}>
                  <cylinderGeometry args={[0.025, 0.035, 0.5, 5]} />
                  <meshStandardMaterial color="#4d994e" />
                </mesh>
                <mesh position={[0, 0.52, 0]}>
                  <sphereGeometry args={[0.12, 7, 6]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </>
  );
}

// Lv3～Lv5 農莊的可見結構升級；每級都有實際結構，不只是數值提升。
export function FarmUpgradeDecor({ level = 1 }) {
  if (level < 3) return null;
  return (
    <group name={`farm-upgrade-level-${level}`}>
      {/* Lv3 加工棚：工作台、屋頂與可阻擋支柱分件。 */}
      <group position={[-22, 0, -16]}>
        <RigidBody type="fixed" colliders={false}>
          {[-3.2, 3.2].flatMap((x) => [-2.2, 2.2].map((z) => <CuboidCollider key={`${x}:${z}`} args={[0.16, 1.6, 0.16]} position={[x, 1.6, z]} />))}
        </RigidBody>
        {[-3.2, 3.2].flatMap((x) => [-2.2, 2.2].map((z) => <mesh key={`${x}:${z}`} position={[x, 1.6, z]} castShadow><boxGeometry args={[0.3, 3.2, 0.3]} /><meshStandardMaterial color="#875b3a" /></mesh>))}
        <mesh position={[0, 3.25, 0]} castShadow><boxGeometry args={[7.2, 0.28, 5.2]} /><meshStandardMaterial color="#b66f45" roughness={0.95} /></mesh>
        <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[4.8, 1.3, 1.2]} /><meshStandardMaterial color="#9c6b43" roughness={1} /></mesh>
        <Html position={[0, 4.1, 0]} center distanceFactor={12}><div className="rounded-lg bg-amber-800/90 px-2 py-1 text-[10px] font-black text-white">Lv3 加工工坊</div></Html>
      </group>

      {level >= 4 && <>
        {/* Lv4 灌溉水路：沿田區外緣，避免切入主道路。 */}
        {[
          { position: [-11, 0.055, -5.9], size: [15.5, 0.12, 0.34] },
          { position: [-18.6, 0.055, 1.5], size: [0.34, 0.12, 15.2] },
          { position: [-3.4, 0.055, 1.5], size: [0.34, 0.12, 15.2] },
        ].map((channel, index) => (
          <mesh key={index} position={channel.position} receiveShadow>
            <boxGeometry args={channel.size} />
            <meshPhysicalMaterial color="#6bbcd3" roughness={0.2} clearcoat={0.25} />
          </mesh>
        ))}
        <group position={[-25, 0, -7]}>
          <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[1.0, 1.15, 0.9, 16]} /><meshStandardMaterial color="#8eaa78" /></mesh>
          <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.92, 20]} /><meshPhysicalMaterial color="#79c5dc" roughness={0.15} /></mesh>
          <Html position={[0, 1.7, 0]} center distanceFactor={12}><div className="rounded-lg bg-emerald-900/85 px-2 py-1 text-[10px] font-black text-white">雨水收集槽</div></Html>
        </group>
        <group position={[20, 0, -1]}>
          {[-3.2, 3.2].map((x) => <mesh key={x} position={[x, 1.5, 0]} castShadow><boxGeometry args={[0.28, 3, 0.28]} /><meshStandardMaterial color="#855939" /></mesh>)}
          <mesh position={[0, 3.05, 0]} rotation={[0, 0, 0.08]} castShadow><boxGeometry args={[7.2, 0.28, 4.8]} /><meshStandardMaterial color="#d4b56c" /></mesh>
          <mesh position={[0, 0.45, 0]} receiveShadow><boxGeometry args={[6.7, 0.16, 4.2]} /><meshStandardMaterial color="#c9aa71" /></mesh>
          <Html position={[0, 3.8, 0]} center distanceFactor={12}><div className="rounded-lg bg-[#6f4a2f]/90 px-2 py-1 text-[10px] font-black text-white">動物避雨棚</div></Html>
        </group>
      </>}

      {level >= 5 && (
        <group position={[26, 0, -24]}>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[4.2, 1.6, 2.8]} position={[0, 1.6, 0]} />
          </RigidBody>
          <mesh position={[0, 0.15, 0]} receiveShadow><boxGeometry args={[8.4, 0.3, 5.6]} /><meshStandardMaterial color="#d4caa0" /></mesh>
          {[-4, 4].map((x) => <mesh key={x} position={[x, 1.8, 0]} castShadow><boxGeometry args={[0.18, 3.6, 5.4]} /><meshStandardMaterial color="#7ba08d" /></mesh>)}
          <mesh position={[0, 3.4, 0]} rotation={[0, 0, Math.PI / 4]} castShadow><boxGeometry args={[6.1, 0.18, 5.8]} /><meshPhysicalMaterial color="#bceee4" transparent opacity={0.55} roughness={0.15} /></mesh>
          <mesh position={[0, 3.4, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow><boxGeometry args={[6.1, 0.18, 5.8]} /><meshPhysicalMaterial color="#bceee4" transparent opacity={0.55} roughness={0.15} /></mesh>
          <pointLight position={[0, 2.6, 0]} intensity={0.8} distance={10} color="#b7ffd7" />
          <Html position={[0, 5.1, 0]} center distanceFactor={12}><div className="rounded-xl border border-white/60 bg-emerald-700/90 px-3 py-1 text-xs font-black text-white">✨ 星光溫室</div></Html>
        </group>
      )}
    </group>
  );
}
