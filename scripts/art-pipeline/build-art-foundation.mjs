// v0.35.0 正式美術基礎生產入口。
// 可重複執行且輸出固定，不是一次性匯入或 Migration 工具。
import { mkdir, writeFile, rm, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { generateProceduralTextures } from './texture/proceduralTextureGenerator.mjs';
import { generateSvgPatterns } from './texture/svgPatternGenerator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const generatedDir = path.join(root, 'public/textures/generated');
const svgDir = path.join(root, 'public/textures/source-svg');

await rm(generatedDir, { recursive: true, force: true });
await rm(svgDir, { recursive: true, force: true });
await mkdir(generatedDir, { recursive: true });
await mkdir(svgDir, { recursive: true });

const textures = await attachEvidence(await generateProceduralTextures(generatedDir), generatedDir);
const svgPatterns = await attachEvidence(await generateSvgPatterns(svgDir), svgDir);
const manifest = {
  schemaVersion: 1,
  release: 'v0.35.0',
  generatedAt: new Date().toISOString(),
  policy: {
    externalManualImportRequired: false,
    svgRuntimePolicy: 'source-only-rasterize-to-atlas',
    currentRuntimeTextureFormat: 'ktx2',
    fallbackRuntimeTextureFormat: 'png',
    targetRuntimeTextureFormat: 'ktx2',
    ktx2Status: 'active-basis-universal-with-png-fallback',
  },
  textures,
  svgPatterns,
};
await writeFile(path.join(generatedDir, 'art-foundation-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, generatedTextures: textures.length, generatedSvgPatterns: svgPatterns.length, manifest: 'public/textures/generated/art-foundation-manifest.json' }, null, 2));

async function attachEvidence(entries, directory) {
  return Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.filename);
    const bytes = await readFile(filePath);
    const fileStat = await stat(filePath);
    return { ...entry, bytes: fileStat.size, sha256: createHash('sha256').update(bytes).digest('hex') };
  }));
}
