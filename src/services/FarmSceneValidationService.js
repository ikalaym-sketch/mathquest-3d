// 農場場景配置驗證器。
// 目的：在正式渲染前阻擋缺少分區、重疊建築、缺少道路或動物位置錯誤的配置。
export function validateFarmLayout(layout) {
  const errors = [];
  const warnings = [];

  // 強制檢查八個核心功能區，避免農場退化成單一農田平面。
  const requiredZones = ['home', 'fields', 'paddock', 'orchard', 'workshop', 'pond', 'windmill', 'shipping'];
  requiredZones.forEach((zoneId) => {
    if (!layout?.zones?.[zoneId]) errors.push(`Missing farm zone: ${zoneId}`);
  });

  // 出生點、道路、建築與動物都屬於可玩性的必要資料。
  if (!layout?.spawn) errors.push('Farm spawn is missing.');
  if ((layout?.roads?.length || 0) < 5) errors.push('Farm road count is below the quality baseline.');
  if ((layout?.buildings?.length || 0) < 4) errors.push('Farm building count is below the quality baseline.');
  if (Object.keys(layout?.animals || {}).length < 3) errors.push('Farm animal placements are incomplete.');
  if ((layout?.orchardTrees?.length || 0) < 5) errors.push('Orchard tree count is below the quality baseline.');

  // 所有場景物件必須有唯一識別碼，避免互動、存檔與碰撞追蹤混亂。
  const ids = new Set();
  const records = [
    ...Object.values(layout?.zones || {}),
    ...(layout?.roads || []),
    ...(layout?.buildings || []),
    ...(layout?.landmarks || []),
    ...(layout?.orchardTrees || []),
    ...(layout?.lifeNpcs || []),
  ];
  records.forEach((record) => {
    if (!record?.id) return;
    if (ids.has(record.id)) errors.push(`Duplicate farm id: ${record.id}`);
    ids.add(record.id);
  });

  // 建築間距過小時提供警告，避免模型與碰撞體互相穿插。
  (layout?.buildings || []).forEach((buildingA, index) => {
    (layout.buildings || []).slice(index + 1).forEach((buildingB) => {
      const distance = Math.hypot(
        buildingA.position[0] - buildingB.position[0],
        buildingA.position[2] - buildingB.position[2]
      );
      if (distance < 8) warnings.push(`Farm buildings may overlap: ${buildingA.id}/${buildingB.id}`);
    });
  });

  // 動物不可配置在出生安全區內，避免玩家進場立即被模型阻擋。
  Object.entries(layout?.animals || {}).forEach(([animalId, animal]) => {
    const distanceFromSpawn = Math.hypot(
      animal.position[0] - layout.spawn.x,
      animal.position[2] - layout.spawn.z
    );
    if (distanceFromSpawn < layout.safeRadius) {
      errors.push(`Animal ${animalId} is inside the spawn safe radius.`);
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}
