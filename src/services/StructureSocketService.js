// 結構 Socket 世界座標服務：Region Interaction、室內入口與 NPC 工作點共用。
import { getRegionStructurePrefab } from '../data/physicalObjectCatalog.js';

export function resolveStructureSocketWorldTransform(layout, structureId, socketId) {
  const structure = layout?.structures?.find((item) => item.id === structureId);
  if (!structure) return null;
  const prefab = getRegionStructurePrefab(structure.type);
  const socket = prefab?.sockets.find((item) => item.id === socketId);
  if (!socket) return null;
  const scale = Number(structure.scale) || 1;
  const rotation = Number(structure.rotation) || 0;
  const localX = socket.position[0] * scale;
  const localZ = socket.position[2] * scale;
  const rotatedX = localX * Math.cos(rotation) + localZ * Math.sin(rotation);
  const rotatedZ = -localX * Math.sin(rotation) + localZ * Math.cos(rotation);
  return {
    structure,
    prefab,
    socket,
    position: [
      structure.position[0] + rotatedX,
      structure.position[1] + socket.position[1] * scale,
      structure.position[2] + rotatedZ,
    ],
    baseY: structure.position[1],
    rotation,
    scale,
  };
}

export function findStructureEntrySocket(layout, structure) {
  const prefab = getRegionStructurePrefab(structure?.type);
  const socket = prefab?.sockets.find((item) => item.id === 'entry')
    || prefab?.sockets.find((item) => item.type === 'interaction')
    || prefab?.sockets.find((item) => item.type === 'path');
  return socket ? resolveStructureSocketWorldTransform(layout, structure.id, socket.id) : null;
}
