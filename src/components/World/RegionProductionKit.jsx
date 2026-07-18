// 八大區域正式生產場景組裝器。
// 場景資料、視覺元件、實體碰撞與互動 Socket 分離；不再使用固定十字路與四平台模板。
import { Html, Sparkles } from '@react-three/drei';
import { BallCollider, CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import Outlined from '../3D/Outlined.jsx';
import Model from '../3D/Model.jsx';
import { getRegionStructurePrefab } from '../../data/physicalObjectCatalog.js';
import { STRUCTURE_ASSETS } from '../../data/productionAssetCatalog.js';
import RegionTraversalLayer from './RegionTraversalLayer.jsx';
import RegionAssetDetailLayer from './RegionAssetDetailLayer.jsx';
import { sampleTraversalSurface } from '../../services/TraversalSurfaceService.js';

export function RegionProductionTerrain({ layout, region }) {
  if (!layout) return null;
  return (
    <group name={`region-production-${layout.id}`}>
      <RegionTraversalLayer layout={layout} />
      {layout.structures.map((item) => <ModularStructure key={item.id} instance={item} regionAccent={region.accent} />)}
      {layout.subareas.map((area, index) => <SubareaMarker key={`${area.id}-label`} area={area} index={index} />)}
      <RegionDecorationLayer layout={layout} />
      <RegionAssetDetailLayer layout={layout} />
      <BoundarySystem layout={layout} />
      <Sparkles count={48} scale={[92, 16, 92]} size={2.2} speed={0.18} color={layout.palette.accent} position={[0, 5, 0]} />
    </group>
  );
}

export function ModularStructure({ instance, regionAccent }) {
  const prefab = getRegionStructurePrefab(instance.type);
  if (!prefab) return null;
  const palette = { ...prefab.palette, accent: regionAccent || prefab.palette.trim };
  return (
    <group
      name={`structure-${instance.id}`}
      position={instance.position}
      rotation={[0, instance.rotation || 0, 0]}
      scale={instance.scale || 1}
      userData={{ prefabType: instance.type, structureId: instance.id, subareaId: instance.subareaId }}
    >
      <RigidBody type="fixed" colliders={false} name={`${instance.id}-physics`}>
        {prefab.colliders.map((collider) => <PhysicalCollider key={collider.id} collider={collider} />)}
      </RigidBody>
      <Model
        assetId={STRUCTURE_ASSETS[instance.type]?.assetId}
        instanceId={`structure-${instance.id}`}
        kind="region-structure"
        fallback={<>{prefab.parts.map((part) => <VisualPart key={part.id} part={part} palette={palette} />)}</>}
      />
      {prefab.sockets.map((socket) => (
        <group key={socket.id} name={`${instance.id}-socket-${socket.id}`} position={socket.position} userData={{ socketType: socket.type, socketId: socket.id }} />
      ))}
    </group>
  );
}

function PhysicalCollider({ collider }) {
  const common = { position: collider.position, rotation: collider.rotation || [0, 0, 0], friction: 0.9 };
  if (collider.shape === 'cylinder') return <CylinderCollider {...common} args={[collider.halfHeight, collider.radius]} />;
  if (collider.shape === 'ball') return <BallCollider {...common} args={[collider.radius]} />;
  return <CuboidCollider {...common} args={collider.halfExtents} />;
}

function VisualPart({ part, palette }) {
  const color = palette[part.colorSlot] || palette.base || '#cccccc';
  const props = {
    color,
    position: part.position || [0, 0, 0],
    rotation: part.rotation || [0, 0, 0],
    outlineScale: 1.008,
  };
  if (part.shape === 'cylinder') return <Outlined {...props}><cylinderGeometry args={part.args} /></Outlined>;
  if (part.shape === 'cone') return <Outlined {...props}><coneGeometry args={part.args} /></Outlined>;
  if (part.shape === 'sphere') return <Outlined {...props} scale={part.scale || [1, 1, 1]}><sphereGeometry args={part.args} /></Outlined>;
  if (part.shape === 'torus') return <Outlined {...props}><torusGeometry args={part.args} /></Outlined>;
  if (part.shape === 'octahedron') return <Outlined {...props}><octahedronGeometry args={part.args} /></Outlined>;
  return <Outlined {...props}><boxGeometry args={part.scale || [1, 1, 1]} /></Outlined>;
}

function SubareaMarker({ area, index }) {
  return (
    <Html position={[area.center[0], area.elevation + 4.8, area.center[1]]} center distanceFactor={20} zIndexRange={[24, 0]}>
      <div className="pointer-events-none rounded-2xl border-2 border-white/90 bg-white/85 px-3 py-1 text-xs font-black text-slate-800 shadow-lg backdrop-blur-sm">
        <span className="mr-1 text-amber-500">{['①', '②', '③', '④'][index]}</span>{area.name}
      </div>
    </Html>
  );
}

function RegionDecorationLayer({ layout }) {
  const items = useMemo(() => createDecorationItems(layout), [layout]);
  return (
    <group name={`${layout.id}-decorations`}>
      {items.map((item) => <RegionDecoration key={item.id} item={item} palette={layout.palette} family={layout.decoration.family} />)}
    </group>
  );
}

function RegionDecoration({ item, palette, family }) {
  const position = [item.x, item.y, item.z];
  if (family === 'wind') {
    if (item.variant % 3 === 0) return <WindFlag position={position} color={palette.accent} scale={item.scale} />;
    return <FlowerTuft position={position} color={item.variant % 2 ? '#fff4a8' : '#b9efff'} scale={item.scale} />;
  }
  if (family === 'snow') {
    if (item.variant % 3 === 0) return <CrystalCluster position={position} color={palette.accent} scale={item.scale} />;
    return <SnowPine position={position} color={item.variant % 2 ? '#8ac6b2' : '#7bb1c7'} scale={item.scale} />;
  }
  if (family === 'farm') {
    if (item.variant % 3 === 0) return <FruitTree position={position} color={item.variant % 2 ? '#f29a57' : '#f3cf4f'} scale={item.scale} />;
    return <HayStack position={position} scale={item.scale} />;
  }
  if (family === 'star') {
    if (item.variant % 3 === 0) return <StarLamp position={position} color={palette.accent} scale={item.scale} />;
    return <FlowerTuft position={position} color={item.variant % 2 ? '#ff9bc7' : '#fff099'} scale={item.scale} />;
  }
  if (family === 'crystal') {
    return item.variant % 2 === 0
      ? <CrystalCluster position={position} color={item.variant % 4 === 0 ? '#6df4f1' : '#8aaeff'} scale={item.scale} />
      : <ReedCluster position={position} color="#78b9a7" scale={item.scale} />;
  }
  if (family === 'canyon') {
    return item.variant % 2 === 0
      ? <Cactus position={position} color="#6ca95d" scale={item.scale} />
      : <RockCluster position={position} color={item.variant % 3 === 0 ? '#c57c51' : '#d5955d'} scale={item.scale} />;
  }
  if (family === 'mushroom') {
    return item.variant % 2 === 0
      ? <MiniMushroom position={position} color={item.variant % 4 === 0 ? '#e96eb7' : '#8f73da'} scale={item.scale} />
      : <ReedCluster position={position} color="#7bb989" scale={item.scale} />;
  }
  return item.variant % 2 === 0
    ? <GearPile position={position} color={palette.accent} scale={item.scale} />
    : <SteamPipe position={position} color="#7e8b83" scale={item.scale} />;
}

function BoundarySystem({ layout }) {
  const points = useMemo(() => {
    const [width, depth] = layout.size;
    const result = [];
    const count = 28;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      result.push({ x: Math.cos(angle) * width * 0.48, z: Math.sin(angle) * depth * 0.48, index });
    }
    return result;
  }, [layout]);
  return (
    <group name={`${layout.id}-boundary`}>
      {points.map((point) => <BoundaryPiece key={point.index} point={point} layout={layout} />)}
    </group>
  );
}

function BoundaryPiece({ point, layout }) {
  const position = [point.x, 1.3 + (point.index % 3) * 0.3, point.z];
  if (layout.boundary === 'snow_peaks') return <Outlined color="#cde9ef" position={position} rotation={[0, point.index * 0.4, 0]} outlineScale={1.004}><coneGeometry args={[2.8, 5.8, 7]} /></Outlined>;
  if (layout.boundary === 'canyon_walls') return <Outlined color="#c77f4e" position={position} rotation={[0, point.index * 0.35, 0]} outlineScale={1.004}><dodecahedronGeometry args={[2.7 + (point.index % 2) * 0.5, 0]} /></Outlined>;
  if (layout.boundary === 'machine_wall') return <Outlined color="#69776f" position={position} rotation={[0, point.index * 0.2, 0]} outlineScale={1.004}><boxGeometry args={[2.8, 4.2, 2.2]} /></Outlined>;
  if (layout.boundary === 'root_ring') return <GiantRoot position={position} color="#765a48" scale={1 + (point.index % 3) * 0.15} />;
  if (layout.boundary === 'crystal_ridge') return <CrystalCluster position={position} color={point.index % 2 ? '#63e1dc' : '#86aaff'} scale={1.8} />;
  if (layout.boundary === 'orchard_fence') return <FruitTree position={position} color={point.index % 2 ? '#f2a45f' : '#efcf4e'} scale={1.25} />;
  if (layout.boundary === 'garden_wall') return <StarLamp position={position} color={layout.palette.accent} scale={1.05} />;
  return <Outlined color={mixColor(layout.palette.base, layout.palette.accent, 0.28)} position={position} rotation={[0, point.index * 0.37, 0]} outlineScale={1.004}><coneGeometry args={[2.5, 4.6, 8]} /></Outlined>;
}

function createDecorationItems(layout) {
  const items = [];
  let seed = hashString(layout.id);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const density = layout.decoration.density;
  let attempts = 0;
  while (items.length < density && attempts < density * 12) {
    const index = items.length;
    const area = layout.subareas[(index + attempts) % layout.subareas.length];
    const angle = random() * Math.PI * 2;
    const radiusX = (area.size[0] * 0.32) * (0.45 + random() * 0.55);
    const radiusZ = (area.size[1] * 0.32) * (0.45 + random() * 0.55);
    const x = area.center[0] + Math.cos(angle) * radiusX;
    const z = area.center[1] + Math.sin(angle) * radiusZ;
    const surface = sampleTraversalSurface(layout, x, z);
    attempts += 1;
    if (!surface.walkable || surface.kind === 'bridge' || surface.kind === 'road') continue;
    items.push({ id: `${layout.id}-decor-${index}`, x, z, y: surface.y, scale: 0.75 + random() * 0.75, variant: Math.floor(random() * 8) });
  }
  return items;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function FlowerTuft({ position, color, scale }) {
  return <group position={position} scale={scale}>{[-0.25, 0, 0.24].map((x, i) => <Outlined key={i} color={i === 1 ? color : mixColor(color, '#ffffff', 0.18)} position={[x, 0.25 + i * 0.05, (i - 1) * 0.12]} outlineScale={1.02}><sphereGeometry args={[0.2, 8, 7]} /></Outlined>)}</group>;
}
function WindFlag({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color="#795b3e" position={[0, 1.0, 0]} outlineScale={1.01}><cylinderGeometry args={[0.06, 0.08, 2.0, 6]} /></Outlined><mesh position={[0.42, 1.55, 0]}><planeGeometry args={[0.8, 0.45]} /><meshToonMaterial color={color} side={2} /></mesh></group>;
}
function SnowPine({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color="#765b45" position={[0, 0.7, 0]} outlineScale={1.01}><cylinderGeometry args={[0.12, 0.18, 1.4, 7]} /></Outlined>{[0.9, 1.45, 2.0].map((y, i) => <Outlined key={y} color={i === 2 ? mixColor(color, '#ffffff', 0.3) : color} position={[0, y, 0]} outlineScale={1.008}><coneGeometry args={[0.95 - i * 0.15, 1.2, 8]} /></Outlined>)}</group>;
}
function CrystalCluster({ position, color, scale }) {
  return <group position={position} scale={scale}>{[[-0.35, 0.55, 0.0, 0.45], [0, 0.8, 0.1, 0.65], [0.38, 0.5, -0.05, 0.4]].map(([x, y, z, s], i) => <Outlined key={i} color={i === 1 ? color : mixColor(color, '#ffffff', 0.18)} position={[x, y, z]} rotation={[0, i * 0.45, 0]} outlineScale={1.01}><octahedronGeometry args={[s, 0]} /></Outlined>)}</group>;
}
function FruitTree({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color="#79512f" position={[0, 1.0, 0]} outlineScale={1.01}><cylinderGeometry args={[0.18, 0.28, 2.0, 8]} /></Outlined><Outlined color="#5fa45d" position={[0, 2.35, 0]} outlineScale={1.008}><sphereGeometry args={[1.0, 10, 9]} /></Outlined>{[[-0.4, 2.5, 0.5], [0.4, 2.2, 0.45], [0.15, 2.7, -0.3]].map((p, i) => <Outlined key={i} color={color} position={p} outlineScale={1.02}><sphereGeometry args={[0.14, 8, 7]} /></Outlined>)}</group>;
}
function HayStack({ position, scale }) {
  return <Outlined color="#e6bd54" position={[position[0], position[1] + 0.5, position[2]]} scale={scale} outlineScale={1.008}><cylinderGeometry args={[0.65, 0.75, 1.0, 10]} /></Outlined>;
}
function StarLamp({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color="#6e5945" position={[0, 1.0, 0]} outlineScale={1.01}><cylinderGeometry args={[0.07, 0.1, 2.0, 7]} /></Outlined><Outlined color={color} position={[0, 2.12, 0]} rotation={[0, 0, Math.PI / 4]} outlineScale={1.012}><octahedronGeometry args={[0.3, 0]} /></Outlined></group>;
}
function ReedCluster({ position, color, scale }) {
  return <group position={position} scale={scale}>{[-0.22, 0, 0.22].map((x, i) => <group key={i}><Outlined color="#6e9f70" position={[x, 0.45 + i * 0.05, 0]} outlineScale={1.02}><cylinderGeometry args={[0.025, 0.04, 0.9 + i * 0.1, 6]} /></Outlined><Outlined color={color} position={[x, 0.95 + i * 0.1, 0]} outlineScale={1.02}><sphereGeometry args={[0.08, 7, 6]} /></Outlined></group>)}</group>;
}
function Cactus({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color={color} position={[0, 0.9, 0]} outlineScale={1.01}><cylinderGeometry args={[0.22, 0.28, 1.8, 8]} /></Outlined><Outlined color={color} position={[0.28, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} outlineScale={1.01}><cylinderGeometry args={[0.1, 0.12, 0.65, 7]} /></Outlined></group>;
}
function RockCluster({ position, color, scale }) {
  return <group position={position} scale={scale}>{[[-0.35, 0.3, 0, 0.45], [0.1, 0.5, 0.05, 0.65], [0.45, 0.25, -0.1, 0.35]].map(([x, y, z, s], i) => <Outlined key={i} color={i === 1 ? color : mixColor(color, '#5b4438', 0.2)} position={[x, y, z]} rotation={[0, i * 0.5, 0]} outlineScale={1.008}><dodecahedronGeometry args={[s, 0]} /></Outlined>)}</group>;
}
function MiniMushroom({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color="#eee1c8" position={[0, 0.34, 0]} outlineScale={1.01}><cylinderGeometry args={[0.1, 0.14, 0.65, 8]} /></Outlined><Outlined color={color} position={[0, 0.78, 0]} scale={[1, 0.5, 1]} outlineScale={1.01}><sphereGeometry args={[0.38, 10, 8]} /></Outlined></group>;
}
function GearPile({ position, color, scale }) {
  return <group position={position} scale={scale}>{[0, 1].map((i) => <group key={i} position={[i * 0.35, 0.42 + i * 0.12, 0]} rotation={[Math.PI / 2, 0, i * 0.4]}><Outlined color={i ? color : '#7f8c84'} outlineScale={1.01}><torusGeometry args={[0.35, 0.12, 8, 12]} /></Outlined></group>)}</group>;
}
function SteamPipe({ position, color, scale }) {
  return <group position={position} scale={scale}><Outlined color={color} position={[0, 0.7, 0]} outlineScale={1.01}><cylinderGeometry args={[0.12, 0.15, 1.4, 8]} /></Outlined><Outlined color={color} position={[0.28, 1.35, 0]} rotation={[0, 0, Math.PI / 2]} outlineScale={1.01}><cylinderGeometry args={[0.12, 0.12, 0.55, 8]} /></Outlined></group>;
}
function GiantRoot({ position, color, scale }) {
  return <Outlined color={color} position={position} rotation={[0.2, 0.4, -0.3]} scale={scale} outlineScale={1.005}><cylinderGeometry args={[0.45, 0.8, 4.4, 8]} /></Outlined>;
}

function mixColor(a, b, ratio) {
  const parse = (hex) => hex.replace('#', '').match(/.{2}/g).map((value) => Number.parseInt(value, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const rgb = [ar, ag, ab].map((value, index) => Math.round(value * (1 - ratio) + [br, bg, bb][index] * ratio));
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
