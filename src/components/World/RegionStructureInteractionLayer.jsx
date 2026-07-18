// 結構 Socket 互動層：將 Prefab Socket 轉成世界座標，提供 NPC、任務與區域工坊入口。
import { Html, Sparkles } from '@react-three/drei';
import Outlined from '../3D/Outlined.jsx';
import RegionGuideNPC from './RegionGuideNPC.jsx';
import { resolveStructureSocketWorldTransform } from '../../services/StructureSocketService.js';
import { useStore } from '../../store/useStore.js';

export default function RegionStructureInteractionLayer({ profile, layout }) {
  const openPanel = useStore((state) => state.openPanel);
  const openMath = useStore((state) => state.openMathChallenge);
  const recordInteraction = useStore((state) => state.recordRegionStructureInteraction);
  const showHint = useStore((state) => state.showWorldHint);
  const talkToNpc = useStore((state) => state.talkToNpc);

  const activate = (interaction) => {
    if (interaction.targetId === 'shimmering_dock:fishing') {
      recordInteraction(profile.regionId, interaction.targetId);
      openPanel('fishing', { regionId: profile.regionId, targetId: interaction.targetId });
      return;
    }
    if (interaction.action === 'workshop') {
      recordInteraction(profile.regionId, interaction.targetId);
      openPanel('regionWorkshop', { regionId: profile.regionId, targetId: interaction.targetId });
      return;
    }
    openMath({
      skillContext: profile.skillContext,
      onResolve: (correct) => {
        if (!correct) {
          showHint('任務控制台尚未解鎖，可以再次嘗試。');
          return;
        }
        recordInteraction(profile.regionId, interaction.targetId);
        showHint(`${interaction.label}完成。`);
      },
    });
  };

  return (
    <group name={`structure-interactions-${profile.regionId}`}>
      {profile.structureInteractions.map((interaction, index) => {
        const socketTransform = resolveStructureSocketWorldTransform(layout, interaction.structureId, interaction.socketId);
        if (!socketTransform) return null;
        const position = socketTransform.position;
        if (index === 0) {
          const groundedPosition = [position[0], socketTransform.baseY + 0.05, position[2]];
          return <RegionGuideNPC key={interaction.targetId} guide={profile.guide} position={groundedPosition} label={interaction.label} icon={interaction.icon} onInteract={() => talkToNpc(`guide_${profile.regionId}`, { name: profile.guide.name, serviceAction: () => activate(interaction) })} />;
        }
        return (
          <group key={interaction.targetId} position={position} name={`socket-interaction-${interaction.targetId}`} onClick={(event) => { event.stopPropagation(); activate(interaction); }}>
            <Outlined color="#ffd565" position={[0, 0.9, 0]} outlineScale={1.018}><icosahedronGeometry args={[0.6, 0]} /></Outlined>
            <Sparkles count={18} scale={3} size={4} speed={0.45} color="#fff1a2" position={[0, 1.1, 0]} />
            <Html zIndexRange={[24, 0]} position={[0, 2.2, 0]} center distanceFactor={13}>
              <button onClick={(event) => { event.stopPropagation(); activate(interaction); }} className="whitespace-nowrap rounded-2xl border-2 border-yellow-100 bg-amber-600/92 px-3 py-1.5 text-xs font-black text-white shadow-xl active:scale-95">
                {interaction.icon} {interaction.label}
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
