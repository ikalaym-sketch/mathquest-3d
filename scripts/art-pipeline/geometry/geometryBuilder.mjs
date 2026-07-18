// 通用程序幾何 Builder；各資產 Recipe 只能描述幾何，不得自行散落建立規則。
import * as THREE from 'three';

export function buildPrimitiveGeometry(part) {
  switch (part.shape) {
    case 'box': return new THREE.BoxGeometry(...(part.args || [1, 1, 1]));
    case 'sphere': return new THREE.SphereGeometry(...(part.args || [0.5, 12, 8]));
    case 'cylinder': return new THREE.CylinderGeometry(...(part.args || [0.5, 0.5, 1, 8]));
    case 'cone': return new THREE.ConeGeometry(...(part.args || [0.5, 1, 8]));
    case 'torus': return new THREE.TorusGeometry(...(part.args || [0.5, 0.1, 8, 16]));
    case 'icosahedron': return new THREE.IcosahedronGeometry(...(part.args || [0.5, 0]));
    default: throw new Error(`不支援的 geometry shape：${part.shape}`);
  }
}
