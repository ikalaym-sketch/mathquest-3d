/**
 * MathQuest 3D Runtime QA
 *
 * Prerequisite (outside the production bundle):
 *   npm install --no-save playwright
 *   npx playwright install chromium
 *
 * Start the app first:
 *   npm run dev -- --host 127.0.0.1 --port 4173
 *
 * Then run:
 *   QA_BASE_URL=http://127.0.0.1:4173/mathquest-3d/?qa=1 node scripts/runtime-qa.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/mathquest-3d/?qa=1';
const outputDir = process.env.QA_OUTPUT_DIR || 'runtime-qa-output';
const playwright = await import('playwright').catch(() => null);
if (!playwright) {
  console.error('Playwright is not installed. Run: npm install --no-save playwright && npx playwright install chromium');
  process.exit(2);
}

await fs.mkdir(outputDir, { recursive: true });
const browserTypeId = process.env.QA_BROWSER || 'chromium';
const browserType = playwright[browserTypeId];
if (!browserType) throw new Error(`Unsupported QA_BROWSER: ${browserTypeId}`);
const launchOptions = { headless: true };
if (process.env.QA_EXECUTABLE_PATH) launchOptions.executablePath = process.env.QA_EXECUTABLE_PATH;
const browser = await browserType.launch(launchOptions);
const report = { generatedAt: new Date().toISOString(), baseUrl, cases: [], errors: [] };

const profiles = [
  { id: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
  { id: 'tablet', viewport: { width: 1024, height: 768 }, isMobile: false, hasTouch: true },
  { id: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

async function waitForReady(page) {
  await page.waitForFunction(() => Boolean(window.__MQ_QA__), null, { timeout: 30_000 });
  await page.evaluate(() => window.__MQ_QA__.ensureCharacterReady());
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(2000);
}

async function captureCase(page, profileId, caseId, action) {
  const item = { profileId, caseId, status: 'RUNNING', consoleErrors: [], pageErrors: [] };
  report.cases.push(item);
  const onConsole = (msg) => {
    if (msg.type() === 'error') item.consoleErrors.push(msg.text());
  };
  const onPageError = (error) => item.pageErrors.push(String(error));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  try {
    await action();
    await page.waitForTimeout(1800);
    item.snapshot = await page.evaluate(() => window.__MQ_QA__.snapshot());
    item.screenshot = `${profileId}_${caseId}.png`;
    await page.screenshot({ path: path.join(outputDir, item.screenshot), fullPage: true });
    item.status = item.consoleErrors.length || item.pageErrors.length ? 'FAILED' : 'PASSED';
  } catch (error) {
    item.status = 'FAILED';
    item.error = String(error);
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
}

for (const profile of profiles) {
  const context = await browser.newContext(profile);
  const page = await context.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForReady(page);
    await captureCase(page, profile.id, 'village_day', async () => {
      await page.evaluate(() => { window.__MQ_QA__.setScene('village'); window.__MQ_QA__.setWeather('sunny'); });
    });
    await captureCase(page, profile.id, 'village_rain', async () => {
      await page.evaluate(() => window.__MQ_QA__.setWeather('rain'));
    });
    await captureCase(page, profile.id, 'farm', async () => {
      await page.evaluate(() => window.__MQ_QA__.setScene('farm'));
    });
    await captureCase(page, profile.id, 'farm_level5_growth', async () => {
      await page.evaluate(() => {
        window.__MQ_QA__.setFarmLevel(5);
        window.__MQ_QA__.plantCenter('seed_01');
        window.__MQ_QA__.setWeather('lightRain');
        window.__MQ_QA__.setWorldTime(1600);
        window.__MQ_QA__.simulateFarm();
      });
      const farm = await page.evaluate(() => window.__MQ_QA__.snapshot().farm);
      if (farm.farmLevel !== 5 || farm.unlockedPlots !== 49) throw new Error('Farm Lv5 progression failed.');
    });
    await captureCase(page, profile.id, 'home_interior_panel', async () => {
      await page.evaluate(() => window.__MQ_QA__.openHomeInterior('life'));
    });
    await captureCase(page, profile.id, 'forest', async () => {
      await page.evaluate(() => window.__MQ_QA__.enterRegion('forest_ruins'));
    });
    for (const regionId of ['wind_highlands', 'snow_valley', 'farm_plains', 'star_village', 'crystal_lake', 'sun_canyon', 'mushroom_grove', 'clockwork_ruins']) {
      await captureCase(page, profile.id, `region_${regionId}`, async () => {
        await page.evaluate((targetRegionId) => window.__MQ_QA__.enterRegion(targetRegionId), regionId);
      });
    }
    await captureCase(page, profile.id, 'trial_tower', async () => {
      await page.evaluate(() => window.__MQ_QA__.setScene('trialTower'));
    });
    await captureCase(page, profile.id, 'defeat_respawn', async () => {
      await page.evaluate(() => window.__MQ_QA__.damagePlayer(9999));
      await page.waitForTimeout(300);
      const defeated = await page.evaluate(() => window.__MQ_QA__.snapshot().defeatState?.active === true);
      if (!defeated) throw new Error('Defeat state did not activate.');
      await page.evaluate(() => window.__MQ_QA__.respawn());
    });
  } catch (error) {
    report.errors.push({ profileId: profile.id, error: String(error) });
  } finally {
    await context.close();
  }
}

await browser.close();
report.ok = report.errors.length === 0 && report.cases.every((item) => item.status === 'PASSED');
await fs.writeFile(path.join(outputDir, 'runtime-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
