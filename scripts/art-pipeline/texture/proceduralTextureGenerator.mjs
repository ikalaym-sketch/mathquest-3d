// v0.29.1 程序 Texture 生成器。
// 所有輸出均由固定 seed 與 Recipe 產生，可重建、可稽核，不依賴手動圖片。
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { encodeRgbaPng } from './pngCodec.mjs';

const SIZE = 128;

export const PROCEDURAL_TEXTURE_RECIPES = Object.freeze([
  { id: 'wood_basecolor', channel: 'baseColor', generator: 'wood', seed: 1103, atlas: 'atlas_village' },
  { id: 'soil_basecolor', channel: 'baseColor', generator: 'soil', seed: 2207, atlas: 'atlas_farm' },
  { id: 'stone_basecolor', channel: 'baseColor', generator: 'stone', seed: 3301, atlas: 'atlas_forest' },
  { id: 'cloth_basecolor', channel: 'baseColor', generator: 'cloth', seed: 4409, atlas: 'atlas_residents' },
  { id: 'water_normal', channel: 'normal', generator: 'waterNormal', seed: 5519, atlas: null },
  { id: 'moss_mask', channel: 'mask', generator: 'mossMask', seed: 6619, atlas: 'atlas_forest' },
  { id: 'snow_mask', channel: 'mask', generator: 'snowMask', seed: 7723, atlas: 'atlas_snow' },
  { id: 'metal_orm', channel: 'orm', generator: 'metalOrm', seed: 8831, atlas: 'atlas_equipment_metal' },
  { id: 'crystal_emissive', channel: 'emissive', generator: 'crystalEmissive', seed: 9941, atlas: 'atlas_crystal' },
  { id: 'mud_orm', channel: 'orm', generator: 'mudOrm', seed: 10501, atlas: 'atlas_farm' },
]);

export async function generateProceduralTextures(outputDir) {
  await mkdir(outputDir, { recursive: true });
  const outputs = [];
  for (const recipe of PROCEDURAL_TEXTURE_RECIPES) {
    const pixels = generatePixels(recipe.generator, SIZE, SIZE, recipe.seed);
    const filename = `${recipe.id}.png`;
    await writeFile(path.join(outputDir, filename), encodeRgbaPng(SIZE, SIZE, pixels));
    outputs.push({ ...recipe, filename, width: SIZE, height: SIZE, source: 'procedural-code', runtimeFormat: 'png', plannedCompressedFormat: 'ktx2' });
  }
  return outputs;
}

function generatePixels(generator, width, height, seed) {
  const pixels = new Uint8Array(width * height * 4);
  const sample = GENERATORS[generator];
  if (!sample) throw new Error(`Unknown procedural texture generator: ${generator}`);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rgba = sample(x, y, width, height, seed);
      const offset = (y * width + x) * 4;
      pixels[offset] = clampByte(rgba[0]);
      pixels[offset + 1] = clampByte(rgba[1]);
      pixels[offset + 2] = clampByte(rgba[2]);
      pixels[offset + 3] = clampByte(rgba[3] ?? 255);
    }
  }
  return pixels;
}

const GENERATORS = {
  wood(x, y, width, height, seed) {
    const u = x / width; const v = y / height;
    const rings = Math.sin((u * 19 + valueNoise(u * 5, v * 2, seed) * 3) * Math.PI);
    const grain = valueNoise(u * 48, v * 9, seed + 13);
    const line = Math.abs(rings) * 0.45 + grain * 0.18;
    return [126 + line * 48, 78 + line * 29, 43 + line * 18, 255];
  },
  soil(x, y, width, height, seed) {
    const n = fbm(x / width * 8, y / height * 8, seed, 4);
    const pebble = valueNoise(x / width * 42, y / height * 42, seed + 31) > 0.88 ? 24 : 0;
    return [91 + n * 38 + pebble, 66 + n * 25 + pebble, 43 + n * 18 + pebble, 255];
  },
  stone(x, y, width, height, seed) {
    const u = x / width * 9; const v = y / height * 9;
    const cells = voronoi(u, v, seed);
    const crack = cells.edge < 0.08 ? -38 : 0;
    const n = fbm(u * 0.55, v * 0.55, seed + 47, 3);
    return [113 + n * 28 + crack, 120 + n * 25 + crack, 112 + n * 21 + crack, 255];
  },
  cloth(x, y, width, height, seed) {
    const weaveX = Math.sin((x + seed % 7) * Math.PI * 0.5) * 8;
    const weaveY = Math.sin((y + seed % 5) * Math.PI * 0.5) * 7;
    const n = valueNoise(x / 18, y / 18, seed) * 12;
    return [117 + weaveX + n, 157 + weaveY + n, 187 + (weaveX + weaveY) * 0.35 + n, 255];
  },
  waterNormal(x, y, width, height, seed) {
    const u = x / width; const v = y / height;
    const hL = waveHeight(u - 1 / width, v, seed); const hR = waveHeight(u + 1 / width, v, seed);
    const hD = waveHeight(u, v - 1 / height, seed); const hU = waveHeight(u, v + 1 / height, seed);
    const nx = hL - hR; const ny = hD - hU; const nz = 0.7;
    const length = Math.hypot(nx, ny, nz) || 1;
    return [(nx / length * 0.5 + 0.5) * 255, (ny / length * 0.5 + 0.5) * 255, (nz / length * 0.5 + 0.5) * 255, 255];
  },
  mossMask(x, y, width, height, seed) {
    const n = fbm(x / width * 6, y / height * 6, seed, 5);
    const vertical = 1 - y / height;
    const value = smoothstep(0.43, 0.76, n * 0.75 + vertical * 0.22) * 255;
    return [value, value, value, 255];
  },
  snowMask(x, y, width, height, seed) {
    const n = fbm(x / width * 7, y / height * 7, seed, 4);
    const value = smoothstep(0.48, 0.7, n) * 255;
    return [value, value, value, 255];
  },
  metalOrm(x, y, width, height, seed) {
    const n = fbm(x / width * 10, y / height * 10, seed, 3);
    const scratches = Math.abs(Math.sin((x * 0.31 + y * 0.07 + seed) * 0.11)) > 0.97 ? 0.22 : 0;
    const occlusion = 220 - n * 28;
    const roughness = 92 + n * 68 + scratches * 90;
    const metallic = 235;
    return [occlusion, roughness, metallic, 255];
  },
  crystalEmissive(x, y, width, height, seed) {
    const u = x / width - 0.5; const v = y / height - 0.5;
    const radial = Math.max(0, 1 - Math.hypot(u * 1.4, v));
    const veins = smoothstep(0.76, 0.94, valueNoise(u * 19 + 10, v * 19 + 10, seed));
    return [35 + radial * 45, 120 + radial * 100, 155 + radial * 95 + veins * 60, 255];
  },
  mudOrm(x, y, width, height, seed) {
    const n = fbm(x / width * 5, y / height * 5, seed, 4);
    const puddle = smoothstep(0.62, 0.8, n);
    return [190 - n * 45, 205 - puddle * 150, 0, 255];
  },
};

function waveHeight(u, v, seed) {
  return Math.sin((u * 11 + v * 4) * Math.PI + seed) * 0.55 + Math.cos((v * 13 - u * 3) * Math.PI + seed * 0.13) * 0.3 + valueNoise(u * 8, v * 8, seed) * 0.15;
}
function fbm(x, y, seed, octaves) {
  let value = 0; let amplitude = 0.5; let frequency = 1; let total = 0;
  for (let i = 0; i < octaves; i += 1) { value += valueNoise(x * frequency, y * frequency, seed + i * 101) * amplitude; total += amplitude; amplitude *= 0.5; frequency *= 2; }
  return value / total;
}
function valueNoise(x, y, seed) {
  const x0 = Math.floor(x); const y0 = Math.floor(y); const tx = smooth(x - x0); const ty = smooth(y - y0);
  const a = hash2(x0, y0, seed); const b = hash2(x0 + 1, y0, seed); const c = hash2(x0, y0 + 1, seed); const d = hash2(x0 + 1, y0 + 1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}
function voronoi(x, y, seed) {
  const ix = Math.floor(x); const iy = Math.floor(y); let first = Infinity; let second = Infinity;
  for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) {
    const cx = ix + ox + hash2(ix + ox, iy + oy, seed);
    const cy = iy + oy + hash2(ix + ox, iy + oy, seed + 73);
    const distance = Math.hypot(x - cx, y - cy);
    if (distance < first) { second = first; first = distance; } else if (distance < second) second = distance;
  }
  return { distance: first, edge: second - first };
}
function hash2(x, y, seed) { let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function smooth(t) { return t * t * (3 - 2 * t); }
function smoothstep(a, b, value) { const t = Math.max(0, Math.min(1, (value - a) / (b - a))); return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clampByte(value) { return Math.max(0, Math.min(255, Math.round(value))); }
