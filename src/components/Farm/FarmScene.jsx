// 第二階段正式農場場景。
// 場景採唯一 FARM_LAYOUT 配置、正式 GLB 資產、分區道路、農場升級外觀與農場情境數學。
import { useEffect, useMemo, useState } from 'react';
import { Html, Sparkles } from '@react-three/drei';
import { useFarmStore } from '../../store/farmStore.js';
import { useStore } from '../../store/useStore.js';
import Outlined from '../3D/Outlined.jsx';
import Model from '../3D/Model.jsx';
import CraftingSystem from './CraftingSystem.jsx';
import { SFX } from '../../audio/sfx.js';
import TeleportGate from '../World/TeleportGate.jsx';
import { goToScene } from '../UI/TransitionManager.jsx';
import {
  FarmBoundaryGrove,
  FarmBuilding,
  FarmCart,
  FarmEntryDecor,
  FarmFence,
  FarmFlowerBeds,
  FarmGround,
  FarmProp,
  HomeYardDecor,
  FarmScarecrow,
  FarmRoad,
  FarmUpgradeDecor,
  PondBridge,
  ShippingYard,
} from '../World/FarmKit.jsx';
import FarmLifeNPCs from '../NPC/FarmLifeNPCs.jsx';
import { FARM_CELL_SIZE, FARM_FIELD_ORIGIN, FARM_LAYOUT } from '../../data/farmLayout.js';
import { FARM_MODEL_ASSETS, preloadFarmAssets, releaseFarmAssets, resolveCropModelAssetId } from '../../services/FarmAssetService.js';
import { validateFarmLayout } from '../../services/FarmSceneValidationService.js';
import { getRenderQualityProfile } from '../../utils/renderQuality.js';
import SurfaceDetailLayer from '../Environment/SurfaceDetailLayer.jsx';
import { resolveAnimalRoutine } from '../../systems/npcSchedule.js';
import { CROP_STAGES } from '../../systems/farmSimulation.js';
import { QUALITY_LABEL } from '../../services/FarmInventoryService.js';
import CompanionHomeActors from './CompanionHomeActors.jsx';
import FarmProductionAssetLayer from './FarmProductionAssetLayer.jsx';

const cellPosition = (row, col) => [
  FARM_FIELD_ORIGIN[0] + (col - 3) * FARM_CELL_SIZE,
  0,
  FARM_FIELD_ORIGIN[2] + (row - 3) * FARM_CELL_SIZE,
];

export default function FarmScene() {
  const grid = useFarmStore((state) => state.farmGrid);
  const farmLevel = useFarmStore((state) => state.farmLevel);
  const advanceFarmSimulation = useFarmStore((state) => state.advanceFarmSimulation);
  const getStage = useFarmStore((state) => state.getStage);
  const harvestCell = useFarmStore((state) => state.harvestCell);
  const waterCell = useFarmStore((state) => state.waterCell);
  const clearWitheredCell = useFarmStore((state) => state.clearWitheredCell);
  const prepareCell = useFarmStore((state) => state.prepareCell);
  const animals = useFarmStore((state) => state.animals);
  const resolveToolAction = useFarmStore((state) => state.resolveToolAction);
  const recordToolAction = useFarmStore((state) => state.recordToolAction);
  const recordShipment = useFarmStore((state) => state.recordShipment);
  const groundDrops = useFarmStore((state) => state.groundDrops);
  const pickupDrop = useFarmStore((state) => state.pickupDrop);
  const homeDecorPlaced = useFarmStore((state) => state.homeDecorPlaced || []);

  const openMath = useStore((state) => state.openMathChallenge);
  const openPanel = useStore((state) => state.openPanel);
  const addFarmProduct = useStore((state) => state.addFarmProduct);
  const consumeStamina = useStore((state) => state.consumeStamina);
  const shipAllFarmProducts = useStore((state) => state.shipAllFarmProducts);
  const showWorldHint = useStore((state) => state.showWorldHint);
  const seeds = useStore((state) => state.inventory.seeds);
  const openWorldMap = useStore((state) => state.openWorldMap);
  const qualityId = useStore((state) => state.renderQuality || 'high');
  const quality = getRenderQualityProfile(qualityId);
  const weatherType = useStore((state) => state.weatherType || 'sunny');
  const worldClock = useStore((state) => state.worldClock);

  const [harvestFx, setHarvestFx] = useState(null);
  const validation = useMemo(() => validateFarmLayout(FARM_LAYOUT), []);

  useEffect(() => {
    preloadFarmAssets();
    const runSimulation = () => {
      const state = useStore.getState();
      advanceFarmSimulation(state.worldClock, state.weatherType);
    };
    runSimulation();
    const timer = window.setInterval(runSimulation, 4000);

    if (!validation.ok) console.error('[Farm Layout]', validation.errors);
    if (validation.warnings.length) console.warn('[Farm Layout]', validation.warnings);

    return () => {
      window.clearInterval(timer);
      window.setTimeout(releaseFarmAssets, 0);
    };
  }, [advanceFarmSimulation, validation]);

  const performToolAction = (action) => {
    const toolResult = resolveToolAction(action);
    if (!toolResult.ok) {
      showWorldHint(`請改用${toolResult.requiredTool ? '正確農具' : '可用工具'}。`);
      return null;
    }
    const stamina = consumeStamina(toolResult.staminaCost, `farm:${action}`);
    if (!stamina.ok) return null;
    recordToolAction(action, toolResult);
    return toolResult;
  };

  const onCellClick = (cell) => {
    if (!cell.isUnlocked) {
      showWorldHint('這格田地尚未解鎖，請先升級農莊。');
      return;
    }
    if (cell.isWithered || cell.stage === CROP_STAGES.WITHERED) {
      if (!performToolAction('clear')) return;
      clearWitheredCell(cell.id);
      showWorldHint('使用鋤頭清除枯萎作物。');
      return;
    }
    if (cell.isReady || cell.stage === CROP_STAGES.MATURE) {
      const tool = performToolAction('harvest');
      if (!tool) return;
      openMath({
        skillContext: 'farm_yield',
        onResolve: (correct) => {
          const runtime = useStore.getState().getEquipmentRuntime?.() || { harvestYield: 0 };
          const result = harvestCell(cell.id, correct, worldClock?.totalMinutes, runtime.harvestYield);
          if (!result) return;
          addFarmProduct(result.product);
          useStore.getState().onCombatEvent('harvest');
          SFX.harvest();
          showWorldHint(`收成 ${result.crop} ×${result.qty}，品質：${QUALITY_LABEL[result.quality] || result.quality}，單價 ${result.unitValue}G。`);
          const [x, , z] = cellPosition(cell.row, cell.col);
          setHarvestFx({ x, z, key: Date.now(), color: result.quality === 'star' ? '#fff27a' : '#ffd24a' });
          window.setTimeout(() => setHarvestFx(null), 1500);
        },
      });
      return;
    }
    if (cell.currentSeedId) {
      if (!performToolAction('water')) return;
      const runtime = useStore.getState().getEquipmentRuntime?.() || { waterRetentionMinutes: 0 };
      const watered = waterCell(cell.id, worldClock?.totalMinutes, runtime.waterRetentionMinutes);
      showWorldHint(watered ? '使用澆水壺完成澆水。' : '目前不需要澆水。');
      return;
    }
    if (!cell.isPrepared) {
      if (!performToolAction('prepare')) return;
      const prepared = prepareCell(cell.id);
      showWorldHint(prepared ? '使用鋤頭完成整地，現在可以播種。' : '這格田地目前無法整地。');
      return;
    }
    if (seeds.length > 0) openPanel('seedpicker', cell.id);
    else showWorldHint('背包裡沒有種子，請先到商店購買。');
  };

  const onAnimalClick = (animal) => {
    openPanel('animalcare', animal.id);
  };

  const onShippingClick = () => {
    const products = useStore.getState().inventory.farmProducts || [];
    if (!products.length) {
      showWorldHint('目前沒有可出貨的農產品。');
      return;
    }
    openMath({
      skillContext: 'farm_market',
      onResolve: (correct) => {
        if (!correct) return;
        const shipment = shipAllFarmProducts();
        if (!shipment.ok) return;
        recordShipment(shipment.totalGold);
        showWorldHint(`完成出貨：${shipment.itemCount} 件農產品，共獲得 ${shipment.totalGold}G。`);
      },
    });
  };

  const visibleOrchardTrees = farmLevel >= 2 ? FARM_LAYOUT.orchardTrees : FARM_LAYOUT.orchardTrees.slice(0, 2);

  return (
    <>
      <FarmGround />
      <SurfaceDetailLayer sceneId="farm" layout={FARM_LAYOUT} density={quality.vegetationDensity} weather={weatherType} />
      {FARM_LAYOUT.roads.map((road) => <FarmRoad key={road.id} {...road} />)}
      <FarmFlowerBeds />
      <FarmBoundaryGrove />
      <FarmEntryDecor />
      <FarmScarecrow position={[-3, 0, 4]} />
      <FarmCart position={[22, 0, 21]} rotation={[0, -0.45, 0]} />
      <FarmUpgradeDecor level={farmLevel} />
      <FarmProductionAssetLayer farmLevel={farmLevel} />

      {FARM_LAYOUT.buildings
        .filter((building) => farmLevel >= building.minLevel)
        .map((building) => (
          <FarmBuilding
            key={building.id}
            {...building}
            onClick={building.id === 'farmhouse' ? (event) => {
              event.stopPropagation();
              openPanel('homeInterior');
            } : null}
          />
        ))}
      <HomeYardDecor placed={homeDecorPlaced} />

      <PondBridge position={FARM_LAYOUT.landmarks.find((landmark) => landmark.kind === 'pondBridge').position} />
      <group onClick={(event) => { event.stopPropagation(); onShippingClick(); }}>
        <ShippingYard position={FARM_LAYOUT.landmarks.find((landmark) => landmark.kind === 'shipping').position} />
      </group>

      {FARM_LAYOUT.landmarks
        .filter((landmark) => landmark.model && farmLevel >= landmark.minLevel)
        .map((landmark) => <FarmProp key={landmark.id} {...landmark} />)}

      {visibleOrchardTrees.map((tree) => (
        <FarmProp key={tree.id} model="fruit_tree" position={tree.position} scale={tree.scale} />
      ))}

      <FarmFence center={FARM_LAYOUT.zones.fields.center} size={[14, 13]} gateSide="south" />
      <FarmFence center={FARM_LAYOUT.zones.paddock.center} size={[17, 14]} gateSide="south" />

      {grid.map((cell) => {
        const [x, , z] = cellPosition(cell.row, cell.col);
        const stage = getStage(cell);
        return (
          <group key={cell.id} position={[x, 0, z]}>
            <mesh
              position={[0, 0.03, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(event) => {
                event.stopPropagation();
                onCellClick(cell);
              }}
              receiveShadow
            >
              <planeGeometry args={[FARM_CELL_SIZE * 0.88, FARM_CELL_SIZE * 0.88]} />
              <meshStandardMaterial
                color={!cell.isUnlocked ? '#8c8b73' : !cell.isPrepared ? '#6f8f43' : cell.isWithered ? '#6f5d46' : cell.moisture >= 0.65 ? '#5d3b20' : cell.moisture >= 0.3 ? '#8c5731' : '#a06d43'}
                roughness={1}
              />
            </mesh>
            {stage >= 0 && <Crop cell={cell} stage={stage} />}
          </group>
        );
      })}

      {harvestFx && (
        <Sparkles
          key={harvestFx.key}
          position={[harvestFx.x, 1, harvestFx.z]}
          count={qualityId === 'low' ? 18 : 40}
          scale={2}
          size={6}
          speed={1}
          color={harvestFx.color || "#ffd24a"}
        />
      )}

      {animals.map((animal) => {
        const placement = FARM_LAYOUT.animals[animal.id];
        const routine = resolveAnimalRoutine(animal.type, worldClock, placement.position);
        return (
          <group
            key={animal.id}
            position={routine.position}
            scale={placement.scale}
            onClick={(event) => {
              event.stopPropagation();
              onAnimalClick(animal);
            }}
          >
            <Model assetId={FARM_MODEL_ASSETS[animal.type]} />
            <Html position={[0, 2.2, 0]} center distanceFactor={13}>
              <div className="rounded-lg border border-white/60 bg-[#4a3827]/80 px-2 py-0.5 text-[10px] font-black text-white whitespace-nowrap">
                {animal.name || (animal.type === 'cow' ? '乳牛' : animal.type === 'sheep' ? '綿羊' : '母雞')} · {routine.label} · {animal.mood}
              </div>
            </Html>
          </group>
        );
      })}

      {groundDrops.map((drop) => (
        <group
          key={drop.id}
          position={[drop.x, 0.45, drop.z]}
          onClick={(event) => {
            event.stopPropagation();
            const picked = pickupDrop(drop.id);
            if (picked?.product) addFarmProduct(picked.product);
          }}
        >
          <Outlined color="#ffd24a">
            <dodecahedronGeometry args={[0.28, 0]} />
          </Outlined>
          <Sparkles count={8} scale={1.1} size={3} speed={0.5} color="#fff3a8" />
        </group>
      ))}

      <group position={[-4.5, 0, 8]}>
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[2.8, 1.8, 0.22]} />
          <meshStandardMaterial color="#9a6b3e" roughness={1} />
        </mesh>
        <Html position={[0, 1.3, 0.18]} center distanceFactor={11}>
          <button
            onClick={() => openMath({ skillContext: 'farm_area' })}
            className="rounded-xl border-2 border-white/70 bg-emerald-700/90 px-3 py-2 text-xs font-black text-white shadow-xl whitespace-nowrap"
          >
            📐 農場數學：田地面積
          </button>
        </Html>
      </group>

      <FarmLifeNPCs npcs={FARM_LAYOUT.lifeNpcs} />
      <CompanionHomeActors />
      <CraftingSystem />

      <TeleportGate
        {...FARM_LAYOUT.gates.village}
        portalType="village"
        onActivate={() => goToScene('village')}
      />
      <TeleportGate
        {...FARM_LAYOUT.gates.world}
        portalType="region"
        onActivate={openWorldMap}
      />

    </>
  );
}

function Crop({ cell, stage }) {
  if (stage === CROP_STAGES.WITHERED) {
    return (
      <group position={[0, 0.28, 0]} rotation={[0.18, 0, 0.35]}>
        <mesh castShadow><cylinderGeometry args={[0.045, 0.06, 0.55, 6]} /><meshStandardMaterial color="#7b5a3b" /></mesh>
        <mesh position={[0.12, 0.18, 0]} rotation={[0, 0, 0.8]}><planeGeometry args={[0.28, 0.12]} /><meshStandardMaterial color="#9b7848" side={2} /></mesh>
      </group>
    );
  }
  const assetId = resolveCropModelAssetId(cell.currentSeedId, stage);
  if (!assetId) return null;
  const scale = stage === CROP_STAGES.SEEDED ? .7 : stage === CROP_STAGES.SPROUT ? .82 : stage === CROP_STAGES.GROWING ? .92 : 1;
  return <group scale={scale}><Model assetId={assetId} instanceId={`farm-crop:${cell.id}:${stage}`} /></group>;
}
