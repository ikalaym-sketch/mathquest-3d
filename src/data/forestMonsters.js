import { FOREST_MODEL_ASSETS } from '../services/ForestAssetService.js';

export const FOREST_MONSTERS = [
  {
    id: 'forest_leaf_slime', name: '葉芽史萊姆', behavior: 'hop', hp: 28, atk: 5, speed: 1.6,
    color: '#62cc64', aggroRange: 6, atkRange: 1.3, ranged: false, weak: 'fire',
    modelAssetId: FOREST_MODEL_ASSETS.leaf_slime, modelScale: 0.95,
  },
  {
    id: 'forest_twig_goblin', name: '枝木哥布林', behavior: 'shield', hp: 48, atk: 8, speed: 1.7,
    color: '#7a5030', aggroRange: 8, atkRange: 1.5, ranged: false, weak: 'lightning',
    modelAssetId: FOREST_MODEL_ASSETS.twig_goblin, modelScale: 0.82,
  },
  {
    id: 'forest_blossom_trap', name: '花冠咬咬草', behavior: 'lure', hp: 52, atk: 9, speed: 0,
    color: '#ed6f9e', aggroRange: 5, atkRange: 3, ranged: false, weak: 'fire',
    modelAssetId: FOREST_MODEL_ASSETS.blossom_trap, modelScale: 0.9,
  },
];

export const FOREST_MONSTER_MAP = Object.fromEntries(FOREST_MONSTERS.map((monster) => [monster.id, monster]));
