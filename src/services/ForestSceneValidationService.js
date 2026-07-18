// 森林遺跡場景配置驗證器。
// 檢查場景不是只有資料存在，而是具備可達路徑、地標、怪物、安全距離與 Boss 條件。
export function validateForestRuinsLayout(layout) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const register = (id, kind) => {
    if (!id) errors.push(`${kind} 缺少 ID`);
    else if (ids.has(id)) errors.push(`重複 ID：${id}`);
    else ids.add(id);
  };

  const subareas = Object.values(layout.subareas || {});
  if (subareas.length !== 4) errors.push(`森林遺跡必須有 4 個子區，目前為 ${subareas.length}`);
  if ((layout.roads || []).length < 5) errors.push('探索回路至少需要 5 條道路／坡道');
  if ((layout.landmarks || []).length < 6) errors.push('至少需要 6 個大型地標');
  if ((layout.monsterCamps || []).length < 4) errors.push('每個子區至少需要 1 個怪物群落');
  if ((layout.puzzleNodes || []).length < 3) errors.push('至少需要 3 個數學互動機關');

  subareas.forEach((area) => {
    register(area.id, '子區');
    if (!area.center || area.center.length !== 3) errors.push(`${area.id} 缺少有效中心座標`);
    if (!area.size || area.size[0] < 24 || area.size[1] < 24) warnings.push(`${area.id} 探索面積偏小`);
    if (!area.assets || area.assets.length < 4) warnings.push(`${area.id} 資產種類不足 4 種`);
    if (!area.neighbors || area.neighbors.length < 2) errors.push(`${area.id} 未形成探索回路`);
  });

  [...layout.landmarks, ...layout.props, ...layout.puzzleNodes, ...layout.monsterCamps, ...layout.eventNodes].forEach((item) => {
    register(item.id, '場景物件');
    if (item.subareaId && !layout.subareas[item.subareaId]) errors.push(`${item.id} 指向不存在的子區 ${item.subareaId}`);
  });

  const bossRequirements = layout.boss?.requiredObjectives || [];
  const availableObjectives = new Set(subareas.map((area) => area.objectiveId));
  bossRequirements.forEach((id) => {
    if (!availableObjectives.has(id)) errors.push(`Boss 條件 ${id} 沒有對應子區目標`);
  });
  if (!layout.spawn || layout.spawn[2] < 30) warnings.push('出生點距離第一探索區過近，可能進場即遭遇怪物');

  // 粗略重疊檢查：大型地標中心距離小於 5 單位即警告。
  for (let i = 0; i < layout.landmarks.length; i += 1) {
    for (let j = i + 1; j < layout.landmarks.length; j += 1) {
      const a = layout.landmarks[i];
      const b = layout.landmarks[j];
      const distance = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
      if (distance < 5) warnings.push(`大型地標距離過近：${a.id} / ${b.id}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
