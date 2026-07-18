// 薩爾達（BOTW/TOTK）風卡通渲染工具
import * as THREE from 'three';

// 產生 3 階漸層貼圖（給 MeshToonMaterial 用，形成明確的階梯狀陰影）
function makeGradientTexture(steps = 3) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    // 由暗到亮分階（0~255）
    data[i] = Math.round((i / (steps - 1)) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

// 共用漸層貼圖（避免每個材質重建）
const GRADIENT = makeGradientTexture(3);

// 快取，避免同色材質重複建立
const _cache = new Map();

// 取得 toon 材質（相同色碼會複用）
export function toonMat(color = '#ffffff') {
  if (_cache.has(color)) return _cache.get(color);
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: GRADIENT,
  });
  _cache.set(color, mat);
  return mat;
}

// 深色描邊材質（inverted-hull：反面外殼，比 postprocessing 省效能，適合手機）
export function outlineMat() {
  return new THREE.MeshBasicMaterial({
    color: '#0a0a12',
    side: THREE.BackSide, // 只渲染背面
  });
}
