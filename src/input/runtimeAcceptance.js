// Runtime 畫面驗收狀態。
// 只保留目前執行期資料，不寫入存檔；供 QA Bridge 與自動化瀏覽器驗證使用。
const state = {
  startedAt: Date.now(),
  frameSamples: [],
  renderer: null,
  viewport: null,
  scene: null,
  assets: new Map(),
  encounters: new Map(),
  warnings: [],
};

export function reportRuntimeFrame(fps) {
  if (!Number.isFinite(fps) || fps <= 0) return;
  state.frameSamples.push(fps);
  if (state.frameSamples.length > 180) state.frameSamples.splice(0, state.frameSamples.length - 180);
}

export function reportRuntimeRenderer(renderer) {
  state.renderer = { ...renderer, reportedAt: Date.now() };
}

export function reportRuntimeViewport(viewport) {
  state.viewport = { ...viewport, profile: resolveViewportProfile(viewport.width, viewport.height), reportedAt: Date.now() };
}

export function reportRuntimeScene(scene) {
  state.scene = { ...scene, reportedAt: Date.now() };
}

export function registerRuntimeAsset(instanceId, asset) {
  const current = state.assets.get(instanceId);
  const referenceCount = (current?.referenceCount || 0) + 1;
  state.assets.set(instanceId, {
    ...current,
    ...asset,
    instanceId,
    referenceCount,
    status: 'ready',
    reportedAt: Date.now(),
  });
  return () => {
    const latest = state.assets.get(instanceId);
    if (!latest) return;
    if ((latest.referenceCount || 1) <= 1) state.assets.delete(instanceId);
    else state.assets.set(instanceId, { ...latest, referenceCount: latest.referenceCount - 1, reportedAt: Date.now() });
  };
}


export function registerRuntimeEncounter(instanceId, encounter) {
  state.encounters.set(instanceId, { ...encounter, reportedAt: Date.now() });
  return () => state.encounters.delete(instanceId);
}

export function reportRuntimeWarning(code, detail) {
  const key = `${code}:${detail || ''}`;
  if (state.warnings.some((item) => item.key === key)) return;
  state.warnings.push({ key, code, detail, reportedAt: Date.now() });
}

export function getRuntimeAcceptanceSnapshot() {
  const samples = state.frameSamples.slice();
  const averageFps = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
  const sorted = samples.slice().sort((a, b) => a - b);
  const p10Fps = sorted.length ? sorted[Math.floor(sorted.length * 0.1)] : 0;
  const assets = Array.from(state.assets.values());
  const encounters = Array.from(state.encounters.values());
  return {
    uptimeMs: Date.now() - state.startedAt,
    renderer: state.renderer,
    viewport: state.viewport,
    scene: state.scene,
    performance: {
      sampleCount: samples.length,
      averageFps: round(averageFps),
      p10Fps: round(p10Fps),
      minimumFps: sorted.length ? round(sorted[0]) : 0,
    },
    assets: {
      readyCount: assets.length,
      byKind: countBy(assets, (item) => item.kind || 'unknown'),
      items: assets,
    },
    encounters: {
      activeCount: encounters.length,
      byTier: countBy(encounters, (item) => item.tier || 'unknown'),
      items: encounters,
    },
    warnings: state.warnings.slice(),
  };
}

function resolveViewportProfile(width, height) {
  if (width <= 600) return 'mobile';
  if (width <= 1100 || height <= 800) return 'tablet';
  return 'desktop';
}

function countBy(items, getKey) {
  return items.reduce((result, item) => {
    const key = getKey(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function round(value) {
  return Math.round(value * 10) / 10;
}
