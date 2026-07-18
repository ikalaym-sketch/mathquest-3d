// 不依賴 Playwright 的 Chromium CDP Runtime 驗收。
// 自動啟動 Vite、切換桌機/平板/手機 Viewport、載入八區並輸出截圖與 JSON 證據。
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

class CdpClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP WebSocket timeout')), 10_000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', (event) => { clearTimeout(timer); reject(new Error(`CDP WebSocket error: ${event.message || 'unknown'}`)); }, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      const handlers = this.listeners.get(message.method) || [];
      for (const handler of handlers) handler(message.params || {});
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, 20_000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }
  async close() {
    this.socket?.close();
  }
}


const root = process.cwd();
const listenHost = process.env.QA_VITE_HOST || '127.0.0.1';
const browserHost = process.env.QA_BROWSER_HOST || getReachableHost();
const controlHost = '127.0.0.1';
const vitePort = Number(process.env.QA_VITE_PORT || 4173);
const cdpPort = Number(process.env.QA_CDP_PORT || 9222);
const baseUrl = `http://${browserHost}:${vitePort}${process.env.QA_BASE_PATH || '/mathquest-3d/'}?qa=1`;
const outputDir = path.resolve(process.env.QA_OUTPUT_DIR || 'docs/runtime-production-qa');
const chromiumPath = process.env.QA_CHROMIUM || '/usr/bin/chromium';
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathquest-cdp-'));
const report = { generatedAt: new Date().toISOString(), baseUrl, profiles: [], errors: [] };

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const vite = spawn(process.execPath, [viteBin, '--host', listenHost, '--port', String(vitePort)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  env: { ...process.env, BROWSER: 'none' },
});
let viteOutput = '';
vite.stdout.on('data', (chunk) => { viteOutput += chunk; });
vite.stderr.on('data', (chunk) => { viteOutput += chunk; });
const chromiumArgs = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--no-proxy-server',
  '--proxy-bypass-list=*',
  '--metrics-recording-only',
  '--no-first-run',
  '--use-gl=angle',
  '--use-angle=swiftshader-webgl',
  '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${userDataDir}`,
  'about:blank',
];
const xvfbPath = process.env.QA_XVFB || '/usr/bin/xvfb-run';
const useXvfb = process.platform === 'linux' && existsSync(xvfbPath) && process.env.QA_USE_XVFB !== '0';
const chromium = useXvfb
  ? spawn(xvfbPath, ['-a', chromiumPath, ...chromiumArgs], { stdio: 'ignore', detached: true })
  : spawn(chromiumPath, ['--headless=new', ...chromiumArgs], { stdio: 'ignore', detached: true });

let client;
try {
  console.log(`QA base URL: ${baseUrl}`);
  console.log('Waiting for Vite...');
  await waitForHttp(`http://${controlHost}:${vitePort}/mathquest-3d/`, 30_000);
  console.log('Vite ready. Waiting for Chromium CDP...');
  await waitForHttp(`http://${controlHost}:${cdpPort}/json/version`, 30_000);
  console.log('Chromium CDP ready. Creating target...');
  const target = await createTarget(baseUrl);
  console.log(`Target created: ${target.id}`);
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  console.log('CDP connected. Enabling domains...');
  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Log.enable'),
  ]);
  console.log('CDP domains enabled.');

  const browserErrors = [];
  client.on('Runtime.exceptionThrown', (event) => browserErrors.push({ type: 'exception', text: event.exceptionDetails?.text || 'Runtime exception' }));
  client.on('Log.entryAdded', (event) => {
    const entry = event.entry;
    if (entry?.level === 'error') browserErrors.push({ type: 'log', text: entry.text });
  });

  const allProfiles = [
    { id: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, touch: false },
    { id: 'tablet', width: 1024, height: 768, deviceScaleFactor: 1, mobile: false, touch: true },
    { id: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, mobile: true, touch: true },
  ];
  report.plan = { profiles: allProfiles.map(({ id, width, height }) => ({ id, width, height })), regions: 8, cases: 24 };
  const requestedProfiles = new Set((process.env.QA_PROFILES || 'desktop,tablet,mobile').split(',').map((value) => value.trim()).filter(Boolean));
  const profiles = allProfiles.filter((profile) => requestedProfiles.has(profile.id));
  const defaultRegionIds = ['wind_highlands', 'snow_valley', 'farm_plains', 'star_village', 'crystal_lake', 'sun_canyon', 'mushroom_grove', 'clockwork_ruins'];
  const requestedRegions = (process.env.QA_REGIONS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const regionIds = requestedRegions.length > 0 ? requestedRegions : defaultRegionIds;

  for (const profile of profiles) {
    const profileReport = { id: profile.id, viewport: profile, cases: [], errors: [] };
    report.profiles.push(profileReport);
    console.log(`Profile start: ${profile.id}`);
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: profile.width,
      height: profile.height,
      deviceScaleFactor: profile.deviceScaleFactor,
      mobile: profile.mobile,
      screenWidth: profile.width,
      screenHeight: profile.height,
    });
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: profile.touch, maxTouchPoints: profile.touch ? 5 : 1 });
    console.log('Navigating...');
    await client.send('Page.navigate', { url: baseUrl });
    console.log('Navigation command returned. Checking browser policy...');
    await delay(1000);
    const navigationState = await evaluate('({ href: location.href, title: document.title, body: document.body?.innerText?.slice(0, 240) || \"\" })');
    if (navigationState?.href?.startsWith('chrome-error://')) {
      throw new Error(`ENVIRONMENT_URL_BLOCKLIST: ${navigationState.body || navigationState.title}`);
    }
    console.log('Browser policy check passed. Waiting for QA bridge...');
    await waitForExpression('Boolean(window.__MQ_QA__ && document.querySelector("canvas"))', 35_000);
    console.log('QA bridge and canvas ready.');
    await evaluate('window.__MQ_QA__.ensureCharacterReady()');
    console.log('Character ready.');
    await delay(1400);

    for (const regionId of regionIds) {
      const item = { regionId, status: 'RUNNING', errors: [] };
      profileReport.cases.push(item);
      const errorStart = browserErrors.length;
      try {
        console.log(`Entering region: ${regionId}`);
        await evaluate(`window.__MQ_QA__.enterRegion(${JSON.stringify(regionId)})`);
        await waitForExpression(`window.__MQ_QA__.snapshot().currentScene === 'region' && window.__MQ_QA__.snapshot().currentRegionId === ${JSON.stringify(regionId)}`, 15_000);
        await waitForExpression(`(() => { const a = window.__MQ_QA__.snapshot().runtimeAcceptance?.assets?.byKind || {}; return (a['region-structure'] || 0) >= 4 && (a.monster || 0) >= 3 && (a.elite || 0) >= 1 && (a.boss || 0) >= 1; })()`, 30_000);
        await delay(1200);
        item.snapshot = await evaluate('window.__MQ_QA__.snapshot()');
        item.assertions = assertSnapshot(item.snapshot, profile.id, regionId);
        const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
        item.screenshot = `${profile.id}_${regionId}.png`;
        await fs.writeFile(path.join(outputDir, item.screenshot), Buffer.from(screenshot.data, 'base64'));
        item.browserErrors = browserErrors.slice(errorStart);
        item.status = item.assertions.every((assertion) => assertion.ok) && item.browserErrors.length === 0 ? 'PASSED' : 'FAILED';
        if (item.status === 'FAILED') profileReport.errors.push({ regionId, assertions: item.assertions.filter((entry) => !entry.ok), browserErrors: item.browserErrors });
      } catch (error) {
        item.status = 'FAILED';
        item.error = String(error);
        item.browserErrors = browserErrors.slice(errorStart);
        profileReport.errors.push({ regionId, error: item.error, browserErrors: item.browserErrors });
      }
      await writeProgress();
      console.log(`${profile.id}/${regionId}: ${item.status}`);
    }
  }
} catch (error) {
  report.errors.push(String(error));
  if (viteOutput.trim()) report.viteOutput = viteOutput.trim();
} finally {
  await client?.close().catch(() => {});
  terminate(chromium);
  terminate(vite);
  console.log('Browser processes terminated.');
}

report.ok = report.errors.length === 0 && report.profiles.every((profile) => profile.errors.length === 0 && profile.cases.every((item) => item.status === 'PASSED'));
report.summary = {
  profiles: report.profiles.length,
  cases: report.profiles.reduce((sum, profile) => sum + profile.cases.length, 0),
  passed: report.profiles.reduce((sum, profile) => sum + profile.cases.filter((item) => item.status === 'PASSED').length, 0),
  failed: report.profiles.reduce((sum, profile) => sum + profile.cases.filter((item) => item.status === 'FAILED').length, 0),
  plannedCases: report.plan?.cases || 0,
};
await fs.writeFile(path.join(outputDir, 'runtime-report.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.rm(path.join(outputDir, 'runtime-report.partial.json'), { force: true });
console.log(JSON.stringify(report.summary, null, 2));
await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
process.exit(report.ok ? 0 : 1);

function assertSnapshot(snapshot, expectedProfile, expectedRegionId) {
  const runtime = snapshot.runtimeAcceptance || {};
  const assets = runtime.assets?.byKind || {};
  const renderer = runtime.renderer || {};
  const scene = runtime.scene || {};
  return [
    check('scene', snapshot.currentScene === 'region', snapshot.currentScene),
    check('region', snapshot.currentRegionId === expectedRegionId, snapshot.currentRegionId),
    check('viewport-profile', runtime.viewport?.profile === expectedProfile, runtime.viewport?.profile),
    check('webgl', renderer.webglVersion === 1 || renderer.webglVersion === 2, renderer.webglVersion),
    check('scene-meshes', (scene.meshes || 0) >= 80, scene.meshes),
    check('structures', (assets['region-structure'] || 0) >= 4, assets['region-structure'] || 0),
    check('monsters', (assets.monster || 0) >= 3, assets.monster || 0),
    check('elite', (assets.elite || 0) >= 1, assets.elite || 0),
    check('boss', (assets.boss || 0) >= 1, assets.boss || 0),
    check('character', (assets.character || 0) >= 1, assets.character || 0),
    check('fps-samples', (runtime.performance?.sampleCount || 0) >= 1, runtime.performance?.sampleCount || 0),
  ];
}

function check(id, ok, actual) {
  return { id, ok, actual };
}

async function createTarget(url) {
  const response = await fetch(`http://${controlHost}:${cdpPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Cannot create CDP target: HTTP ${response.status}`);
  return response.json();
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`HTTP wait timeout: ${url}`);
}

async function waitForExpression(expression, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await evaluate(expression);
      if (value) return value;
    } catch {}
    await delay(300);
  }
  throw new Error(`Expression wait timeout: ${expression}`);
}

async function evaluate(expression) {
  const response = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Runtime.evaluate failed');
  return response.result?.value;
}

async function writeProgress() {
  report.summary = {
    profiles: report.profiles.length,
    cases: report.profiles.reduce((sum, profile) => sum + profile.cases.length, 0),
    passed: report.profiles.reduce((sum, profile) => sum + profile.cases.filter((item) => item.status === 'PASSED').length, 0),
    failed: report.profiles.reduce((sum, profile) => sum + profile.cases.filter((item) => item.status === 'FAILED').length, 0),
  };
  await fs.writeFile(path.join(outputDir, 'runtime-report.partial.json'), `${JSON.stringify(report, null, 2)}\n`);
}

function getReachableHost() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return '127.0.0.1';
}

function terminate(child) {
  if (!child?.pid) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  try { process.kill(-child.pid, 'SIGKILL'); } catch {}
}
