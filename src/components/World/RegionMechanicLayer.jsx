// 區域核心機制層：八區共用事件管線，但每區使用不同視覺、數學脈絡與節點名稱。
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import Outlined from '../3D/Outlined.jsx';
import { useStore } from '../../store/useStore.js';

export default function RegionMechanicLayer({ profile }) {
  const progress = useStore((state) => state.worldProgress.regionMechanicProgress?.[profile.regionId] || {});
  const openPanel = useStore((state) => state.openPanel);
  const completeMechanic = useStore((state) => state.completeRegionMechanic);
  const showHint = useStore((state) => state.showWorldHint);

  const activate = (mechanicNode) => {
    if (progress[mechanicNode.id]) {
      const result = completeMechanic(profile.regionId, mechanicNode.id);
      if (!result.eventCompleted) showHint(result.eventChanged ? `${mechanicNode.label}已同步目前事件。` : `${mechanicNode.label}已完成。`);
      return;
    }
    const previous = profile.mechanic.nodes.find((item) => item.order === mechanicNode.order - 1);
    if (previous && !progress[previous.id]) {
      showHint(`請先完成：${previous.label}`);
      return;
    }
    openPanel('regionMechanic', { regionId: profile.regionId, nodeId: mechanicNode.id });
  };

  return (
    <group name={`region-mechanic-${profile.mechanic.id}`}>
      {profile.mechanic.nodes.map((mechanicNode) => {
        const previous = profile.mechanic.nodes.find((item) => item.order === mechanicNode.order - 1);
        const locked = Boolean(previous && !progress[previous.id]);
        const completed = Boolean(progress[mechanicNode.id]);
        return (
          <MechanicNode
            key={mechanicNode.id}
            node={mechanicNode}
            variant={profile.mechanic.variant}
            completed={completed}
            locked={locked}
            onActivate={() => activate(mechanicNode)}
          />
        );
      })}
    </group>
  );
}

function MechanicNode({ node, variant, completed, locked, onActivate }) {
  const animatedRef = useRef(null);
  useFrame((_, delta) => {
    if (!animatedRef.current || locked) return;
    if (['wind', 'clockwork', 'crystal'].includes(variant)) animatedRef.current.rotation.y += delta * (completed ? 0.35 : 0.9);
    if (variant === 'mushroom') animatedRef.current.position.y = 1.0 + Math.abs(Math.sin(performance.now() * 0.003)) * 0.28;
    if (variant === 'star') animatedRef.current.rotation.z += delta * 0.35;
  });
  const displayColor = locked ? '#7b8790' : completed ? '#65d68a' : node.color;

  return (
    <group position={node.position} name={`mechanic-node-${node.id}`} onClick={(event) => { event.stopPropagation(); onActivate(); }}>
      <group ref={animatedRef} position={[0, 1.0, 0]}>
        <MechanicShape variant={variant} color={displayColor} completed={completed} />
      </group>
      {!locked && <Sparkles count={completed ? 10 : 22} scale={3.4} size={completed ? 2 : 4} speed={0.4} color={displayColor} position={[0, 1.3, 0]} />}
      <Html zIndexRange={[24, 0]} position={[0, 2.8, 0]} center distanceFactor={14}>
        <button
          onClick={(event) => { event.stopPropagation(); onActivate(); }}
          className={`whitespace-nowrap rounded-2xl border-2 px-3 py-1.5 text-xs font-black text-white shadow-xl active:scale-95 ${locked ? 'border-slate-300 bg-slate-600/90' : completed ? 'border-emerald-200 bg-emerald-600/92' : 'border-white/85 bg-slate-800/88'}`}
        >
          {locked ? '🔒' : completed ? '✓' : node.icon} {node.label}
        </button>
      </Html>
    </group>
  );
}

function MechanicShape({ variant, color, completed }) {
  if (variant === 'wind') return <group><Outlined color={color} outlineScale={1.015}><cylinderGeometry args={[0.14, 0.2, 2.0, 8]} /></Outlined><Outlined color={color} position={[0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]} outlineScale={1.012}><torusGeometry args={[0.7, 0.12, 8, 20]} /></Outlined></group>;
  if (variant === 'snow') return <Outlined color={color} outlineScale={1.018}><octahedronGeometry args={[0.9, 0]} /></Outlined>;
  if (variant === 'farm') return <group>{[-0.55, 0, 0.55].map((x) => <Outlined key={x} color={color} position={[x, 0, 0]} outlineScale={1.012}><boxGeometry args={[0.42, 0.9, 0.42]} /></Outlined>)}</group>;
  if (variant === 'star') return <Outlined color={color} rotation={[Math.PI / 2, 0, Math.PI / 4]} outlineScale={1.018}><octahedronGeometry args={[0.9, 0]} /></Outlined>;
  if (variant === 'crystal') return <group><Outlined color={color} outlineScale={1.018}><octahedronGeometry args={[0.85, 0]} /></Outlined><mesh position={[0, 0, 0.95]}><coneGeometry args={[0.18, 1.8, 8]} /><meshBasicMaterial color={color} transparent opacity={completed ? 0.45 : 0.75} /></mesh></group>;
  if (variant === 'canyon') return <group><Outlined color={color} outlineScale={1.012}><cylinderGeometry args={[0.25, 0.35, 1.5, 8]} /></Outlined><Outlined color="#79533a" position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]} outlineScale={1.01}><torusGeometry args={[0.55, 0.12, 8, 18]} /></Outlined></group>;
  if (variant === 'mushroom') return <group><Outlined color="#ece0cb" position={[0, -0.45, 0]} outlineScale={1.012}><cylinderGeometry args={[0.24, 0.34, 1.0, 10]} /></Outlined><Outlined color={color} position={[0, 0.15, 0]} scale={[1.2, 0.55, 1.2]} outlineScale={1.014}><sphereGeometry args={[0.72, 14, 10]} /></Outlined></group>;
  return <group><Outlined color={color} rotation={[Math.PI / 2, 0, 0]} outlineScale={1.014}><torusGeometry args={[0.75, 0.18, 10, 24]} /></Outlined>{Array.from({ length: 8 }).map((_, index) => { const angle = index / 8 * Math.PI * 2; return <Outlined key={index} color={color} position={[Math.cos(angle) * 0.95, Math.sin(angle) * 0.95, 0]} outlineScale={1.01}><boxGeometry args={[0.25, 0.25, 0.25]} /></Outlined>; })}</group>;
}
