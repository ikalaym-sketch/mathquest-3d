// v0.35 美術治理永久驗證入口。
// 驗證 Registry、裝備／動畫契約、GLSL Library、程序 Texture/SVG、正式 Art Pipeline 與 Runtime 路徑邊界。
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAssetGovernanceContracts } from '../src/services/AssetGovernanceValidationService.js';
import { SHADER_LIBRARY } from '../src/shaders/shaderLibrary.js';
import { SHADER_PROFILE_IDS, TEXTURE_ATLAS_PROFILES } from '../src/data/artGovernanceProfiles.js';
import { CANONICAL_ASSET_REGISTRY } from '../src/data/productionAssetCatalog.js';
import { injectVertexColorSupport } from '../src/services/RuntimeMaterialService.js';
import {
  flushUnusedRuntimeAssets,
  getAssetRuntimeResidencySnapshot,
  registerRuntimeAssetResources,
  releaseRuntimeBundleAsset,
  retainRuntimeAsset,
  retainRuntimeBundleAsset,
} from '../src/services/AssetRuntimeService.js';
import { RUNTIME_ATLAS_RECIPES } from './art-pipeline/texture/atlasKtx2Builder.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const cases = [];

await runCase('canonical_registry_equipment_animation_contracts', async () => {
  const report = validateAssetGovernanceContracts();
  if (!report.ok) throw new Error(report.errors.join(' | '));
  warnings.push(...report.warnings);
  return report.summary;
});

await runCase('shader_library_has_all_governed_profiles', async () => {
  const missing = SHADER_PROFILE_IDS.filter((id) => !SHADER_LIBRARY[id]);
  if (missing.length) throw new Error(`缺少 Shader profiles：${missing.join(', ')}`);
  for (const id of SHADER_PROFILE_IDS) {
    const profile = SHADER_LIBRARY[id];
    if (!profile.vertexShader?.includes('gl_Position')) throw new Error(`${id} 缺少合法 vertex shader。`);
    if (!profile.fragmentShader?.includes('gl_FragColor')) throw new Error(`${id} 缺少合法 fragment shader。`);
  }
  const injected = injectVertexColorSupport(SHADER_LIBRARY.terrainBlend.vertexShader, SHADER_LIBRARY.terrainBlend.fragmentShader);
  if (!injected.vertexShader.includes('vCanonicalColor = color;')) throw new Error('Shader Vertex Color 未寫入 vertex stage。');
  if (!injected.fragmentShader.includes('gl_FragColor.rgb *= vCanonicalColor;')) throw new Error('Shader Vertex Color 未寫入 fragment stage。');
  return { shaderProfiles: SHADER_PROFILE_IDS.length, vertexColorBridge: true };
});

await runCase('procedural_texture_and_svg_manifest', async () => {
  const manifestPath = path.join(root, 'public/textures/generated/art-foundation-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const validAtlasIds = new Set(Object.values(TEXTURE_ATLAS_PROFILES).map((profile) => profile.id));
  if (manifest.policy.externalManualImportRequired !== false) throw new Error('美術管線仍要求手動外部匯入。');
  if (manifest.textures.length < 10) throw new Error(`程序 Texture 應至少 10 張，實際 ${manifest.textures.length}。`);
  if (manifest.svgPatterns.length < 8) throw new Error(`SVG Pattern 應至少 8 張，實際 ${manifest.svgPatterns.length}。`);
  for (const texture of manifest.textures) {
    const filePath = path.join(root, 'public/textures/generated', texture.filename);
    const fileStat = await stat(filePath);
    const signature = (await readFile(filePath)).subarray(0, 8).toString('hex');
    if (signature !== '89504e470d0a1a0a') throw new Error(`${texture.filename} 不是合法 PNG。`);
    if (fileStat.size < 128) throw new Error(`${texture.filename} 檔案異常過小。`);
    if (texture.atlas && !validAtlasIds.has(texture.atlas)) throw new Error(`${texture.id}: Atlas ${texture.atlas} 未註冊。`);
  }
  for (const pattern of manifest.svgPatterns) {
    const source = await readFile(path.join(root, 'public/textures/source-svg', pattern.filename), 'utf8');
    if (!source.startsWith('<svg') || !source.includes('</svg>')) throw new Error(`${pattern.filename} 不是合法 SVG Source。`);
    if (pattern.atlas && !validAtlasIds.has(pattern.atlas)) throw new Error(`${pattern.id}: Atlas ${pattern.atlas} 未註冊。`);
  }
  if (manifest.policy.ktx2Status !== 'active-basis-universal-with-png-fallback') throw new Error('KTX2正式狀態未啟用。');
  return { textures: manifest.textures.length, svgPatterns: manifest.svgPatterns.length, ktx2Status: manifest.policy.ktx2Status };
});

await runCase('runtime_atlas_ktx2_contract', async () => {
  const manifestPath = path.join(root, 'public/textures/atlases/atlas-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.release !== 'v0.35.0') throw new Error(`Atlas release錯誤：${manifest.release}`);
  if (manifest.atlases.length !== RUNTIME_ATLAS_RECIPES.length) throw new Error(`Runtime Atlas應為${RUNTIME_ATLAS_RECIPES.length}組，實際${manifest.atlases.length}。`);
  let ktx2Files = 0;
  for (const atlas of manifest.atlases) {
    for (const file of atlas.files) {
      const ktx2Path = path.join(root, 'public', file.ktx2.path);
      const signature = (await readFile(ktx2Path)).subarray(0, 12).toString('hex');
      if (signature !== 'ab4b5458203230bb0d0a1a0a') throw new Error(`${file.ktx2.path}不是合法KTX2。`);
      const pngSignature = (await readFile(path.join(root, 'public', file.png.path))).subarray(0, 8).toString('hex');
      if (pngSignature !== '89504e470d0a1a0a') throw new Error(`${file.png.path}不是合法PNG fallback。`);
      ktx2Files += 1;
    }
  }
  await stat(path.join(root, 'public/basis/basis_transcoder.wasm'));
  return { atlases: manifest.atlases.length, ktx2Files, pngFallback: true };
});

await runCase('runtime_loader_boundary', async () => {
  const sourceFiles = await listFiles(path.join(root, 'src'), (file) => /\.(js|jsx)$/.test(file));
  const permittedUseGltf = new Set([
    'src/components/3D/Model.jsx',
    'src/components/3D/AnimatedProductionModel.jsx',
    'src/components/3D/LodEnvironmentModel.jsx',
    'src/services/AssetRuntimeService.js',
  ]);
  const directUseGltf = [];
  const hardRootPaths = [];
  const rawUrlProps = [];
  const missingRuntimeImports = [];
  for (const filePath of sourceFiles) {
    const relative = path.relative(root, filePath).replaceAll('\\', '/');
    const source = await readFile(filePath, 'utf8');
    if (/\buseGLTF\s*[.(]/.test(source) && !permittedUseGltf.has(relative)) directUseGltf.push(relative);
    if (/['"]\/models\//.test(source)) hardRootPaths.push(relative);
    if (/<(?:Model|AnimatedProductionModel|LodEnvironmentModel|CompanionActor)\b[^>]*(?:url|modelUrl)=/s.test(source)) rawUrlProps.push(relative);
    missingRuntimeImports.push(...findMissingRuntimeImports(source, relative));
  }

  // 這個合成案例用來證明守門邏輯本身會攔截「有呼叫、沒匯入」的 Hook；
  // 避免未來測試因實作退化而產生永遠綠燈的假安全感。
  const guardProbe = findMissingRuntimeImports(
    "const renderer = useThree((state) => state.gl);",
    'synthetic/missing-use-three.jsx',
  );
  if (guardProbe.length !== 1 || !guardProbe[0].includes('useThree')) {
    throw new Error('Runtime import guard 無法攔截缺少 useThree 匯入的合成案例。');
  }

  const registryUrlFields = Object.values(CANONICAL_ASSET_REGISTRY).filter((asset) => Object.prototype.hasOwnProperty.call(asset, 'url'));
  if (directUseGltf.length) throw new Error(`未經統一 Loader 使用 useGLTF：${directUseGltf.join(', ')}`);
  if (hardRootPaths.length) throw new Error(`Source 仍硬編根目錄 /models 路徑：${hardRootPaths.join(', ')}`);
  if (rawUrlProps.length) throw new Error(`正式模型元件仍接受 URL：${rawUrlProps.join(', ')}`);
  if (missingRuntimeImports.length) throw new Error(`Runtime Hook 有呼叫但未從指定套件匯入：${missingRuntimeImports.join(', ')}`);
  if (registryUrlFields.length) throw new Error(`Registry 仍保存 URL 欄：${registryUrlFields.map((asset) => asset.assetId).join(', ')}`);
  return {
    scannedSourceFiles: sourceFiles.length,
    permittedLoaders: permittedUseGltf.size,
    runtimeImportGuard: true,
  };
});

await runCase('runtime_gpu_residency_contract', async () => {
  const assetId = 'character:player_child';
  const url = CANONICAL_ASSET_REGISTRY[assetId].canonicalPath;
  const disposed = { geometry: 0, material: 0, texture: 0 };
  const texture = { isTexture: true, dispose: () => { disposed.texture += 1; } };
  const material = { map: texture, dispose: () => { disposed.material += 1; } };
  const geometry = { dispose: () => { disposed.geometry += 1; } };
  const root = { traverse: (visit) => visit({ geometry, material }) };

  registerRuntimeAssetResources(assetId, root, url);
  const releaseInstance = retainRuntimeAsset(assetId, url);
  retainRuntimeBundleAsset(assetId, { preload: false });
  releaseInstance();
  let snapshot = getAssetRuntimeResidencySnapshot().find((entry) => entry.assetId === assetId);
  if (snapshot?.referenceCount !== 1 || snapshot.instanceReferenceCount !== 0 || snapshot.bundleReferenceCount !== 1) {
    throw new Error('Bundle與實例引用未共用同一份資產計數。');
  }
  releaseRuntimeBundleAsset(assetId);
  const flushed = flushUnusedRuntimeAssets();
  snapshot = getAssetRuntimeResidencySnapshot().find((entry) => entry.assetId === assetId);
  if (!flushed.includes(assetId) || snapshot) throw new Error('零引用資產未從Runtime Residency移除。');
  if (disposed.geometry !== 1 || disposed.material !== 1 || disposed.texture !== 1) {
    throw new Error(`GPU資源dispose次數錯誤：${JSON.stringify(disposed)}`);
  }
  return { sharedReferenceCount: true, disposed };
});

await runCase('canonical_art_pipeline_modules_and_adapters', async () => {
  const requiredModules = [
    'scripts/art-pipeline/recipes/assetRecipeSchema.mjs',
    'scripts/art-pipeline/geometry/geometryBuilder.mjs',
    'scripts/art-pipeline/animation/animationBuilder.mjs',
    'scripts/art-pipeline/texture/proceduralTextureGenerator.mjs',
    'scripts/art-pipeline/texture/atlasKtx2Builder.mjs',
    'scripts/art-pipeline/build-runtime-atlases.mjs',
    'scripts/art-pipeline/material/materialResolver.mjs',
    'scripts/art-pipeline/optimization/vertexColorMaterialConsolidator.mjs',
    'scripts/art-pipeline/optimize-canonical-assets.mjs',
    'scripts/art-pipeline/lod/lodBuilder.mjs',
    'scripts/art-pipeline/lod/lodBudgetEnforcer.mjs',
    'scripts/art-pipeline/export/glbExporter.mjs',
    'scripts/art-pipeline/validation/contractValidator.mjs',
    'scripts/art-pipeline/run-canonical-art-pipeline.mjs',
  ];
  for (const relative of requiredModules) await stat(path.join(root, relative));
  const adapterFiles = [
    'scripts/generate-production-assets.mjs',
    'scripts/generate-region-environment-assets.mjs',
    'scripts/generate-companion-assets.mjs',
    'scripts/generate-village-assets.mjs',
    'scripts/generate-farm-expansion-assets.mjs',
    'scripts/generate-equipment-combat-assets.mjs',
    'scripts/generate-region-creature-v033-assets.mjs',
    'scripts/generate-interior-tower-v034-assets.mjs',
    'scripts/generate-event-effect-v035-assets.mjs',
  ];
  for (const relative of adapterFiles) {
    const source = await readFile(path.join(root, relative), 'utf8');
    if (!source.includes('exportCanonicalGlb')) throw new Error(`${relative} 未接入 Canonical GLB Exporter。`);
    if (/\.modelUrl\b/.test(source)) throw new Error(`${relative} 仍讀取舊 modelUrl。`);
  }
  return { formalModules: requiredModules.length, domainAdapters: adapterFiles.length };
});

const report = {
  generatedAt: new Date().toISOString(),
  version: '0.35.0-canonical-800',
  ok: errors.length === 0,
  caseCount: cases.length,
  cases,
  errors,
  warnings,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

async function runCase(id, callback) {
  try {
    const result = await callback();
    cases.push({ id, status: 'PASSED', result });
  } catch (error) {
    const message = error?.message || String(error);
    errors.push(`${id}: ${message}`);
    cases.push({ id, status: 'FAILED', error: message });
  }
}

async function listFiles(directory, predicate) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(fullPath, predicate));
    else if (predicate(entry.name)) output.push(fullPath);
  }
  return output;
}

// Vite／Rolldown 目前可能把未宣告識別字保留到正式 Bundle，而不讓 build 失敗。
// 因此針對 3D Runtime 常用 Hook 建立來源契約：只要實際呼叫，就必須從唯一指定套件以 named import 匯入。
// 此檢查不執行 JSX，也不依賴瀏覽器，能在 build 前穩定攔截 AnimatedProductionModel 類型的回歸。
function findMissingRuntimeImports(source, relativePath) {
  const contracts = [
    { identifier: 'useThree', packageName: '@react-three/fiber', usage: /\buseThree\s*\(/ },
    { identifier: 'useFrame', packageName: '@react-three/fiber', usage: /\buseFrame\s*\(/ },
    { identifier: 'createPortal', packageName: '@react-three/fiber', usage: /\bcreatePortal\s*\(/ },
    { identifier: 'useGLTF', packageName: '@react-three/drei', usage: /\buseGLTF\s*[.(]/ },
    { identifier: 'useAnimations', packageName: '@react-three/drei', usage: /\buseAnimations\s*\(/ },
  ];
  const importedNamesByPackage = new Map();
  const failures = [];

  for (const contract of contracts) {
    if (!contract.usage.test(source)) continue;
    if (!importedNamesByPackage.has(contract.packageName)) {
      importedNamesByPackage.set(contract.packageName, collectNamedImports(source, contract.packageName));
    }
    if (!importedNamesByPackage.get(contract.packageName).has(contract.identifier)) {
      failures.push(`${relativePath}:${contract.identifier}<-${contract.packageName}`);
    }
  }
  return failures;
}

function collectNamedImports(source, packageName) {
  const names = new Set();
  const escapedPackageName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const importPattern = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${escapedPackageName}['"]`, 'gs');

  for (const match of source.matchAll(importPattern)) {
    for (const specifier of match[1].split(',')) {
      const localName = specifier.trim().split(/\s+as\s+/).at(-1)?.trim();
      if (localName) names.add(localName);
    }
  }
  return names;
}
