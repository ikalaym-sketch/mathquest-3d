// 描邊包裝元件（inverted-hull）
// 用法：<Outlined color="#e83a2a" scale={1.05}><boxGeometry/></Outlined>
// 內部渲染兩層：正常 toon 本體 + 稍微放大的深色背面外殼形成描邊。
import { toonMat, outlineMat } from '../../utils/toon.js';
import { useMemo } from 'react';

export default function Outlined({ children, color = '#ffffff', outlineScale = 1.06, ...props }) {
  // 材質記憶化，避免每次 render 重建
  const bodyMat = useMemo(() => toonMat(color), [color]);
  const edgeMat = useMemo(() => outlineMat(), []);

  return (
    <group {...props}>
      {/* 描邊外殼：放大 + 只畫背面（深色） */}
      <mesh scale={outlineScale} material={edgeMat}>
        {children}
      </mesh>
      {/* 本體：toon 材質 */}
      <mesh material={bodyMat}>{children}</mesh>
    </group>
  );
}
