// 匯出 v0.19 區域玩法 Canonical Manifest，供工程稽核與外部檢視使用。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGION_CRAFTS, REGION_GAMEPLAY_PROFILES, REGION_MATERIALS } from '../src/data/regionGameplayProfiles.js';
import { validateRegionGameplayProduction } from '../src/services/RegionGameplayValidationService.js';
import { REGION_MECHANIC_CHALLENGES } from '../src/data/regionMechanicChallenges.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'public/manifests/region-gameplay-manifest.json');
const validation = validateRegionGameplayProduction();
if (!validation.ok) {
  console.error(JSON.stringify(validation, null, 2));
  process.exit(1);
}

const manifest = {
  schemaVersion: '1.0.0',
  packageVersion: '0.19.0',
  generatedAt: new Date().toISOString(),
  validation: validation.summary,
  materials: REGION_MATERIALS,
  keepsakes: REGION_CRAFTS,
  mechanicChallenges: REGION_MECHANIC_CHALLENGES,
  regions: Object.values(REGION_GAMEPLAY_PROFILES).map((profile) => ({
    regionId: profile.regionId,
    materialId: profile.materialId,
    keepsakeId: profile.keepsakeId,
    skillContext: profile.skillContext,
    mechanic: profile.mechanic,
    guide: profile.guide,
    structureInteractions: profile.structureInteractions,
    events: profile.events,
  })),
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, outputPath, summary: validation.summary }, null, 2));
