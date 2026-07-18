// 八區結構室內 Pocket Runtime。
// 室外入口只負責建立描述物件；室內房間、家具、互動與退出門在獨立封閉空間渲染。
import { Html, Sparkles } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import { getEnterableRegionStructures } from '../../data/regionInteriorDefinitions.js';
import { findStructureEntrySocket } from '../../services/StructureSocketService.js';
import { useStore } from '../../store/useStore.js';
import Outlined from '../3D/Outlined.jsx';
import { SFX } from '../../audio/sfx.js';
import CanonicalInteriorKit from './CanonicalInteriorKit.jsx';
import { getInteriorRoomDefinition } from '../../data/interiorTowerV034Catalog.js';

export default function RegionInteriorLayer({ layout }) {
  const activeInterior = useStore((state) => state.activeRegionInterior);
  const enterInterior = useStore((state) => state.enterRegionInterior);
  const entries = useMemo(() => getEnterableRegionStructures(layout), [layout]);
  if (!layout) return null;

  return (
    <group name={`region-interiors-${layout.id}`}>
      {!activeInterior && entries.map(({ structure, interior }) => {
        const entry = findStructureEntrySocket(layout, structure);
        if (!entry) return null;
        return (
          <InteriorEntryPortal
            key={interior.id}
            position={entry.position}
            label={interior.label}
            onEnter={() => { SFX.portal(); enterInterior(interior); }}
          />
        );
      })}
      {activeInterior?.regionId === layout.id && <InteriorPocket interior={activeInterior} />}
    </group>
  );
}

function InteriorEntryPortal({ position, label, onEnter }) {
  return (
    <group position={position} name={`interior-entry-${label}`} onClick={(event) => { event.stopPropagation(); onEnter(); }}>
      <mesh position={[0, 1.25, 0]}><ringGeometry args={[0.62, 0.86, 24]} /><meshBasicMaterial color="#fff2a8" transparent opacity={0.8} /></mesh>
      <Sparkles count={12} scale={[2, 2.8, 2]} size={3} speed={0.28} color="#fff1a0" position={[0, 1.2, 0]} />
      <Html position={[0, 2.4, 0]} center distanceFactor={13} zIndexRange={[25, 0]}>
        <button type="button" onClick={(event) => { event.stopPropagation(); onEnter(); }} className="whitespace-nowrap rounded-2xl border-2 border-amber-100 bg-amber-700/92 px-3 py-1.5 text-xs font-black text-white shadow-xl active:scale-95">
          🚪 進入{label}
        </button>
      </Html>
    </group>
  );
}

function InteriorPocket({ interior }) {
  const exitInterior = useStore((state) => state.exitRegionInterior);
  const showHint = useStore((state) => state.showWorldHint);
  const restUntilMorning = useStore((state) => state.restUntilMorning);
  const recordLearningInteraction = useStore((state) => state.recordLearningInteraction);
  const openMath = useStore((state) => state.openMathChallenge);
  const [base, accent, dark] = interior.palette;
  const center = interior.center;
  const canonicalRoom = getInteriorRoomDefinition(interior.regionId, interior.structureId);

  const activate = (item) => {
    SFX.click();
    recordLearningInteraction?.({
      kind: 'interior-interaction',
      regionId: interior.regionId,
      structureId: interior.structureId,
      targetId: item.kind,
      source: 'region-interior',
    });
    if (item.kind === 'rest') {
      restUntilMorning?.();
      showHint('休息完成，體力與精神都恢復了。');
      return;
    }
    if (['lessonBoard', 'telescope', 'gearConsole'].includes(item.kind)) {
      openMath?.({
        skillContext: `region-interior:${interior.structureType}:${item.kind}`,
        onResolve: (correct) => showHint(correct ? `${item.label}完成。` : '可以再觀察室內線索後重試。'),
      });
      return;
    }
    showHint(`${item.label}：你取得了一筆與${interior.label}有關的環境紀錄。`);
  };

  return (
    <group position={[center.x, center.y, center.z]} name={`interior-pocket-${interior.id}`}>
      <ambientLight intensity={0.55} color={base} />
      <pointLight position={[0, 4.1, 0]} intensity={1.3} distance={16} color={accent} />
      <RigidBody type="fixed" colliders={false} name={`${interior.id}-room-physics`}>
        <CuboidCollider args={[6.6, 0.2, 5.7]} position={[0, -0.2, 0]} friction={0.95} />
        <CuboidCollider args={[0.2, 2.7, 5.7]} position={[-6.6, 2.5, 0]} />
        <CuboidCollider args={[0.2, 2.7, 5.7]} position={[6.6, 2.5, 0]} />
        <CuboidCollider args={[6.6, 2.7, 0.2]} position={[0, 2.5, -5.7]} />
        <CuboidCollider args={[5.05, 2.7, 0.2]} position={[-1.55, 2.5, 5.7]} />
        <CuboidCollider args={[5.05, 2.7, 0.2]} position={[1.55, 2.5, 5.7]} />
        {interior.furniture.filter((item) => item.solid).map((item) => (
          <CuboidCollider key={item.id} args={item.size.map((value) => value / 2)} position={item.position} />
        ))}
      </RigidBody>

      {canonicalRoom ? <CanonicalInteriorKit interior={interior} /> : (
        <>
          <mesh position={[0, -0.22, 0]} receiveShadow><boxGeometry args={[13.2, 0.4, 11.4]} /><meshToonMaterial color={base} /></mesh>
          <mesh position={[-6.62, 2.5, 0]} receiveShadow><boxGeometry args={[0.4, 5.4, 11.4]} /><meshToonMaterial color={dark} /></mesh>
          <mesh position={[6.62, 2.5, 0]} receiveShadow><boxGeometry args={[0.4, 5.4, 11.4]} /><meshToonMaterial color={dark} /></mesh>
          <mesh position={[0, 2.5, -5.72]} receiveShadow><boxGeometry args={[13.2, 5.4, 0.4]} /><meshToonMaterial color={dark} /></mesh>
          <mesh position={[-3.85, 2.5, 5.72]} receiveShadow><boxGeometry args={[5.5, 5.4, 0.4]} /><meshToonMaterial color={dark} /></mesh>
          <mesh position={[3.85, 2.5, 5.72]} receiveShadow><boxGeometry args={[5.5, 5.4, 0.4]} /><meshToonMaterial color={dark} /></mesh>
          <mesh position={[0, 5.25, 0]}><boxGeometry args={[13.2, 0.25, 11.4]} /><meshToonMaterial color={accent} /></mesh>
          {interior.furniture.map((item, index) => (
            <InteriorFurniture key={item.id} item={item} palette={interior.palette} index={index} theme={interior.furnitureTheme} />
          ))}
        </>
      )}
      {interior.interactions.map((item) => (
        <InteriorInteraction key={item.id} item={item} onActivate={() => activate(item)} accent={accent} />
      ))}

      <group position={[0, 0.05, 5.05]} onClick={(event) => { event.stopPropagation(); SFX.portal(); exitInterior(); }}>
        <Outlined color={accent} position={[0, 1.25, 0]} outlineScale={1.015}><boxGeometry args={[2.0, 2.5, 0.18]} /></Outlined>
        <Html position={[0, 2.85, 0]} center distanceFactor={12} zIndexRange={[25, 0]}>
          <button type="button" onClick={(event) => { event.stopPropagation(); SFX.portal(); exitInterior(); }} className="whitespace-nowrap rounded-2xl border-2 border-white/90 bg-sky-800/92 px-3 py-1.5 text-xs font-black text-white shadow-xl active:scale-95">
            🚪 返回戶外
          </button>
        </Html>
      </group>
      <Html position={[0, 4.65, -5.35]} center distanceFactor={14} zIndexRange={[20, 0]}>
        <div className="pointer-events-none rounded-2xl border-2 border-white/85 bg-slate-900/82 px-4 py-2 text-sm font-black text-white shadow-xl">{interior.label}</div>
      </Html>
    </group>
  );
}

function InteriorFurniture({ item, palette, index, theme }) {
  const [base, accent, dark] = palette;
  const color = item.kind === 'rug' ? accent : index % 3 === 0 ? dark : base;
  if (item.kind === 'lamp') {
    return (
      <group position={item.position}>
        <Outlined color={dark} position={[0, 0, 0]} outlineScale={1.012}><cylinderGeometry args={[0.08, 0.12, item.size[1], 8]} /></Outlined>
        <Outlined color={accent} position={[0, item.size[1] / 2, 0]} outlineScale={1.015}><sphereGeometry args={[0.25, 10, 8]} /></Outlined>
        <pointLight position={[0, item.size[1] / 2, 0]} intensity={0.48} distance={5} color={accent} />
      </group>
    );
  }
  if (item.kind === 'display') {
    return (
      <group position={item.position}>
        <Outlined color={dark} outlineScale={1.01}><boxGeometry args={item.size} /></Outlined>
        <Outlined color={accent} position={[0, 0.15, 0.28]} outlineScale={1.018}><dodecahedronGeometry args={[0.42, 0]} /></Outlined>
      </group>
    );
  }
  return (
    <group position={item.position} name={`interior-${theme}-${item.id}`}>
      <Outlined color={color} outlineScale={1.008}><boxGeometry args={item.size} /></Outlined>
      {item.kind === 'shelf' && [0.45, -0.25, -0.75].map((y, shelfIndex) => (
        <Outlined key={y} color={shelfIndex % 2 ? accent : '#f0d18c'} position={[0.37, y, 0]} outlineScale={1.01}><boxGeometry args={[0.12, 0.32, 1.45]} /></Outlined>
      ))}
      {item.kind === 'workbench' && <Outlined color={accent} position={[0.3, 0.62, 0]} outlineScale={1.012}><cylinderGeometry args={[0.18, 0.25, 0.6, 8]} /></Outlined>}
    </group>
  );
}

function InteriorInteraction({ item, onActivate, accent }) {
  return (
    <group position={item.position} name={`interior-action-${item.kind}`} onClick={(event) => { event.stopPropagation(); onActivate(); }}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.35, 0.58, 20]} /><meshBasicMaterial color={accent} transparent opacity={0.6} /></mesh>
      <Sparkles count={8} scale={1.4} size={2.5} speed={0.25} color="#fff4a5" position={[0, 0.55, 0]} />
      <Html position={[0, 1.05, 0]} center distanceFactor={12} zIndexRange={[24, 0]}>
        <button type="button" onClick={(event) => { event.stopPropagation(); onActivate(); }} className="whitespace-nowrap rounded-xl border border-white/90 bg-indigo-800/90 px-2.5 py-1 text-[11px] font-black text-white shadow-lg active:scale-95">
          {item.icon} {item.label}
        </button>
      </Html>
    </group>
  );
}
