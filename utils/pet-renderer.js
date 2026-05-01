const { getMood } = require('./decay');

const PET_PART_KEYS = ['base', 'face', 'pose', 'fx', 'accessory'];
const ACTIONS = ['idle', 'feed', 'play', 'pet', 'recover'];
const MOODS = ['excited', 'normal', 'sad', 'sick'];

const DOG_ACTION_CONFIG = {
  idle: {
    pose: null,
    fx: null,
    anim: 'float',
  },
  feed: {
    pose: 'eat',
    fx: 'sparkle',
    anim: 'bounce',
  },
  play: {
    pose: 'play',
    fx: 'sparkle',
    anim: 'wag',
  },
  pet: {
    pose: null,
    fx: 'heart',
    anim: 'pulse',
  },
  recover: {
    pose: 'recover',
    fx: 'heal',
    anim: 'recover',
  },
};

const DOG_MOOD_CONFIG = {
  excited: {
    parts: {
      base: 'dog/base/body-brown.png',
      face: 'dog/face/excited-smile.png',
      pose: 'dog/pose/idle-tail-up.png',
      fx: 'common/fx/confetti.png',
      accessory: null,
    },
    anim: 'float-happy',
    bubbleText: '好开心，继续陪我玩吧！',
  },
  normal: {
    parts: {
      base: 'dog/base/body-brown.png',
      face: 'dog/face/normal-smile.png',
      pose: 'dog/pose/idle-neutral.png',
      fx: null,
      accessory: null,
    },
    anim: 'float-calm',
    bubbleText: '今天状态不错，我们一起加油。',
  },
  sad: {
    parts: {
      base: 'dog/base/body-brown.png',
      face: 'dog/face/sad-mouth.png',
      pose: 'dog/pose/idle-droop.png',
      fx: 'common/fx/droplet.png',
      accessory: null,
    },
    anim: 'float-sad',
    bubbleText: '我有点失落，想吃点东西或陪我玩。',
  },
  sick: {
    parts: {
      base: 'dog/base/body-brown.png',
      face: 'dog/face/sick-dizzy.png',
      pose: 'dog/pose/idle-weak.png',
      fx: 'common/fx/sick-stars.png',
      accessory: null,
    },
    anim: 'float-sick',
    bubbleText: '我不太舒服，需要你的照顾。',
  },
};

const SPECIES_CONFIG = {
  dog: {
    sizeRatio: 1,
    anchor: {
      x: 0.5,
      y: 0.5,
    },
    moods: DOG_MOOD_CONFIG,
    actions: DOG_ACTION_CONFIG,
  },
};

function getSpeciesConfig(species) {
  return SPECIES_CONFIG[species] || SPECIES_CONFIG.dog;
}

function getResolvedMood(species, mood, hunger, happiness) {
  const speciesConfig = getSpeciesConfig(species);
  const computedMood = mood || getMood(hunger, happiness);

  return speciesConfig.moods[computedMood] ? computedMood : 'normal';
}

function getResolvedAction(species, action) {
  const speciesConfig = getSpeciesConfig(species);
  return speciesConfig.actions[action] ? action : 'idle';
}

function buildLayer(key, assetPath, index) {
  if (!assetPath) {
    return null;
  }

  return {
    key,
    assetPath,
    src: `/assets/pet/${assetPath}`,
    zIndex: index + 1,
    useFallback: true,
  };
}

function mergeParts(species, moodParts, actionConfig) {
  return {
    base: moodParts.base,
    face: moodParts.face,
    pose: actionConfig.pose ? `${species}/pose/${actionConfig.pose}.png` : moodParts.pose,
    fx: actionConfig.fx ? `common/fx/${actionConfig.fx}.png` : moodParts.fx,
    accessory: moodParts.accessory,
  };
}

function getPetRenderModel(options) {
  const source = options || {};
  const species = source.species || 'dog';
  const speciesConfig = getSpeciesConfig(species);
  const mood = getResolvedMood(species, source.mood, source.hunger, source.happiness);
  const action = getResolvedAction(species, source.action);
  const moodConfig = speciesConfig.moods[mood];
  const actionConfig = speciesConfig.actions[action];
  const parts = mergeParts(species, moodConfig.parts, actionConfig);
  const layers = PET_PART_KEYS
    .map((key, index) => buildLayer(key, parts[key], index))
    .filter(Boolean);

  return {
    species,
    mood,
    action,
    anim: action === 'idle' ? moodConfig.anim : actionConfig.anim,
    bubbleText: moodConfig.bubbleText,
    parts,
    layers,
    anchor: speciesConfig.anchor,
    sizeRatio: speciesConfig.sizeRatio,
  };
}

module.exports = {
  ACTIONS,
  MOODS,
  PET_PART_KEYS,
  SPECIES_CONFIG,
  getPetRenderModel,
  getResolvedAction,
  getResolvedMood,
  getSpeciesConfig,
};
