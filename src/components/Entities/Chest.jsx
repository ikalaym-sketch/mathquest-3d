// v0.5.0 寶箱：靠近點擊開啟 → 隨機獎勵；註冊 POI 供小地圖
import { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import Outlined from '../3D/Outlined.jsx';
import { useStore } from '../../store/useStore.js';
import { registerPOI } from '../../input/pois.js';
import { SFX } from '../../audio/sfx.js';

// 隨機獎勵表
const LOOT = [
  { kind: 'gold', amount: 100 },
  { kind: 'gold', amount: 50 },
  { kind: 'item', category: 'items', id: 'item_03' },
  { kind: 'item', category: 'items', id: 'item_07' },
  { kind: 'item', category: 'materials', id: 'mat_stone' },
  { kind: 'item', category: 'seeds', id: 'seed_09' },
];

export function Chest({ position = [0, 0.4, 0] }) {
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState(null);
  const addGold = useStore((s) => s.addGold);
  const addToInventory = useStore((s) => s.addToInventory);
  const openedRef = useRef(false);

  // 註冊為 POI（開啟後消失）
  const api = useRef({
    id: `chest_${Math.random().toString(36).slice(2, 7)}`,
    type: 'chest',
    label: 'Treasure',
    getPos: () => ({ x: position[0], z: position[2] }),
    alive: () => !openedRef.current,
  });
  useEffect(() => registerPOI(api.current), []);

  const onOpen = (e) => {
    e.stopPropagation();
    if (opened) return;
    openedRef.current = true;
    setOpened(true);
    SFX.chest();
    const loot = LOOT[Math.floor(Math.random() * LOOT.length)];
    if (loot.kind === 'gold') {
      addGold(loot.amount);
      setReward(`+${loot.amount} Gold`);
    } else {
      addToInventory(loot.category, loot.id);
      setReward('Item acquired!');
    }
    setTimeout(() => setReward(null), 1800);
  };

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <group onClick={onOpen}>
        {/* 箱體 */}
        <Outlined color={opened ? '#5a4a2a' : '#8a6a3a'} position={[0, 0.25, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.5]} />
        </Outlined>
        {/* 蓋子（開啟後掀起） */}
        <group position={[0, 0.5, -0.25]} rotation={[opened ? -1.2 : 0, 0, 0]}>
          <Outlined color="#c9a05a" position={[0, 0, 0.25]}>
            <boxGeometry args={[0.7, 0.2, 0.5]} />
          </Outlined>
        </group>
        {!opened && (
          <Html zIndexRange={[20, 0]} position={[0, 1, 0]} center>
            <div className="text-hyrule-gold text-xs whitespace-nowrap select-none">開啟</div>
          </Html>
        )}
        {reward && (
          <Html zIndexRange={[20, 0]} position={[0, 1.2, 0]} center>
            <div className="px-2 py-1 rounded bg-hyrule-gold text-black text-xs whitespace-nowrap">{reward}</div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}
