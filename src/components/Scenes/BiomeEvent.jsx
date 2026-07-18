// v0.7.0 生態系事件：進入野外時隨機觸發，套用週期效果 + 顯示橫幅
// 效果 kind：'damage'(灼燒/毒 DOT)、'slow'(暴風雪減速，透過玩家移速旗標)
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../store/useStore.js';
import { playerPos } from '../../input/playerPos.js';

// 依生態系 id 對應事件（部分生態系才有）
const EVENTS = {
  2: { name: '沙塵暴', kind: 'slow', color: '#e8d8a0' },
  3: { name: '暴風雪', kind: 'slow', color: '#dfeaf2' },
  4: { name: '毒霧', kind: 'damage', color: '#4a5a3a' },
  5: { name: '火山爆發', kind: 'damage', color: '#ff5a2a' },
  10: { name: '混沌湧流', kind: 'damage', color: '#ff3a6a' },
};

// 玩家減速旗標（Player 讀取）
export const envState = { slow: false };

// 控制器：放在 WildernessScene 內（Canvas），依 biome 觸發並套用效果
export function BiomeEventController({ biomeId }) {
  const setBiomeEvent = useStore((s) => s.setBiomeEvent);
  const modifyHp = useStore((s) => s.modifyHp);
  const isPaused = useStore((s) => s.isPaused);
  const evtRef = useRef(null);
  const tickRef = useRef(0);

  useEffect(() => {
    // 40% 機率觸發該生態系事件
    const base = EVENTS[biomeId];
    const evt = base && Math.random() < 0.4 ? base : null;
    evtRef.current = evt;
    setBiomeEvent(evt);
    envState.slow = evt?.kind === 'slow';
    return () => {
      setBiomeEvent(null);
      envState.slow = false;
    };
  }, [biomeId, setBiomeEvent]);

  useFrame((_, delta) => {
    if (isPaused || !evtRef.current) return;
    if (evtRef.current.kind === 'damage') {
      // 每 1.5s 造成環境傷害（無敵幀免疫）
      tickRef.current += delta;
      if (tickRef.current >= 1.5) {
        tickRef.current = 0;
        if (!playerPos.invuln) modifyHp(-4);
      }
    }
  });

  return null;
}

// 橫幅（DOM 疊層）
export function BiomeEventBanner() {
  const evt = useStore((s) => s.biomeEvent);
  const isPaused = useStore((s) => s.isPaused);
  if (!evt || isPaused) return null;
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div
        className="px-4 py-1 rounded-full border text-sm font-display tracking-wider animate-pulse"
        style={{ background: 'rgba(0,0,0,0.55)', borderColor: evt.color, color: evt.color }}
      >
        ⚠ {evt.name}
      </div>
    </div>
  );
}
