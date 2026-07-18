export const RENDER_QUALITY_PROFILES = {
  low:{id:'low',label:'Low',dpr:[.85,1],shadows:false,vegetationDensity:.5,particles:.45,dynamicLights:1},
  medium:{id:'medium',label:'Medium',dpr:[1,1.25],shadows:true,vegetationDensity:.75,particles:.7,dynamicLights:2},
  high:{id:'high',label:'High',dpr:[1,1.5],shadows:true,vegetationDensity:1,particles:1,dynamicLights:4},
  ultra:{id:'ultra',label:'Ultra',dpr:[1.5,2],shadows:true,vegetationDensity:1.25,particles:1.35,dynamicLights:6},
};
export function getRenderQualityProfile(id){return RENDER_QUALITY_PROFILES[id]||RENDER_QUALITY_PROFILES.high;}
