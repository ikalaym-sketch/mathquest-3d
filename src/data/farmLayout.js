// 星光農莊唯一正規化空間配置。
// 所有分區、道路、建築、地標、動物與互動座標都集中在此檔案，避免 JSX 散落硬編碼。
export const FARM_LAYOUT = {
  id: 'starlight_farm',
  name: '星光農莊',
  bounds: { minX: -42, maxX: 42, minZ: -38, maxZ: 38 },
  spawn: { x: 0, y: 1.2, z: 27 },
  safeRadius: 8,

  // 農莊分為八個功能區，讓玩家能用地標與道路理解空間。
  zones: {
    home: { id: 'home', label: '玩家農舍', center: [-17, 0, 21], radius: 9 },
    fields: { id: 'fields', label: '作物田區', center: [-10, 0, 2], radius: 12 },
    paddock: { id: 'paddock', label: '動物牧場', center: [15, 0, 4], radius: 11 },
    orchard: { id: 'orchard', label: '果樹園', center: [20, 0, -18], radius: 10 },
    workshop: { id: 'workshop', label: '加工工坊', center: [-22, 0, -16], radius: 9 },
    pond: { id: 'pond', label: '池塘與紅橋', center: [4, 0, 17], radius: 8 },
    windmill: { id: 'windmill', label: '風車高地', center: [1, 0, -25], radius: 9 },
    shipping: { id: 'shipping', label: '出貨廣場', center: [25, 0, 23], radius: 8 },
  },

  // 道路採主要十字動線再分支到各功能區，避免大片無意義空地。
  roads: [
    { id: 'entry_main', from: [0, 0.03, 34], to: [0, 0.03, -27], width: 3.5 },
    { id: 'home_branch', from: [-2, 0.03, 24], to: [-18, 0.03, 21], width: 3.4 },
    { id: 'field_branch', from: [-1, 0.03, 6], to: [-12, 0.03, 2], width: 3.2 },
    { id: 'paddock_branch', from: [2, 0.03, 8], to: [16, 0.03, 4], width: 3.2 },
    { id: 'workshop_branch', from: [-1, 0.03, -13], to: [-22, 0.03, -16], width: 3.2 },
    { id: 'orchard_branch', from: [1, 0.03, -14], to: [20, 0.03, -18], width: 3.2 },
    { id: 'shipping_branch', from: [3, 0.03, 24], to: [25, 0.03, 23], width: 3.2 },
  ],

  // 建築模型依 farmLevel 漸進出現，讓升級產生可見變化。
  buildings: [
    { id: 'farmhouse', model: 'farmhouse', position: [-14, 0, 20], rotation: [0, 0.2, 0], minLevel: 1, scale: 1.05 },
    { id: 'main_barn', model: 'barn', position: [14, 0, 15], rotation: [0, -0.25, 0], minLevel: 1, scale: 0.92 },
    { id: 'farm_windmill', model: 'windmill', position: [0, 0, -27], rotation: [0, 0.2, 0], minLevel: 1, scale: 0.95 },
    { id: 'water_tower', model: 'water_tower', position: [-25, 0, -10], rotation: [0, 0, 0], minLevel: 2, scale: 0.9 },
  ],

  // 地標負責形成前景、中景、遠景，並提供探索與互動節點。
  landmarks: [
    { id: 'pond_bridge', kind: 'pondBridge', position: [3, 0, 18], minLevel: 1 },
    { id: 'mailbox', model: 'mailbox', position: [-11, 0, 25], rotation: [0, -0.2, 0], minLevel: 1, scale: 1 },
    { id: 'hay_01', model: 'hay_bale', position: [18, 0, 10], rotation: [0, 0.3, 0], minLevel: 1, scale: 1.1 },
    { id: 'hay_02', model: 'hay_bale', position: [21, 0, 8], rotation: [0, -0.5, 0], minLevel: 1, scale: 0.9 },
    { id: 'shipping_crates', kind: 'shipping', position: [25, 0, 23], minLevel: 1 },
  ],

  // 果樹園使用正式 GLB 樹木，位置與尺度刻意錯落，避免機械排列。
  orchardTrees: [
    { id: 'fruit_01', position: [15, 0, -15], scale: 0.95 },
    { id: 'fruit_02', position: [21, 0, -14], scale: 1.1 },
    { id: 'fruit_03', position: [26, 0, -18], scale: 0.9 },
    { id: 'fruit_04', position: [17, 0, -22], scale: 1.05 },
    { id: 'fruit_05', position: [23, 0, -24], scale: 1.0 },
  ],

  // 動物配置與 store 資料分離；場景位置由此唯一配置控制。
  animals: {
    cow: { position: [12, 0, 2], scale: 1.05 },
    sheep: { position: [17, 0, 1], scale: 1.0 },
    chicken: { position: [16, 0, 7], scale: 0.95 },
  },

  // 生活 NPC 具備固定巡邏路線，讓農場有工作與生活感。
  lifeNpcs: [
    { id: 'farmer_aya', name: '農場主艾雅', route: [[-12, 0, 24], [-7, 0, 12], [-12, 0, 4]], speed: 0.5 },
    { id: 'helper_tom', name: '助手湯姆', route: [[12, 0, 11], [17, 0, 6], [22, 0, 10]], speed: 0.45 },
    { id: 'orchard_mia', name: '果園米亞', route: [[16, 0, -16], [22, 0, -20], [18, 0, -24]], speed: 0.42 },
  ],

  gates: {
    village: { position: [-30, 0, 29], color: '#68c97c', icon: '🏠', label: '返回星光村' },
    world: { position: [30, 0, 29], color: '#59bde8', icon: '🗺️', label: '世界地圖' },
  },
};

// 農田中心偏左，讓玩家出生後可先看到農舍、池塘、穀倉與風車，再走入耕作區。
export const FARM_FIELD_ORIGIN = [-11, 0, 1];
export const FARM_CELL_SIZE = 1.35;
