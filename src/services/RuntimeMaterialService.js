// v0.29.1 Material／Shader Profile 實際套用服務。
// 只修改每個模型實例的 clone，禁止污染 useGLTF 共用材質；SkinnedMesh 保留原材質避免自訂 Vertex Shader 破壞骨架蒙皮。
import * as THREE from 'three';
import { resolveMaterialRuntimeProfile } from './MaterialProfileService.js';

export function applyRuntimeMaterialProfile(root, asset, options = {}) {
  const quality = options.quality || 'medium';
  const profile = resolveMaterialRuntimeProfile(asset?.materialProfile, quality, options.materialOverrides || {});
  const ownedMaterials = [];
  const dynamicMaterials = [];

  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const nodeOverride = options.colorOverrides?.[node.name] || null;
    const originalMaterials = Array.isArray(node.material) ? node.material : [node.material];
    const nextMaterials = originalMaterials.map((material) => {
      if (!material) return material;
      const cloned = material.clone?.() || material;
      if (nodeOverride && cloned.color?.set) {
        cloned.color.set(nodeOverride);
        if ('vertexColors' in cloned) cloned.vertexColors = false;
      }
      if (!profile.shader || quality === 'off' || node.isSkinnedMesh) {
        if (cloned !== material) ownedMaterials.push(cloned);
        return cloned;
      }
      const useVertexColors = Boolean(profile.useVertexColors && cloned.vertexColors && node.geometry?.attributes?.color);
      const shaderMaterial = createShaderMaterial(profile, cloned, useVertexColors);
      ownedMaterials.push(shaderMaterial);
      dynamicMaterials.push(shaderMaterial);
      if (cloned !== material) cloned.dispose?.();
      return shaderMaterial;
    });
    node.material = Array.isArray(node.material) ? nextMaterials : nextMaterials[0];
  });

  return {
    profile,
    dynamicMaterials,
    dispose() {
      for (const material of new Set(ownedMaterials)) material?.dispose?.();
    },
  };
}

export function updateRuntimeMaterialTime(dynamicMaterials, elapsedSeconds) {
  for (const material of dynamicMaterials || []) {
    const uniform = material?.uniforms?.uTime;
    if (uniform) uniform.value = elapsedSeconds;
  }
}

function createShaderMaterial(profile, sourceMaterial, useVertexColors = false) {
  const uniforms = Object.fromEntries(Object.entries(profile.uniforms || {}).map(([key, value]) => [key, { value: normalizeUniform(value) }]));
  if (!uniforms.uColor) uniforms.uColor = { value: sourceMaterial.color?.clone?.() || new THREE.Color('#ffffff') };
  if (!uniforms.uOpacity) uniforms.uOpacity = { value: sourceMaterial.opacity ?? 1 };
  const shaderSource = useVertexColors
    ? injectVertexColorSupport(profile.shader.vertexShader, profile.shader.fragmentShader)
    : { vertexShader: profile.shader.vertexShader, fragmentShader: profile.shader.fragmentShader };
  const material = new THREE.ShaderMaterial({
    vertexShader: shaderSource.vertexShader,
    fragmentShader: shaderSource.fragmentShader,
    uniforms,
    transparent: Boolean(profile.transparent || profile.shader.transparent || sourceMaterial.transparent),
    depthWrite: !(profile.transparent || profile.shader.transparent),
    side: sourceMaterial.side,
    vertexColors: useVertexColors,
    blending: profile.shader.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  material.name = `${sourceMaterial.name || 'material'}:${profile.profileId}`;
  return material;
}

export function injectVertexColorSupport(vertexShader, fragmentShader) {
  const mainPattern = /void\s+main\s*\(\s*\)\s*\{/;
  if (!mainPattern.test(vertexShader) || !mainPattern.test(fragmentShader)) {
    throw new Error('Shader profile 缺少可注入的 main()。');
  }
  const nextVertexShader = `varying vec3 vCanonicalColor;\n${vertexShader.replace(mainPattern, (match) => `${match}\n  vCanonicalColor = color;`)}`;
  const closingBraceIndex = fragmentShader.lastIndexOf('}');
  if (closingBraceIndex < 0) throw new Error('Fragment shader 缺少結束大括號。');
  const nextFragmentShader = `varying vec3 vCanonicalColor;\n${fragmentShader.slice(0, closingBraceIndex)}  gl_FragColor.rgb *= vCanonicalColor;\n${fragmentShader.slice(closingBraceIndex)}`;
  return { vertexShader: nextVertexShader, fragmentShader: nextFragmentShader };
}

function normalizeUniform(value) {
  if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) return new THREE.Color(value);
  if (Array.isArray(value)) return [...value];
  return value;
}
