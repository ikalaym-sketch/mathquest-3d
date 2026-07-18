// v0.30 星光村正式模型層。
// 建築與地標維持互動碰撞；小型生活物件僅渲染玩家鄰近兩個分區，避免80個村莊GLB同時駐留。
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Sparkles } from '@react-three/drei';
import { playerPos } from '../../input/playerPos.js';
import Model from '../3D/Model.jsx';
import { StorybookHouse } from './VillageKit.jsx';
import {
  VILLAGE_BUILDING_ASSET_BY_LAYOUT_ID,
  VILLAGE_MODEL_ASSETS,
  VILLAGE_ZONE_PROP_PLACEMENTS,
  activateVillageCoreAssets,
  getVillageZoneIdsForBundles,
  releaseVillageCoreAssets,
  releaseVillageZoneBundles,
  syncVillageZoneBundles,
} from '../../services/VillageAssetService.js';

export default function VillageProductionAssetLayer({ layout, landmarks, quality, onQuestBoard, onBalloonAltar }) {
  const activeBundles = useRef([]);
  const elapsed = useRef(0);
  const [activeZones, setActiveZones] = useState(['plaza']);

  useEffect(() => {
    activateVillageCoreAssets();
    activeBundles.current = syncVillageZoneBundles([], playerPos.x, playerPos.z);
    setActiveZones(getVillageZoneIdsForBundles(activeBundles.current));
    return () => {
      releaseVillageZoneBundles(activeBundles.current);
      activeBundles.current = [];
      releaseVillageCoreAssets();
    };
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 0.3) return;
    elapsed.current = 0;
    const next = syncVillageZoneBundles(activeBundles.current, playerPos.x, playerPos.z);
    if (next.join('|') !== activeBundles.current.join('|')) {
      activeBundles.current = next;
      setActiveZones(getVillageZoneIdsForBundles(next));
    }
  });

  return <>
    {layout.buildings.map((building) => <StorybookHouse key={building.id} {...building} assetId={VILLAGE_BUILDING_ASSET_BY_LAYOUT_ID[building.id]} />)}
    <LandmarkModel assetId={VILLAGE_MODEL_ASSETS.star_tree} position={landmarks.star_tree.position} collider={[.8, 2.2, .8]} colliderPosition={[0, 2.2, 0]}>
      <Sparkles count={Math.round(45 * quality.particles)} scale={8} size={4} speed={.4} color="#ffe88b" position={[0,5,0]} />
    </LandmarkModel>
    <LandmarkModel assetId={VILLAGE_MODEL_ASSETS.fountain} position={landmarks.plaza_fountain.position} collider={[3, .55, 3]} colliderPosition={[0, .55, 0]} />
    <LandmarkModel assetId={VILLAGE_MODEL_ASSETS.pond_bridge} position={landmarks.red_bridge.position} collider={[1.4, .25, 4.9]} colliderPosition={[0, .4, 0]} />
    <LandmarkModel assetId={VILLAGE_MODEL_ASSETS.quest_board} position={landmarks.quest_board.position} collider={[1.4, 1.1, .3]} colliderPosition={[0, 1.1, 0]} onClick={onQuestBoard} />
    <LandmarkModel assetId={VILLAGE_MODEL_ASSETS.balloon_altar} position={landmarks.balloon_altar.position} collider={[1, .65, 1]} colliderPosition={[0, .65, 0]} onClick={onBalloonAltar}>
      <pointLight position={[0,1.6,0]} intensity={1.2} distance={6} color="#8ee8ff" />
      <Sparkles count={Math.round(18 * quality.particles)} scale={3.2} size={3} speed={.45} color="#c9f4ff" position={[0,1.3,0]} />
    </LandmarkModel>
    {activeZones.flatMap((zoneId) => VILLAGE_ZONE_PROP_PLACEMENTS[zoneId] || []).map((item) => (
      <group key={item.id} position={item.position} rotation={item.rotation} scale={item.scale}>
        <Model assetId={item.assetId} instanceId={`village-prop:${item.id}`} />
      </group>
    ))}
  </>;
}

function LandmarkModel({ assetId, position, rotation = [0,0,0], collider, colliderPosition, onClick, children }) {
  return <group position={position} rotation={rotation} onClick={onClick}>
    {collider&&<RigidBody type="fixed" colliders={false}><CuboidCollider args={collider} position={colliderPosition}/></RigidBody>}
    <Model assetId={assetId} instanceId={`village-landmark:${assetId}`} />
    {children}
  </group>;
}
