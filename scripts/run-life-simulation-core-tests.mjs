import { validateLifeSimulationCore } from '../src/services/LifeSimulationCoreValidationService.js';

const result = validateLifeSimulationCore();
const report = { generatedAt: new Date().toISOString(), ...result };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
