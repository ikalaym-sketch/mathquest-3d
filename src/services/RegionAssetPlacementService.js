// 八區環境 GLB 配置服務。
// 依角色（岸線／地表／道路／邊界／敘事）解析安全位置，Runtime 與驗證器共用相同結果。
import { getWaterEnvironmentProfile } from '../data/waterEnvironmentProfiles.js';
import { localToWorld2D, sampleTraversalSurface } from './TraversalSurfaceService.js';

export function createRegionAssetPlacements(layout, kit) {
  const result = [];
  for (const [assetIndex, asset] of kit.assets.entries()) {
    const count = asset.role === 'ground-detail' || asset.role === 'shore-detail' ? 3 : 2;
    for (let index = 0; index < count; index += 1) {
      const candidate = resolveRegionAssetPlacement(layout, asset, assetIndex, index);
      if (!candidate) continue;
      result.push({
        asset,
        instanceId: `${layout.id}:${asset.id}:${index}`,
        position: [candidate.x, candidate.y, candidate.z],
        rotation: candidate.rotation,
        scale: (asset.scale || 1) * (0.88 + ((assetIndex + index) % 3) * 0.08),
      });
    }
  }
  return result;
}

export function resolveRegionAssetPlacement(layout, asset, assetIndex, index) {
  if (asset.role === 'shore-detail' || asset.role === 'water-detail') {
    const water = layout.waters[(assetIndex + index) % layout.waters.length];
    if (!water) return null;
    const profile = getWaterEnvironmentProfile(water);
    const angle = ((assetIndex * 3 + index) % 4) * Math.PI / 2;
    const localX = Math.cos(angle) * (water.size[0] / 2 + (asset.role === 'water-detail' ? -1.3 : 1.2));
    const localZ = Math.sin(angle) * (water.size[1] / 2 + (asset.role === 'water-detail' ? -1.3 : 1.2));
    const point = localToWorld2D(localX, localZ, water.center, water.rotation || 0);
    const surface = sampleTraversalSurface(layout, point.x, point.z);
    const y = asset.role === 'water-detail' ? (water.surfaceY ?? 0.13) + 0.04 : surface.walkable ? surface.y : 0;
    if (profile.mode === 'ravine' && asset.role === 'water-detail') return null;
    if (asset.role === 'shore-detail' && !surface.walkable) return null;
    return { x: point.x, y, z: point.z, rotation: angle + (water.rotation || 0), surface };
  }

  const area = layout.subareas[(assetIndex + index) % layout.subareas.length];
  const baseAngle = (assetIndex * 1.73 + index * 2.21) % (Math.PI * 2);
  const radiusX = area.size[0] * (asset.role === 'boundary-detail' ? 0.38 : 0.27);
  const radiusZ = area.size[1] * (asset.role === 'boundary-detail' ? 0.38 : 0.27);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const angle = baseAngle + attempt * 0.63;
    const x = area.center[0] + Math.cos(angle) * radiusX;
    const z = area.center[1] + Math.sin(angle) * radiusZ;
    const surface = sampleTraversalSurface(layout, x, z);
    if (surface.walkable && !['road', 'bridge', 'ice'].includes(surface.kind)) return { x, y: surface.y, z, rotation: angle + Math.PI, surface };
  }
  return null;
}
