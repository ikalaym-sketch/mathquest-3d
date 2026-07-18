// 八大區域正式遭遇層：一般怪物、精英與區域 Boss 分開管理。
import { useEffect } from 'react';
import { Sparkles } from '@react-three/drei';
import RespawnMonsterField from './RespawnMonsterField.jsx';
import { Boss } from './Boss.jsx';
import { useStore } from '../../store/useStore.js';
import { registerRuntimeEncounter } from '../../input/runtimeAcceptance.js';

export default function RegionEncounterLayer({ encounter, onAreaCleared = null }) {
  const defeatedBosses = useStore((state) => state.gameProgress.bossDefeated);
  const showHint = useStore((state) => state.showWorldHint);
  const setMonsterCount = useStore((state) => state.setActiveRegionMonsterCount);
  const bossDefeated = defeatedBosses.includes(encounter.boss.id);

  useEffect(() => {
    setMonsterCount(0);
    const unregisterNormal = registerRuntimeEncounter(`${encounter.regionId}:normal-field`, {
      regionId: encounter.regionId,
      tier: 'normal',
      definitionCount: encounter.normal.length,
      maxAlive: 8,
    });
    const unregisterElite = registerRuntimeEncounter(`${encounter.regionId}:elite-field`, {
      regionId: encounter.regionId,
      tier: 'elite',
      definitionCount: 1,
      maxAlive: 1,
    });
    const unregisterBoss = bossDefeated ? () => {} : registerRuntimeEncounter(`${encounter.regionId}:boss`, {
      regionId: encounter.regionId,
      tier: 'boss',
      definitionCount: 1,
      maxAlive: 1,
    });
    return () => { unregisterNormal(); unregisterElite(); unregisterBoss(); setMonsterCount(0); };
  }, [bossDefeated, encounter, setMonsterCount]);

  return (
    <group name={`encounters-${encounter.regionId}`}>
      <RespawnMonsterField
        fieldId={`${encounter.regionId}-normal`}
        monsterDefs={encounter.normal}
        spawnPoints={encounter.normalSpawns}
        respawnMs={encounter.respawnMs}
        maxAlive={8}
        onCountChange={(count) => { setMonsterCount(count); if (count === 0) onAreaCleared?.(); }}
      />
      <RespawnMonsterField
        fieldId={`${encounter.regionId}-elite`}
        monsterDefs={[encounter.elite]}
        spawnPoints={[{ x: encounter.eliteSpawn[0], y: encounter.eliteSpawn[1], z: encounter.eliteSpawn[2] }]}
        respawnMs={encounter.eliteRespawnMs}
        maxAlive={1}
        onDefeated={() => showHint(`${encounter.elite.name} defeated. The guardian will recover later.`)}
      />
      {!bossDefeated && (
        <group name={`${encounter.regionId}-boss-arena`}>
          <Boss
            def={encounter.boss}
            position={encounter.bossSpawn}
            onDefeated={() => showHint(`${encounter.boss.name} sealed. Region guardian completed.`)}
          />
          <Sparkles count={36} scale={[10, 4, 10]} position={[encounter.bossSpawn[0], 1.2, encounter.bossSpawn[2]]} color={encounter.boss.color} size={4} speed={0.35} />
        </group>
      )}
    </group>
  );
}
