// v0.23 分區地形、道路、水域、裂縫與橋梁 Runtime。
// 不使用全圖底板；所有碰撞與視覺都由 TraversalSurfaceService 產生，確保同一份幾何規則可被玩家、AI 與驗證器共用。
import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import Outlined from '../3D/Outlined.jsx';
import Model from '../3D/Model.jsx';
import { BRIDGE_ASSET } from '../../data/productionAssetCatalog.js';
import RegionWaterSurface from './RegionWaterSurface.jsx';
import {
  buildRoadRuns,
  buildWalkableRectangles,
  getWaterBehavior,
  resolveBridgeGeometry,
} from '../../services/TraversalSurfaceService.js';

export default function RegionTraversalLayer({ layout }) {
  const baseRectangles = useMemo(() => buildWalkableRectangles(layout, { cellSize: 4 }), [layout]);
  const terraceRectangles = useMemo(() => layout.subareas.flatMap((area) => buildWalkableRectangles(layout, {
    scope: { id: area.id, center: area.center, size: area.size },
    elevation: area.elevation,
    cellSize: 3.5,
  })), [layout]);
  const roadRuns = useMemo(() => layout.roads.flatMap((road) => buildRoadRuns(layout, road)), [layout]);
  const bridges = useMemo(() => layout.bridges.map((bridge) => resolveBridgeGeometry(layout, bridge)), [layout]);

  return (
    <group name={`${layout.id}-traversal-foundation`}>
      <GroundRectangles rectangles={baseRectangles} color={layout.palette.base} kind="ground" />
      <GroundRectangles rectangles={terraceRectangles} color={mixColor(layout.palette.patch, layout.palette.accent, 0.08)} kind="terrace" />
      <RoadNetwork runs={roadRuns} palette={layout.palette} />
      {layout.waters.map((water) => <WaterOrRavine key={water.id} water={water} palette={layout.palette} />)}
      {bridges.map((bridge) => <ResolvedBridge key={bridge.id} bridge={bridge} palette={layout.palette} />)}
    </group>
  );
}

function GroundRectangles({ rectangles, color, kind }) {
  const thickness = kind === 'terrace' ? 0.5 : 0.7;
  return (
    <group name={`${kind}-rectangles`}>
      <RigidBody type="fixed" colliders={false} name={`${kind}-surface-rigidbody`}>
        {rectangles.map((rect) => (
          <CuboidCollider
            key={`${rect.id}-collider`}
            args={[rect.size[0] / 2, thickness / 2, rect.size[1] / 2]}
            position={[rect.center[0], rect.elevation - thickness / 2, rect.center[2]]}
            friction={1.1}
            userData={{ traversalKind: kind, surfaceId: rect.id }}
          />
        ))}
      </RigidBody>
      {rectangles.map((rect, index) => (
        <mesh
          key={rect.id}
          position={[rect.center[0], rect.elevation - thickness / 2, rect.center[2]]}
          receiveShadow
          name={rect.id}
        >
          <boxGeometry args={[rect.size[0], thickness, rect.size[1]]} />
          <meshToonMaterial color={index % 3 === 0 ? mixColor(color, '#ffffff', 0.025) : color} />
        </mesh>
      ))}
    </group>
  );
}

function RoadNetwork({ runs, palette }) {
  return (
    <group name="terrain-road-network">
      {runs.map((run) => <RoadRun key={run.id} run={run} palette={palette} />)}
    </group>
  );
}

function RoadRun({ run, palette }) {
  const dx = run.to[0] - run.from[0];
  const dy = run.to[1] - run.from[1];
  const dz = run.to[2] - run.from[2];
  const horizontalLength = Math.hypot(dx, dz);
  const length = Math.hypot(horizontalLength, dy);
  const yaw = Math.atan2(dx, dz);
  const slope = Math.atan2(dy, Math.max(0.001, horizontalLength));
  const center = [
    (run.from[0] + run.to[0]) / 2,
    (run.from[1] + run.to[1]) / 2 + 0.09,
    (run.from[2] + run.to[2]) / 2,
  ];
  const color = run.kind === 'secondary' ? mixColor(palette.path, palette.base, 0.18) : palette.path;
  return (
    <group position={center} rotation={[0, yaw, 0]} name={`road-${run.id}`}>
      <RigidBody type="fixed" colliders={false} rotation={[-slope, 0, 0]}>
        <CuboidCollider args={[run.width / 2, 0.12, length / 2]} friction={1.15} userData={{ traversalKind: 'road', roadId: run.id }} />
        <mesh receiveShadow>
          <boxGeometry args={[run.width, 0.24, length]} />
          <meshToonMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.126, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(0.45, run.width * 0.09), length * 0.9]} />
          <meshToonMaterial color={mixColor(color, '#ffffff', 0.18)} transparent opacity={0.52} />
        </mesh>
      </RigidBody>
    </group>
  );
}

function WaterOrRavine({ water, palette }) {
  const behavior = getWaterBehavior(water);
  if (behavior === 'ravine') return <RavineBody water={water} palette={palette} />;
  return <RegionWaterSurface water={water} palette={palette} />;
}

function RavineBody({ water, palette }) {
  const [width, depth] = water.size;
  return (
    <group position={[water.center[0], 0, water.center[1]]} rotation={[0, water.rotation || 0, 0]} name={`ravine-${water.id}`}>
      <mesh position={[0, -7.5, 0]} receiveShadow>
        <boxGeometry args={[width * 0.7, 0.35, depth]} />
        <meshToonMaterial color="#33251f" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 + 0.7), -2.5, 0]}>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.1, 2.8, depth / 2]} userData={{ traversalKind: 'ravine-wall', waterId: water.id }} />
            <mesh receiveShadow castShadow>
              <boxGeometry args={[2.2, 5.6, depth]} />
              <meshToonMaterial color={mixColor(palette.base, '#654333', 0.52)} />
            </mesh>
          </RigidBody>
        </group>
      ))}
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#241c22" transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

function ResolvedBridge({ bridge, palette }) {
  const fallbackVisual = <BridgeFallback bridge={bridge} />;
  const scale = [bridge.width / 4.4, 1, bridge.resolvedLength / 9.5];
  const dirX = Math.sin(bridge.resolvedRotation);
  const dirZ = Math.cos(bridge.resolvedRotation);
  const approachLength = 3.2;
  const startOuter = [bridge.start[0] - dirX * approachLength, bridge.startGround, bridge.start[1] - dirZ * approachLength];
  const startInner = [bridge.start[0], bridge.deckY, bridge.start[1]];
  const endInner = [bridge.end[0], bridge.deckY, bridge.end[1]];
  const endOuter = [bridge.end[0] + dirX * approachLength, bridge.endGround, bridge.end[1] + dirZ * approachLength];

  return (
    <group name={`bridge-${bridge.id}`}>
      <group position={[bridge.center[0], bridge.deckY, bridge.center[1]]} rotation={[0, bridge.resolvedRotation, 0]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[bridge.width / 2, 0.16, bridge.resolvedLength / 2]} friction={1.05} userData={{ traversalKind: 'bridge', bridgeId: bridge.id }} />
          <CuboidCollider args={[0.12, 0.58, bridge.resolvedLength / 2]} position={[-bridge.width / 2, 0.55, 0]} />
          <CuboidCollider args={[0.12, 0.58, bridge.resolvedLength / 2]} position={[bridge.width / 2, 0.55, 0]} />
        </RigidBody>
        <Model assetId={BRIDGE_ASSET.assetId} instanceId={`region-bridge:${bridge.id}`} kind="region-bridge" scale={scale} fallback={fallbackVisual} />
      </group>
      <ApproachRamp id={`${bridge.id}-start`} from={startOuter} to={startInner} width={bridge.width + 0.8} color={palette.path} />
      <ApproachRamp id={`${bridge.id}-end`} from={endInner} to={endOuter} width={bridge.width + 0.8} color={palette.path} />
    </group>
  );
}

function ApproachRamp({ id, from, to, width, color }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const horizontal = Math.hypot(dx, dz);
  const length = Math.hypot(horizontal, dy);
  const yaw = Math.atan2(dx, dz);
  const slope = Math.atan2(dy, Math.max(0.001, horizontal));
  const center = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return (
    <group position={center} rotation={[0, yaw, 0]} name={`bridge-approach-${id}`}>
      <RigidBody type="fixed" colliders={false} rotation={[-slope, 0, 0]}>
        <CuboidCollider args={[width / 2, 0.15, length / 2]} friction={1.1} userData={{ traversalKind: 'bridge-approach', bridgeId: id }} />
        <mesh receiveShadow><boxGeometry args={[width, 0.3, length]} /><meshToonMaterial color={color} /></mesh>
      </RigidBody>
    </group>
  );
}

function BridgeFallback({ bridge }) {
  const plankCount = Math.max(5, Math.round(bridge.resolvedLength / 0.9));
  const plankStep = bridge.resolvedLength / plankCount;
  return (
    <group name={`${bridge.id}-procedural-fallback`}>
      {Array.from({ length: plankCount }).map((_, index) => (
        <Outlined key={index} color={index % 2 ? '#a77649' : '#b88655'} position={[0, 0, -bridge.resolvedLength / 2 + plankStep * (index + 0.5)]} outlineScale={1.006}>
          <boxGeometry args={[bridge.width, 0.28, plankStep * 0.9]} />
        </Outlined>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * bridge.width / 2, 0, 0]}>
          <Outlined color="#6e5138" position={[0, 0.82, 0]} outlineScale={1.006}><boxGeometry args={[0.16, 0.16, bridge.resolvedLength]} /></Outlined>
          {Array.from({ length: 6 }).map((_, index) => (
            <Outlined key={index} color="#75583c" position={[0, 0.46, -bridge.resolvedLength / 2 + (bridge.resolvedLength / 5) * index]} outlineScale={1.006}>
              <boxGeometry args={[0.18, 0.9, 0.18]} />
            </Outlined>
          ))}
        </group>
      ))}
    </group>
  );
}

function mixColor(a, b, ratio) {
  const parse = (hex) => hex.replace('#', '').match(/.{2}/g).map((value) => Number.parseInt(value, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const rgb = [ar, ag, ab].map((value, index) => Math.round(value * (1 - ratio) + [br, bg, bb][index] * ratio));
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
