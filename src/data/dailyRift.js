// 每日秘境 Canonical 生成器。
// 同一個本地日期必須產生完全相同的生態系、怪物與首勝獎勵，避免重新進場刷到不同內容。
import { BIOMES, BOSSES, MONSTERS } from './biomes.js';
import { REGION_MATERIALS } from './regionGameplayProfiles.js';

export function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDailyRiftConfig(dayKey = getLocalDayKey()) {
  const random = createSeededRandom(hashString(dayKey));
  const biome = BIOMES[Math.floor(random() * BIOMES.length)];
  const bossBase = BOSSES.find((item) => item.biome === biome.id) || BOSSES[Math.floor(random() * BOSSES.length)];
  const monsterPool = seededShuffle(MONSTERS, random).slice(0, 3);
  const rewardMaterial = REGION_MATERIALS[Math.floor(random() * REGION_MATERIALS.length)];
  return {
    dayKey,
    title: `${biome.name} 每日秘境`,
    biome,
    rewardMaterialId: rewardMaterial.id,
    rewardMaterialName: rewardMaterial.name,
    rewardIcon: rewardMaterial.icon,
    rewardGold: 180,
    boss: { ...bossBase, id: `daily_rift_${dayKey}_${bossBase.id}`, name: `秘境守護者 · ${bossBase.name}` },
    monsters: Array.from({ length: 6 }).map((_, index) => ({
      key: `daily_monster_${index}`,
      def: { ...monsterPool[index % monsterPool.length], id: `daily_${dayKey}_${monsterPool[index % monsterPool.length].id}_${index}`, grantLoot: false, rewardGold: 0 },
      spawn: { x: -10 + random() * 20, z: -12 + random() * 18, y: 0.5 },
    })),
    decorations: Array.from({ length: biome.decoCount }).map((_, index) => ({
      key: `daily_deco_${index}`,
      x: -25 + random() * 50,
      z: -25 + random() * 50,
      scale: 0.7 + random() * 0.8,
      rotation: random() * Math.PI * 2,
    })).filter((item) => Math.hypot(item.x, item.z) >= 5 && Math.hypot(item.x, item.z + 8) >= 4),
  };
}

function seededShuffle(source, random) {
  const result = [...source];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = seed || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
