// v0.6.0 世界氛圍：晝夜循環（色溫/亮度變化）+ 隨機天氣
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { updateWorldTime } from '../../input/worldTime.js';

// 晝夜關鍵色（依時間 phase 0~1 插值）
const DAY = new THREE.Color('#fff2d0');
const DUSK = new THREE.Color('#ff9a5a');
const NIGHT = new THREE.Color('#2a3a6a');
const DAWN = new THREE.Color('#c0a0e0');

export default function WorldAmbience() {
  const lightRef = useRef();
  const ambRef = useRef();
  const isPaused = useStore((s) => s.isPaused);

  // 本次遊玩的天氣（進入時隨機決定一次）
  const weather = useMemo(() => {
    const r = Math.random();
    return r < 0.25 ? 'rain' : r < 0.45 ? 'snow' : 'clear';
  }, []);

  const phaseRef = useRef(Math.random()); // 隨機起始時段

  useFrame((_, delta) => {
    if (isPaused) return;
    // 一個完整晝夜約 240 秒
    phaseRef.current = (phaseRef.current + delta / 240) % 1;
    const t = phaseRef.current;
    updateWorldTime(t); // 寫入世界時間單例供 gameplay 讀取

    // 依 phase 混色：0 日→0.25 昏→0.5 夜→0.75 曉→1 日
    const col = new THREE.Color();
    if (t < 0.25) col.copy(DAY).lerp(DUSK, t / 0.25);
    else if (t < 0.5) col.copy(DUSK).lerp(NIGHT, (t - 0.25) / 0.25);
    else if (t < 0.75) col.copy(NIGHT).lerp(DAWN, (t - 0.5) / 0.25);
    else col.copy(DAWN).lerp(DAY, (t - 0.75) / 0.25);

    // 夜晚壓暗
    const nightFactor = Math.max(0, Math.cos((t - 0.5) * Math.PI * 2)); // 0.5 附近最暗
    const intensity = 0.35 + nightFactor * 0.9;

    if (lightRef.current) {
      lightRef.current.color.copy(col);
      lightRef.current.intensity = intensity;
      // 太陽繞行
      lightRef.current.position.set(Math.cos(t * Math.PI * 2) * 12, 6 + Math.sin(t * Math.PI * 2) * 8, 5);
    }
    if (ambRef.current) ambRef.current.intensity = 0.3 + nightFactor * 0.3;
  });

  return (
    <>
      <directionalLight ref={lightRef} position={[10, 12, 5]} intensity={1.2} color="#fff2d0" />
      <ambientLight ref={ambRef} intensity={0.5} color="#cfe0ff" />
      {/* 天氣粒子 */}
      {weather === 'rain' && (
        <Sparkles count={200} scale={[40, 20, 40]} size={1.5} speed={3} opacity={0.5} color="#a0c0ff" position={[0, 8, 0]} />
      )}
      {weather === 'snow' && (
        <Sparkles count={150} scale={[40, 20, 40]} size={2.5} speed={0.5} opacity={0.8} color="#ffffff" position={[0, 8, 0]} />
      )}
    </>
  );
}
