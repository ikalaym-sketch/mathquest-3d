// 動畫 Builder 契約入口；目前接受正式 THREE.AnimationClip，後續骨架生成仍沿用同一介面。
export function buildAnimationSet(clips = [], requiredNames = []) {
  const byName = new Map(clips.map((clip) => [clip.name, clip]));
  const missing = requiredNames.filter((name) => !byName.has(name));
  if (missing.length) throw new Error(`動畫契約缺少：${missing.join(', ')}`);
  return [...byName.values()];
}
