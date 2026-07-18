import { validateRelease022Content } from '../src/services/Release022ValidationService.js';
import { STORY_CHAPTERS, STORY_QUEST_BY_ID } from '../src/data/storyContent.js';
import { applyStorySignal, backfillChapterProgress } from '../src/services/StoryProgressService.js';
import { calculateLineTelegraphRotation, isPointInsideBossSkill } from '../src/services/CombatGeometryService.js';
import { UI_DEFAULTS, sanitizeUiPreferences } from '../src/data/uiSystem.js';

const assertions = [];
function assert(name, condition, detail = null) {
  assertions.push({ name, ok: Boolean(condition), detail: condition ? null : detail });
}

const release = validateRelease022Content();
const chapter = STORY_CHAPTERS.find((item) => item.id === 'chapter_wind');
const blankProgress = { activeChapterId: null, acceptedQuestIds: [], completedQuestIds: [], questProgress: {}, completedChapterIds: [] };
const backfilled = backfillChapterProgress(blankProgress, chapter, {
  worldProgress: {
    exploredSubareas: { wind_highlands: ['breeze_meadow'] },
    regionMechanicProgress: { wind_highlands: { wind_vane_meadow: true } },
    structureInteractions: { 'wind_highlands:wind_station_a:entry': true },
  },
  gameProgress: { bossDefeated: ['wind_boss'] },
});
assert('舊存檔接受五條章節任務', backfilled.storyProgress.acceptedQuestIds.length === 5);
assert('舊存檔回填探索／機制／Socket／Boss', backfilled.storyProgress.completedQuestIds.length === 4, backfilled.storyProgress.completedQuestIds);
assert('精英沒有唯一舊證據時不得誤判完成', !backfilled.storyProgress.completedQuestIds.includes('chapter_wind_elite'));

const eliteQuestProgress = { ...backfilled.storyProgress, completedQuestIds: backfilled.storyProgress.completedQuestIds.filter((id) => id !== 'chapter_wind_elite') };
const eliteResult = applyStorySignal(eliteQuestProgress, { type: 'defeat', regionId: 'wind_highlands', targetId: 'wind_elite', tier: 'elite', amount: 1 });
assert('精英 Signal 完成精英任務', eliteResult.completedQuestIds.includes('chapter_wind_elite'));
assert('章節五任務完成後標記章節', eliteResult.storyProgress.completedChapterIds.includes(chapter.id));
assert('任務獎勵使用 Canonical 金額', eliteResult.rewardGold === STORY_QUEST_BY_ID.chapter_wind_elite.rewardGold);
const duplicate = applyStorySignal(eliteResult.storyProgress, { type: 'defeat', regionId: 'wind_highlands', targetId: 'wind_elite', tier: 'elite', amount: 1 });
assert('重複 Signal 不重複獎勵', !duplicate.changed);

const lineSkill = { kind: 'line', radius: 2, length: 12 };
const rotationY = calculateLineTelegraphRotation({ x: 0, z: 0 }, { x: 10, z: 0 });
const telegraph = { skill: lineSkill, position: [0, 0, 0], rotationY };
assert('線型預警朝目標方向旋轉', Math.abs(rotationY + Math.PI / 2) < 1e-6, rotationY);
assert('預警方向內命中', isPointInsideBossSkill(telegraph, { x: 8, z: 0 }));
assert('預警方向外不命中', !isPointInsideBossSkill(telegraph, { x: 0, z: -8 }));
assert('圓形邊界內命中', isPointInsideBossSkill({ skill: { kind: 'ring', radius: 5 }, position: [0, 0, 0] }, { x: 3, z: 4 }));
assert('圓形邊界外不命中', !isPointInsideBossSkill({ skill: { kind: 'ring', radius: 5 }, position: [0, 0, 0] }, { x: 5.1, z: 0 }));

const sanitized = sanitizeUiPreferences({ ...UI_DEFAULTS, textScale: '巨大', colorVision: '未知', hudScale: 'large' });
assert('UI 非法列舉回復預設值', sanitized.textScale === UI_DEFAULTS.textScale && sanitized.colorVision === UI_DEFAULTS.colorVision);
assert('UI 合法值保留', sanitized.hudScale === 'large');

const failedAssertions = assertions.filter((item) => !item.ok);
const report = {
  generatedAt: new Date().toISOString(),
  version: '0.22.0',
  release,
  destructiveChecks: assertions,
  failureCount: failedAssertions.length,
  ok: release.ok && failedAssertions.length === 0,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
