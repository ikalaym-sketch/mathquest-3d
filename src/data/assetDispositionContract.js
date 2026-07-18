// v0.29.1 既有 134 個 Canonical GLB 的正式處置契約。
// 本檔是逐筆決策的唯一來源，禁止再由類別預設值推導 keep／rework／replace。

export const ASSET_DISPOSITION_TARGETS = Object.freeze({
  keep: 24,
  rework: 82,
  replace: 28,
});

const REPLACE_ASSET_IDS = Object.freeze([
  'character:player_child',
  'character:npc_adult',
  'character:npc_child',
  'structure:canonical_bridge',
  'encounter:wind_elite',
  'encounter:snow_elite',
  'encounter:farm_elite',
  'encounter:star_elite',
  'encounter:crystal_elite',
  'encounter:canyon_elite',
  'encounter:mushroom_elite',
  'encounter:clockwork_elite',
  'encounter:wind_boss',
  'encounter:snow_boss',
  'encounter:farm_boss',
  'encounter:star_boss',
  'encounter:crystal_boss',
  'encounter:canyon_boss',
  'encounter:mushroom_boss',
  'encounter:clockwork_boss',
  'companion:tanuki',
  'companion:rabbit',
  'companion:fox',
  'companion:cat',
  'companion:otter',
  'companion:squirrel',
  'companion:chick',
  'companion:red_panda',
]);

const KEEP_ASSET_IDS = Object.freeze([
  'farm:farmhouse',
  'farm:barn',
  'farm:windmill',
  'farm:water_tower',
  'farm:farmer',
  'farm:cow',
  'farm:sheep',
  'farm:chicken',
  'farm:fruit_tree',
  'farm:hay_bale',
  'farm:mailbox',
  'farm:bridge',
  'forest:great_tree',
  'forest:waterfall_cliff',
  'forest:ancient_gate',
  'forest:mossy_shrine',
  'forest:forest_bridge',
  'forest:lantern_post',
  'forest:fern_cluster',
  'forest:mushroom_cluster',
  'forest:vine_arch',
  'forest:stone_totem',
  'forest:treasure_altar',
  'region-environment:field_crate',
]);

const DISPOSITION_BY_ASSET_ID = Object.freeze({
  ...Object.fromEntries(KEEP_ASSET_IDS.map((assetId) => [assetId, 'keep'])),
  ...Object.fromEntries(REPLACE_ASSET_IDS.map((assetId) => [assetId, 'replace'])),
});

export function getAssetDisposition(assetId) {
  return DISPOSITION_BY_ASSET_ID[assetId] || 'rework';
}

export function summarizeAssetDisposition(assetIds = []) {
  return assetIds.reduce((summary, assetId) => {
    const status = getAssetDisposition(assetId);
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, { keep: 0, rework: 0, replace: 0 });
}

export function getExplicitDispositionAssetIds() {
  return {
    keep: [...KEEP_ASSET_IDS],
    replace: [...REPLACE_ASSET_IDS],
  };
}
