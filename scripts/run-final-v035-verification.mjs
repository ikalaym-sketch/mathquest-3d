import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  CANONICAL_ASSET_COUNT,
  CANONICAL_ASSET_REGISTRY,
} from '../src/data/productionAssetCatalog.js';
import {
  ART_TARGET_VERSION,
  CANONICAL_GLB_HARD_LIMIT,
  CANONICAL_GLB_TARGET,
  GLB_TARGET_DISTRIBUTION,
  getTargetGlbTotal,
} from '../src/data/artGovernanceProfiles.js';

const root = process.cwd();
const reportPath = path.join(root, 'docs', 'FINAL_VERIFICATION_V035.json');
const report = {
  generatedAt: new Date().toISOString(),
  version: '0.35.0-canonical-800',
  status: 'RUNNING',
  ok: false,
  cases: [],
  errors: [],
  physicalAcceptance: {
    status: 'NOT_STARTED',
    scheduledVersion: 'v0.36',
    notClaimed: [
      'physical Android phone FPS, GPU memory, thermals or long-session stability',
      'physical Android tablet acceptance',
      'physical desktop GPU acceptance',
      'mandatory EXT_meshopt_compression runtime compatibility',
    ],
  },
};

await verify('release_version_and_frozen_target', async () => {
  const packageJson = await readJson('package.json');
  const packageLock = await readJson('package-lock.json');
  const packageLockSource = await fs.readFile(path.join(root, 'package-lock.json'), 'utf8');
  assert(packageJson.version === '0.35.0', `package version is ${packageJson.version}`);
  assert(packageLock.version === '0.35.0', `lock version is ${packageLock.version}`);
  assert(packageLock.packages?.['']?.version === '0.35.0', 'lock root package version is not 0.35.0');
  assert(!packageLockSource.includes('internal.api.openai.org'), 'lock file contains an environment-specific internal Registry URL');
  assert(ART_TARGET_VERSION === 'v0.35', `art target version is ${ART_TARGET_VERSION}`);
  assert(CANONICAL_GLB_TARGET === 800 && CANONICAL_GLB_HARD_LIMIT === 800, 'canonical target is not frozen at 800');
  assert(getTargetGlbTotal() === 800, `distribution target is ${getTargetGlbTotal()}`);
  return { packageVersion: packageJson.version, publicRegistryLock: true, artTargetVersion: ART_TARGET_VERSION, target: 800, remaining: 0 };
});

const registryAssets = Object.values(CANONICAL_ASSET_REGISTRY);
const registryPaths = registryAssets.map((asset) => normalize(asset.canonicalPath));
const publicGlb = await walkGlb(path.join(root, 'public', 'models'), 'models');
const distGlb = await walkGlb(path.join(root, 'dist', 'models'), 'models');

await verify('canonical_registry_and_public_files', async () => {
  assert(CANONICAL_ASSET_COUNT === 800, `registry contains ${CANONICAL_ASSET_COUNT}`);
  assert(new Set(registryPaths).size === 800, 'registry has duplicate canonical paths');
  assert(publicGlb.length === 800, `public/models contains ${publicGlb.length} GLB`);
  const publicSet = new Set(publicGlb);
  const missing = registryPaths.filter((item) => !publicSet.has(item));
  const extra = publicGlb.filter((item) => !new Set(registryPaths).has(item));
  assert(missing.length === 0, `public is missing ${missing.length} registry GLB`);
  assert(extra.length === 0, `public has ${extra.length} unregistered GLB`);
  const invalidHeaders = [];
  let bytes = 0;
  for (const relativePath of publicGlb) {
    const data = await fs.readFile(path.join(root, 'public', relativePath));
    bytes += data.byteLength;
    if (data.subarray(0, 4).toString('ascii') !== 'glTF') invalidHeaders.push(relativePath);
  }
  assert(invalidHeaders.length === 0, `${invalidHeaders.length} public GLB have invalid headers`);
  return { registry: 800, publicFiles: 800, bytes, invalidHeaders: 0, missing: 0, extra: 0 };
});

await verify('public_dist_asset_parity', async () => {
  assert(distGlb.length === 800, `dist/models contains ${distGlb.length} GLB`);
  assert(JSON.stringify(publicGlb) === JSON.stringify(distGlb), 'public/dist GLB path sets differ');
  const mismatches = [];
  for (const relativePath of publicGlb) {
    const [publicHash, distHash] = await Promise.all([
      sha256(path.join(root, 'public', relativePath)),
      sha256(path.join(root, 'dist', relativePath)),
    ]);
    if (publicHash !== distHash) mismatches.push(relativePath);
  }
  assert(mismatches.length === 0, `${mismatches.length} public/dist GLB hashes differ`);
  return { publicCanonical: 800, distBuildCopies: 800, countedCanonical: 800, hashMismatches: 0 };
});

await verify('twelve_category_distribution', async () => {
  const byCategory = countBy(registryAssets, (asset) => asset.category);
  const actual = {
    characters: byCategory.character || 0,
    companions: byCategory.companion || 0,
    equipment: byCategory.equipment || 0,
    village: byCategory.village || 0,
    farm: byCategory.farm || 0,
    forest: byCategory.forest || 0,
    regions: (byCategory['region-structure'] || 0) + (byCategory.bridge || 0) + (byCategory['region-environment'] || 0),
    creatures: (byCategory.monster || 0) + (byCategory.elite || 0) + (byCategory.boss || 0) + (byCategory.creature || 0),
    interiors: byCategory.interior || 0,
    tower: byCategory['trial-tower'] || 0,
    events: byCategory.event || 0,
    effects: byCategory.effect || 0,
  };
  const expected = Object.fromEntries(Object.entries(GLB_TARGET_DISTRIBUTION).map(([id, value]) => [id, value.target]));
  assert(JSON.stringify(actual) === JSON.stringify(expected), `distribution mismatch: ${JSON.stringify(actual)}`);
  return { actual, expected, total: Object.values(actual).reduce((sum, value) => sum + value, 0) };
});

await verify('legacy_disposition_and_net_new', async () => {
  const disposition = countBy(registryAssets, (asset) => asset.artStatus);
  assert(disposition.keep === 24, `keep is ${disposition.keep}`);
  assert(disposition.rework === 82, `rework is ${disposition.rework}`);
  assert(disposition.replace === 28, `replace is ${disposition.replace}`);
  assert(disposition.new === 666, `new is ${disposition.new}`);
  return { keep: 24, rework: 82, replace: 28, new: 666 };
});

await verify('runtime_atlas_release', async () => {
  const manifest = await readJson('public/textures/atlases/atlas-manifest.json');
  const channelPairs = manifest.atlases.reduce((sum, atlas) => sum + atlas.files.length, 0);
  assert(manifest.release === 'v0.35.0', `atlas release is ${manifest.release}`);
  assert(manifest.atlases.length === 16, `atlas count is ${manifest.atlases.length}`);
  assert(channelPairs === 73, `atlas channel pair count is ${channelPairs}`);
  const missing = [];
  for (const atlas of manifest.atlases) {
    for (const file of atlas.files) {
      for (const format of ['png', 'ktx2']) {
        if (!(await exists(path.join(root, 'public', file[format].path)))) missing.push(file[format].path);
      }
    }
  }
  assert(missing.length === 0, `${missing.length} atlas runtime files are missing`);
  return { release: manifest.release, atlases: 16, channelPairs: 73, runtimeFiles: 146, missing: 0 };
});

await verify('meshopt_safe_adoption_gate', async () => {
  const audit = await readJson('public/manifests/meshopt-v034-audit.json');
  assert(audit.status === 'encoder-integrated-roundtrip-audited', `meshopt status is ${audit.status}`);
  assert(audit.assetCount === 96, `meshopt audited assets is ${audit.assetCount}`);
  assert(audit.totals.skippedAccessors === 0, `meshopt skipped ${audit.totals.skippedAccessors} accessors`);
  assert(audit.runtimeExtensionWritten === false && audit.runtimeExtensionRequired === false, 'meshopt extension was enabled before physical acceptance');
  assert(audit.physicalCompatibilityGate === 'v0.36', `meshopt physical gate is ${audit.physicalCompatibilityGate}`);
  return {
    encoderVersion: audit.encoderVersion,
    auditedAssets: audit.assetCount,
    accessors: audit.totals.accessors,
    candidateRatio: audit.totals.candidateRatio,
    runtimeExtensionRequired: false,
    physicalCompatibilityGate: 'v0.36',
  };
});

await verify('production_http_smoke', async () => {
  const http = await readJson('docs/HTTP_SMOKE_V035.json');
  assert(http.ok === true, 'HTTP smoke report is not passing');
  assert(http.cases.length === 11 && http.cases.every((item) => item.status === 'PASSED'), 'HTTP smoke case set is incomplete');
  assert(http.baseUrl.endsWith('/mathquest-3d/'), `HTTP base path is ${http.baseUrl}`);
  return { cases: http.cases.length, passed: http.cases.length, basePath: '/mathquest-3d/' };
});

await verify('headless_webgl_viewport_region_matrix', async () => {
  const runtime = await readJson('docs/runtime-production-qa/runtime-report.json');
  assert(runtime.ok === true, 'runtime CDP report is not passing');
  assert(runtime.summary.profiles === 3, `runtime profiles is ${runtime.summary.profiles}`);
  assert(runtime.summary.cases === 24 && runtime.summary.passed === 24 && runtime.summary.failed === 0, 'runtime CDP matrix is not 24/24');
  const allCases = runtime.profiles.flatMap((profile) => profile.cases);
  assert(allCases.every((item) => item.status === 'PASSED' && item.browserErrors.length === 0), 'runtime matrix contains failures or browser errors');
  const screenshots = await fs.readdir(path.join(root, 'docs', 'runtime-production-qa'));
  const pngCount = screenshots.filter((file) => file.endsWith('.png')).length;
  assert(pngCount === 24, `runtime screenshot count is ${pngCount}`);
  return { profiles: 3, regions: 8, cases: 24, passed: 24, failed: 0, browserErrors: 0, screenshots: 24 };
});

await verify('production_build_base_path', async () => {
  const html = await fs.readFile(path.join(root, 'dist', 'index.html'), 'utf8');
  const entry = html.match(/src="(\/mathquest-3d\/assets\/index-[^"]+\.js)"/)?.[1];
  assert(entry, 'dist index has no hashed /mathquest-3d/ entry');
  assert(await exists(path.join(root, 'dist', entry.replace('/mathquest-3d/', ''))), `build entry is missing: ${entry}`);
  return { basePath: '/mathquest-3d/', hashedEntry: entry, distCanonicalCopies: 800 };
});

report.ok = report.errors.length === 0 && report.cases.every((item) => item.status === 'PASSED');
report.status = report.ok ? 'PASSED_FOR_V035_RELEASE' : 'FAILED';
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

async function verify(id, callback) {
  try {
    const result = await callback();
    report.cases.push({ id, status: 'PASSED', result });
  } catch (error) {
    const message = `${id}: ${error instanceof Error ? error.message : String(error)}`;
    report.cases.push({ id, status: 'FAILED', error: message });
    report.errors.push(message);
  }
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
}

async function walkGlb(directory, prefix) {
  const result = [];
  async function visit(current, relative) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const childRelative = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) await visit(path.join(current, entry.name), childRelative);
      else if (entry.isFile() && entry.name.endsWith('.glb')) result.push(path.posix.join(prefix, childRelative));
    }
  }
  await visit(directory, '');
  return result.sort();
}

async function sha256(filePath) {
  return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function normalize(value) {
  return String(value || '').replace(/^\/+/, '').replaceAll('\\', '/');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
