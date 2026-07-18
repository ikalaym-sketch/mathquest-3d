// 持續維護的 Asset Recipe Schema；所有批量模型必須先經此正規化，禁止只換顏色或 Noise Seed。
const REQUIRED_IDENTITY_FIELDS = ['assetId', 'category', 'purpose', 'silhouette', 'proportion', 'materialProfile'];

export function normalizeAssetRecipe(recipe) {
  const errors = REQUIRED_IDENTITY_FIELDS.filter((key) => !recipe?.[key]);
  if (errors.length) throw new Error(`Asset Recipe 缺少：${errors.join(', ')}`);
  if (!Array.isArray(recipe.geometry) || recipe.geometry.length === 0) throw new Error(`${recipe.assetId} geometry 不得為空。`);
  return Object.freeze({
    ...recipe,
    geometry: Object.freeze(recipe.geometry.map((part) => Object.freeze({ ...part }))),
    sockets: Object.freeze((recipe.sockets || []).map((socket) => Object.freeze({ ...socket }))),
    colliders: Object.freeze((recipe.colliders || []).map((collider) => Object.freeze({ ...collider }))),
    animations: Object.freeze((recipe.animations || []).map((animation) => Object.freeze({ ...animation }))),
    lod: Object.freeze({ profileId: recipe.lod?.profileId || null, ratios: recipe.lod?.ratios || [1, 0.55, 0.22] }),
  });
}
