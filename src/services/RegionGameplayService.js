// 區域玩法的純資料服務。
// 事件狀態推進、事件挑選與資料驗證集中於此，React 元件只負責顯示與發送 Signal。
import { REGION_GAMEPLAY_IDS, REGION_GAMEPLAY_PROFILES } from '../data/regionGameplayProfiles.js';

export function pickNextRegionEvent(profile, visitCount = 0, completedEvents = {}) {
  if (!profile?.events?.length) return null;
  const offset = Math.max(0, Number(visitCount) || 0) % profile.events.length;
  for (let index = 0; index < profile.events.length; index += 1) {
    const candidate = profile.events[(offset + index) % profile.events.length];
    if (!completedEvents[`${profile.regionId}:${candidate.id}`]) return candidate;
  }
  return null;
}

export function createRegionEventRun(eventDefinition) {
  if (!eventDefinition) return null;
  return {
    eventId: eventDefinition.id,
    stepIndex: 0,
    stepProgress: 0,
    status: 'active',
    startedAt: Date.now(),
    completedAt: null,
  };
}

export function applyRegionEventSignal(run, eventDefinition, signal) {
  if (!run || !eventDefinition || run.status !== 'active') return { run, changed: false, completed: false, stepAdvanced: false };
  const currentStep = eventDefinition.steps[run.stepIndex];
  if (!currentStep || !signalMatchesStep(signal, currentStep)) return { run, changed: false, completed: false, stepAdvanced: false };

  const nextProgress = Math.min(currentStep.target, run.stepProgress + Math.max(1, Number(signal.amount) || 1));
  if (nextProgress < currentStep.target) {
    return { run: { ...run, stepProgress: nextProgress }, changed: true, completed: false, stepAdvanced: false };
  }

  const nextStepIndex = run.stepIndex + 1;
  if (nextStepIndex >= eventDefinition.steps.length) {
    return {
      run: { ...run, stepIndex: nextStepIndex, stepProgress: 0, status: 'completed', completedAt: Date.now() },
      changed: true,
      completed: true,
      stepAdvanced: true,
    };
  }

  return {
    run: { ...run, stepIndex: nextStepIndex, stepProgress: 0 },
    changed: true,
    completed: false,
    stepAdvanced: true,
  };
}

export function getRegionEventView(profile, run) {
  if (!profile || !run) return null;
  const eventDefinition = profile.events.find((item) => item.id === run.eventId);
  if (!eventDefinition) return null;
  const currentStep = eventDefinition.steps[run.stepIndex] || null;
  return {
    eventDefinition,
    currentStep,
    stepNumber: Math.min(eventDefinition.steps.length, run.stepIndex + 1),
    totalSteps: eventDefinition.steps.length,
    progress: run.stepProgress,
    target: currentStep?.target || 0,
    completed: run.status === 'completed',
  };
}

export function getRegionExplorationSummary(profile, exploredSubareas = []) {
  const total = 4;
  const unique = new Set(exploredSubareas || []);
  return { explored: unique.size, total, completed: unique.size >= total };
}

export function validateRegionGameplayProfiles() {
  const errors = [];
  const warnings = [];
  const materialIds = new Set();
  const keepsakeIds = new Set();

  for (const regionId of REGION_GAMEPLAY_IDS) {
    const profile = REGION_GAMEPLAY_PROFILES[regionId];
    if (profile.regionId !== regionId) errors.push(`${regionId}: profile regionId mismatch.`);
    if (!profile.materialId) errors.push(`${regionId}: materialId missing.`);
    if (!profile.keepsakeId) errors.push(`${regionId}: keepsakeId missing.`);
    if (materialIds.has(profile.materialId)) errors.push(`${regionId}: duplicated materialId ${profile.materialId}.`);
    if (keepsakeIds.has(profile.keepsakeId)) errors.push(`${regionId}: duplicated keepsakeId ${profile.keepsakeId}.`);
    materialIds.add(profile.materialId);
    keepsakeIds.add(profile.keepsakeId);

    if (profile.mechanic?.nodes?.length !== 3) errors.push(`${regionId}: expected exactly 3 mechanic nodes.`);
    const nodeIds = new Set();
    for (const mechanicNode of profile.mechanic?.nodes || []) {
      if (nodeIds.has(mechanicNode.id)) errors.push(`${regionId}: duplicated mechanic node ${mechanicNode.id}.`);
      nodeIds.add(mechanicNode.id);
      if (!Array.isArray(mechanicNode.position) || mechanicNode.position.length !== 3) errors.push(`${regionId}:${mechanicNode.id}: invalid position.`);
    }

    if (profile.structureInteractions?.length < 2) errors.push(`${regionId}: expected at least 2 structure interactions.`);
    const socketTargets = new Set(profile.structureInteractions.map((item) => item.targetId));
    if (socketTargets.size !== profile.structureInteractions.length) errors.push(`${regionId}: duplicated structure interaction target.`);

    if (profile.events?.length !== 3) errors.push(`${regionId}: expected exactly 3 events.`);
    const eventIds = new Set();
    for (const eventDefinition of profile.events || []) {
      if (!eventDefinition.id || eventIds.has(eventDefinition.id)) errors.push(`${regionId}: duplicated or empty event id ${eventDefinition.id}.`);
      eventIds.add(eventDefinition.id);
      if (!Number.isFinite(eventDefinition.rewardGold) || eventDefinition.rewardGold <= 0) errors.push(`${regionId}:${eventDefinition.id}: rewardGold must be positive.`);
      if (eventDefinition.steps?.length < 3) errors.push(`${regionId}:${eventDefinition.id}: expected at least 3 steps.`);
      if (eventDefinition.steps?.[0]?.type !== 'beacon') errors.push(`${regionId}:${eventDefinition.id}: first step must be beacon.`);
      const stepIds = new Set();
      for (const eventStep of eventDefinition.steps || []) {
        if (!eventStep.id || stepIds.has(eventStep.id)) errors.push(`${regionId}:${eventDefinition.id}: duplicated or empty step id ${eventStep.id}.`);
        stepIds.add(eventStep.id);
        if (!Number.isFinite(eventStep.target) || eventStep.target < 1) errors.push(`${regionId}:${eventDefinition.id}:${eventStep.id}: target must be at least 1.`);
        if (!['beacon', 'mechanic', 'structure', 'collect', 'defeat', 'visit'].includes(eventStep.type)) {
          errors.push(`${regionId}:${eventDefinition.id}:${eventStep.id}: unsupported step type ${eventStep.type}.`);
        }
        if (eventStep.type === 'beacon') {
          if (eventStep.targetId !== eventDefinition.id) errors.push(`${regionId}:${eventDefinition.id}: beacon target must equal event id.`);
          if (!Array.isArray(eventStep.position) || eventStep.position.length !== 3) errors.push(`${regionId}:${eventDefinition.id}: beacon position is invalid.`);
        }
        if (eventStep.type === 'mechanic' && !nodeIds.has(eventStep.targetId)) errors.push(`${regionId}:${eventDefinition.id}: unknown mechanic target ${eventStep.targetId}.`);
        if (eventStep.type === 'structure' && !socketTargets.has(eventStep.targetId)) errors.push(`${regionId}:${eventDefinition.id}: unknown structure target ${eventStep.targetId}.`);
        if (eventStep.type === 'collect' && eventStep.targetId !== profile.materialId) errors.push(`${regionId}:${eventDefinition.id}: collect target must use canonical regional material.`);
        if (eventStep.type === 'defeat' && !['normal', 'elite', 'boss', 'any'].includes(eventStep.targetId)) errors.push(`${regionId}:${eventDefinition.id}: unsupported defeat target ${eventStep.targetId}.`);
      }
    }
  }

  return {
    ok: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    summary: {
      regions: REGION_GAMEPLAY_IDS.length,
      mechanics: REGION_GAMEPLAY_IDS.length,
      mechanicNodes: REGION_GAMEPLAY_IDS.reduce((sum, regionId) => sum + REGION_GAMEPLAY_PROFILES[regionId].mechanic.nodes.length, 0),
      events: REGION_GAMEPLAY_IDS.reduce((sum, regionId) => sum + REGION_GAMEPLAY_PROFILES[regionId].events.length, 0),
      eventSteps: REGION_GAMEPLAY_IDS.reduce((sum, regionId) => sum + REGION_GAMEPLAY_PROFILES[regionId].events.reduce((eventSum, item) => eventSum + item.steps.length, 0), 0),
      structureInteractions: REGION_GAMEPLAY_IDS.reduce((sum, regionId) => sum + REGION_GAMEPLAY_PROFILES[regionId].structureInteractions.length, 0),
    },
  };
}

function signalMatchesStep(signal, stepDefinition) {
  if (!signal || signal.type !== stepDefinition.type) return false;
  if (stepDefinition.type === 'defeat') return stepDefinition.targetId === 'any' || signal.targetId === stepDefinition.targetId || signal.tier === stepDefinition.targetId;
  return signal.targetId === stepDefinition.targetId;
}
