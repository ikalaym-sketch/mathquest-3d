// v0.35 正式 Runtime 契約驗證器。
// 瀏覽器與 Node 共用同一 Canonical Registry；實體 GLB 內容由 scripts/run-production-runtime-tests.mjs 驗證。
import {
  CANONICAL_ASSET_COUNT,
  CANONICAL_ASSET_REGISTRY,
  CHARACTER_ASSETS,
  ENCOUNTER_ASSETS,
  STRUCTURE_ASSETS,
  getCanonicalAsset,
} from '../data/productionAssetCatalog.js';
import { REGION_ENCOUNTERS, REGION_ENCOUNTER_IDS } from '../data/regionEncounters.js';
import { validateAssetGovernanceContracts } from './AssetGovernanceValidationService.js';

const EXPECTED_REGION_COUNT = 8;
const EXPECTED_NORMAL_PER_REGION = 3;
const REQUIRED_ENEMY_CLIPS = ['Idle', 'Move', 'Attack', 'Hurt', 'Defeat'];

export function validateProductionRuntimeContracts() {
  const errors = [];
  const warnings = [];
  const allIds = new Set();
  const governance = validateAssetGovernanceContracts();
  errors.push(...governance.errors);
  warnings.push(...governance.warnings);

  if (REGION_ENCOUNTER_IDS.length !== EXPECTED_REGION_COUNT) errors.push(`Expected ${EXPECTED_REGION_COUNT} region encounters, got ${REGION_ENCOUNTER_IDS.length}.`);

  for (const regionId of REGION_ENCOUNTER_IDS) {
    const encounter = REGION_ENCOUNTERS[regionId];
    if (encounter.normal.length !== EXPECTED_NORMAL_PER_REGION) errors.push(`${regionId}: expected ${EXPECTED_NORMAL_PER_REGION} normal monsters, got ${encounter.normal.length}.`);
    if (encounter.normalSpawns.length < 8) errors.push(`${regionId}: requires at least 8 normal spawn points.`);
    if (!encounter.elite || !encounter.boss) errors.push(`${regionId}: elite or boss definition missing.`);

    for (const def of [...encounter.normal, encounter.elite, encounter.boss]) {
      if (allIds.has(def.id)) errors.push(`Duplicate encounter actor id: ${def.id}.`);
      allIds.add(def.id);
      const asset = getCanonicalAsset(def.modelAssetId);
      if (!asset) errors.push(`${def.id}: modelAssetId ${def.modelAssetId || 'missing'} is not registered.`);
      if (asset && !asset.canonicalPath.startsWith('models/')) errors.push(`${def.id}: asset path must stay under models/.`);
      if (!(def.hp > 0) || !(def.atk > 0)) errors.push(`${def.id}: hp and atk must be positive.`);
    }
  }

  if (CANONICAL_ASSET_COUNT !== 800) errors.push(`Expected 800 Canonical GLB assets for v0.35, got ${CANONICAL_ASSET_COUNT}.`);
  if (Object.keys(STRUCTURE_ASSETS).length !== 15) errors.push(`Expected 15 structure GLB assets, got ${Object.keys(STRUCTURE_ASSETS).length}.`);
  if (Object.keys(CHARACTER_ASSETS).length !== 3) errors.push(`Expected 3 character GLB assets, got ${Object.keys(CHARACTER_ASSETS).length}.`);
  if (Object.keys(ENCOUNTER_ASSETS).length !== EXPECTED_REGION_COUNT * 5) errors.push(`Expected 40 encounter GLB assets, got ${Object.keys(ENCOUNTER_ASSETS).length}.`);

  for (const [profileId, asset] of Object.entries(CHARACTER_ASSETS)) {
    if (!asset.canonicalPath.endsWith('.glb')) errors.push(`${profileId}: character asset is not a GLB.`);
    if (!asset.requiredClips.includes('Idle')) errors.push(`${profileId}: Idle clip is required.`);
    if (profileId === 'player_child' && !asset.requiredClips.includes('Defeat')) errors.push(`${profileId}: Defeat clip is required.`);
  }
  for (const [actorId, asset] of Object.entries(ENCOUNTER_ASSETS)) {
    for (const clip of REQUIRED_ENEMY_CLIPS) if (!asset.clips.includes(clip)) errors.push(`${actorId}: missing required clip ${clip}.`);
  }

  const categoryCounts = Object.values(CANONICAL_ASSET_REGISTRY).reduce((result, asset) => {
    result[asset.category] = (result[asset.category] || 0) + 1;
    return result;
  }, {});

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      canonicalAssets: CANONICAL_ASSET_COUNT,
      regions: REGION_ENCOUNTER_IDS.length,
      normalMonsters: REGION_ENCOUNTER_IDS.reduce((sum, id) => sum + REGION_ENCOUNTERS[id].normal.length, 0),
      elites: REGION_ENCOUNTER_IDS.length,
      bosses: REGION_ENCOUNTER_IDS.length,
      structureAssets: Object.keys(STRUCTURE_ASSETS).length,
      characterAssets: Object.keys(CHARACTER_ASSETS).length,
      encounterAssets: Object.keys(ENCOUNTER_ASSETS).length,
      categoryCounts,
      artTarget: governance.summary.targetAssets,
    },
  };
}
