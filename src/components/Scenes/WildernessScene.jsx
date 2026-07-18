// 每日秘境：由日期種子產生固定生態系與遭遇，不再是每次掛載都變動的原型亂數場。
import { useMemo, useEffect } from 'react';
import { Instances, Instance, Sparkles } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { createDailyRiftConfig } from '../../data/dailyRift.js';
import { Monster } from '../Entities/Monsters.jsx';
import { Boss } from '../Entities/Boss.jsx';
import WanderingNPC from '../NPC/WanderingNPC.jsx';
import { ReturnPortal } from '../Entities/ReturnPortal.jsx';
import { Bush } from './SceneProps.jsx';
import { useStore } from '../../store/useStore.js';

export default function WildernessScene() {
  const setCurrentBiomeId = useStore((state) => state.setCurrentBiomeId);
  const completeDailyRift = useStore((state) => state.completeDailyRift);
  const showHint = useStore((state) => state.showWorldHint);
  const config = useMemo(() => createDailyRiftConfig(), []);
  const completed = useStore((state) => Boolean(state.worldProgress.dailyRiftCompletions?.[config.dayKey]));

  useEffect(() => { setCurrentBiomeId(config.biome.id); }, [config.biome.id, setCurrentBiomeId]);

  const defeatGuardian = () => {
    const result = completeDailyRift(config.dayKey, config.rewardMaterialId, config.rewardGold);
    if (!result.ok) showHint('今天的每日秘境獎勵已領取。');
  };

  return (
    <>
      <ambientLight intensity={0.7} color={config.biome.ambient} />
      <directionalLight position={[10, 12, 6]} intensity={1.2} color="#fff2d0" />
      <fog attach="fog" args={[config.biome.fog, 18, 60]} />

      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshToonMaterial color={config.biome.ground} />
        </mesh>
      </RigidBody>

      <BiomeDecorations biome={config.biome} positions={config.decorations} />
      {config.biome.particle && <Sparkles count={config.biome.particle === 'snow' ? 100 : 45} scale={40} size={config.biome.particle === 'ember' ? 4 : 2} speed={config.biome.particle === 'snow' ? 0.4 : 0.2} color={config.biome.particle === 'ember' ? '#ff8a3a' : config.biome.particle === 'glow' ? config.biome.decoColor : '#ffffff'} position={[0, 6, 0]} />}

      <ReturnPortal position={[0, 0, 11]} />
      <Bush position={[3, 0, 4]} color={config.biome.decoColor} />
      <Bush position={[-4, 0, 5]} color={config.biome.decoColor} />
      <Bush position={[6, 0, -2]} color={config.biome.decoColor} />

      {!completed ? (
        <>
          {config.monsters.map((monster) => <Monster key={monster.key} def={monster.def} spawn={monster.spawn} />)}
          <Boss def={config.boss} rewardGold={0} grantBlueprint={false} grantLoot={false} onDefeated={defeatGuardian} />
          <WanderingNPC position={[12, 0.6, 8]} />
        </>
      ) : (
        <Sparkles count={80} scale={[28, 8, 28]} size={5} speed={0.25} color="#86f0b0" position={[0, 3, -5]} />
      )}
    </>
  );
}

function BiomeDecorations({ biome, positions }) {
  const geometry = useMemo(() => {
    switch (biome.deco) {
      case 'pillar': return <cylinderGeometry args={[0.4, 0.5, 3, 6]} />;
      case 'crystal': return <octahedronGeometry args={[0.8, 0]} />;
      case 'mushroom': return <coneGeometry args={[0.7, 1, 8]} />;
      case 'rock':
      case 'snowrock': return <dodecahedronGeometry args={[0.7, 0]} />;
      case 'deadtree': return <cylinderGeometry args={[0.15, 0.25, 2, 6]} />;
      case 'tree':
      default: return <sphereGeometry args={[0.9, 8, 8]} />;
    }
  }, [biome.deco]);

  return (
    <Instances limit={positions.length + 1} range={positions.length}>
      {geometry}
      <meshToonMaterial color={biome.decoColor} />
      {positions.map((item) => <Instance key={item.key} position={[item.x, biome.deco === 'tree' ? 1.5 : 0.6, item.z]} scale={item.scale} rotation={[0, item.rotation, 0]} />)}
    </Instances>
  );
}
