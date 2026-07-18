// 森林遺跡正式場景套件：地形、探索道路、植被、GLB 地標、數學機關與事件節點。
import { Html, Instances, Instance, Sparkles } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import Model from '../3D/Model.jsx';
import Outlined from '../3D/Outlined.jsx';
import { FOREST_MODEL_ASSETS } from '../../services/ForestAssetService.js';

export function ForestBaseTerrain({ layout, vegetationDensity = 1 }) {
  return (
    <>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
          <planeGeometry args={[108, 106]} />
          <meshStandardMaterial color="#69b95f" roughness={1} />
        </mesh>
      </RigidBody>

      {Object.values(layout.subareas).map((area) => (
        <RigidBody key={area.id} type="fixed" colliders="cuboid">
          <mesh
            position={[area.center[0], area.height / 2 - 0.02, area.center[2]]}
            receiveShadow
          >
            <boxGeometry args={[area.size[0], Math.max(0.25, area.height), area.size[1]]} />
            <meshStandardMaterial color={areaColor(area.index)} roughness={1} />
          </mesh>
        </RigidBody>
      ))}

      {layout.roads.map((road) => <ForestRoad key={road.id} road={road} />)}
      <ForestWaterFeature />
      <ForestEntryDetails density={vegetationDensity} />
      <ForestSubareaGroundDetails layout={layout} density={vegetationDensity} />
      <ForestBoundary />
      <ForestCanopy density={vegetationDensity} />
    </>
  );
}

function ForestRoad({ road }) {
  const [x1, y1, z1] = road.from;
  const [x2, y2, z2] = road.to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  const horizontal = Math.hypot(dx, dz);
  const length = Math.hypot(horizontal, dy);
  const yaw = Math.atan2(dx, dz);
  const pitch = -Math.atan2(dy, horizontal || 1);
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh
        position={[(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2]}
        rotation={[pitch, yaw, 0]}
        receiveShadow
      >
        <boxGeometry args={[road.width, 0.24, length]} />
        <meshStandardMaterial color="#d8bf82" roughness={1} />
      </mesh>
    </RigidBody>
  );
}


function ForestEntryDetails({ density }) {
  const stones = Array.from({ length: 11 }, (_, index) => ({
    x: (index % 2 ? 0.75 : -0.65) + Math.sin(index * 1.7) * 0.35,
    z: 42 - index * 1.35,
    scale: 0.72 + (index % 3) * 0.12,
    rotation: index * 0.41,
  }));
  const flowers = [
    [-5.4, 0.18, 38.3], [-3.8, 0.18, 35.8], [4.2, 0.18, 37.5], [5.8, 0.18, 34.3],
    [-7.2, 0.18, 31.2], [7.5, 0.18, 30.7], [-5.8, 0.18, 27.8], [5.2, 0.18, 27.2],
  ];
  const visibleFlowers = flowers.slice(0, Math.max(4, Math.round(flowers.length * density)));
  return (
    <group>
      {stones.map((stone, index) => (
        <mesh key={`entry_stone_${index}`} position={[stone.x, 0.09, stone.z]} rotation={[-Math.PI / 2, 0, stone.rotation]} receiveShadow>
          <circleGeometry args={[stone.scale, 10]} />
          <meshStandardMaterial color={index % 2 ? '#e7d8aa' : '#d6c48f'} roughness={1} />
        </mesh>
      ))}
      {visibleFlowers.map((position, index) => (
        <group key={`entry_flower_${index}`} position={position} rotation={[0, index * 0.8, 0]}>
          <LowPolyFlower color={index % 3 === 0 ? '#fff0a8' : index % 3 === 1 ? '#ffd0df' : '#d9c6ff'} />
          <LowPolyBush scale={0.62 + (index % 2) * 0.18} color={index % 2 ? '#4fa958' : '#5db665'} />
        </group>
      ))}
      <ForestSign position={[-3.7, 0.1, 32.4]} label="低語樹林" />
      <ForestLantern position={[-4.1, 0.05, 29.5]} />
      <ForestLantern position={[4.1, 0.05, 29.5]} />
      <Outlined color="#73b65e" position={[-8.5, 1.25, 35.2]} outlineScale={1.006}>
        <dodecahedronGeometry args={[1.5, 0]} />
      </Outlined>
      <Outlined color="#66ad58" position={[8.7, 1.05, 35.5]} outlineScale={1.006}>
        <dodecahedronGeometry args={[1.3, 0]} />
      </Outlined>
    </group>
  );
}

function ForestSubareaGroundDetails({ layout, density }) {
  return (
    <group>
      {Object.values(layout.subareas).flatMap((area) => {
        const count = Math.max(3, Math.round(5 * density));
        return Array.from({ length: count }, (_, index) => {
          const angle = index * 2.13 + area.index * 0.7;
          const radiusX = area.size[0] * (0.17 + (index % 3) * 0.055);
          const radiusZ = area.size[1] * (0.17 + ((index + 1) % 3) * 0.05);
          const x = area.center[0] + Math.cos(angle) * radiusX;
          const z = area.center[2] + Math.sin(angle) * radiusZ;
          return (
            <group key={`${area.id}_ground_${index}`} position={[x, area.height + 0.11, z]} rotation={[0, angle, 0]}>
              {index % 3 === 0 ? <LowPolyFlower color={area.index % 2 ? '#d9f4ff' : '#ffe0e8'} /> : <LowPolyBush scale={0.45 + (index % 2) * 0.18} color={area.themeColor} />}
            </group>
          );
        });
      })}
    </group>
  );
}

function LowPolyFlower({ color = '#ffe0e8' }) {
  return (
    <group scale={0.62}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.64, 5]} />
        <meshStandardMaterial color="#3f9654" roughness={1} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.73, 0.18]} castShadow>
        <sphereGeometry args={[0.075, 6, 4]} />
        <meshStandardMaterial color="#f4c542" roughness={0.8} />
      </mesh>
    </group>
  );
}

function LowPolyBush({ scale = 1, color = '#59aa5f' }) {
  return (
    <mesh scale={[scale * 1.25, scale * 0.78, scale]} position={[0, scale * 0.48, 0]} castShadow>
      <dodecahedronGeometry args={[0.72, 0]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function ForestLantern({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 2.1, 8]} />
        <meshStandardMaterial color="#6e4d33" roughness={1} />
      </mesh>
      <mesh position={[0, 2.12, 0]} castShadow>
        <boxGeometry args={[0.5, 0.58, 0.5]} />
        <meshStandardMaterial color="#ffe79a" emissive="#ffd35a" emissiveIntensity={0.8} roughness={0.6} />
      </mesh>
      <pointLight position={[0, 2.1, 0]} intensity={0.75} distance={5} color="#ffd86e" />
    </group>
  );
}

function ForestSign({ position, label }) {
  return (
    <group position={position} rotation={[0, 0.18, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 1.6, 7]} />
        <meshStandardMaterial color="#765034" roughness={1} />
      </mesh>
      <mesh position={[0.55, 1.45, 0]} castShadow>
        <boxGeometry args={[1.5, 0.55, 0.14]} />
        <meshStandardMaterial color="#bc8149" roughness={0.9} />
      </mesh>
      <Html position={[0.55, 1.45, 0.09]} center distanceFactor={9}>
        <div className="whitespace-nowrap rounded-md bg-amber-50/90 px-2 py-1 text-[10px] font-black text-amber-900 shadow">{label}</div>
      </Html>
    </group>
  );
}

function ForestWaterFeature() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[31, 0.23, 3]} receiveShadow>
        <circleGeometry args={[9, 32]} />
        <meshStandardMaterial color="#58c8df" roughness={0.3} metalness={0.05} transparent opacity={0.86} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[23, 0.23, 15]}>
        <planeGeometry args={[6, 24]} />
        <meshStandardMaterial color="#65cfe0" roughness={0.3} transparent opacity={0.78} />
      </mesh>
      <Sparkles count={22} scale={[18, 3, 20]} position={[28, 2, 7]} size={2.5} speed={0.35} color="#d9fbff" />
    </group>
  );
}

function ForestBoundary() {
  const points = Array.from({ length: 38 }, (_, index) => {
    const angle = (index / 38) * Math.PI * 2;
    const radiusX = 51 + (index % 3) * 1.4;
    const radiusZ = 49 + (index % 4) * 1.1;
    return [Math.cos(angle) * radiusX, Math.sin(angle) * radiusZ, 3.2 + (index % 4) * 0.55];
  });
  return (
    <group>
      {points.map(([x, z, s], index) => (
        <Outlined key={index} color={index % 2 ? '#3d8f50' : '#4aa85b'} position={[x, s * 0.75, z]} outlineScale={1.004}>
          <coneGeometry args={[s * 1.55, s * 2.5, 8]} />
        </Outlined>
      ))}
    </group>
  );
}

function ForestCanopy({ density }) {
  const count = Math.round(74 * density);
  const trees = Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 17 + (index % 13) * 2.45;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const scale = 0.7 + ((index * 17) % 10) / 15;
    return { x, z, scale };
  }).filter(({ x, z }) => !isRoadCore(x, z));

  return (
    <group>
      <Instances limit={trees.length} range={trees.length}>
        <cylinderGeometry args={[0.22, 0.34, 2.4, 7]} />
        <meshStandardMaterial color="#765033" roughness={1} />
        {trees.map((tree, index) => (
          <Instance key={`trunk_${index}`} position={[tree.x, 1.2 * tree.scale, tree.z]} scale={tree.scale} />
        ))}
      </Instances>
      <Instances limit={trees.length} range={trees.length}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial color="#4ea95e" roughness={0.95} />
        {trees.map((tree, index) => (
          <Instance key={`crown_${index}`} position={[tree.x, 3.25 * tree.scale, tree.z]} scale={[tree.scale * 1.15, tree.scale, tree.scale * 1.15]} />
        ))}
      </Instances>
    </group>
  );
}

export function ForestDetailedSubarea({ layout, subareaId, vegetationDensity = 1 }) {
  const area = layout.subareas[subareaId];
  if (!area) return null;
  const landmarks = layout.landmarks.filter((item) => item.subareaId === subareaId);
  const props = layout.props.filter((item) => item.subareaId === subareaId);
  const clusters = createSubareaClusters(area, vegetationDensity);

  return (
    <group>
      {landmarks.map((item) => <ForestModelProp key={item.id} item={item} />)}
      {props.map((item) => <ForestModelProp key={item.id} item={item} />)}
      <SubareaFeatureSet area={area} />
      {clusters.map((cluster) => (
        <ForestClusterModel key={cluster.id} cluster={cluster} />
      ))}
      <Html position={[area.center[0], area.height + 5.5, area.center[2]]} center distanceFactor={18}>
        <div className="rounded-2xl border-2 border-white/80 bg-white/88 px-4 py-2 text-xs font-black text-slate-800 shadow-xl backdrop-blur-sm">
          <span className="mr-2 text-lg">{['🌳', '💧', '🗿', '⛩️'][area.index]}</span>{area.name}
        </div>
      </Html>
    </group>
  );
}


function SubareaFeatureSet({ area }) {
  if (area.id === 'whispering_grove') {
    return (
      <group>
        <StoneCircle center={[6, area.height + 0.12, 20]} radius={3.4} color="#e8d79d" />
        <ForestBench position={[-3.5, area.height + 0.08, 18.5]} rotation={0.35} />
        <ForestBench position={[2.8, area.height + 0.08, 26.5]} rotation={-2.5} />
        <TreeStump position={[-6.5, area.height + 0.12, 27.5]} />
        <FlowerGarden center={[-1.5, area.height + 0.1, 22.5]} radius={3.2} />
      </group>
    );
  }
  if (area.id === 'waterfall_path') {
    return (
      <group>
        <StoneCircle center={[29, area.height + 0.12, 11]} radius={4.1} color="#c8e1db" />
        <ReedCluster position={[24, area.height + 0.08, 13]} />
        <ReedCluster position={[35, area.height + 0.08, 7]} />
        <ForestBench position={[27, area.height + 0.08, 18]} rotation={2.6} />
        <RockGarden center={[35, area.height + 0.1, 16]} />
      </group>
    );
  }
  if (area.id === 'ancient_gate') {
    return (
      <group>
        <RuinWall position={[-20, area.height + 0.1, -4]} rotation={0.5} />
        <RuinWall position={[-34, area.height + 0.1, -10]} rotation={-0.35} />
        <StoneCircle center={[-27, area.height + 0.12, -5]} radius={3.8} color="#d8ce9a" />
        <ForestLantern position={[-23, area.height + 0.05, -8]} />
        <ForestLantern position={[-31, area.height + 0.05, -8]} />
      </group>
    );
  }
  return (
    <group>
      <StoneCircle center={[15, area.height + 0.12, -24]} radius={5.3} color="#e6d18a" />
      <ForestLantern position={[9, area.height + 0.05, -25]} />
      <ForestLantern position={[21, area.height + 0.05, -25]} />
      <FlowerGarden center={[7, area.height + 0.1, -32]} radius={3.5} />
      <FlowerGarden center={[23, area.height + 0.1, -32]} radius={3.5} />
      <ForestBench position={[15, area.height + 0.08, -18]} rotation={Math.PI} />
    </group>
  );
}

function StoneCircle({ center, radius, color }) {
  return (
    <group position={center}>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
            <circleGeometry args={[0.48 + (index % 3) * 0.08, 8]} />
            <meshStandardMaterial color={color} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function FlowerGarden({ center, radius }) {
  return (
    <group position={center}>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = index * 2.399963;
        const r = radius * (0.35 + (index % 3) * 0.25);
        return (
          <group key={index} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]} scale={0.75 + (index % 2) * 0.2}>
            <LowPolyFlower color={index % 3 === 0 ? '#fff1a6' : index % 3 === 1 ? '#ffc9df' : '#cfd8ff'} />
          </group>
        );
      })}
    </group>
  );
}

function ForestBench({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.3, 0.18, 0.65]} />
        <meshStandardMaterial color="#a86f3d" roughness={1} />
      </mesh>
      <mesh position={[0, 1.05, 0.28]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[2.3, 0.16, 0.8]} />
        <meshStandardMaterial color="#b77d45" roughness={1} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.55]} />
          <meshStandardMaterial color="#6f4930" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function TreeStump({ position }) {
  return (
    <group position={position}>
      <Outlined color="#8c613d" position={[0, 0.45, 0]} outlineScale={1.005}>
        <cylinderGeometry args={[0.75, 0.88, 0.9, 10]} />
      </Outlined>
      <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 10]} />
        <meshStandardMaterial color="#d2a36a" roughness={1} />
      </mesh>
    </group>
  );
}

function ReedCluster({ position }) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * 1.8;
        const r = (index % 3) * 0.18;
        return (
          <mesh key={index} position={[Math.cos(angle) * r, 0.65 + (index % 2) * 0.12, Math.sin(angle) * r]} rotation={[0.12 * Math.sin(angle), 0, 0.08 * Math.cos(angle)]}>
            <cylinderGeometry args={[0.025, 0.045, 1.3 + (index % 2) * 0.24, 5]} />
            <meshStandardMaterial color={index % 2 ? '#6aaa5f' : '#86bd63'} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function RockGarden({ center }) {
  return (
    <group position={center}>
      {[[-1.5, 0, 0.4, 0.85], [0, 0, -0.8, 1.1], [1.3, 0, 0.5, 0.7], [0.8, 0, 1.7, 0.55]].map(([x, y, z, scale], index) => (
        <Outlined key={index} color={index % 2 ? '#91a899' : '#a7b8a3'} position={[x, scale * 0.55, z]} outlineScale={1.004}>
          <dodecahedronGeometry args={[scale, 0]} />
        </Outlined>
      ))}
    </group>
  );
}

function RuinWall({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: 5 }, (_, index) => (
        <Outlined key={index} color={index % 2 ? '#aeb69b' : '#bcc2a8'} position={[(index - 2) * 1.05, 0.5 + (index % 2) * 0.25, 0]} outlineScale={1.004}>
          <boxGeometry args={[0.95, 1 + (index % 2) * 0.5, 0.8]} />
        </Outlined>
      ))}
    </group>
  );
}

function ForestModelProp({ item }) {
  const assetId = FOREST_MODEL_ASSETS[item.model];
  if (!assetId) return renderForestFallback(item.model, item);
  const localItem = { ...item, position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      <Model
        assetId={assetId}
        instanceId={`forest-${item.id || item.model}`}
        kind="forest-prop"
        fallback={renderForestFallback(item.model, localItem)}
      />
    </group>
  );
}

function ForestClusterModel({ cluster }) {
  const assetId = FOREST_MODEL_ASSETS[cluster.model];
  if (!assetId) return renderForestClusterFallback(cluster);
  return (
    <group position={cluster.position} rotation={[0, cluster.rotation, 0]} scale={cluster.scale}>
      <Model
        assetId={assetId}
        instanceId={`forest-cluster-${cluster.id}`}
        kind="forest-cluster"
        fallback={renderForestClusterFallback({ ...cluster, position: [0, 0, 0], rotation: 0, scale: 1 })}
      />
    </group>
  );
}

function renderForestFallback(model, item) {
  if (model === 'great_tree') return <ProceduralGreatTree item={item} />;
  if (model === 'vine_arch') return <ProceduralVineArch item={item} />;
  if (model === 'stone_totem') return <ProceduralStoneTotem item={item} />;
  if (model === 'lantern_post') return <ForestLantern position={item.position || [0, 0, 0]} />;
  if (model === 'forest_bridge') return <ProceduralForestBridge item={item} />;
  if (model === 'waterfall_cliff') return <ProceduralWaterfallCliff item={item} />;
  if (model === 'ancient_gate') return <ProceduralAncientGate item={item} />;
  if (model === 'mossy_shrine') return <ProceduralMossyShrine item={item} />;
  return null;
}

function renderForestClusterFallback(cluster) {
  const transform = { position: cluster.position, rotation: [0, cluster.rotation, 0], scale: cluster.scale };
  if (cluster.model === 'fern_cluster') return <ProceduralFernCluster {...transform} />;
  if (cluster.model === 'mushroom_cluster') return <ProceduralMushroomCluster {...transform} />;
  if (cluster.model === 'lantern_post') return <group position={cluster.position} rotation={[0, cluster.rotation, 0]} scale={cluster.scale * 0.7}><ForestLantern position={[0, 0, 0]} /></group>;
  return null;
}


function ProceduralFernCluster({ position, rotation, scale }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.25, 0.38, Math.sin(angle) * 0.25]} rotation={[0.15, -angle, 0.55]} castShadow>
            <coneGeometry args={[0.18, 1.15, 6]} />
            <meshStandardMaterial color={index % 2 ? '#56a95d' : '#69bb67'} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function ProceduralMushroomCluster({ position, rotation, scale }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {[[-0.42, 0, 0.1, 0.62], [0.25, 0, -0.18, 0.82], [0.55, 0, 0.35, 0.48]].map(([x, y, z, s], index) => (
        <group key={index} position={[x, y, z]} scale={s}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 0.84, 7]} />
            <meshStandardMaterial color="#f5ead0" roughness={1} />
          </mesh>
          <mesh position={[0, 0.92, 0]} castShadow>
            <sphereGeometry args={[0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={index % 2 ? '#f39bb4' : '#e7bf65'} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ProceduralStoneTotem({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      {[0, 0.85, 1.7].map((y, index) => (
        <Outlined key={index} color={index % 2 ? '#aeb99e' : '#bbc4aa'} position={[0, y + 0.42, 0]} outlineScale={1.004}>
          <boxGeometry args={[1.05 - index * 0.08, 0.82, 0.9]} />
        </Outlined>
      ))}
      {[0.55, 1.38, 2.2].map((y, index) => (
        <mesh key={`glyph_${index}`} position={[0, y, 0.47]}>
          <circleGeometry args={[0.17, 10]} />
          <meshStandardMaterial color={index % 2 ? '#7bd5d0' : '#f2d46e'} emissive={index % 2 ? '#3bb7b0' : '#d6ad37'} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function ProceduralForestBridge({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} position={[0, 0.32, (index - 5) * 0.72]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 0.18, 0.62]} />
          <meshStandardMaterial color={index % 2 ? '#b67943' : '#c4874c'} roughness={1} />
        </mesh>
      ))}
      {[-1.55, 1.55].flatMap((x) => Array.from({ length: 6 }, (_, index) => (
        <group key={`${x}_${index}`} position={[x, 0, (index - 2.5) * 1.45]}>
          <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.09, 0.12, 1.8, 7]} /><meshStandardMaterial color="#7b4e31" roughness={1} /></mesh>
          <mesh position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.07, 0.09, 1.5, 7]} /><meshStandardMaterial color="#895936" roughness={1} /></mesh>
        </group>
      )))}
    </group>
  );
}

function ProceduralWaterfallCliff({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      {[-2.8, -1.3, 0.2, 1.8, 3.1].map((x, index) => (
        <Outlined key={x} color={index % 2 ? '#869a7d' : '#98aa8b'} position={[x, 1.7 + (index % 2) * 0.35, 0]} outlineScale={1.003}>
          <dodecahedronGeometry args={[1.9 + (index % 3) * 0.2, 0]} />
        </Outlined>
      ))}
      <mesh position={[0.2, 2.0, 1.25]} castShadow>
        <planeGeometry args={[2.2, 4.1]} />
        <meshStandardMaterial color="#72d2ea" emissive="#48aeca" emissiveIntensity={0.3} transparent opacity={0.83} roughness={0.25} />
      </mesh>
      <Sparkles count={26} scale={[3.2, 4, 2]} position={[0.2, 1.7, 1.45]} size={2.5} speed={0.55} color="#e5fbff" />
    </group>
  );
}

function ProceduralAncientGate({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      {[-2.2, 2.2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[0.55, 1.65, 2.75, 3.85].map((y, index) => (
            <Outlined key={y} color={index % 2 ? '#aab29a' : '#bcc2aa'} position={[0, y, 0]} outlineScale={1.003}>
              <boxGeometry args={[1.25, 1.02, 1.2]} />
            </Outlined>
          ))}
        </group>
      ))}
      {[-1.65, -0.55, 0.55, 1.65].map((x, index) => (
        <Outlined key={x} color={index % 2 ? '#aab29a' : '#bcc2aa'} position={[x, 4.4, 0]} outlineScale={1.003}>
          <boxGeometry args={[1.05, 1.0, 1.2]} />
        </Outlined>
      ))}
      <Sparkles count={20} scale={[5, 5, 2]} position={[0, 3.2, 0.8]} size={2.5} speed={0.25} color="#e8dd91" />
    </group>
  );
}

function ProceduralMossyShrine({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      {[0, 1, 2].map((level) => (
        <mesh key={level} position={[0, 0.22 + level * 0.28, 1.2 - level * 0.72]} receiveShadow castShadow>
          <boxGeometry args={[7 - level * 0.8, 0.38, 5.6 - level * 0.7]} />
          <meshStandardMaterial color={level % 2 ? '#a8b287' : '#bbc294'} roughness={1} />
        </mesh>
      ))}
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 2.55, -0.35]} castShadow>
          <cylinderGeometry args={[0.28, 0.38, 4.4, 8]} />
          <meshStandardMaterial color="#796044" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 4.65, -0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 5.3, 8]} />
        <meshStandardMaterial color="#796044" roughness={1} />
      </mesh>
      <mesh position={[0, 5.25, -0.35]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <octahedronGeometry args={[2.25, 0]} />
        <meshStandardMaterial color="#d47858" roughness={0.85} />
      </mesh>
      <LowPolyBush scale={1.1} color="#62ad65" />
    </group>
  );
}

function ProceduralGreatTree({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      <Outlined color="#765033" position={[0, 2.6, 0]} outlineScale={1.004}>
        <cylinderGeometry args={[0.72, 1.05, 5.2, 10]} />
      </Outlined>
      {[[-1.15, 4.4, 0.15, -0.7], [1.05, 4.7, -0.1, 0.68], [0.25, 5.15, 0.55, 0.18]].map(([x, y, z, rz], index) => (
        <mesh key={`branch_${index}`} position={[x, y, z]} rotation={[0, 0, rz]} castShadow>
          <cylinderGeometry args={[0.28, 0.42, 2.7, 8]} />
          <meshStandardMaterial color="#765033" roughness={1} />
        </mesh>
      ))}
      {[
        [-1.7, 6.0, 0, 1.65], [0, 6.55, 0.15, 1.9], [1.75, 5.95, -0.1, 1.55],
        [-0.85, 5.45, 1.05, 1.4], [0.95, 5.35, 1.0, 1.35],
      ].map(([x, y, z, scale], index) => (
        <Outlined key={`crown_${index}`} color={index % 2 ? '#4fae61' : '#5abb68'} position={[x, y, z]} outlineScale={1.003}>
          <icosahedronGeometry args={[scale, 1]} />
        </Outlined>
      ))}
      <Sparkles count={20} scale={[5, 4, 5]} position={[0, 5.7, 0]} size={2.8} speed={0.25} color="#fff2a6" />
    </group>
  );
}

function ProceduralVineArch({ item }) {
  return (
    <group position={item.position} rotation={item.rotation || [0, 0, 0]} scale={item.scale || 1}>
      {[-1.75, 1.75].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.7, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 3.4, 8]} />
            <meshStandardMaterial color="#795438" roughness={1} />
          </mesh>
          <LowPolyBush scale={0.85} color="#4ca65b" />
        </group>
      ))}
      <mesh position={[0, 3.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 3.6, 8]} />
        <meshStandardMaterial color="#795438" roughness={1} />
      </mesh>
      {[-1.35, -0.65, 0, 0.7, 1.35].map((x, index) => (
        <group key={x} position={[x, 3.4 + (index % 2) * 0.16, 0]} scale={0.6}>
          <LowPolyBush scale={0.8} color={index % 2 ? '#58b966' : '#4ea85d'} />
        </group>
      ))}
    </group>
  );
}

export function ForestPuzzleNode({ node, completed, onActivate }) {
  return (
    <group position={node.position}>
      <Outlined color={completed ? '#5bd48a' : '#f2c94c'} position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]} outlineScale={1.015}>
        <octahedronGeometry args={[0.72, 0]} />
      </Outlined>
      <pointLight position={[0, 1.2, 0]} intensity={completed ? 0.6 : 1.5} distance={7} color={completed ? '#6de3a0' : '#ffd866'} />
      {!completed && <Sparkles count={18} scale={3} size={3.5} speed={0.45} color="#fff2a0" position={[0, 1, 0]} />}
      <Html position={[0, 2.1, 0]} center distanceFactor={12}>
        <button
          onClick={(event) => { event.stopPropagation(); if (!completed) onActivate(); }}
          className={`whitespace-nowrap rounded-xl border-2 px-3 py-2 text-xs font-black text-white shadow-xl ${completed ? 'border-emerald-200 bg-emerald-600/90' : 'border-amber-200 bg-amber-500/95'}`}
        >
          {completed ? '✓ 已完成' : `${node.icon} ${node.title}`}
        </button>
      </Html>
    </group>
  );
}

export function ForestEventBeacon({ event, completed, onActivate }) {
  if (completed) return null;
  return (
    <group position={event.position}>
      <Outlined color="#ffd95d" position={[0, 1, 0]} outlineScale={1.02}>
        <dodecahedronGeometry args={[0.58, 0]} />
      </Outlined>
      <Sparkles count={24} scale={4} size={4} speed={0.6} color="#fff1a3" position={[0, 1.2, 0]} />
      <Html position={[0, 2.2, 0]} center distanceFactor={13}>
        <button onClick={(e) => { e.stopPropagation(); onActivate(); }} className="whitespace-nowrap rounded-xl border-2 border-yellow-200 bg-amber-500/95 px-3 py-1.5 text-xs font-black text-white shadow-xl">
          ✨ {event.name}
        </button>
      </Html>
    </group>
  );
}

export function ForestBossSeal({ position, unlocked, objectivesDone, objectiveTotal }) {
  if (unlocked) return null;
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <ringGeometry args={[3.2, 4.2, 32]} />
        <meshBasicMaterial color="#f2c94c" transparent opacity={0.72} />
      </mesh>
      <Outlined color="#7ad49a" position={[0, 2.2, 0]} outlineScale={1.01}>
        <torusGeometry args={[2.2, 0.22, 12, 32]} />
      </Outlined>
      <Html position={[0, 4.6, 0]} center distanceFactor={14}>
        <div className="rounded-2xl border-2 border-amber-200 bg-slate-900/88 px-4 py-2 text-center text-xs font-black text-white shadow-xl">
          <div className="text-amber-300">森林封印</div>
          <div className="mt-1">完成區域目標 {objectivesDone}/{objectiveTotal}</div>
        </div>
      </Html>
    </group>
  );
}

function createSubareaClusters(area, density) {
  const models = ['fern_cluster', 'mushroom_cluster', 'lantern_post'];
  const count = Math.round(10 * density);
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.19 + area.index;
    const radiusX = area.size[0] * (0.27 + ((index * 13) % 10) / 45);
    const radiusZ = area.size[1] * (0.25 + ((index * 7) % 10) / 50);
    return {
      id: `${area.id}_cluster_${index}`,
      model: models[(index + area.index) % models.length],
      position: [
        area.center[0] + Math.cos(angle) * radiusX,
        area.height + 0.03,
        area.center[2] + Math.sin(angle) * radiusZ,
      ],
      rotation: angle * 0.45,
      scale: 0.7 + ((index * 11) % 8) / 10,
    };
  });
}

function isRoadCore(x, z) {
  return Math.abs(x) < 6 || Math.abs(z - 22) < 7 || (x > 12 && z > -8 && z < 22) || (x < -12 && z > -17 && z < 18);
}

function areaColor(index) {
  return ['#73c46a', '#69c6a3', '#8fbe68', '#6bb26a'][index] || '#73c46a';
}
