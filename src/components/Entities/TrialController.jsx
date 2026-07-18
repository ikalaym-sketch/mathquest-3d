// v0.6.0 無盡試煉控制器：生成波次怪物，全清後進下一波
import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Monster } from '../Entities/Monsters.jsx';
import { getEnemies } from '../../input/combat.js';
import { MONSTERS } from '../../data/biomes.js';
import { useStore } from '../../store/useStore.js';

// 依波次強化怪物數值
function scaleDef(base, wave) {
  return {
    ...base,
    hp: Math.round(base.hp * (1 + wave * 0.18)),
    atk: Math.round(base.atk * (1 + wave * 0.1)),
  };
}

export default function TrialController() {
  const wave = useStore((s) => s.trialWave);
  const clearTrialWave = useStore((s) => s.clearTrialWave);
  const isPaused = useStore((s) => s.isPaused);
  const [spawns, setSpawns] = useState([]);
  const checkedRef = useRef(0);
  const spawnedForWave = useRef(0);

  // 每波生成 (2 + wave) 隻怪
  useEffect(() => {
    const count = 2 + wave;
    const list = Array.from({ length: count }).map((_, i) => {
      const base = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
      const ang = (i / count) * Math.PI * 2;
      const r = 8 + Math.random() * 6;
      return {
        key: `trial_w${wave}_${i}`,
        def: scaleDef(base, wave),
        spawn: { x: Math.cos(ang) * r, z: Math.sin(ang) * r - 3 },
      };
    });
    setSpawns(list);
    spawnedForWave.current = count;
  }, [wave]);

  // 偵測全清 → 進下一波（節流檢查）
  useFrame(() => {
    if (isPaused) return;
    checkedRef.current += 1;
    if (checkedRef.current % 30 !== 0) return; // 約每 0.5s 檢查
    if (spawns.length === 0) return;
    const liveMonsters = getEnemies().filter((e) => e.kind === 'monster').length;
    if (liveMonsters === 0 && spawnedForWave.current > 0) {
      spawnedForWave.current = 0;
      clearTrialWave(); // wave++ → 觸發 useEffect 生成下一波
    }
  });

  return (
    <>
      {spawns.map((m) => (
        <Monster key={m.key} def={m.def} spawn={m.spawn} />
      ))}
    </>
  );
}
