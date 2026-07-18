import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.V035_SMOKE_PORT || 4174);
const basePath = '/mathquest-3d/';
const baseUrl = `http://${host}:${port}${basePath}`;
const reportPath = path.join(root, 'docs', 'HTTP_SMOKE_V035.json');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const report = {
  generatedAt: new Date().toISOString(),
  version: '0.35.0-canonical-800',
  baseUrl,
  ok: false,
  cases: [],
  errors: [],
};

const server = spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port)], {
  cwd: root,
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk; });
server.stderr.on('data', (chunk) => { serverOutput += chunk; });

try {
  await waitForHttp(baseUrl, 20_000);

  const indexResponse = await checkedFetch(baseUrl, 'production_index');
  const indexHtml = await indexResponse.text();
  const entryMatch = indexHtml.match(/src="(\/mathquest-3d\/assets\/index-[^"]+\.js)"/);
  assert(entryMatch, 'Production index does not reference a hashed entry bundle.');
  assert(indexHtml.includes('<canvas') === false, 'Canvas must be mounted by React rather than duplicated in static HTML.');
  pass('base_path_and_hashed_entry', {
    basePath,
    entry: entryMatch[1],
  });

  const entryResponse = await checkedFetch(`http://${host}:${port}${entryMatch[1]}`, 'hashed_entry_bundle');
  assert((await entryResponse.arrayBuffer()).byteLength > 100_000, 'Hashed entry bundle is unexpectedly small.');

  const glbResponse = await checkedFetch(`${baseUrl}models/events/relationships/child_01_memory.glb`, 'canonical_event_glb');
  const glb = new Uint8Array(await glbResponse.arrayBuffer());
  assert(new TextDecoder().decode(glb.slice(0, 4)) === 'glTF', 'Canonical event asset does not have a GLB header.');
  pass('canonical_glb_binary_header', { bytes: glb.byteLength, magic: 'glTF' });

  const ktxResponse = await checkedFetch(`${baseUrl}textures/atlases/atlas_residents_baseColor.ktx2`, 'ktx2_atlas');
  const ktx = new Uint8Array(await ktxResponse.arrayBuffer());
  const ktxMagic = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];
  assert(ktxMagic.every((value, index) => ktx[index] === value), 'Atlas does not have a KTX2 header.');
  pass('ktx2_binary_header', { bytes: ktx.byteLength });

  const pngResponse = await checkedFetch(`${baseUrl}textures/atlases/atlas_interior_festival_tower_baseColor.png`, 'png_fallback_atlas');
  const png = new Uint8Array(await pngResponse.arrayBuffer());
  const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  assert(pngMagic.every((value, index) => png[index] === value), 'Atlas fallback does not have a PNG header.');
  pass('png_fallback_binary_header', { bytes: png.byteLength });

  const atlasResponse = await checkedFetch(`${baseUrl}textures/atlases/atlas-manifest.json`, 'atlas_manifest');
  const atlasManifest = await atlasResponse.json();
  const channelPairs = atlasManifest.atlases.reduce((sum, atlas) => sum + atlas.files.length, 0);
  assert(atlasManifest.release === 'v0.35.0', `Unexpected atlas release: ${atlasManifest.release}`);
  assert(atlasManifest.atlases.length === 16, `Expected 16 atlases, found ${atlasManifest.atlases.length}.`);
  assert(channelPairs === 73, `Expected 73 atlas channel pairs, found ${channelPairs}.`);
  pass('atlas_release_manifest', {
    release: atlasManifest.release,
    atlases: atlasManifest.atlases.length,
    channelPairs,
  });

  report.ok = report.errors.length === 0;
} catch (error) {
  report.errors.push(String(error));
} finally {
  terminate(server);
  report.serverOutput = serverOutput.trim();
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

async function checkedFetch(url, id) {
  const response = await fetch(url, { redirect: 'error' });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status} for ${url}`);
  pass(id, {
    status: response.status,
    contentType: response.headers.get('content-type'),
    contentLength: Number(response.headers.get('content-length') || 0),
  });
  return response;
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (server.exitCode !== null) {
      throw new Error(`Vite preview exited before becoming ready (${server.exitCode}). ${serverOutput.trim()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server startup is expected to refuse connections briefly.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}. ${serverOutput.trim()}`);
}

function pass(id, result) {
  report.cases.push({ id, status: 'PASSED', result });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function terminate(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill('SIGTERM');
    else process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}
