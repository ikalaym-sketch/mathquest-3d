// v0.5.0 小地圖（右上雷達）：玩家為中心，顯示附近怪物與地標
import { useState, useEffect, useRef } from 'react';
import { getEnemies } from '../../input/combat.js';
import { getPOIs, POI_COLOR } from '../../input/pois.js';
import { playerPos } from '../../input/playerPos.js';
import { useStore } from '../../store/useStore.js';

const DESKTOP_SIZE = 128;
const MOBILE_SIZE = 88;   // 小地圖像素尺寸
const RANGE = 24;   // 顯示半徑（世界單位）

export default function Minimap() {
  const isPaused = useStore((s) => s.isPaused);
  const showMinimap = useStore((s) => s.uiPreferences?.showMinimap !== false);
  const [, force] = useState(0);
  const raf = useRef(0);

  // 以 rAF 定頻刷新（約每 100ms），避免每幀 setState
  useEffect(() => {
    let last = 0;
    const loop = (t) => {
      if (t - last > 100) {
        last = t;
        force((n) => n + 1);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  if (isPaused || !showMinimap) return null;

  const size = typeof window !== 'undefined' && window.innerWidth < 600 ? MOBILE_SIZE : DESKTOP_SIZE;

  // 世界座標 → 小地圖像素（玩家置中；世界 -z 為上方）
  const toMap = (x, z) => {
    const dx = x - playerPos.x;
    const dz = z - playerPos.z;
    const mx = size / 2 + (dx / RANGE) * (size / 2);
    const my = size / 2 + (dz / RANGE) * (size / 2);
    return { mx, my, inside: Math.hypot(dx, dz) <= RANGE };
  };

  const enemies = getEnemies();
  const pois = getPOIs();

  return (
    <div
      className="mq-minimap fixed z-30 rounded-full overflow-hidden border-2 border-hyrule-bronze/70 bg-hyrule-night/80 shadow-lg"
      style={{ width: size, height: size }}
    >
      {/* 十字準星 */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
      </div>

      {/* 地標 */}
      {pois.map((p) => {
        const pos = p.getPos();
        const { mx, my, inside } = toMap(pos.x, pos.z);
        if (!inside) return null;
        return (
          <div
            key={p.id}
            title={p.label}
            className="absolute w-2.5 h-2.5 rounded-sm -translate-x-1/2 -translate-y-1/2"
            style={{ left: mx, top: my, background: POI_COLOR[p.type] || '#fff' }}
          />
        );
      })}

      {/* 怪物 */}
      {enemies.map((e, i) => {
        const pos = e.getPos();
        const { mx, my, inside } = toMap(pos.x, pos.z);
        if (!inside) return null;
        const isBoss = e.kind === 'boss';
        return (
          <div
            key={e.id || i}
            className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 ${isBoss ? 'w-3 h-3' : 'w-2 h-2'}`}
            style={{ left: mx, top: my, background: isBoss ? '#ff2a6a' : '#ff5a4a' }}
          />
        );
      })}

      {/* 玩家（中心，帶朝向箭頭） */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(-50%,-50%) rotate(${-playerPos.yaw}rad)` }}
      >
        <div className="w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #7fdfff' }} />
      </div>
    </div>
  );
}
