// v0.19 區域玩法正式驗證器。
// 驗證玩法設定必須指向真實子區、結構與 Socket，並確保素材、事件及遭遇掉落維持單一 Canonical 契約。
import { REGION_CRAFTS, REGION_GAMEPLAY_IDS, REGION_GAMEPLAY_PROFILES, REGION_MATERIALS } from '../data/regionGameplayProfiles.js';
import { REGION_PRODUCTION_LAYOUTS } from '../data/regionProductionLayouts.js';
import { REGION_STRUCTURE_CATALOG } from '../data/physicalObjectCatalog.js';
import { REGION_ENCOUNTERS } from '../data/regionEncounters.js';
import { validateRegionGameplayProfiles } from './RegionGameplayService.js';
import { createDailyRiftConfig } from '../data/dailyRift.js';
import { REGION_MECHANIC_CHALLENGES } from '../data/regionMechanicChallenges.js';

export function validateRegionGameplayProduction() {
  const base = validateRegionGameplayProfiles();
  const errors = [...base.errors];
  const warnings = [...base.warnings];
  const materialIds = new Set(REGION_MATERIALS.map((item) => item.id));
  const craftIds = new Set(REGION_CRAFTS.map((item) => item.id));
  const mechanicNodeIds = new Set();

  if (REGION_GAMEPLAY_IDS.length !== 8) errors.push(`Expected 8 gameplay regions, got ${REGION_GAMEPLAY_IDS.length}.`);

  for (const regionId of REGION_GAMEPLAY_IDS) {
    const profile = REGION_GAMEPLAY_PROFILES[regionId];
    const layout = REGION_PRODUCTION_LAYOUTS[regionId];
    const encounter = REGION_ENCOUNTERS[regionId];
    if (!layout) { errors.push(`${regionId}: production layout missing.`); continue; }
    if (!encounter) { errors.push(`${regionId}: encounter definition missing.`); continue; }
    if (!materialIds.has(profile.materialId)) errors.push(`${regionId}: material ${profile.materialId} missing from canonical material catalog.`);
    if (!craftIds.has(profile.keepsakeId)) errors.push(`${regionId}: keepsake ${profile.keepsakeId} missing from canonical craft catalog.`);

    const subareaIds = new Set(layout.subareas.map((item) => item.id));
    for (const mechanicNode of profile.mechanic.nodes) {
      mechanicNodeIds.add(mechanicNode.id);
      if (!subareaIds.has(mechanicNode.subareaId)) errors.push(`${regionId}:${mechanicNode.id}: subarea ${mechanicNode.subareaId} missing.`);
      const area = layout.subareas.find((item) => item.id === mechanicNode.subareaId);
      if (area && !insideRect(mechanicNode.position[0], mechanicNode.position[2], area)) errors.push(`${regionId}:${mechanicNode.id}: node is outside declared subarea footprint.`);
      if ((layout.waters || []).some((water) => insideRotatedRect(mechanicNode.position[0], mechanicNode.position[2], water))) errors.push(`${regionId}:${mechanicNode.id}: node is placed inside water.`);
    }

    for (const eventDefinition of profile.events) {
      for (const eventStep of eventDefinition.steps) {
        if (eventStep.type === 'visit' && !subareaIds.has(eventStep.targetId)) errors.push(`${regionId}:${eventDefinition.id}: visit target ${eventStep.targetId} missing.`);
        if (eventStep.type !== 'beacon') continue;
        if (!layout.subareas.some((area) => insideRect(eventStep.position[0], eventStep.position[2], area))) errors.push(`${regionId}:${eventDefinition.id}: beacon is outside all subareas.`);
        if ((layout.waters || []).some((water) => insideRotatedRect(eventStep.position[0], eventStep.position[2], water))) errors.push(`${regionId}:${eventDefinition.id}: beacon is placed inside water.`);
      }
    }

    for (const interaction of profile.structureInteractions) {
      const structure = layout.structures.find((item) => item.id === interaction.structureId);
      if (!structure) { errors.push(`${regionId}:${interaction.targetId}: structure missing.`); continue; }
      const prefab = REGION_STRUCTURE_CATALOG[structure.type];
      if (!prefab?.sockets.some((item) => item.id === interaction.socketId)) errors.push(`${regionId}:${interaction.targetId}: socket missing from prefab ${structure.type}.`);
    }

    const encounterActors = [...encounter.normal, encounter.elite, encounter.boss];
    for (const actor of encounterActors) {
      if (actor.regionMaterialId !== profile.materialId) errors.push(`${regionId}:${actor.id}: regional loot mismatch.`);
    }

    for (const mechanicNode of profile.mechanic.nodes) {
      const challenge = REGION_MECHANIC_CHALLENGES[mechanicNode.id];
      if (!challenge) { errors.push(`${regionId}:${mechanicNode.id}: mechanic challenge missing.`); continue; }
      if (challenge.type !== profile.mechanic.variant) errors.push(`${regionId}:${mechanicNode.id}: challenge type ${challenge.type} does not match ${profile.mechanic.variant}.`);
      validateChallengeContract(regionId, mechanicNode.id, challenge, errors);
    }
  }

  const orphanChallengeIds = Object.keys(REGION_MECHANIC_CHALLENGES).filter((nodeId) => !mechanicNodeIds.has(nodeId));
  for (const nodeId of orphanChallengeIds) errors.push(`${nodeId}: orphan mechanic challenge.`);

  const riftA = createDailyRiftConfig('2026-07-14');
  const riftB = createDailyRiftConfig('2026-07-14');
  if (JSON.stringify(riftA) !== JSON.stringify(riftB)) errors.push('Daily Rift is not deterministic for the same day key.');
  if (!materialIds.has(riftA.rewardMaterialId)) errors.push('Daily Rift reward is not a canonical regional material.');

  return {
    ok: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    summary: {
      ...base.summary,
      materials: REGION_MATERIALS.length,
      keepsakes: REGION_CRAFTS.length,
      mechanicChallenges: Object.keys(REGION_MECHANIC_CHALLENGES).length,
      dailyRiftDeterministic: JSON.stringify(riftA) === JSON.stringify(riftB),
    },
  };
}

function insideRect(x, z, area) {
  return x >= area.center[0] - area.size[0] / 2 && x <= area.center[0] + area.size[0] / 2 && z >= area.center[1] - area.size[1] / 2 && z <= area.center[1] + area.size[1] / 2;
}

function insideRotatedRect(x, z, area) {
  const deltaX = x - area.center[0];
  const deltaZ = z - area.center[1];
  const cosine = Math.cos(-(area.rotation || 0));
  const sine = Math.sin(-(area.rotation || 0));
  const localX = deltaX * cosine - deltaZ * sine;
  const localZ = deltaX * sine + deltaZ * cosine;
  return Math.abs(localX) <= area.size[0] / 2 && Math.abs(localZ) <= area.size[1] / 2;
}

function validateChallengeContract(regionId, nodeId, challenge, errors) {
  const prefix = `${regionId}:${nodeId}`;
  if (challenge.type === 'wind') {
    if (!Number.isFinite(challenge.step) || challenge.step <= 0 || (challenge.targetAngle - challenge.startAngle) % challenge.step !== 0) errors.push(`${prefix}: wind angle is not reachable.`);
  } else if (challenge.type === 'snow') {
    if (challenge.targetTemperature < challenge.min || challenge.targetTemperature > challenge.max || (challenge.targetTemperature - challenge.startTemperature) % challenge.step !== 0) errors.push(`${prefix}: snow temperature is not reachable.`);
  } else if (challenge.type === 'farm') {
    if (challenge.rows * challenge.columns !== challenge.answer || !challenge.choices.includes(challenge.answer)) errors.push(`${prefix}: farm array answer mismatch.`);
  } else if (challenge.type === 'star') {
    if (!challenge.sequence?.length || !challenge.choices.includes(challenge.answer)) errors.push(`${prefix}: star pattern answer missing.`);
  } else if (challenge.type === 'crystal') {
    if (!challenge.sourceShape || !challenge.choices.includes(challenge.answer)) errors.push(`${prefix}: crystal mirror answer missing.`);
  } else if (challenge.type === 'canyon') {
    const total = (challenge.segments || []).reduce((sum, value) => sum + value, 0);
    if (total !== challenge.answer || !challenge.choices.includes(challenge.answer)) errors.push(`${prefix}: canyon measurement answer mismatch.`);
  } else if (challenge.type === 'mushroom') {
    if (!challenge.pattern?.length || challenge.targetTaps <= challenge.pattern.at(-1)) errors.push(`${prefix}: mushroom rhythm target is invalid.`);
  } else if (challenge.type === 'clockwork') {
    if (challenge.sequence?.length !== challenge.gears?.length || new Set(challenge.sequence).size !== challenge.gears.length || challenge.sequence.some((gear) => !challenge.gears.includes(gear))) errors.push(`${prefix}: clockwork sequence is invalid.`);
  } else {
    errors.push(`${prefix}: unknown mechanic challenge type ${challenge.type}.`);
  }
}
