// GLB 匯出前的正式 Contract 驗證；失敗時禁止寫入 Canonical 路徑。
export function validateSceneContract({ scene, animations = [], asset = null }) {
  const errors = [];
  if (!scene?.isScene) errors.push('scene 必須是 THREE.Scene。');
  if (!asset?.assetId) errors.push('缺少 Canonical asset 定義。');
  if (!asset?.canonicalPath?.endsWith('.glb')) errors.push(`${asset?.assetId || 'unknown'} 缺少合法 canonicalPath。`);

  const nodeNames = new Set();
  scene?.traverse?.((node) => { if (node.name) nodeNames.add(node.name); });
  for (const requiredNode of asset?.requiredNodes || []) {
    if (!nodeNames.has(requiredNode)) errors.push(`${asset.assetId} 缺少節點 ${requiredNode}。`);
  }
  const animationNames = new Set((animations || []).map((clip) => clip.name));
  for (const requiredClip of asset?.requiredClips || asset?.clips || []) {
    if (!animationNames.has(requiredClip)) errors.push(`${asset.assetId} 缺少動畫 ${requiredClip}。`);
  }
  if (errors.length) throw new Error(errors.join(' | '));
  return { assetId: asset.assetId, nodes: nodeNames.size, animations: animationNames.size };
}
