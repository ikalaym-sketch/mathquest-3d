// 八區主要結構的室內 Pocket 定義。
// 室內共用單一執行期空間，但家具、色盤與互動依結構類型切換；不複製主地圖 Collider。
import { getRegionStructurePrefab } from './physicalObjectCatalog.js';
import { findStructureEntrySocket } from '../services/StructureSocketService.js';
import { findNearestWalkablePoint } from '../services/TraversalSurfaceService.js';

const template = (label, palette, furnitureTheme, interactions) => ({ label, palette, furnitureTheme, interactions });

export const REGION_INTERIOR_TEMPLATES = Object.freeze({
  windmill_station: template('風車站內部', ['#f5e9ca', '#77b9d8', '#725943'], 'workshop', ['workbench', 'storyShelf', 'rest']),
  cloud_observatory: template('雲端觀測室', ['#edf7ff', '#69b9df', '#536678'], 'observatory', ['telescope', 'storyShelf', 'lessonBoard']),
  aurora_shrine: template('極光神殿內殿', ['#e8f8ff', '#7bdce1', '#707bd0'], 'shrine', ['altar', 'storyShelf', 'rest']),
  orchard_barn: template('果園穀倉', ['#f3d6aa', '#c75e45', '#6d4d36'], 'barn', ['workbench', 'storage', 'rest']),
  beekeeper_pavilion: template('養蜂工作亭', ['#fff0b7', '#efb34b', '#7b5836'], 'apiary', ['workbench', 'storyShelf', 'storage']),
  crystal_dock: template('水晶碼頭站', ['#d8f5ef', '#56ced7', '#527b76'], 'dock', ['mapTable', 'storyShelf', 'rest']),
  prism_sanctuary: template('稜鏡聖所', ['#e2f8f5', '#52c8cf', '#716fc4'], 'sanctuary', ['altar', 'lessonBoard', 'storyShelf']),
  canyon_forge: template('峽谷鍛造場', ['#d9a176', '#e89c46', '#5c4439'], 'forge', ['workbench', 'forge', 'rest']),
  rope_bridge_station: template('繩橋管理站', ['#ebc184', '#dc7941', '#705039'], 'station', ['mapTable', 'workbench', 'storyShelf']),
  mushroom_house: template('巨菇屋', ['#f3e5d1', '#df69ae', '#704d61'], 'home', ['rest', 'storyShelf', 'workbench']),
  glow_pavilion: template('螢光亭內環', ['#e8dbef', '#9c68d4', '#51415c'], 'pavilion', ['altar', 'storyShelf', 'lessonBoard']),
  gear_workshop: template('齒輪工坊', ['#a9b7a4', '#d59a48', '#4e5250'], 'mechanical', ['workbench', 'gearConsole', 'storyShelf']),
  clock_core: template('時鐘核心控制室', ['#b7c2b6', '#d99a43', '#48534e'], 'clock', ['gearConsole', 'lessonBoard', 'storyShelf']),
  star_learning_hall: template('星光學習館', ['#f4e8c9', '#efbd4f', '#6d70c5'], 'classroom', ['lessonBoard', 'storyShelf', 'rest']),
  adventure_lodge: template('冒險旅舍', ['#e0b477', '#efd19e', '#65483a'], 'lodge', ['rest', 'mapTable', 'storyShelf']),
});

const FURNITURE_LAYOUT = Object.freeze([
  { id: 'table-main', kind: 'table', position: [0, 0.75, -0.4], size: [2.4, 0.18, 1.2], solid: true },
  { id: 'seat-left', kind: 'seat', position: [-1.45, 0.45, -0.4], size: [0.7, 0.8, 0.7], solid: true },
  { id: 'seat-right', kind: 'seat', position: [1.45, 0.45, -0.4], size: [0.7, 0.8, 0.7], solid: true },
  { id: 'shelf-a', kind: 'shelf', position: [-4.7, 1.25, -2.8], size: [0.65, 2.5, 2.2], solid: true },
  { id: 'shelf-b', kind: 'shelf', position: [4.7, 1.25, -2.8], size: [0.65, 2.5, 2.2], solid: true },
  { id: 'cabinet', kind: 'cabinet', position: [-4.5, 0.85, 2.2], size: [1.0, 1.7, 1.4], solid: true },
  { id: 'workbench', kind: 'workbench', position: [4.25, 0.8, 2.2], size: [2.0, 1.0, 1.0], solid: true },
  { id: 'rug', kind: 'rug', position: [0, 0.035, 1.4], size: [4.2, 0.05, 2.4], solid: false },
  { id: 'lamp-left', kind: 'lamp', position: [-3.3, 1.1, 0.5], size: [0.3, 2.2, 0.3], solid: true },
  { id: 'lamp-right', kind: 'lamp', position: [3.3, 1.1, 0.5], size: [0.3, 2.2, 0.3], solid: true },
  { id: 'story-display', kind: 'display', position: [0, 1.15, -4.65], size: [2.8, 2.0, 0.5], solid: true },
  { id: 'storage-box', kind: 'box', position: [-2.8, 0.42, 3.7], size: [1.2, 0.8, 1.0], solid: true },
]);

const INTERACTION_POSITION = Object.freeze({
  rest: [-3.2, 0.1, 3.2],
  storyShelf: [0, 0.1, -3.8],
  workbench: [3.4, 0.1, 2.2],
  telescope: [3.7, 0.1, -3.0],
  lessonBoard: [0, 0.1, -3.8],
  altar: [0, 0.1, -1.7],
  storage: [-3.7, 0.1, 2.2],
  mapTable: [0, 0.1, -0.4],
  forge: [3.4, 0.1, 2.2],
  gearConsole: [3.4, 0.1, 2.2],
});

const INTERACTION_LABELS = Object.freeze({
  rest: ['🛏️', '休息到早晨'],
  storyShelf: ['📚', '閱讀區域故事'],
  workbench: ['🛠️', '查看工作設備'],
  telescope: ['🔭', '觀測天空'],
  lessonBoard: ['📐', '進行場景學習'],
  altar: ['✨', '查看古老記錄'],
  storage: ['📦', '檢查儲藏物'],
  mapTable: ['🗺️', '查看旅行地圖'],
  forge: ['🔥', '觀察鍛造流程'],
  gearConsole: ['⚙️', '操作控制台'],
});

export function buildRegionInteriorDescriptor(layout, structure) {
  const interiorTemplate = REGION_INTERIOR_TEMPLATES[structure?.type];
  const prefab = getRegionStructurePrefab(structure?.type);
  const entry = findStructureEntrySocket(layout, structure);
  if (!layout || !structure || !interiorTemplate || !prefab || !entry) return null;

  const rotation = Number(structure.rotation) || 0;
  const outsideDistance = 2.3;
  const outsideX = entry.position[0] + Math.sin(rotation) * outsideDistance;
  const outsideZ = entry.position[2] + Math.cos(rotation) * outsideDistance;
  const safeReturn = findNearestWalkablePoint(layout, outsideX, outsideZ, 9, 0.9);
  const center = { x: 0, y: 42, z: 0 };
  const interactionItems = interiorTemplate.interactions.map((kind, index) => ({
    id: `${structure.id}-${kind}`,
    kind,
    icon: INTERACTION_LABELS[kind]?.[0] || '🔎',
    label: INTERACTION_LABELS[kind]?.[1] || '互動',
    position: INTERACTION_POSITION[kind] || [index * 1.8 - 1.8, 0.1, 0],
  }));

  return {
    id: `${layout.id}:${structure.id}`,
    regionId: layout.id,
    structureId: structure.id,
    structureType: structure.type,
    label: interiorTemplate.label,
    sourceLabel: prefab.label,
    palette: interiorTemplate.palette,
    furnitureTheme: interiorTemplate.furnitureTheme,
    center,
    spawn: { x: center.x, y: center.y + 1.15, z: center.z + 4.1 },
    returnPosition: { x: safeReturn.x, y: safeReturn.y + 0.95, z: safeReturn.z },
    bounds: { minX: -6.55, maxX: 6.55, minZ: -5.65, maxZ: 5.65, warning: 0.65, safeY: center.y - 4 },
    furniture: FURNITURE_LAYOUT,
    interactions: interactionItems,
  };
}

export function getEnterableRegionStructures(layout) {
  return (layout?.structures || [])
    .map((structure) => ({ structure, interior: buildRegionInteriorDescriptor(layout, structure) }))
    .filter((entry) => entry.interior);
}
