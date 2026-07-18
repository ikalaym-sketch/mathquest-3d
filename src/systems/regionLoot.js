// 怪物掉落規則集中管理。
// 八大區域怪物必定掉落對應 Canonical 素材；舊場景怪物則維持石材／木材規則。
export function rollMonsterLoot(definition, random = Math.random) {
  const drops = [];
  const tier = definition?.tier || 'normal';

  if (definition?.regionMaterialId) {
    const count = tier === 'boss' ? 4 : tier === 'elite' ? 2 : 1;
    drops.push({ itemId: definition.regionMaterialId, count, source: 'regional' });
  }

  // 保留原本基礎建材來源，但降低八區怪物的額外木材機率，避免掉落過度膨脹。
  drops.push({ itemId: 'mat_stone', count: 1, source: 'base' });
  const woodChance = definition?.regionMaterialId ? 0.25 : 0.5;
  if (random() < woodChance) drops.push({ itemId: 'mat_wood', count: 1, source: 'base' });
  return drops;
}

export function grantMonsterLoot(storeState, definition, random = Math.random) {
  const drops = rollMonsterLoot(definition, random);
  const modifiers = storeState.getCompanionRuntime?.().modifiers || {};
  for (const drop of drops) {
    let count = drop.count;
    const chance = drop.itemId === 'mat_wood'
      ? Math.max(modifiers.materialDropBonus || 0, modifiers.treeMaterialBonus || 0)
      : (modifiers.materialDropBonus || 0);
    if (chance > 0 && random() < chance) count += 1;
    for (let index = 0; index < count; index += 1) storeState.addToInventory('materials', drop.itemId);
    if (drop.source === 'regional') storeState.recordRegionEventSignal?.({ type: 'collect', targetId: drop.itemId, amount: count });
    drop.count = count;
  }
  return drops;
}
