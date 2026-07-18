// 試煉塔樓層控制器：戰鬥、精英、場景式機關、休息與 Boss 均採獨立流程。
import { useEffect, useMemo, useRef, useState } from 'react';
import { Monster } from './Monsters.jsx';
import { Boss } from './Boss.jsx';
import { MONSTERS } from '../../data/biomes.js';
import { getTrialFloorConfig } from '../../data/trialTower.js';
import { getTrialRoomScenario } from '../../data/trialTowerRooms.js';
import { getEliteCombatProfile } from '../../data/combatEncounterProfiles.js';
import { useStore } from '../../store/useStore.js';
import TrialRoomMechanic from '../Trial/TrialRoomMechanic.jsx';

export default function TrialFloorController() {
  const floor = useStore((state) => state.trialTower.currentFloor);
  const setPortalReady = useStore((state) => state.setTrialPortalReady);
  const healHpPercent = useStore((state) => state.healHpPercent);
  const modifyMp = useStore((state) => state.modifyMp);
  const showHint = useStore((state) => state.showWorldHint);
  const config = getTrialFloorConfig(floor);
  const scenario = getTrialRoomScenario(config);
  const [aliveIds, setAliveIds] = useState([]);
  const roomInitialized = useRef(null);

  const floorMonsters = useMemo(() => {
    const count = config.enemyCount;
    return Array.from({ length: count }).map((_, index) => {
      const base = MONSTERS[(floor + index) % MONSTERS.length];
      const ratio = count === 1 ? 0.5 : index / Math.max(1, count - 1);
      const angle = Math.PI + ratio * Math.PI;
      const radius = config.roomType === 'elite' ? 7 : 7.5 + (index % 2) * 3;
      const elite = config.roomType === 'elite';
      return {
        id: `tower_f${floor}_${index}`,
        spawn: { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius },
        def: {
          ...base,
          id: `tower_f${floor}_${index}_${base.id}`,
          tier: elite ? 'elite' : 'normal',
          name: elite ? `試煉精英 · ${base.name}` : base.name,
          hp: Math.round(base.hp * config.hpMultiplier),
          atk: Math.max(1, Math.round(base.atk * config.attackMultiplier)),
          eliteTraits: elite ? getEliteCombatProfile(['wind_highlands', 'snow_valley', 'farm_plains', 'star_village', 'crystal_lake', 'sun_canyon', 'mushroom_grove', 'clockwork_ruins'][config.tier % 8]) : undefined,
          rewardGold: 0,
          grantLoot: false,
        },
      };
    });
  }, [config.attackMultiplier, config.enemyCount, config.hpMultiplier, config.roomType, config.tier, floor]);

  useEffect(() => {
    setPortalReady(false);
    setAliveIds(floorMonsters.map((monster) => monster.id));
    roomInitialized.current = null;
  }, [floor, floorMonsters, setPortalReady]);

  useEffect(() => {
    if (roomInitialized.current === floor) return;
    roomInitialized.current = floor;
    if (config.roomType === 'rest') {
      healHpPercent(100);
      modifyMp(9999);
      setPortalReady(true);
      showHint('星光休息站已恢復生命與魔力。');
    }
  }, [config.roomType, floor, healHpPercent, modifyMp, setPortalReady, showHint]);

  const defeated = (monsterId) => {
    setAliveIds((current) => {
      const next = current.filter((id) => id !== monsterId);
      if (next.length === 0) setPortalReady(true);
      return next;
    });
  };

  if (config.roomType === 'boss' && config.boss) {
    return <Boss def={config.boss} position={[0, 1.2, -7]} rewardGold={0} grantBlueprint={false} grantLoot={false} onDefeated={() => setPortalReady(true)} />;
  }

  if (['trap', 'escort', 'puzzle', 'sequence', 'treasure'].includes(config.roomType)) {
    return <TrialRoomMechanic scenario={scenario} config={config} onComplete={() => { setPortalReady(true); showHint(`${scenario.label}完成，傳送門已開啟。`); }} />;
  }

  if (config.roomType === 'rest') return null;

  return (
    <>
      {floorMonsters.map((monster) => aliveIds.includes(monster.id) && (
        <Monster key={monster.id} def={monster.def} spawn={monster.spawn} onDefeated={() => defeated(monster.id)} />
      ))}
    </>
  );
}
