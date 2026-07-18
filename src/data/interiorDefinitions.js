// 建築室內 Canonical 定義。每個家具都有 footprint、互動用途與碰撞高度。
const TEMPLATE_BY_KIND = {
  shop: [
    { key: 'counter', type: 'counter', position: [0, 0, -1.7], size: [3.6, 1.05, 0.75], color: '#9a673f' },
    { key: 'shelf_left', type: 'shelf', position: [-2.15, 0, -0.2], size: [0.55, 2.2, 2.5], color: '#825638' },
    { key: 'display', type: 'display', position: [1.75, 0, 0.2], size: [1.6, 0.85, 1.2], color: '#c99d61' },
  ],
  forge: [
    { key: 'anvil', type: 'anvil', position: [-1.45, 0, -1.2], size: [1.35, 1.0, 0.7], color: '#4d5663' },
    { key: 'furnace', type: 'furnace', position: [1.7, 0, -1.4], size: [1.35, 2.1, 1.25], color: '#704532' },
    { key: 'rack', type: 'rack', position: [2.15, 0, 0.8], size: [0.5, 2.1, 1.6], color: '#7e5738' },
  ],
  workshop: [
    { key: 'workbench', type: 'workbench', position: [0, 0, -1.55], size: [3.4, 1.0, 0.8], color: '#9a6c42' },
    { key: 'tool_rack', type: 'rack', position: [-2.1, 0, 0.35], size: [0.5, 2.0, 1.8], color: '#765034' },
    { key: 'materials', type: 'crate', position: [1.8, 0, 0.6], size: [1.25, 1.0, 1.15], color: '#af7d48' },
  ],
  learning: [
    { key: 'teacher_desk', type: 'desk', position: [0, 0, -1.7], size: [2.7, 0.95, 0.8], color: '#9c7047' },
    { key: 'bookcase_left', type: 'bookcase', position: [-2.15, 0, 0], size: [0.55, 2.25, 2.2], color: '#76513a' },
    { key: 'study_table', type: 'table', position: [1.15, 0, 0.45], size: [2.0, 0.82, 1.4], color: '#c4975a' },
  ],
  home: [
    { key: 'bed', type: 'bed', position: [-1.45, 0, -1.2], size: [1.8, 0.72, 2.25], color: '#d5a66d' },
    { key: 'table', type: 'table', position: [1.45, 0, -0.85], size: [1.5, 0.82, 1.2], color: '#9f7147' },
    { key: 'wardrobe', type: 'wardrobe', position: [2.05, 0, 0.9], size: [0.8, 2.1, 1.35], color: '#805738' },
  ],
};

const FARM_TEMPLATE = {
  farmhouse: [
    { key: 'farm_bed', type: 'bed', position: [-1.55, 0, -1.0], size: [1.8, 0.72, 2.2], color: '#d3a36a' },
    { key: 'farm_table', type: 'table', position: [1.15, 0, -0.4], size: [1.7, 0.82, 1.25], color: '#9d7046' },
    { key: 'farm_storage', type: 'wardrobe', position: [2.05, 0, 1.0], size: [0.8, 2.0, 1.2], color: '#7e5638' },
  ],
  barn: [
    { key: 'feed_bin', type: 'bin', position: [-1.8, 0, -1.2], size: [1.4, 0.85, 1.0], color: '#a77743' },
    { key: 'hay_stack', type: 'hay', position: [1.5, 0, -1.1], size: [1.8, 1.4, 1.45], color: '#d7b64f' },
    { key: 'tool_wall', type: 'rack', position: [2.25, 0, 0.9], size: [0.45, 2.0, 1.6], color: '#7c5538' },
  ],
};

export function createVillageInterior(building) {
  const furniture = TEMPLATE_BY_KIND[building.kind] || TEMPLATE_BY_KIND.home;
  return {
    id: `interior_${building.id}`,
    buildingId: building.id,
    sceneId: 'village',
    center: building.position,
    rotationY: building.rotation?.[1] || 0,
    size: building.interiorSize || [5.25, 4.45],
    entranceLocal: [0, 2.7],
    entranceClearance: [1.8, 1.8],
    furniture: furniture.map((item) => ({ ...item, id: `${building.id}_${item.key}` })),
  };
}

export function createFarmInterior(building) {
  if (!['farmhouse', 'barn'].includes(building.model)) return null;
  const size = building.model === 'barn' ? [6.4, 5.2] : [5.5, 4.6];
  return {
    id: `interior_${building.id}`,
    buildingId: building.id,
    sceneId: 'farm',
    center: building.position,
    rotationY: building.rotation?.[1] || 0,
    size,
    entranceLocal: [0, size[1] / 2 + 0.35],
    entranceClearance: [2.2, 2.0],
    furniture: (FARM_TEMPLATE[building.model] || []).map((item) => ({ ...item, id: `${building.id}_${item.key}` })),
  };
}
