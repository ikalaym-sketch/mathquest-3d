// 區域正式生產用多元件物件目錄。
// 每個 Prefab 都拆成 Visual Parts、Physical Colliders 與 Interaction Sockets；
// 目的不是把所有細節都交給單一 GLB，而是讓結構、碰撞與互動保持可驗證。

const box = (id, position, scale, colorSlot, rotation = [0, 0, 0]) => ({ id, shape: 'box', position, scale, colorSlot, rotation });
const cylinder = (id, position, args, colorSlot, rotation = [0, 0, 0]) => ({ id, shape: 'cylinder', position, args, colorSlot, rotation });
const cone = (id, position, args, colorSlot, rotation = [0, 0, 0]) => ({ id, shape: 'cone', position, args, colorSlot, rotation });
const sphere = (id, position, args, colorSlot, scale = [1, 1, 1]) => ({ id, shape: 'sphere', position, args, colorSlot, scale });
const torus = (id, position, args, colorSlot, rotation = [0, 0, 0]) => ({ id, shape: 'torus', position, args, colorSlot, rotation });
const octa = (id, position, args, colorSlot, rotation = [0, 0, 0]) => ({ id, shape: 'octahedron', position, args, colorSlot, rotation });

const cuboid = (id, position, halfExtents, rotation = [0, 0, 0], role = 'solid') => ({ id, shape: 'cuboid', position, halfExtents, rotation, role });
const cylinderCollider = (id, position, halfHeight, radius, rotation = [0, 0, 0], role = 'solid') => ({ id, shape: 'cylinder', position, halfHeight, radius, rotation, role });
const ballCollider = (id, position, radius, role = 'solid') => ({ id, shape: 'ball', position, radius, role });

export const REGION_STRUCTURE_CATALOG = {
  windmill_station: {
    label: 'Windmill Station',
    footprint: [7, 7],
    palette: { base: '#f0dfbb', trim: '#76b9df', roof: '#6aa2c8', dark: '#6f604e', glow: '#fff2b0' },
    parts: [
      cylinder('foundation', [0, 0.45, 0], [2.35, 2.55, 0.9, 10], 'dark'),
      cylinder('tower', [0, 3.0, 0], [1.45, 1.9, 5.2, 10], 'base'),
      cone('roof', [0, 6.1, 0], [2.05, 1.8, 8], 'roof'),
      cylinder('hub', [0, 4.2, 1.55], [0.38, 0.38, 0.42, 12], 'trim', [Math.PI / 2, 0, 0]),
      ...[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, index) => box(`blade_${index}`, [Math.sin(angle) * 1.55, 4.2 + Math.cos(angle) * 1.55, 1.72], [0.32, 3.0, 0.16], 'glow', [0, 0, -angle])),
      box('door_frame', [0, 1.25, 1.72], [1.1, 2.1, 0.22], 'trim'),
      box('door', [0, 1.2, 1.86], [0.78, 1.7, 0.12], 'dark'),
      box('balcony', [0, 3.25, 1.55], [3.0, 0.18, 1.1], 'dark'),
    ],
    colliders: [
      cylinderCollider('foundation_collider', [0, 0.45, 0], 0.45, 2.45),
      cylinderCollider('tower_collider', [0, 3.0, 0], 2.6, 1.6),
      cuboid('balcony_collider', [0, 3.25, 1.55], [1.5, 0.09, 0.55]),
    ],
    sockets: [{ id: 'entry', position: [0, 0, 2.7], type: 'interaction' }, { id: 'blade_hub', position: [0, 4.2, 1.75], type: 'motion' }],
  },
  cloud_observatory: {
    label: 'Cloud Observatory', footprint: [8, 8],
    palette: { base: '#edf6ff', trim: '#7cc4e8', roof: '#4f8eb4', dark: '#536273', glow: '#fff5b7' },
    parts: [
      cylinder('platform', [0, 0.4, 0], [3.7, 4.0, 0.8, 12], 'dark'),
      cylinder('main_tower', [0, 2.6, 0], [1.8, 2.2, 4.4, 12], 'base'),
      sphere('dome', [0, 5.15, 0], [2.05, 18, 12], 'trim', [1, 0.65, 1]),
      cylinder('telescope_base', [0.9, 5.65, 0], [0.3, 0.45, 1.2, 10], 'dark', [0, 0, Math.PI / 2]),
      cylinder('telescope_tube', [1.8, 6.15, 0], [0.34, 0.46, 2.6, 12], 'roof', [0, 0, Math.PI / 2.7]),
      box('door_frame', [0, 1.35, 2.15], [1.3, 2.4, 0.24], 'trim'),
      box('door', [0, 1.3, 2.3], [0.9, 1.95, 0.12], 'dark'),
      ...[-1, 1].map((x) => box(`side_window_${x}`, [x * 1.72, 2.7, 0], [0.18, 1.0, 1.1], 'glow')),
    ],
    colliders: [cylinderCollider('platform_collider', [0, 0.4, 0], 0.4, 3.8), cylinderCollider('tower_collider', [0, 2.6, 0], 2.2, 2.0)],
    sockets: [{ id: 'entry', position: [0, 0, 3.15], type: 'interaction' }, { id: 'telescope', position: [2.5, 6.25, 0], type: 'interaction' }],
  },
  aurora_shrine: {
    label: 'Aurora Shrine', footprint: [8, 7],
    palette: { base: '#e7f7ff', trim: '#79d6df', roof: '#6d7ed2', dark: '#7693a5', glow: '#d8fffb' },
    parts: [
      box('foundation', [0, 0.45, 0], [6.8, 0.9, 5.8], 'dark'),
      ...[-2.2, 0, 2.2].map((x) => cylinder(`pillar_${x}`, [x, 2.25, -1.2], [0.38, 0.52, 3.6, 8], 'base')),
      box('crossbeam', [0, 4.15, -1.2], [6.4, 0.55, 0.65], 'trim'),
      box('roof_left', [-1.7, 4.75, -1.2], [3.8, 0.35, 3.8], 'roof', [0, 0, -0.16]),
      box('roof_right', [1.7, 4.75, -1.2], [3.8, 0.35, 3.8], 'roof', [0, 0, 0.16]),
      octa('aurora_crystal', [0, 2.35, 1.0], [1.3, 0], 'glow'),
      ...[-2.2, 2.2].map((x) => octa(`side_crystal_${x}`, [x, 1.35, 1.15], [0.75, 0], 'trim')),
    ],
    colliders: [cuboid('foundation_collider', [0, 0.45, 0], [3.4, 0.45, 2.9]), ...[-2.2, 0, 2.2].map((x) => cylinderCollider(`pillar_collider_${x}`, [x, 2.25, -1.2], 1.8, 0.46))],
    sockets: [{ id: 'altar', position: [0, 1.0, 1.7], type: 'interaction' }],
  },
  orchard_barn: {
    label: 'Orchard Barn', footprint: [9, 8],
    palette: { base: '#c95e44', trim: '#f2d6a2', roof: '#7e3e32', dark: '#76533a', glow: '#ffd58a' },
    parts: [
      box('foundation', [0, 0.35, 0], [8.2, 0.7, 6.8], 'dark'),
      box('left_wall', [-3.65, 2.35, 0], [0.45, 4.0, 6.4], 'base'),
      box('right_wall', [3.65, 2.35, 0], [0.45, 4.0, 6.4], 'base'),
      box('back_wall', [0, 2.35, -3.0], [7.0, 4.0, 0.45], 'base'),
      box('front_left', [-2.45, 2.35, 3.0], [2.3, 4.0, 0.45], 'base'),
      box('front_right', [2.45, 2.35, 3.0], [2.3, 4.0, 0.45], 'base'),
      box('roof_left', [-2.0, 4.9, 0], [4.5, 0.45, 7.2], 'roof', [0, 0, -0.42]),
      box('roof_right', [2.0, 4.9, 0], [4.5, 0.45, 7.2], 'roof', [0, 0, 0.42]),
      box('door_left', [-0.9, 1.8, 3.25], [1.7, 3.4, 0.16], 'trim'),
      box('door_right', [0.9, 1.8, 3.25], [1.7, 3.4, 0.16], 'trim'),
      box('hay_loft', [0, 3.0, -0.4], [4.5, 0.25, 2.2], 'dark'),
    ],
    colliders: [
      cuboid('foundation_collider', [0, 0.35, 0], [4.1, 0.35, 3.4]),
      cuboid('left_wall_collider', [-3.65, 2.35, 0], [0.225, 2.0, 3.2]),
      cuboid('right_wall_collider', [3.65, 2.35, 0], [0.225, 2.0, 3.2]),
      cuboid('back_wall_collider', [0, 2.35, -3.0], [3.5, 2.0, 0.225]),
      cuboid('front_left_collider', [-2.45, 2.35, 3.0], [1.15, 2.0, 0.225]),
      cuboid('front_right_collider', [2.45, 2.35, 3.0], [1.15, 2.0, 0.225]),
    ],
    sockets: [{ id: 'entry', position: [0, 0, 4.0], type: 'interaction' }, { id: 'loft', position: [0, 3.25, -0.4], type: 'storage' }],
  },
  beekeeper_pavilion: {
    label: 'Beekeeper Pavilion', footprint: [7, 7],
    palette: { base: '#fff0b5', trim: '#efb64c', roof: '#d77b3d', dark: '#7f5b37', glow: '#fff6c6' },
    parts: [
      box('deck', [0, 0.35, 0], [6.4, 0.7, 5.8], 'dark'),
      ...[[-2.4, -2], [2.4, -2], [-2.4, 2], [2.4, 2]].map(([x, z], i) => cylinder(`post_${i}`, [x, 2.15, z], [0.22, 0.28, 3.6, 8], 'trim')),
      cone('roof', [0, 4.6, 0], [4.2, 1.8, 6], 'roof'),
      ...[-1.8, 0, 1.8].map((x) => box(`hive_${x}`, [x, 1.0, 0.8], [1.2, 1.4, 1.0], 'base')),
      ...[-1.8, 0, 1.8].map((x) => box(`hive_lid_${x}`, [x, 1.8, 0.8], [1.35, 0.18, 1.15], 'roof')),
      torus('honey_sign', [0, 2.4, -2.15], [0.65, 0.16, 8, 20], 'glow', [Math.PI / 2, 0, 0]),
    ],
    colliders: [cuboid('deck_collider', [0, 0.35, 0], [3.2, 0.35, 2.9]), ...[-1.8, 0, 1.8].map((x) => cuboid(`hive_collider_${x}`, [x, 1.0, 0.8], [0.6, 0.7, 0.5]))],
    sockets: [{ id: 'honey_counter', position: [0, 1.0, -2.1], type: 'interaction' }],
  },
  crystal_dock: {
    label: 'Crystal Dock', footprint: [10, 7],
    palette: { base: '#b9eadf', trim: '#52cddd', roof: '#3b91a4', dark: '#597d76', glow: '#d8ffff' },
    parts: [
      box('dock_deck', [0, 0.45, 0], [9.0, 0.55, 3.6], 'dark'),
      ...[-4, -2, 0, 2, 4].flatMap((x, xi) => [-1.4, 1.4].map((z, zi) => cylinder(`pile_${xi}_${zi}`, [x, -0.35, z], [0.18, 0.22, 1.6, 8], 'base'))),
      ...[-3.2, 0, 3.2].map((x) => octa(`crystal_${x}`, [x, 1.35, -0.9], [0.7, 0], 'glow')),
      box('canopy_top', [0, 3.25, 0], [5.2, 0.3, 3.0], 'roof'),
      ...[-2.2, 2.2].flatMap((x, xi) => [-1, 1].map((z, zi) => cylinder(`canopy_post_${xi}_${zi}`, [x, 1.8, z], [0.12, 0.16, 2.8, 8], 'trim'))),
    ],
    colliders: [cuboid('dock_collider', [0, 0.45, 0], [4.5, 0.275, 1.8]), ...[-2.2, 2.2].flatMap((x, xi) => [-1, 1].map((z, zi) => cylinderCollider(`post_collider_${xi}_${zi}`, [x, 1.8, z], 1.4, 0.16)))],
    sockets: [{ id: 'fishing', position: [0, 0.85, 2.2], type: 'interaction' }, { id: 'boat', position: [4.8, 0, 0], type: 'vehicle' }],
  },
  prism_sanctuary: {
    label: 'Prism Sanctuary', footprint: [9, 9],
    palette: { base: '#dff7f4', trim: '#4ec9cf', roof: '#7776c7', dark: '#577379', glow: '#d7ffff' },
    parts: [
      cylinder('base', [0, 0.45, 0], [4.2, 4.5, 0.9, 12], 'dark'),
      ...Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return cylinder(`pillar_${i}`, [Math.cos(angle) * 3.0, 2.2, Math.sin(angle) * 3.0], [0.28, 0.38, 3.7, 8], 'base');
      }),
      torus('upper_ring', [0, 4.2, 0], [3.1, 0.28, 10, 32], 'trim', [Math.PI / 2, 0, 0]),
      octa('core', [0, 2.7, 0], [1.7, 0], 'glow'),
      ...Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return octa(`satellite_${i}`, [Math.cos(angle) * 2.0, 2.1, Math.sin(angle) * 2.0], [0.55, 0], 'roof');
      }),
    ],
    colliders: [cylinderCollider('base_collider', [0, 0.45, 0], 0.45, 4.3), ...Array.from({ length: 6 }).map((_, i) => { const angle = (i / 6) * Math.PI * 2; return cylinderCollider(`pillar_collider_${i}`, [Math.cos(angle) * 3.0, 2.2, Math.sin(angle) * 3.0], 1.85, 0.33); })],
    sockets: [{ id: 'core_interaction', position: [0, 1.0, 0], type: 'interaction' }],
  },
  canyon_forge: {
    label: 'Canyon Forge', footprint: [10, 8],
    palette: { base: '#b36a45', trim: '#e6a24c', roof: '#774133', dark: '#5d453b', glow: '#ffb13c' },
    parts: [
      box('foundation', [0, 0.45, 0], [9.2, 0.9, 7.0], 'dark'),
      box('main_hall', [-1.0, 2.35, 0], [5.8, 3.8, 5.8], 'base'),
      box('roof', [-1.0, 4.75, 0], [6.3, 0.55, 6.4], 'roof', [0, 0, 0.14]),
      cylinder('chimney', [-2.7, 5.2, -1.7], [0.48, 0.65, 3.8, 10], 'dark'),
      cylinder('furnace', [2.6, 1.7, 0.2], [1.2, 1.45, 3.0, 12], 'trim'),
      sphere('furnace_glow', [2.6, 1.5, 1.3], [0.65, 12, 10], 'glow', [1, 0.65, 0.35]),
      box('anvil_base', [1.1, 0.85, -2.3], [1.6, 1.0, 1.3], 'dark'),
      box('anvil_top', [1.1, 1.55, -2.3], [2.4, 0.45, 1.0], 'trim'),
      box('door', [-1.0, 1.3, 3.0], [1.2, 2.2, 0.15], 'dark'),
    ],
    colliders: [cuboid('foundation_collider', [0, 0.45, 0], [4.6, 0.45, 3.5]), cuboid('hall_collider', [-1.0, 2.35, 0], [2.9, 1.9, 2.9]), cylinderCollider('furnace_collider', [2.6, 1.7, 0.2], 1.5, 1.3), cuboid('anvil_collider', [1.1, 1.2, -2.3], [1.2, 0.7, 0.65])],
    sockets: [{ id: 'forge', position: [2.6, 1.0, 1.8], type: 'interaction' }, { id: 'anvil', position: [1.1, 1.0, -1.3], type: 'interaction' }],
  },
  rope_bridge_station: {
    label: 'Rope Bridge Station', footprint: [8, 7],
    palette: { base: '#e4b875', trim: '#d8733e', roof: '#854738', dark: '#70503a', glow: '#ffd27a' },
    parts: [
      box('platform', [0, 0.35, 0], [7.0, 0.7, 5.6], 'dark'),
      ...[-2.6, 2.6].flatMap((x, xi) => [-1.8, 1.8].map((z, zi) => cylinder(`tower_${xi}_${zi}`, [x, 2.3, z], [0.28, 0.38, 4.0, 8], 'base'))),
      ...[-1.8, 1.8].map((z) => box(`crossbeam_${z}`, [0, 4.25, z], [6.4, 0.35, 0.45], 'trim')),
      ...[-2.4, -1.2, 0, 1.2, 2.4].map((x) => box(`plank_${x}`, [x, 0.75, 2.8], [0.95, 0.18, 1.9], 'base')),
      box('canopy', [0, 5.0, 0], [5.6, 0.35, 4.4], 'roof'),
    ],
    colliders: [cuboid('platform_collider', [0, 0.35, 0], [3.5, 0.35, 2.8]), ...[-2.6, 2.6].flatMap((x, xi) => [-1.8, 1.8].map((z, zi) => cylinderCollider(`tower_collider_${xi}_${zi}`, [x, 2.3, z], 2.0, 0.34)))],
    sockets: [{ id: 'bridge_entry', position: [0, 0.85, 3.6], type: 'path' }],
  },
  mushroom_house: {
    label: 'Mushroom House', footprint: [7, 7],
    palette: { base: '#f4e5cf', trim: '#e968b5', roof: '#bb4b96', dark: '#735063', glow: '#ffe7fb' },
    parts: [
      cylinder('stem_house', [0, 2.2, 0], [1.65, 2.15, 4.2, 12], 'base'),
      sphere('cap', [0, 5.05, 0], [3.15, 18, 12], 'roof', [1, 0.55, 1]),
      ...[[-1.7, 0.1], [0.8, -1.5], [1.6, 1.0]].map(([x, z], i) => sphere(`cap_spot_${i}`, [x, 5.25, z], [0.5, 10, 8], 'glow', [1, 0.3, 1])),
      box('door_frame', [0, 1.35, 2.0], [1.3, 2.3, 0.25], 'trim'),
      box('door', [0, 1.28, 2.18], [0.9, 1.9, 0.12], 'dark'),
      ...[-1, 1].map((x) => sphere(`window_${x}`, [x * 1.55, 2.5, 0.7], [0.38, 10, 8], 'glow', [0.35, 1, 1])),
      box('porch', [0, 0.35, 2.7], [3.4, 0.35, 1.8], 'dark'),
    ],
    colliders: [cylinderCollider('house_collider', [0, 2.2, 0], 2.1, 1.9), cuboid('porch_collider', [0, 0.35, 2.7], [1.7, 0.175, 0.9])],
    sockets: [{ id: 'entry', position: [0, 0, 3.6], type: 'interaction' }],
  },
  glow_pavilion: {
    label: 'Glow Pavilion', footprint: [8, 8],
    palette: { base: '#e6d9ef', trim: '#9b68d4', roof: '#5b397f', dark: '#51415c', glow: '#baffef' },
    parts: [
      cylinder('base', [0, 0.35, 0], [3.6, 3.9, 0.7, 12], 'dark'),
      ...Array.from({ length: 6 }).map((_, i) => { const a = (i / 6) * Math.PI * 2; return cylinder(`pillar_${i}`, [Math.cos(a) * 2.8, 2.2, Math.sin(a) * 2.8], [0.16, 0.22, 3.7, 8], 'trim'); }),
      cone('roof', [0, 4.75, 0], [4.1, 1.6, 8], 'roof'),
      sphere('glow_orb', [0, 2.6, 0], [1.0, 16, 12], 'glow'),
      ...Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2; return sphere(`spore_${i}`, [Math.cos(a) * 2.0, 1.5 + (i % 2) * 0.5, Math.sin(a) * 2.0], [0.18, 8, 8], i % 2 ? 'trim' : 'glow'); }),
    ],
    colliders: [cylinderCollider('base_collider', [0, 0.35, 0], 0.35, 3.7), ...Array.from({ length: 6 }).map((_, i) => { const a = (i / 6) * Math.PI * 2; return cylinderCollider(`pillar_collider_${i}`, [Math.cos(a) * 2.8, 2.2, Math.sin(a) * 2.8], 1.85, 0.2); })],
    sockets: [{ id: 'glow_orb', position: [0, 1.2, 0], type: 'interaction' }],
  },
  gear_workshop: {
    label: 'Gear Workshop', footprint: [10, 9],
    palette: { base: '#9cae9a', trim: '#d49a48', roof: '#665a4a', dark: '#4d5150', glow: '#ffd37b' },
    parts: [
      box('foundation', [0, 0.45, 0], [9.2, 0.9, 7.8], 'dark'),
      box('main_hall', [-1.0, 2.45, 0], [6.4, 4.0, 6.4], 'base'),
      box('roof', [-1.0, 4.9, 0], [6.8, 0.6, 6.8], 'roof'),
      torus('gear_large', [2.8, 3.0, 0], [1.65, 0.35, 10, 20], 'trim', [0, Math.PI / 2, 0]),
      ...Array.from({ length: 10 }).map((_, i) => { const a = (i / 10) * Math.PI * 2; return box(`tooth_${i}`, [2.8, 3.0 + Math.sin(a) * 2.0, Math.cos(a) * 2.0], [0.45, 0.42, 0.45], 'trim', [a, 0, 0]); }),
      cylinder('steam_pipe', [-3.2, 4.8, -1.8], [0.32, 0.42, 4.2, 10], 'dark'),
      box('door', [-1.0, 1.35, 3.3], [1.25, 2.3, 0.16], 'dark'),
      sphere('core_lamp', [0.7, 2.7, 3.25], [0.38, 10, 8], 'glow'),
    ],
    colliders: [cuboid('foundation_collider', [0, 0.45, 0], [4.6, 0.45, 3.9]), cuboid('hall_collider', [-1.0, 2.45, 0], [3.2, 2.0, 3.2]), cylinderCollider('gear_collider', [2.8, 3.0, 0], 1.7, 1.9, [0, Math.PI / 2, 0])],
    sockets: [{ id: 'entry', position: [-1.0, 0, 4.2], type: 'interaction' }, { id: 'gear_console', position: [2.8, 1.0, 2.4], type: 'interaction' }],
  },
  clock_core: {
    label: 'Clock Core', footprint: [9, 9],
    palette: { base: '#aeb9ad', trim: '#d99742', roof: '#626f68', dark: '#4a5550', glow: '#fff0a7' },
    parts: [
      cylinder('base', [0, 0.55, 0], [4.1, 4.5, 1.1, 12], 'dark'),
      cylinder('tower', [0, 3.1, 0], [2.3, 2.8, 5.2, 12], 'base'),
      torus('clock_ring', [0, 3.7, 2.4], [1.45, 0.22, 10, 28], 'trim'),
      cylinder('clock_face', [0, 3.7, 2.48], [1.2, 1.2, 0.16, 20], 'glow', [Math.PI / 2, 0, 0]),
      box('hour_hand', [0, 3.95, 2.62], [0.14, 0.9, 0.1], 'dark', [0, 0, -0.35]),
      box('minute_hand', [0.3, 3.7, 2.64], [1.0, 0.12, 0.1], 'dark', [0, 0, 0.25]),
      cone('spire', [0, 6.75, 0], [1.8, 2.1, 8], 'roof'),
      ...[-1, 1].map((x) => box(`door_side_${x}`, [x * 0.85, 1.25, 2.6], [0.65, 2.0, 0.16], 'trim')),
    ],
    colliders: [cylinderCollider('base_collider', [0, 0.55, 0], 0.55, 4.2), cylinderCollider('tower_collider', [0, 3.1, 0], 2.6, 2.5)],
    sockets: [{ id: 'clock_console', position: [0, 0.8, 3.2], type: 'interaction' }, { id: 'clock_face', position: [0, 3.7, 3.0], type: 'visual' }],
  },
  star_learning_hall: {
    label: 'Star Learning Hall', footprint: [10, 8],
    palette: { base: '#f5e8c8', trim: '#f0bd4f', roof: '#6f72c8', dark: '#735b4a', glow: '#fff3a6' },
    parts: [
      box('foundation', [0, 0.4, 0], [9.0, 0.8, 7.0], 'dark'),
      box('main_hall', [0, 2.3, 0], [7.8, 3.8, 6.0], 'base'),
      box('roof_left', [-2.1, 4.75, 0], [4.6, 0.45, 6.8], 'roof', [0, 0, -0.35]),
      box('roof_right', [2.1, 4.75, 0], [4.6, 0.45, 6.8], 'roof', [0, 0, 0.35]),
      octa('star_emblem', [0, 5.7, 2.2], [0.8, 0], 'glow', [0, 0, Math.PI / 4]),
      box('door_frame', [0, 1.35, 3.15], [1.5, 2.4, 0.25], 'trim'),
      box('door', [0, 1.3, 3.32], [1.0, 2.0, 0.12], 'dark'),
      ...[-2.45, 2.45].map((x) => box(`window_${x}`, [x, 2.45, 3.15], [1.2, 1.2, 0.18], 'glow')),
    ],
    colliders: [cuboid('foundation_collider', [0, 0.4, 0], [4.5, 0.4, 3.5]), cuboid('hall_collider', [0, 2.3, 0], [3.9, 1.9, 3.0])],
    sockets: [{ id: 'entry', position: [0, 0, 4.1], type: 'interaction' }, { id: 'lesson_board', position: [0, 1.2, -2.6], type: 'interaction' }],
  },
  adventure_lodge: {
    label: 'Adventure Lodge', footprint: [9, 8],
    palette: { base: '#d9a967', trim: '#f0d09d', roof: '#7a4938', dark: '#65483a', glow: '#ffd98c' },
    parts: [
      box('foundation', [0, 0.4, 0], [8.2, 0.8, 6.8], 'dark'),
      box('main_body', [0, 2.2, 0], [7.1, 3.6, 5.8], 'base'),
      box('roof_left', [-2.0, 4.55, 0], [4.4, 0.45, 6.6], 'roof', [0, 0, -0.38]),
      box('roof_right', [2.0, 4.55, 0], [4.4, 0.45, 6.6], 'roof', [0, 0, 0.38]),
      cylinder('chimney', [-2.8, 5.0, -1.6], [0.35, 0.45, 2.8, 8], 'dark'),
      box('porch', [0, 0.5, 3.8], [5.0, 0.4, 1.8], 'trim'),
      box('door', [0, 1.25, 3.0], [1.0, 2.0, 0.14], 'dark'),
      ...[-2.2, 2.2].map((x) => box(`window_${x}`, [x, 2.35, 3.0], [1.0, 1.0, 0.16], 'glow')),
    ],
    colliders: [cuboid('foundation_collider', [0, 0.4, 0], [4.1, 0.4, 3.4]), cuboid('body_collider', [0, 2.2, 0], [3.55, 1.8, 2.9]), cuboid('porch_collider', [0, 0.5, 3.8], [2.5, 0.2, 0.9])],
    sockets: [{ id: 'entry', position: [0, 0, 4.8], type: 'interaction' }, { id: 'quest_board', position: [2.7, 1.2, 3.9], type: 'interaction' }],
  },
};

export function getRegionStructurePrefab(type) {
  return REGION_STRUCTURE_CATALOG[type] || null;
}

export function getRegionStructureTypes() {
  return Object.keys(REGION_STRUCTURE_CATALOG);
}
