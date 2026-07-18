// 區域怪物定時生成器。
// 支援場景專屬怪物定義、自訂群落座標、同屏上限與擊倒統計。
import { useEffect, useMemo, useRef, useState } from 'react';
import { Monster } from './Monsters.jsx';
import { MONSTERS } from '../../data/biomes.js';
import { useStore } from '../../store/useStore.js';
import { matchesSpawnRule } from '../../systems/npcSchedule.js';

const GLOBAL_MONSTER_MAP = Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster]));
const DEFAULT_SPAWNS = [
  [-33, -27], [-18, -33], [19, -31], [34, -17],
  [-34, 20], [-17, 34], [20, 34], [35, 19],
];

export default function RespawnMonsterField({
  monsterIds = [],
  monsterDefs = null,
  spawnPoints = null,
  respawnMs = 9000,
  maxAlive = 8,
  onCountChange,
  onDefeated,
  fieldId = 'region',
  spawnRule = null,
}) {
  const timers = useRef(new Set());
  const worldClock = useStore((state) => state.worldClock);
  const onCountChangeRef = useRef(onCountChange);
  const defs = useMemo(() => {
    if (monsterDefs?.length) return monsterDefs;
    return monsterIds.map((id) => GLOBAL_MONSTER_MAP[id]).filter(Boolean);
  }, [monsterDefs, monsterIds]);
  const points = useMemo(() => (spawnPoints?.length ? spawnPoints : DEFAULT_SPAWNS), [spawnPoints]);
  const activeByEnvironment = matchesSpawnRule(spawnRule, worldClock);
  const [slots, setSlots] = useState(() => createSlots(defs, maxAlive, points, fieldId));

  useEffect(() => {
    if (activeByEnvironment) setSlots(createSlots(defs, maxAlive, points, fieldId));
    else setSlots((current) => current.map((slot) => ({ ...slot, alive: false })));
  }, [activeByEnvironment, defs, fieldId, maxAlive, points]);

  useEffect(() => { onCountChangeRef.current = onCountChange; }, [onCountChange]);

  useEffect(() => {
    if (activeByEnvironment) return;
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, [activeByEnvironment]);

  useEffect(() => {
    onCountChangeRef.current?.(activeByEnvironment ? slots.filter((slot) => slot.alive).length : 0);
  }, [activeByEnvironment, slots]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  const defeated = (slotId, monsterId) => {
    if (!activeByEnvironment) return;
    setSlots((current) => current.map((slot) => slot.id === slotId ? { ...slot, alive: false } : slot));
    onDefeated?.(monsterId, slotId);
    const timer = window.setTimeout(() => {
      setSlots((current) => current.map((slot) => {
        if (slot.id !== slotId) return slot;
        const nextDef = defs[Math.floor(Math.random() * defs.length)] || slot.def;
        return { ...slot, alive: true, def: nextDef, generation: slot.generation + 1 };
      }));
      timers.current.delete(timer);
    }, respawnMs + Math.floor(Math.random() * 3500));
    timers.current.add(timer);
  };

  if (!activeByEnvironment) return null;

  return (
    <>
      {slots.map((slot) => slot.alive && (
        <Monster
          key={`${slot.id}_${slot.generation}`}
          def={slot.def}
          spawn={slot.spawn}
          onDefeated={(monsterId) => defeated(slot.id, monsterId)}
        />
      ))}
    </>
  );
}

function createSlots(defs, maxAlive, points, fieldId) {
  const safeDefs = defs.length ? defs : MONSTERS.slice(0, 3);
  return points.slice(0, maxAlive).map((point, index) => {
    const [x, z, y] = Array.isArray(point)
      ? [point[0], point[1], point[2] ?? 0.5]
      : [point.x, point.z, point.y ?? 0.5];
    return {
      id: `${fieldId}_slot_${index}`,
      alive: true,
      generation: 0,
      spawn: { x, z, y },
      def: safeDefs[index % safeDefs.length],
    };
  });
}
