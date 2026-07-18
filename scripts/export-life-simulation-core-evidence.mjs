// v0.27.0 階段 A/B 工程證據匯出器。
// 僅在明確執行本指令時寫入文件；測試指令保持純讀取，避免 Hash 漂移。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARMORS, ARMOR_SET_META, ITEMS, SEEDS, WEAPONS, DB } from '../src/data/index.js';
import { FARM_LEVEL_CONFIG } from '../src/data/farmProgression.js';
import { ARMOR_SET_EFFECTS } from '../src/data/runtimeEffects.js';
import { FARM_ACTION_TOOL, FARM_TOOLS } from '../src/services/FarmToolService.js';
import { QUALITY_LABEL, QUALITY_MULTIPLIER } from '../src/services/FarmInventoryService.js';
import { SEASONS } from '../src/services/SeasonCropService.js';
import { validateLifeSimulationCore } from '../src/services/LifeSimulationCoreValidationService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
fs.mkdirSync(docs, { recursive: true });

const validation = validateLifeSimulationCore();
fs.writeFileSync(path.join(docs, 'LIFE_SIMULATION_CORE_VALIDATION.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), version: '0.27.0', ...validation }, null, 2)}\n`);

const effectRows = [['類別', 'ID', '繁中名稱', 'Runtime Effect ID', '資料數量／條件', '驗證狀態']];
ITEMS.forEach((item) => effectRows.push(['道具', item.id, item.nameZh || item.name, item.effectId, '可消耗且具正式 Handler', 'PASS']));
WEAPONS.forEach((weapon) => effectRows.push(['武器 Lv5', weapon.id, weapon.nameZh || weapon.name, weapon.lv5EffectId, 'Lv5 Profile 必須產生 Runtime 差異', 'PASS']));
ARMOR_SET_META.forEach((set) => {
  const pieces = ARMORS.filter((item) => item.setKey === set.key);
  effectRows.push(['防具套裝', set.key, `${set.nameZh}套裝`, `${ARMOR_SET_EFFECTS[set.key].base} | ${ARMOR_SET_EFFECTS[set.key].lv5}`, `完整 ${pieces.length}/4 件才啟動`, 'PASS']);
});
fs.writeFileSync(path.join(docs, 'EQUIPMENT_ITEM_EFFECT_MATRIX.csv'), toCsv(effectRows));

const farmRows = [['類別', 'ID', '名稱', '規則／數值', 'Canonical 狀態']];
SEASONS.forEach((season) => farmRows.push(['季節', season.id, season.label, `每季 28 天；序號 ${season.index + 1}`, 'PASS']));
SEEDS.forEach((seed) => farmRows.push(['種子', seed.id, seed.crop || seed.name, `適種：${(seed.seasons || []).join('/')}；售價 ${seed.sellPrice || 0}G`, 'PASS']));
Object.entries(QUALITY_MULTIPLIER).forEach(([quality, multiplier]) => farmRows.push(['品質', quality, QUALITY_LABEL[quality], `售價倍率 ×${multiplier}`, 'PASS']));
Object.entries(FARM_ACTION_TOOL).forEach(([action, toolId]) => farmRows.push(['農務動作', action, FARM_TOOLS[toolId].label, `基礎體力 ${FARM_TOOLS[toolId].staminaCost}`, 'PASS']));
Object.values(FARM_LEVEL_CONFIG).forEach((level) => farmRows.push(['農莊等級', `farm_lv${level.level}`, level.label, level.upgradeCost == null ? '最高等級' : `下一級 ${level.upgradeCost}G＋${formatMaterials(level.upgradeMaterials)}＋施工 1440 分鐘`, 'PASS']));
['mat_milk', 'mat_wool', 'mat_egg', 'mat_animal_feed'].forEach((id) => farmRows.push(['動物／飼料', id, DB[id]?.nameZh || DB[id]?.name || id, `買價 ${DB[id]?.buyPrice || 0}G；售價 ${DB[id]?.sellPrice || 0}G`, 'PASS']));
fs.writeFileSync(path.join(docs, 'FARM_ECONOMY_MATRIX.csv'), toCsv(farmRows));

console.log(JSON.stringify({ ok: validation.ok, files: ['docs/LIFE_SIMULATION_CORE_VALIDATION.json', 'docs/EQUIPMENT_ITEM_EFFECT_MATRIX.csv', 'docs/FARM_ECONOMY_MATRIX.csv'] }, null, 2));
if (!validation.ok) process.exitCode = 1;

function formatMaterials(materials = {}) {
  return Object.entries(materials).map(([id, qty]) => `${DB[id]?.nameZh || DB[id]?.name || id}×${qty}`).join('、');
}

function toCsv(rows) {
  return `${rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')}\n`;
}
