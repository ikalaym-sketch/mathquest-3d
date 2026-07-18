// 星光村正式品質垂直切片。
// 場景由唯一配置表組裝：八個分區、道路、十一棟建築、生活物件、居民、互動入口與碰撞。
import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { VILLAGE_LAYOUT } from '../../data/villageLayout.js';
import { validateVillageLayout } from '../../services/SceneValidationService.js';
import { validatePlacementRules } from '../../services/PlacementValidationService.js';
import { getRenderQualityProfile } from '../../utils/renderQuality.js';
import { registerPOI } from '../../input/pois.js';
import { setLoadError, setStep } from '../../input/loadProgress.js';
import VillageNPCs from '../NPC/VillageNPCs.jsx';
import VillageLifeNPCs from '../NPC/VillageLifeNPCs.jsx';
import TeleportGate from '../World/TeleportGate.jsx';
import { goToScene } from '../UI/TransitionManager.jsx';
import { VillageGround, RoadSegment, Plaza, PondAndBridge, FlowerPatch, TreeGrove } from '../World/VillageKit.jsx';
import VillageActivityProps from '../World/VillageActivityProps.jsx';
import SurfaceDetailLayer from '../Environment/SurfaceDetailLayer.jsx';
import VillageProductionAssetLayer from '../World/VillageProductionAssetLayer.jsx';
import WorldEventAssetLayer from '../World/WorldEventAssetLayer.jsx';

export default function VillageScene() {
  const openBalloon = useStore((state) => state.openBalloonGame);
  const startOrResumeTrialTower = useStore((state) => state.startOrResumeTrialTower);
  const openWorldMap = useStore((state) => state.openWorldMap);
  const openPanel = useStore((state) => state.openPanel);
  const qualityId = useStore((state) => state.renderQuality || 'high');
  const quality = getRenderQualityProfile(qualityId);
  const weatherType = useStore((state) => state.weatherType || 'sunny');
  const validation = useMemo(() => {
    const base = validateVillageLayout(VILLAGE_LAYOUT);
    const placement = validatePlacementRules(VILLAGE_LAYOUT);
    return { ok: base.ok && placement.ok, errors: [...base.errors, ...placement.errors], warnings: [...base.warnings, ...placement.warnings] };
  }, []);
  const landmarks = useMemo(() => Object.fromEntries(VILLAGE_LAYOUT.landmarks.map((item) => [item.id, item])), []);
  const altarApi = useRef({ id:'altar_village',type:'altar',label:'Balloon Altar',getPos:()=>({x:landmarks.balloon_altar.position[0],z:landmarks.balloon_altar.position[2]}) });

  useEffect(() => {
    if (!validation.ok) { setLoadError(`村莊配置檢查失敗：${validation.errors.join(' / ')}`); return undefined; }
    if (validation.warnings.length) console.warn('[Village Validation]', validation.warnings);
    setStep('scene', 1);
    const unregA=registerPOI(altarApi.current);
    const unregB=registerPOI({id:'village_board',type:'quest',label:'Quest Board',getPos:()=>({x:landmarks.quest_board.position[0],z:landmarks.quest_board.position[2]})});
    return()=>{unregA();unregB();};
  }, [landmarks, validation]);

  return <>
    <VillageGround/>
    <SurfaceDetailLayer sceneId="village" layout={VILLAGE_LAYOUT} density={quality.vegetationDensity} weather={weatherType}/>
    {VILLAGE_LAYOUT.roads.map(r=><RoadSegment key={r.id} {...r}/>) }
    <Plaza position={VILLAGE_LAYOUT.zones.plaza.center} radius={VILLAGE_LAYOUT.zones.plaza.radius}/>
    <PondAndBridge pondPosition={landmarks.village_pond.position} bridgePosition={landmarks.red_bridge.position} showBridge={false}/>
    <VillageProductionAssetLayer
      layout={VILLAGE_LAYOUT}
      landmarks={landmarks}
      quality={quality}
      onQuestBoard={(event)=>{event.stopPropagation();openPanel('villageBoard');}}
      onBalloonAltar={(event)=>{event.stopPropagation();openBalloon();}}
    />
    <WorldEventAssetLayer sceneId="village" />
    <FlowerPatch position={[13,0,20]} colors={['#fff','#83d4ff','#ffd66b']} count={26}/>
    <FlowerPatch position={[24,0,18]} colors={['#ff9dc0','#fff2a7','#9fe3a0']} count={22}/>
    <FlowerPatch position={[-6,0,19]} colors={['#ffb4c8','#fff','#f0cf5b']} count={24}/>
    <TeleportGate {...VILLAGE_LAYOUT.gates.farm} portalType="farm" onActivate={()=>goToScene('farm')}/>
    <TeleportGate {...VILLAGE_LAYOUT.gates.world} portalType="region" onActivate={openWorldMap}/>
    <TeleportGate {...VILLAGE_LAYOUT.gates.trial} portalType="trial" onActivate={()=>{startOrResumeTrialTower();goToScene('trialTower');}}/>
    <VillageNPCs definitions={VILLAGE_LAYOUT.roleNpcs}/>
    <VillageLifeNPCs definitions={VILLAGE_LAYOUT.lifeNpcs}/>
    <VillageActivityProps/>
    <TreeGrove density={quality.vegetationDensity}/>
  </>;
}
