// v0.4.0 野外隨機 NPC（收集任務 → 加入任務追蹤器 / 學者任務 → 連答 2 題）
import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useStore } from '../../store/useStore.js';
import Outlined from '../3D/Outlined.jsx';
import { randomCollectQuest, SCHOLAR_QUEST } from '../../data/quests.js';

export default function WanderingNPC({ position = [12, 0.6, 8] }) {
  const openMath = useStore((s) => s.openMathChallenge);
  const addQuest = useStore((s) => s.addQuest);
  const addToInventory = useStore((s) => s.addToInventory);
  const quests = useStore((s) => s.quests);
  const [done, setDone] = useState(false);

  // 隨機決定任務（穩定於元件生命週期）
  const isScholar = useMemo(() => Math.random() < 0.4, []);
  const collectQuest = useMemo(() => randomCollectQuest(), []);
  const label = isScholar ? SCHOLAR_QUEST.label : collectQuest.label;
  const alreadyTaken = !isScholar && quests.some((q) => q.id === collectQuest.id);

  const onInteract = () => {
    if (done) return;
    if (isScholar) {
      openMath({
        onResolve: (c1) => {
          if (!c1) return;
          openMath({
            onResolve: (c2) => {
              if (c2) {
                addToInventory('items', SCHOLAR_QUEST.rewardItem);
                setDone(true);
              }
            },
          });
        },
      });
    } else {
      if (!alreadyTaken) addQuest({ ...collectQuest, done: false });
      setDone(true);
    }
  };

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <group onClick={(e) => { e.stopPropagation(); onInteract(); }}>
        <Outlined color={done ? '#5a5a5a' : '#3aa06a'} position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 1, 10]} />
        </Outlined>
        <Outlined color="#f0c9a0" position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.28, 12, 12]} />
        </Outlined>
        <Html zIndexRange={[20, 0]} position={[0, 1.7, 0]} center>
          <div className="text-center whitespace-nowrap select-none">
            <div className="font-body text-white text-xs">旅行者</div>
            <div className="text-hyrule-gold text-[10px]">
              {done ? '祝你冒險順利！' : label}
            </div>
          </div>
        </Html>
      </group>
    </RigidBody>
  );
}
