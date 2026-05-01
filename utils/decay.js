const MAX_PET_STAT = 10;

const DECAY_RULES = {
  relaxed: {
    hungerPerHour: 0.5,
    happinessPerHour: 1 / 3,
  },
  standard: {
    hungerPerHour: 1,
    happinessPerHour: 0.5,
  },
  strict: {
    hungerPerHour: 2,
    happinessPerHour: 1,
  },
};

function clampStat(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_PET_STAT, numericValue));
}

function getDecayRule(decaySpeed) {
  return DECAY_RULES[decaySpeed] || DECAY_RULES.relaxed;
}

function normalizeDecayCarry(decayCarry) {
  const source = decayCarry && typeof decayCarry === 'object' ? decayCarry : {};

  return {
    hunger: Math.max(0, Number(source.hunger) || 0),
    happiness: Math.max(0, Number(source.happiness) || 0),
  };
}

function getElapsedHours(lastDecayAt, now) {
  const safeNow = typeof now === 'number' ? now : Date.now();
  const safeLastDecayAt = typeof lastDecayAt === 'number' ? lastDecayAt : safeNow;

  if (safeNow <= safeLastDecayAt) {
    return 0;
  }

  return (safeNow - safeLastDecayAt) / (1000 * 60 * 60);
}

function calculateDecayProgress(currentValue, elapsedHours, ratePerHour, carryValue) {
  const currentStat = clampStat(currentValue);

  if (currentStat <= 0) {
    return {
      amount: 0,
      carry: 0,
    };
  }

  const progress = elapsedHours * ratePerHour + Math.max(0, Number(carryValue) || 0);
  const amount = Math.min(currentStat, Math.floor(progress));

  return {
    amount,
    carry: progress - amount,
  };
}

function calculateDecayDelta(pet, elapsedHours, decaySpeed) {
  const safeElapsedHours = elapsedHours > 0 ? elapsedHours : 0;
  const rule = getDecayRule(decaySpeed);
  const sourcePet = pet || {};
  const carry = normalizeDecayCarry(sourcePet.decayCarry);
  const hungerProgress = calculateDecayProgress(
    sourcePet.hunger,
    safeElapsedHours,
    rule.hungerPerHour,
    carry.hunger
  );
  const happinessProgress = calculateDecayProgress(
    sourcePet.happiness,
    safeElapsedHours,
    rule.happinessPerHour,
    carry.happiness
  );

  return {
    hunger: hungerProgress.amount,
    happiness: happinessProgress.amount,
    carry: {
      hunger: hungerProgress.carry,
      happiness: happinessProgress.carry,
    },
  };
}

function getMood(hunger, happiness) {
  const avg = (clampStat(hunger) + clampStat(happiness)) / 2;

  if (avg >= 8) {
    return 'excited';
  }

  if (avg >= 5) {
    return 'normal';
  }

  if (avg >= 2) {
    return 'sad';
  }

  return 'sick';
}

function applyDecayToPet(pet, decayDelta, now) {
  const sourcePet = pet || {};
  const nextTimestamp = Math.max(
    typeof sourcePet.lastDecayAt === 'number' ? sourcePet.lastDecayAt : 0,
    typeof now === 'number' ? now : Date.now()
  );

  return Object.assign({}, sourcePet, {
    hunger: clampStat(clampStat(sourcePet.hunger) - decayDelta.hunger),
    happiness: clampStat(clampStat(sourcePet.happiness) - decayDelta.happiness),
    lastDecayAt: nextTimestamp,
    decayCarry: normalizeDecayCarry(decayDelta.carry),
  });
}

function calculatePetDecay(pet, decaySpeed, now) {
  const safeNow = typeof now === 'number' ? now : Date.now();
  const elapsedHours = getElapsedHours(pet && pet.lastDecayAt, safeNow);
  const decayDelta = calculateDecayDelta(pet, elapsedHours, decaySpeed);
  const nextHunger = clampStat((pet && pet.hunger) - decayDelta.hunger);
  const nextHappiness = clampStat((pet && pet.happiness) - decayDelta.happiness);

  return {
    elapsedHours,
    decayDelta,
    pet: applyDecayToPet(pet, decayDelta, safeNow),
    mood: getMood(nextHunger, nextHappiness),
  };
}

function decayState(state, now) {
  const sourceState = state || {};
  const pet = sourceState.pet || {};
  const settings = sourceState.settings || {};
  const result = calculatePetDecay(pet, settings.decaySpeed, now);

  return Object.assign({}, sourceState, {
    pet: result.pet,
  });
}

module.exports = {
  DECAY_RULES,
  MAX_PET_STAT,
  applyDecayToPet,
  calculateDecayDelta,
  calculateDecayProgress,
  calculatePetDecay,
  clampStat,
  decayState,
  getDecayRule,
  getElapsedHours,
  getMood,
  normalizeDecayCarry,
};
