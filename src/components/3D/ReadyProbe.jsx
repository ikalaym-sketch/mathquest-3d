// v0.7.0 就緒探針：等第 2 個實際算圖畫面（確保 shader 已編譯）回報載入完成
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { setStep } from '../../input/loadProgress.js';

export default function ReadyProbe() {
  const n = useRef(0);
  useFrame(() => {
    n.current += 1;
    // 第 2 幀時視覺內容已首次算圖完成
    if (n.current === 2) setStep('frame', 1);
    else if (n.current === 1) setStep('frame', 0.5);
  });
  return null;
}
