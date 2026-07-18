// 第三階段森林遺跡正式垂直切片。
// 四個子區採 Residency 分段載入，並整合數學機關、怪物群落、事件與 Boss 解鎖。
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { useStore } from '../../store/useStore.js';
import { playerPos } from '../../input/playerPos.js';
import { getRenderQualityProfile } from '../../utils/renderQuality.js';
import { FOREST_RUINS_LAYOUT, FOREST_SUBAREA_LIST } from '../../data/forestRuinsLayout.js';
import { FOREST_MONSTER_MAP } from '../../data/forestMonsters.js';
import { FOREST_MODEL_ASSETS, releaseAllForestAssets, syncForestResidency } from '../../services/ForestAssetService.js';
import { validateForestRuinsLayout } from '../../services/ForestSceneValidationService.js';
import SurfaceDetailLayer from '../Environment/SurfaceDetailLayer.jsx';
import {
  ForestBaseTerrain,
  ForestBossSeal,
  ForestDetailedSubarea,
  ForestEventBeacon,
  ForestPuzzleNode,
} from '../World/ForestRuinsKit.jsx';
import RespawnMonsterField from '../Entities/RespawnMonsterField.jsx';
import { Boss } from '../Entities/Boss.jsx';
import TeleportGate from '../World/TeleportGate.jsx';
import ForestV033ExpansionLayer from '../World/ForestV033ExpansionLayer.jsx';
import { goToScene } from '../UI/TransitionManager.jsx';

const REGION_ID = 'forest_ruins';
const KILL_OBJECTIVE = 'forest_guardians';
const KILL_TARGET = 5;

export default function ForestRuinsScene() {
  const qualityId = useStore((state) => state.renderQuality || 'high');
  const quality = getRenderQualityProfile(qualityId);
  const weatherType = useStore((state) => state.weatherType || 'sunny');
  const openWorldMap = useStore((state) => state.openWorldMap);
  const openMath = useStore((state) => state.openMathChallenge);
  const showHint = useStore((state) => state.showWorldHint);
  const completeObjective = useStore((state) => state.completeRegionObjective);
  const incrementKill = useStore((state) => state.incrementRegionKillObjective);
  const setActiveEvent = useStore((state) => state.setActiveRegionEvent);
  const setMonsterCount = useStore((state) => state.setActiveRegionMonsterCount);
  const completeEvent = useStore((state) => state.completeRegionEvent);
  const objectives = useStore((state) => state.worldProgress.regionObjectives || {});
  const killProgress = useStore((state) => state.worldProgress.regionKillProgress || {});
  const completedEvents = useStore((state) => state.worldProgress.completedEvents || {});
  const bossDefeated = useStore((state) => state.gameProgress.bossDefeated.includes(FOREST_RUINS_LAYOUT.boss.id));
  const visits = useStore((state) => state.worldProgress.regionVisits[REGION_ID] || 1);

  const validation = useMemo(() => validateForestRuinsLayout(FOREST_RUINS_LAYOUT), []);
  const campCountsRef = useRef({});
  const { activeSubareaId, residentIds } = useForestResidency();

  useEffect(() => {
    if (!validation.ok) console.error('[Forest Ruins Layout]', validation.errors);
    if (validation.warnings.length) console.warn('[Forest Ruins Layout]', validation.warnings);
    return () => {
      setActiveEvent(null);
      setMonsterCount(0);
      window.setTimeout(releaseAllForestAssets, 0);
    };
  }, [setActiveEvent, setMonsterCount, validation]);

  const objectiveDone = (objectiveId) => Boolean(objectives[`${REGION_ID}:${objectiveId}`]);
  const required = FOREST_RUINS_LAYOUT.boss.requiredObjectives;
  const completedCount = required.filter(objectiveDone).length;
  const bossUnlocked = completedCount === required.length;

  const selectedEvent = useMemo(() => {
    const nodes = FOREST_RUINS_LAYOUT.eventNodes;
    return nodes[(visits - 1) % nodes.length];
  }, [visits]);
  const eventKey = `${REGION_ID}:${selectedEvent.name}`;
  const eventCompleted = Boolean(completedEvents[eventKey]);

  useEffect(() => {
    if (eventCompleted) setActiveEvent(null);
    else setActiveEvent({ regionId: REGION_ID, name: selectedEvent.name, subareaId: selectedEvent.subareaId });
    return () => setActiveEvent(null);
  }, [eventCompleted, selectedEvent, setActiveEvent]);

  const solvePuzzle = (node) => {
    openMath({
      skillContext: node.skillContext,
      onResolve: (correct) => {
        if (!correct) {
          showHint('小精靈已記住這個題型，可以再試一次。');
          return;
        }
        completeObjective(REGION_ID, node.objectiveId || node.id);
        showHint(`完成：${node.title} · 森林封印力量增加`);
      },
    });
  };

  const monsterDefeated = () => {
    const progress = incrementKill(REGION_ID, KILL_OBJECTIVE, KILL_TARGET);
    if (progress >= KILL_TARGET) showHint('森林守衛已清除，苔蘚神殿封印解除！');
    else showHint(`森林守衛 ${progress}/${KILL_TARGET}`);
  };

  const finishEvent = () => {
    completeEvent(REGION_ID, selectedEvent.name);
    showHint(`事件完成：${selectedEvent.name} · +80G`);
  };

  const maxResidentMonsters = qualityId === 'low' ? 6 : qualityId === 'medium' ? 8 : qualityId === 'ultra' ? 14 : 11;
  const residentKey = residentIds.join('|');
  const residentCampConfigs = useMemo(() => {
    const residentCamps = FOREST_RUINS_LAYOUT.monsterCamps.filter((camp) => residentIds.includes(camp.subareaId));
    let allocated = 0;
    return residentCamps.map((camp) => {
      const remaining = Math.max(0, maxResidentMonsters - allocated);
      const count = Math.min(camp.count, remaining);
      allocated += count;
      return {
        camp,
        count,
        defs: camp.types.map((id) => FOREST_MONSTER_MAP[id]).filter(Boolean),
        spawnPoints: buildCampSpawnPoints(camp, count),
      };
    }).filter((config) => config.count > 0);
    // residentKey is the stable primitive dependency representing the current residency set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residentKey, maxResidentMonsters]);

  return (
    <>
      <SurfaceDetailLayer sceneId="forest" layout={FOREST_RUINS_LAYOUT} density={quality.vegetationDensity} weather={weatherType} />
      <ForestBaseTerrain layout={FOREST_RUINS_LAYOUT} vegetationDensity={quality.vegetationDensity} />
      {residentIds.map((subareaId) => (
        <ForestDetailedSubarea
          key={subareaId}
          layout={FOREST_RUINS_LAYOUT}
          subareaId={subareaId}
          vegetationDensity={quality.vegetationDensity}
        />
      ))}
      <ForestV033ExpansionLayer residentIds={residentIds} />

      {FOREST_RUINS_LAYOUT.puzzleNodes
        .filter((node) => residentIds.includes(node.subareaId))
        .map((node) => (
          <ForestPuzzleNode
            key={node.id}
            node={node}
            completed={objectiveDone(node.objectiveId || node.id)}
            onActivate={() => solvePuzzle(node)}
          />
        ))}

      {residentIds.includes(selectedEvent.subareaId) && (
        <ForestEventBeacon event={selectedEvent} completed={eventCompleted} onActivate={finishEvent} />
      )}

      {residentCampConfigs.map(({ camp, count, defs, spawnPoints }) => (
        <RespawnMonsterField
          key={camp.id}
          fieldId={camp.id}
          monsterDefs={defs}
          spawnPoints={spawnPoints}
          maxAlive={count}
          respawnMs={12000}
          spawnRule={camp.spawnRule}
          onDefeated={monsterDefeated}
          onCountChange={(aliveCount) => {
            campCountsRef.current[camp.id] = aliveCount;
            const activeIds = new Set(residentCampConfigs.map((config) => config.camp.id));
            const total = Object.entries(campCountsRef.current)
              .filter(([id]) => activeIds.has(id))
              .reduce((sum, [, value]) => sum + value, 0);
            setMonsterCount(total);
          }}
        />
      ))}

      <ForestBossSeal
        position={[15, 0.25, -24]}
        unlocked={bossUnlocked || bossDefeated}
        objectivesDone={completedCount}
        objectiveTotal={required.length}
      />

      {bossUnlocked && !bossDefeated && residentIds.includes('mossy_shrine') && (
        <Boss
          def={{
            ...FOREST_RUINS_LAYOUT.boss,
            modelAssetId: FOREST_MODEL_ASSETS.forest_guardian,
            modelScale: 0.95,
            modelPosition: [0, -1.2, 0],
          }}
          position={FOREST_RUINS_LAYOUT.boss.position}
        />
      )}

      {bossDefeated && residentIds.includes('mossy_shrine') && (
        <group position={[15, 0.8, -23]}>
          <Sparkles count={55} scale={5} size={7} speed={0.7} color="#ffe36e" />
        </group>
      )}

      <TeleportGate position={[-9, 0, 45]} portalType="village" color="#61d98d" icon="🏠" label="返回星光村" onActivate={() => goToScene('village')} />
      <TeleportGate position={[9, 0, 45]} portalType="region" color="#59bfe9" icon="🗺️" label="世界地圖" onActivate={openWorldMap} />
    </>
  );
}

function useForestResidency() {
  const setActiveSubarea = useStore((state) => state.setActiveRegionSubarea);
  const [activeSubareaId, setActiveSubareaId] = useState('whispering_grove');
  const [residentIds, setResidentIds] = useState(['whispering_grove', 'waterfall_path', 'ancient_gate']);
  const previousResidents = useRef([]);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 0.25) return;
    elapsed.current = 0;

    let nearest = FOREST_SUBAREA_LIST[0];
    let nearestDistance = Infinity;
    FOREST_SUBAREA_LIST.forEach((area) => {
      const distance = Math.hypot(playerPos.x - area.center[0], playerPos.z - area.center[2]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = area;
      }
    });

    if (nearest.id !== activeSubareaId) {
      const nextResidents = [nearest.id, ...nearest.neighbors];
      setActiveSubareaId(nearest.id);
      setResidentIds(nextResidents);
      setActiveSubarea(nearest.id);
      syncForestResidency(previousResidents.current, nextResidents);
      previousResidents.current = nextResidents;
    }
  });

  useEffect(() => {
    const initial = ['whispering_grove', 'waterfall_path', 'ancient_gate'];
    syncForestResidency([], initial);
    previousResidents.current = initial;
    setActiveSubarea('whispering_grove');
    return () => syncForestResidency(previousResidents.current, []);
  }, [setActiveSubarea]);

  return { activeSubareaId, residentIds };
}

function buildCampSpawnPoints(camp, count) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / Math.max(1, count)) * Math.PI * 2 + camp.center[0] * 0.03;
    const radius = camp.radius * (0.45 + (index % 3) * 0.18);
    return [
      camp.center[0] + Math.cos(angle) * radius,
      camp.center[2] + Math.sin(angle) * radius,
      camp.center[1],
    ];
  }).map(([x, z, y]) => ({ x, z, y }));
}
