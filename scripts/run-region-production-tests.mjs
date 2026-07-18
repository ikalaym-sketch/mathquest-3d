import { REGION_STRUCTURE_CATALOG } from '../src/data/physicalObjectCatalog.js';
import { validateAllRegionProductionLayouts } from '../src/services/RegionProductionValidationService.js';
import { validateCharacterPhysicalProfiles } from '../src/services/CharacterPhysicalValidationService.js';

const region = validateAllRegionProductionLayouts(REGION_STRUCTURE_CATALOG);
const character = validateCharacterPhysicalProfiles();
const report = {
  generatedAt: new Date().toISOString(),
  ok: region.ok && character.ok,
  regionProduction: region,
  characterPhysical: character,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
