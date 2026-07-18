// v0.27.0 動物照顧資料與產出規則。
export function createFarmAnimal({ id, type, name, product }) {
  return {
    id,
    type,
    name,
    ageDays: 1,
    affection: 10,
    hunger: 80,
    cleanliness: 80,
    health: 100,
    mood: 'content',
    lastFedDay: 0,
    lastPetDay: 0,
    lastBrushDay: 0,
    lastCareWorldMinute: 0,
    productReadyAtWorldMinute: 0,
    product,
  };
}

export function normalizeFarmAnimal(animal, fallback) {
  return { ...fallback, ...animal, name: animal?.name || fallback.name };
}

export function applyAnimalCare(animal, action, { dayIndex, worldMinute }) {
  const next = { ...animal, lastCareWorldMinute: worldMinute };
  if (action === 'feed') {
    next.hunger = 100;
    next.lastFedDay = dayIndex;
    next.affection = clamp(next.affection + 2, 0, 100);
  } else if (action === 'pet') {
    if (next.lastPetDay === dayIndex) return { ok: false, reason: 'already-petted', animal };
    next.lastPetDay = dayIndex;
    next.affection = clamp(next.affection + 5, 0, 100);
  } else if (action === 'brush') {
    if (next.lastBrushDay === dayIndex) return { ok: false, reason: 'already-brushed', animal };
    next.lastBrushDay = dayIndex;
    next.cleanliness = clamp(next.cleanliness + 24, 0, 100);
    next.affection = clamp(next.affection + 3, 0, 100);
  } else return { ok: false, reason: 'unsupported-action', animal };
  next.mood = resolveAnimalMood(next);
  return { ok: true, animal: next };
}

export function advanceAnimalDailyState(animal, elapsedDays = 0) {
  if (elapsedDays <= 0) return animal;
  const next = {
    ...animal,
    ageDays: animal.ageDays + elapsedDays,
    hunger: clamp(animal.hunger - elapsedDays * 20, 0, 100),
    cleanliness: clamp(animal.cleanliness - elapsedDays * 12, 0, 100),
  };
  next.health = clamp(next.health + (next.hunger < 25 || next.cleanliness < 20 ? -elapsedDays * 8 : elapsedDays * 2), 20, 100);
  next.mood = resolveAnimalMood(next);
  return next;
}

export function resolveAnimalProductQuality(animal, farmLevel) {
  const score = animal.affection * 0.45 + animal.hunger * 0.25 + animal.cleanliness * 0.2 + animal.health * 0.1 + farmLevel * 4;
  return score >= 92 ? 'star' : score >= 76 ? 'high' : score >= 55 ? 'good' : 'normal';
}

export function resolveAnimalMood(animal) {
  const score = animal.affection * 0.35 + animal.hunger * 0.25 + animal.cleanliness * 0.2 + animal.health * 0.2;
  return score >= 82 ? 'happy' : score >= 55 ? 'content' : score >= 35 ? 'tired' : 'sad';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
