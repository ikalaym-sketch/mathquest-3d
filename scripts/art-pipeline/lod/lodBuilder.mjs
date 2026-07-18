// LOD Builder 契約：統一減面比例與命名；實際幾何減面器可在不改 Recipe 的情況下替換。
export function getLodRatios(profile = {}) {
  const ratios = profile.ratios || [1, 0.55, 0.22];
  if (ratios.length !== 3 || ratios[0] !== 1 || ratios[1] >= 1 || ratios[2] >= ratios[1]) {
    throw new Error(`LOD ratios 無效：${JSON.stringify(ratios)}`);
  }
  return ratios;
}
