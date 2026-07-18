// v0.35 Runtime Atlas 建置入口：資產數量凍結於800，正式輸出16組PNG Fallback、KTX2、Mipmap與Basis轉碼器。
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuntimeAtlases, RUNTIME_ATLAS_RECIPES } from './texture/atlasKtx2Builder.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = path.join(root, 'public', 'textures', 'atlases');
const basisDir = path.join(root, 'public', 'basis');
await mkdir(outputDir, { recursive: true });
const files = await buildRuntimeAtlases({ root, outputDir, basisDir });
const manifest = {
  schemaVersion: 1,
  release: 'v0.35.0',
  generatedAt: new Date().toISOString(),
  runtimePreference: ['ktx2', 'png'],
  ktx2: { encoder: 'Basis Universal', mipmaps: true, transcoderPath: 'basis/' },
  atlases: RUNTIME_ATLAS_RECIPES.map((recipe) => ({ ...recipe, tileGrid: [4, 4], files: files.filter((item) => item.atlasId === recipe.atlasId) })),
};
await writeFile(path.join(outputDir, 'atlas-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, atlasCount: manifest.atlases.length, filePairs: files.length, manifest: 'public/textures/atlases/atlas-manifest.json' }, null, 2));
