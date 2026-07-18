// Boss 技能預警：所有傷害在紅／橙色範圍完整顯示後才結算，避免兒童遭受不可預測攻擊。
import { Html } from '@react-three/drei';

export default function BossSkillTelegraph({ telegraph }) {
  if (!telegraph) return null;
  const { skill, position, progress = 0 } = telegraph;
  const opacity = 0.18 + Math.min(0.42, progress * 0.42);
  const commonMaterial = <meshBasicMaterial color={skill.color || '#ff765f'} transparent opacity={opacity} depthWrite={false} />;

  return (
    <group position={position} rotation={[0, telegraph.rotationY || 0, 0]} name={`boss-telegraph-${skill.id}`}>
      {skill.kind === 'line' ? (
        <mesh position={[0, 0.05, -(skill.length || 14) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[skill.radius * 2, skill.length || 14]} />
          {commonMaterial}
        </mesh>
      ) : (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(0.15, skill.kind === 'ring' ? skill.radius * 0.55 : 0.1), skill.radius, 48]} />
          {commonMaterial}
        </mesh>
      )}
      <Html zIndexRange={[28, 0]} position={[0, 0.45, 0]} center distanceFactor={12}>
        <div className="rounded-full border-2 border-white/90 bg-red-600/90 px-3 py-1 text-sm font-black text-white shadow-xl">
          {skill.label} · 請離開預警區
        </div>
      </Html>
    </group>
  );
}
