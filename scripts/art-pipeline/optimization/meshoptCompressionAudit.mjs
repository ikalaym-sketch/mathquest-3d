// v0.34 Meshopt 正式編碼／解碼稽核。
// 本階段驗證每個新 GLB 的 buffer accessor 可無損 Meshopt round-trip，並量測候選壓縮率；
// 不在缺少實機相容性驗收前把 EXT_meshopt_compression 強制寫成 required，避免舊裝置黑屏。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { V034_INTERIOR_TOWER_ASSET_DEFINITIONS } from '../../../src/data/interiorTowerV034Catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const COMPONENT_BYTES = Object.freeze({ 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 });
const TYPE_COMPONENTS = Object.freeze({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 });
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);

const assets = [];
for (const definition of V034_INTERIOR_TOWER_ASSET_DEFINITIONS) {
  const sourcePath = path.join(root, 'public', definition.canonicalPath);
  const source = await fs.readFile(sourcePath);
  const glb = parseGlb(source);
  const result = auditAccessors(glb.json, glb.bin);
  if (!result.ok) throw new Error(`${definition.assetId} Meshopt round-trip失敗：${result.errors.join(' | ')}`);
  assets.push({ assetId: definition.assetId, category: definition.category, sourceBytes: source.length, ...result });
}

const totals = assets.reduce((output, item) => {
  output.accessors += item.accessors;
  output.rawAccessorBytes += item.rawAccessorBytes;
  output.encodedAccessorBytes += item.encodedAccessorBytes;
  output.skippedAccessors += item.skippedAccessors;
  return output;
}, { accessors: 0, rawAccessorBytes: 0, encodedAccessorBytes: 0, skippedAccessors: 0 });
totals.candidateRatio = Number((totals.encodedAccessorBytes / Math.max(1, totals.rawAccessorBytes)).toFixed(3));

const report = {
  generatedAt: new Date().toISOString(),
  release: 'v0.34.0',
  status: 'encoder-integrated-roundtrip-audited',
  encoder: 'meshoptimizer',
  encoderVersion: '1.1.1',
  runtimeExtensionWritten: false,
  runtimeExtensionRequired: false,
  physicalCompatibilityGate: 'v0.36',
  reason: 'EXT_meshopt_compression強制改寫須在Android、平板與桌機實際Loader驗收後啟用。',
  assetCount: assets.length,
  totals,
  assets,
  ok: assets.length === 96 && assets.every((item) => item.ok),
};

const outputPath = path.join(root, 'public', 'manifests', 'meshopt-v034-audit.json');
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), ...report, assets: undefined }, null, 2));

function auditAccessors(json, bin) {
  const indexAccessors = new Set();
  for (const mesh of json.meshes || []) for (const primitive of mesh.primitives || []) if (Number.isInteger(primitive.indices)) indexAccessors.add(primitive.indices);
  const errors = [];
  let rawAccessorBytes = 0;
  let encodedAccessorBytes = 0;
  let accessors = 0;
  let skippedAccessors = 0;

  for (const [accessorIndex, accessor] of (json.accessors || []).entries()) {
    if (!Number.isInteger(accessor.bufferView) || accessor.sparse) { skippedAccessors += 1; continue; }
    const view = json.bufferViews?.[accessor.bufferView];
    if (!view) { skippedAccessors += 1; continue; }
    const componentBytes = COMPONENT_BYTES[accessor.componentType];
    const components = TYPE_COMPONENTS[accessor.type];
    const stride = view.byteStride || componentBytes * components;
    // TRIANGLES 模式可在維持幾何等價時循環旋轉單一三角形索引；稽核要求逐位元回讀，因此採 INDICES。
    const mode = indexAccessors.has(accessorIndex) ? 'INDICES' : 'ATTRIBUTES';
    if (!componentBytes || !components || (mode === 'ATTRIBUTES' && stride % 4 !== 0) || (mode !== 'ATTRIBUTES' && ![2, 4].includes(stride))) {
      skippedAccessors += 1;
      continue;
    }
    const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
    const length = accessor.count * stride;
    const source = new Uint8Array(bin.buffer, bin.byteOffset + offset, length);
    const encoded = MeshoptEncoder.encodeGltfBuffer(source, accessor.count, stride, mode);
    const decoded = new Uint8Array(length);
    MeshoptDecoder.decodeGltfBuffer(decoded, accessor.count, stride, encoded, mode);
    if (!equalBytes(source, decoded)) errors.push(`accessor ${accessorIndex} (${mode}) round-trip不同`);
    rawAccessorBytes += length;
    encodedAccessorBytes += encoded.length;
    accessors += 1;
  }
  return {
    ok: errors.length === 0 && accessors > 0,
    accessors,
    skippedAccessors,
    rawAccessorBytes,
    encodedAccessorBytes,
    candidateRatio: Number((encodedAccessorBytes / Math.max(1, rawAccessorBytes)).toFixed(3)),
    errors,
  };
}

function parseGlb(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error('不是GLB。');
  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8').trim());
    if (type === 0x004e4942) bin = data;
    offset += 8 + length;
  }
  if (!json || !bin) throw new Error('GLB缺少JSON或BIN chunk。');
  return { json, bin };
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return false;
  return true;
}
