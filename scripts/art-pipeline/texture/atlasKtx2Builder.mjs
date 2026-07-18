// v0.30 Atlas／KTX2 正式生成器。
// 以固定 Recipe 產生 BaseColor、Normal、ORM、Emissive、Mask，並透過 Basis Universal 產出具 Mipmap 的 KTX2。
import { chmod, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { encodeRgbaPng } from './pngCodec.mjs';

const SIZE = 1024;
const GRID = 4;
const TILE_SIZE = SIZE / GRID;

export const RUNTIME_ATLAS_RECIPES = Object.freeze([
  { atlasId: 'atlas_player', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#4f83c5', '#f0cf70', '#704c38', '#f0c9a5', '#5b7d91', '#8f66b2'] },
  { atlasId: 'atlas_residents', channels: ['baseColor', 'normal', 'orm', 'mask'], palette: ['#7b6eb2', '#4f8ba1', '#7a4f3a', '#4e8c68', '#d36956', '#c49a58'] },
  { atlasId: 'atlas_companions', channels: ['baseColor', 'normal', 'orm', 'mask'], palette: ['#9b7658', '#f4eee6', '#e78343', '#b8c7d9', '#8a6b50', '#a94832'] },
  { atlasId: 'atlas_village', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#e8c882', '#a36c45', '#c85f52', '#738e59', '#76bdd1', '#dba8c1'] },
  { atlasId: 'atlas_farm', channels: ['baseColor', 'normal', 'orm', 'mask'], palette: ['#9f7146', '#745038', '#6b9d4b', '#d4b765', '#8fa9af', '#c6674b'] },
  { atlasId: 'atlas_crop_animal', channels: ['baseColor', 'normal', 'orm', 'mask'], palette: ['#4f9d50', '#79b94d', '#e4c74d', '#dc654b', '#e58d35', '#d6a8a0'] },
  { atlasId: 'atlas_equipment_metal', channels: ['baseColor', 'normal', 'orm', 'emissive'], palette: ['#9ca8ad', '#5d6870', '#d6b85d', '#5592c7', '#b26f72', '#8d72bb'] },
  { atlasId: 'atlas_equipment_cloth', channels: ['baseColor', 'normal', 'orm', 'mask'], palette: ['#8f633f', '#796aaa', '#66864e', '#c55738', '#4e7898', '#72884d'] },
  { atlasId: 'atlas_forest', channels: ['baseColor', 'normal', 'orm', 'mask'], palette: ['#527f4f', '#86ad62', '#6c523d', '#b8d48a', '#487a66', '#d2c078'] },
  { atlasId: 'atlas_wind', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#6fc7df', '#d9f3ff', '#78966b', '#acd77d', '#ffffff', '#638cb1'] },
  { atlasId: 'atlas_snow', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#a7e2ee', '#eefcff', '#789fb4', '#c8dff1', '#6fc2de', '#ffffff'] },
  { atlasId: 'atlas_crystal', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#49d4d1', '#8ba9f3', '#a7eee0', '#5eb4d8', '#d7ffff', '#637cca'] },
  { atlasId: 'atlas_canyon', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#df8244', '#edbd68', '#86513a', '#c76737', '#f1d394', '#607851'] },
  { atlasId: 'atlas_mushroom', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#d967af', '#8e71d1', '#79ae73', '#f0a7d4', '#6bc4a0', '#5c496f'] },
  { atlasId: 'atlas_clockwork', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#c38a42', '#76847d', '#53646b', '#d9b86c', '#90b5a4', '#3f484d'] },
  // 室內、節慶、試煉塔不會與全部區域同時駐留；此Atlas由各自Bundle按場景載入。
  { atlasId: 'atlas_interior_festival_tower', channels: ['baseColor', 'normal', 'orm', 'emissive', 'mask'], palette: ['#c99d65', '#f0ce78', '#63538f', '#6cc4d6', '#d96da8', '#55606b'] },
]);

export async function buildRuntimeAtlases({ root, outputDir, basisDir }) {
  await mkdir(outputDir, { recursive: true });
  await mkdir(basisDir, { recursive: true });
  await installBasisTranscoder(root, basisDir);

  const outputs = [];
  for (const recipe of RUNTIME_ATLAS_RECIPES) {
    for (const channel of recipe.channels) {
      const pixels = generateAtlasPixels(recipe, channel);
      const pngName = `${recipe.atlasId}_${channel}.png`;
      const ktx2Name = `${recipe.atlasId}_${channel}.ktx2`;
      const pngPath = path.join(outputDir, pngName);
      const ktx2Path = path.join(outputDir, ktx2Name);
      await writeFile(pngPath, encodeRgbaPng(SIZE, SIZE, pixels));
      await encodeKtx2(root, pngPath, ktx2Path, channel);
      outputs.push(await createEvidence(outputDir, recipe.atlasId, channel, pngName, ktx2Name));
    }
  }
  return outputs;
}

function generateAtlasPixels(recipe, channel) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const palette = recipe.palette.map(hexToRgb);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const tileX = Math.floor(x / TILE_SIZE);
      const tileY = Math.floor(y / TILE_SIZE);
      const tile = tileY * GRID + tileX;
      const u = (x % TILE_SIZE) / TILE_SIZE;
      const v = (y % TILE_SIZE) / TILE_SIZE;
      const color = sampleChannel(channel, palette, tile, u, v, recipe.atlasId);
      const offset = (y * SIZE + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3] ?? 255;
    }
  }
  return pixels;
}

function sampleChannel(channel, palette, tile, u, v, atlasId) {
  const base = palette[tile % palette.length];
  const seed = hashString(`${atlasId}:${tile}`);
  const weave = Math.sin((u * (8 + tile % 5) + v * (3 + tile % 4)) * Math.PI * 2 + seed) * 0.5 + 0.5;
  const grain = valueNoise(u * 14, v * 14, seed);
  const border = Math.min(u, v, 1 - u, 1 - v);
  if (channel === 'baseColor') {
    const shade = 0.72 + grain * 0.22 + weave * 0.08 - (border < 0.025 ? 0.12 : 0);
    return [base[0] * shade, base[1] * shade, base[2] * shade, 255].map(clampByte);
  }
  if (channel === 'normal') {
    const dx = Math.cos((u * 10 + grain * 2) * Math.PI * 2) * 0.14;
    const dy = Math.sin((v * 10 + weave * 2) * Math.PI * 2) * 0.14;
    const nz = Math.sqrt(Math.max(0.001, 1 - dx * dx - dy * dy));
    return [128 + dx * 127, 128 + dy * 127, nz * 255, 255].map(clampByte);
  }
  if (channel === 'orm') {
    const occlusion = border < 0.03 ? 160 : 220 - grain * 25;
    const roughness = 110 + (tile % 4) * 25 + weave * 30;
    const metallic = tile % 7 === 0 || tile % 7 === 1 ? 205 : 8;
    return [occlusion, roughness, metallic, 255].map(clampByte);
  }
  if (channel === 'emissive') {
    const active = tile % 5 === 0 || tile % 7 === 0;
    const pulse = active ? Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.5) * 2) : 0;
    return [base[0] * pulse, base[1] * pulse, Math.min(255, base[2] * pulse + 40 * pulse), 255].map(clampByte);
  }
  const mask = clampByte((grain * 0.7 + weave * 0.3) * 255);
  return [mask, tile % 2 ? mask : 0, tile % 3 ? 0 : mask, 255];
}

async function encodeKtx2(root, inputPath, outputPath, channel) {
  const binary = path.join(root, 'node_modules', 'basis_universal', 'bin', process.platform === 'win32' ? 'basisu.exe' : 'basisu');
  if (process.platform !== 'win32') await chmod(binary, 0o755);
  const linear = channel === 'normal' || channel === 'orm' || channel === 'mask';
  const args = [inputPath, '-ktx2', '-mipmap', '-output_file', outputPath, '-q', channel === 'baseColor' ? '190' : '160'];
  if (linear) args.push('-linear');
  if (channel === 'normal') args.push('-normal_map', '-mip_renorm');
  await run(binary, args, root);
}

async function installBasisTranscoder(root, basisDir) {
  const source = path.join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'basis');
  await copyFile(path.join(source, 'basis_transcoder.js'), path.join(basisDir, 'basis_transcoder.js'));
  await copyFile(path.join(source, 'basis_transcoder.wasm'), path.join(basisDir, 'basis_transcoder.wasm'));
}

async function createEvidence(outputDir, atlasId, channel, pngName, ktx2Name) {
  const png = await readFile(path.join(outputDir, pngName));
  const ktx2 = await readFile(path.join(outputDir, ktx2Name));
  const pngStat = await stat(path.join(outputDir, pngName));
  const ktxStat = await stat(path.join(outputDir, ktx2Name));
  return {
    atlasId, channel, width: SIZE, height: SIZE, tileGrid: [GRID, GRID],
    png: { path: `textures/atlases/${pngName}`, bytes: pngStat.size, sha256: createHash('sha256').update(png).digest('hex') },
    ktx2: { path: `textures/atlases/${ktx2Name}`, bytes: ktxStat.size, sha256: createHash('sha256').update(ktx2).digest('hex') },
  };
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve(stdout) : reject(new Error(`basisu failed (${code}): ${stderr || stdout}`)));
  });
}

function hexToRgb(hex) { const value = Number.parseInt(hex.replace('#', ''), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; }
function clampByte(value) { return Math.max(0, Math.min(255, Math.round(value))); }
function hashString(value) { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function valueNoise(x, y, seed) {
  const x0 = Math.floor(x); const y0 = Math.floor(y); const tx = smooth(x - x0); const ty = smooth(y - y0);
  const a = hash2(x0, y0, seed); const b = hash2(x0 + 1, y0, seed); const c = hash2(x0, y0 + 1, seed); const d = hash2(x0 + 1, y0 + 1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}
function hash2(x, y, seed) { let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function smooth(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }
