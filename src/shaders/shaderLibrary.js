// v0.29.1 Canonical Shader Library。
// 所有動態材質只能透過 profileId 取得；元件不得自行內嵌未分級的 GLSL。

const COMMON_VERTEX = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`;

const WIND_VERTEX = `
uniform float uTime;
uniform float uStrength;
uniform float uFrequency;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  vUv = uv;
  vec3 moved = position;
  float heightMask = clamp(uv.y, 0.0, 1.0);
  moved.x += sin(uTime * uFrequency + position.x * 1.7 + position.z * 1.3) * uStrength * heightMask;
  moved.z += cos(uTime * uFrequency * 0.73 + position.x) * uStrength * 0.35 * heightMask;
  vec4 worldPosition = modelMatrix * vec4(moved, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`;

const NOISE = `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}`;

const BASE_FRAGMENT = `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  float light = 0.55 + max(dot(normalize(vWorldNormal), normalize(vec3(0.35, 1.0, 0.25))), 0.0) * 0.45;
  gl_FragColor = vec4(uColor * light, uOpacity);
}`;

const createProfile = ({ id, vertex = COMMON_VERTEX, fragment = BASE_FRAGMENT, uniforms = {}, transparent = false, blending = 'normal' }) => Object.freeze({
  id,
  vertexShader: vertex,
  fragmentShader: fragment,
  defaultUniforms: Object.freeze(uniforms),
  transparent,
  blending,
});

const SHADERS = {
  terrainBlend: createProfile({
    id: 'terrainBlend',
    fragment: `${NOISE}
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uScale;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  float n = valueNoise(vWorldPosition.xz * uScale);
  float slope = 1.0 - clamp(vWorldNormal.y, 0.0, 1.0);
  vec3 color = mix(uColor, uSecondaryColor, clamp(n * 0.75 + slope * 0.45, 0.0, 1.0));
  gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: { uColor: '#6f9f52', uSecondaryColor: '#786349', uScale: 0.18 },
  }),
  grassWind: createProfile({ id: 'grassWind', vertex: WIND_VERTEX, uniforms: { uColor: '#72a958', uOpacity: 1, uTime: 0, uStrength: 0.08, uFrequency: 1.8 } }),
  waterSurface: createProfile({
    id: 'waterSurface', transparent: true,
    fragment: `${NOISE}
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uDeepColor;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vWorldPosition;
void main() {
  float waveA = sin(vWorldPosition.x * 1.8 + uTime * 1.2) * 0.5 + 0.5;
  float waveB = valueNoise(vWorldPosition.xz * 1.7 + vec2(uTime * 0.08, -uTime * 0.05));
  float foam = smoothstep(0.82, 1.0, waveA * 0.55 + waveB * 0.6);
  vec3 color = mix(uDeepColor, uColor, waveB * 0.55 + 0.2) + vec3(foam * 0.22);
  gl_FragColor = vec4(color, uOpacity);
}`,
    uniforms: { uTime: 0, uColor: '#70d7e8', uDeepColor: '#347fa5', uOpacity: 0.78 },
  }),
  snowAccumulation: createProfile({
    id: 'snowAccumulation',
    fragment: `${NOISE}
uniform vec3 uColor;
uniform vec3 uSnowColor;
uniform float uAmount;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  float upward = smoothstep(0.25, 0.9, vWorldNormal.y);
  float variation = valueNoise(vWorldPosition.xz * 0.35);
  float mask = smoothstep(1.0 - uAmount, 1.0, upward * 0.8 + variation * 0.2);
  gl_FragColor = vec4(mix(uColor, uSnowColor, mask), 1.0);
}`,
    uniforms: { uColor: '#6c7a83', uSnowColor: '#f2fbff', uAmount: 0.65 },
  }),
  wetSurface: createProfile({
    id: 'wetSurface',
    fragment: `${NOISE}
uniform vec3 uColor;
uniform float uWetness;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  float puddle = smoothstep(0.55, 0.9, valueNoise(vWorldPosition.xz * 0.55));
  float gloss = mix(0.72, 1.2, puddle * uWetness);
  float light = 0.5 + max(dot(normalize(vWorldNormal), normalize(vec3(0.3, 1.0, 0.2))), 0.0) * 0.5;
  gl_FragColor = vec4(uColor * light * gloss, 1.0);
}`,
    uniforms: { uColor: '#665442', uWetness: 0.7 },
  }),
  crystalPulse: createProfile({
    id: 'crystalPulse', transparent: true,
    fragment: `uniform float uTime; uniform vec3 uColor; uniform vec3 uGlowColor; varying vec2 vUv; varying vec3 vWorldNormal;
void main(){ float pulse=0.45+0.35*sin(uTime*2.2+vUv.y*8.0); float edge=pow(1.0-abs(vWorldNormal.z),2.0); gl_FragColor=vec4(mix(uColor,uGlowColor,clamp(pulse+edge,0.0,1.0)),0.86); }`,
    uniforms: { uTime: 0, uColor: '#65cfe0', uGlowColor: '#e4fbff' },
  }),
  mushroomSpore: createProfile({
    id: 'mushroomSpore', transparent: true, blending: 'additive',
    fragment: `${NOISE}
uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){ vec2 p=vUv-0.5; float d=length(p); float n=valueNoise(vUv*18.0+uTime*0.08); float a=smoothstep(0.48,0.1,d)*smoothstep(0.55,0.9,n); gl_FragColor=vec4(uColor,a*0.65); }`,
    uniforms: { uTime: 0, uColor: '#ef9ee3' },
  }),
  steamFlow: createProfile({
    id: 'steamFlow', transparent: true,
    fragment: `${NOISE}
uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){ float n=valueNoise(vec2(vUv.x*5.0+sin(vUv.y*8.0)*0.15,vUv.y*4.0-uTime*0.35)); float edge=smoothstep(0.5,0.12,abs(vUv.x-0.5)); float a=edge*n*smoothstep(0.0,0.15,vUv.y)*smoothstep(1.0,0.72,vUv.y); gl_FragColor=vec4(uColor,a*0.52); }`,
    uniforms: { uTime: 0, uColor: '#e7f4f5' },
  }),
  hologramPanel: createProfile({
    id: 'hologramPanel', transparent: true, blending: 'additive',
    fragment: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){ float line=0.72+0.28*sin((vUv.y+uTime*0.12)*420.0); float frame=step(vUv.x,0.02)+step(0.98,vUv.x)+step(vUv.y,0.02)+step(0.98,vUv.y); gl_FragColor=vec4(uColor*(line+frame),0.38+frame*0.35); }`,
    uniforms: { uTime: 0, uColor: '#71e9ff' },
  }),
  equipmentEnchant: createProfile({
    id: 'equipmentEnchant', blending: 'additive',
    fragment: `${NOISE}
uniform float uTime; uniform vec3 uColor; uniform vec3 uGlowColor; varying vec2 vUv; varying vec3 vWorldNormal;
void main(){ float rune=smoothstep(0.68,0.9,valueNoise(vUv*12.0+uTime*0.04)); float rim=pow(1.0-abs(vWorldNormal.z),2.5); gl_FragColor=vec4(mix(uColor,uGlowColor,clamp(rune*0.6+rim,0.0,1.0)),1.0); }`,
    uniforms: { uTime: 0, uColor: '#8693a8', uGlowColor: '#9ae8ff' },
  }),
  hitFlash: createProfile({ id: 'hitFlash', uniforms: { uColor: '#ffffff', uOpacity: 1 } }),
  bossWeakPoint: createProfile({
    id: 'bossWeakPoint', blending: 'additive',
    fragment: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){ float ring=abs(length(vUv-0.5)-0.28); float pulse=smoothstep(0.055,0.0,ring)*(0.65+0.35*sin(uTime*5.0)); gl_FragColor=vec4(uColor*pulse,pulse); }`,
    uniforms: { uTime: 0, uColor: '#ff8b5c' }, transparent: true,
  }),
  dissolveEffect: createProfile({
    id: 'dissolveEffect', transparent: true,
    fragment: `${NOISE}
uniform float uProgress; uniform vec3 uColor; uniform vec3 uEdgeColor; varying vec2 vUv;
void main(){ float n=valueNoise(vUv*11.0); float edge=smoothstep(uProgress,uProgress+0.05,n)-smoothstep(uProgress+0.05,uProgress+0.1,n); if(n<uProgress) discard; gl_FragColor=vec4(mix(uColor,uEdgeColor,edge),1.0); }`,
    uniforms: { uProgress: 0, uColor: '#8c98a6', uEdgeColor: '#ffd875' },
  }),
  festivalLight: createProfile({
    id: 'festivalLight', transparent: true, blending: 'additive',
    fragment: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){ float d=length(vUv-0.5); float glow=smoothstep(0.5,0.0,d)*(0.78+0.22*sin(uTime*2.5)); gl_FragColor=vec4(uColor*glow,glow*0.78); }`,
    uniforms: { uTime: 0, uColor: '#ffd578' },
  }),
};

export const SHADER_LIBRARY = Object.freeze(SHADERS);

export const SHADER_QUALITY_PROFILES = Object.freeze({
  low: Object.freeze({ noiseOctaves: 1, dynamicNormal: false, transparencyLayers: 1, maxDistance: 28 }),
  medium: Object.freeze({ noiseOctaves: 2, dynamicNormal: true, transparencyLayers: 2, maxDistance: 55 }),
  high: Object.freeze({ noiseOctaves: 4, dynamicNormal: true, transparencyLayers: 3, maxDistance: 100 }),
  off: Object.freeze({ noiseOctaves: 0, dynamicNormal: false, transparencyLayers: 0, maxDistance: 0 }),
});

export function getShaderProfile(profileId) {
  return SHADER_LIBRARY[profileId] || null;
}

export function getShaderQualityProfile(quality = 'medium') {
  return SHADER_QUALITY_PROFILES[quality] || SHADER_QUALITY_PROFILES.medium;
}
