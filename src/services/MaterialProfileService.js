// v0.29.1 材質描述解析服務。
// 此層只回傳可驗證描述，不直接修改共享 Material，避免單一實例換色污染其他角色。
import { getShaderProfile, getShaderQualityProfile } from '../shaders/shaderLibrary.js';

export const MATERIAL_RUNTIME_PROFILES = Object.freeze({
  'vertex-color-foundation': Object.freeze({ useVertexColors: true, atlasId: null, shaderId: null, instanceSafe: true }),
  'terrain-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_forest', shaderId: 'terrainBlend', instanceSafe: true }),
  'wind-grass-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_wind', shaderId: 'grassWind', instanceSafe: true }),
  'snow-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_snow', shaderId: 'snowAccumulation', instanceSafe: true }),
  'farm-wet-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_farm', shaderId: 'wetSurface', instanceSafe: true }),
  'farm-atlas-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_farm', shaderId: null, instanceSafe: true }),
  'farm-tool-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_farm', shaderId: null, instanceSafe: true }),
  'crop-animal-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_crop_animal', shaderId: null, instanceSafe: true }),
  'village-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_village', shaderId: null, instanceSafe: true }),
  'player-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_player', shaderId: null, instanceSafe: true }),
  'residents-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_residents', shaderId: null, instanceSafe: true }),
  'companions-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_companions', shaderId: null, instanceSafe: true }),
  'crystal-generated': Object.freeze({ useVertexColors: false, atlasId: 'atlas_crystal', shaderId: 'crystalPulse', transparent: true, instanceSafe: true }),
  'canyon-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_canyon', shaderId: 'terrainBlend', instanceSafe: true }),
  'mushroom-generated': Object.freeze({ useVertexColors: false, atlasId: 'atlas_mushroom', shaderId: 'mushroomSpore', transparent: true, instanceSafe: true }),
  'clockwork-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_clockwork', shaderId: null, instanceSafe: true }),
  'clockwork-steam-generated': Object.freeze({ useVertexColors: false, atlasId: 'atlas_clockwork', shaderId: 'steamFlow', transparent: true, instanceSafe: true }),
  'water-generated': Object.freeze({ useVertexColors: false, atlasId: 'atlas_crystal', shaderId: 'waterSurface', transparent: true, instanceSafe: true }),
  'equipment-metal-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_equipment_metal', shaderId: null, instanceSafe: true }),
  'equipment-cloth-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_equipment_cloth', shaderId: null, instanceSafe: true }),
  // VFX由Shader直接著色，不重複載入不會被Shader取樣的Atlas。
  'equipment-effect-generated': Object.freeze({ useVertexColors: true, atlasId: null, shaderId: 'equipmentEnchant', transparent: true, instanceSafe: false }),
  'equipment-enchanted': Object.freeze({ useVertexColors: false, atlasId: 'atlas_equipment_metal', shaderId: 'equipmentEnchant', instanceSafe: false }),
  'festival-emissive': Object.freeze({ useVertexColors: false, atlasId: 'atlas_interior_festival_tower', shaderId: 'festivalLight', transparent: true, instanceSafe: false }),
  'interior-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_interior_festival_tower', shaderId: null, instanceSafe: true }),
  'tower-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_interior_festival_tower', shaderId: 'festivalLight', instanceSafe: false }),
  'event-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_interior_festival_tower', shaderId: null, instanceSafe: true }),
  'event-festival-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_interior_festival_tower', shaderId: 'festivalLight', instanceSafe: false }),
  'portal-generated': Object.freeze({ useVertexColors: true, atlasId: 'atlas_interior_festival_tower', shaderId: 'festivalLight', transparent: true, instanceSafe: false }),
  'vfx-generated': Object.freeze({ useVertexColors: true, atlasId: null, shaderId: 'equipmentEnchant', transparent: true, instanceSafe: false }),
});

export function resolveMaterialRuntimeProfile(profileId = 'vertex-color-foundation', quality = 'medium', overrides = {}) {
  const profile = MATERIAL_RUNTIME_PROFILES[profileId] || MATERIAL_RUNTIME_PROFILES['vertex-color-foundation'];
  const shader = profile.shaderId ? getShaderProfile(profile.shaderId) : null;
  return {
    ...profile,
    profileId,
    quality: getShaderQualityProfile(quality),
    shader,
    uniforms: shader ? { ...shader.defaultUniforms, ...(overrides.uniforms || {}) } : {},
    // 非 instanceSafe 材質必須 clone 後再套用，禁止直接改共享快取物件。
    requiresClone: profile.instanceSafe === false,
  };
}
