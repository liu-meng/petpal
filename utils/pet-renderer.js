const { getMood } = require('./decay');
const DOG_MOTION_LIBRARY = require('./pet-motion-spec');

const ACTIONS = ['idle', 'feed', 'play', 'pet', 'recover', 'tap_head', 'tap_body'];
const MOODS = ['excited', 'normal', 'sad', 'sick'];
const DEFAULT_PARAMS = {
  eyeOpen: 1,
  mouthSmile: 0.65,
  bodyBreath: 0.05,
  headRotate: 0,
  earSwing: 0.16,
  tailSwing: 0.24,
};

const DOG_TEXTURES = {
  body: '/assets/pet/runtime/dog/textures/dog_body_rig.png',
  tail: '/assets/pet/runtime/dog/textures/dog_tail_rig.png',
  blink: '/assets/pet/runtime/dog/textures/dog_blink_closed.png',
  head: {
    normal: '/assets/pet/runtime/dog/textures/dog_head_normal.png',
    excited: '/assets/pet/runtime/dog/textures/dog_head_happy.png',
    sad: '/assets/pet/runtime/dog/textures/dog_head_sad.png',
    sick: '/assets/pet/runtime/dog/textures/dog_head_sick.png',
  },
  fallback: {
    normal: '/assets/pet/runtime/dog/textures/dog_fallback_normal.png',
    excited: '/assets/pet/runtime/dog/textures/dog_fallback_excited.png',
    sad: '/assets/pet/runtime/dog/textures/dog_fallback_sad.png',
    sick: '/assets/pet/runtime/dog/textures/dog_fallback_sick.png',
  },
};
const DOG_HIT_AREAS = {
  head: {
    shape: 'ellipse',
    cx: 0.5,
    cy: 0.3,
    rx: 0.18,
    ry: 0.15,
  },
  body: {
    shape: 'ellipse',
    cx: 0.52,
    cy: 0.66,
    rx: 0.24,
    ry: 0.19,
  },
  tail: {
    shape: 'ellipse',
    cx: 0.22,
    cy: 0.63,
    rx: 0.12,
    ry: 0.09,
  },
};

const DOG_MOOD_CONFIG = {
  excited: {
    idleMotion: 'idle_excited',
    fallbackImage: DOG_TEXTURES.fallback.excited,
    bubbleText: '今天状态满格，快带我去冒险吧！',
    params: {
      eyeOpen: 1,
      mouthSmile: 1,
      bodyBreath: 0.075,
      headRotate: 0.02,
      earSwing: 0.34,
      tailSwing: 0.62,
    },
  },
  normal: {
    idleMotion: 'idle_normal',
    fallbackImage: DOG_TEXTURES.fallback.normal,
    bubbleText: '我准备好了，今天也一起完成任务。',
    params: {
      eyeOpen: 1,
      mouthSmile: 0.72,
      bodyBreath: 0.055,
      headRotate: 0.01,
      earSwing: 0.18,
      tailSwing: 0.28,
    },
  },
  sad: {
    idleMotion: 'idle_sad',
    fallbackImage: DOG_TEXTURES.fallback.sad,
    bubbleText: '我有点低落，想吃点东西或者陪我玩。',
    params: {
      eyeOpen: 0.82,
      mouthSmile: 0.18,
      bodyBreath: 0.03,
      headRotate: -0.04,
      earSwing: 0.08,
      tailSwing: 0.06,
    },
  },
  sick: {
    idleMotion: 'idle_sick',
    fallbackImage: DOG_TEXTURES.fallback.sick,
    bubbleText: '我不太舒服，想被你好好照顾一下。',
    params: {
      eyeOpen: 0.56,
      mouthSmile: 0.08,
      bodyBreath: 0.024,
      headRotate: -0.06,
      earSwing: 0.05,
      tailSwing: 0.02,
    },
  },
};

const DOG_ACTION_CONFIG = {
  idle: {
    bubbleText: '',
    params: {},
  },
  feed: {
    motion: 'feed_start',
    bubbleText: '开饭啦，我会好好吃掉它。',
    params: {
      mouthSmile: 0.92,
      bodyBreath: 0.07,
      headRotate: -0.08,
      tailSwing: 0.34,
    },
  },
  play: {
    motion: 'play_start',
    bubbleText: '再玩一会儿！我现在超有精神。',
    params: {
      eyeOpen: 1,
      mouthSmile: 1,
      bodyBreath: 0.1,
      headRotate: 0.08,
      earSwing: 0.4,
      tailSwing: 0.78,
    },
  },
  pet: {
    motion: 'pet_loop',
    bubbleText: '嘿嘿，被摸摸真舒服。',
    params: {
      mouthSmile: 0.96,
      bodyBreath: 0.08,
      headRotate: 0.03,
      earSwing: 0.24,
      tailSwing: 0.56,
    },
  },
  recover: {
    motion: 'recover',
    bubbleText: '我舒服多了，谢谢你照顾我。',
    params: {
      eyeOpen: 0.94,
      mouthSmile: 0.62,
      bodyBreath: 0.06,
      headRotate: 0,
      earSwing: 0.14,
      tailSwing: 0.2,
    },
  },
  tap_head: {
    motion: 'tap_head',
    bubbleText: '摸摸头会让我安心很多。',
    params: {
      mouthSmile: 0.9,
      headRotate: 0.12,
      earSwing: 0.42,
      tailSwing: 0.3,
    },
  },
  tap_body: {
    motion: 'tap_body',
    bubbleText: '嘿，我听见你的轻轻拍打啦。',
    params: {
      mouthSmile: 0.82,
      bodyBreath: 0.07,
      headRotate: 0.08,
      earSwing: 0.2,
      tailSwing: 0.38,
    },
  },
};

const SPECIES_CONFIG = {
  dog: {
    sizeRatio: 1,
    anchor: {
      x: 0.5,
      y: 0.68,
    },
    hitAreas: DOG_HIT_AREAS,
    moods: DOG_MOOD_CONFIG,
    actions: DOG_ACTION_CONFIG,
    motions: DOG_MOTION_LIBRARY.motions,
  },
};

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mergeParams(base, overrides) {
  const next = Object.assign({}, base, overrides || {});

  return {
    eyeOpen: clamp(Number(next.eyeOpen) || 0, 0, 1),
    mouthSmile: clamp(Number(next.mouthSmile) || 0, 0, 1),
    bodyBreath: Math.max(0, Number(next.bodyBreath) || 0),
    headRotate: Number(next.headRotate) || 0,
    earSwing: Math.max(0, Number(next.earSwing) || 0),
    tailSwing: Math.max(0, Number(next.tailSwing) || 0),
  };
}

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

function getResolvedMotionName(species, mood, action) {
  const speciesConfig = getSpeciesConfig(species);
  const moodConfig = speciesConfig.moods[mood];
  const actionConfig = speciesConfig.actions[action];

  if (action === 'idle') {
    return moodConfig.idleMotion;
  }

  return actionConfig.motion || moodConfig.idleMotion;
}

function getResolvedMotion(species, mood, action) {
  const speciesConfig = getSpeciesConfig(species);
  const moodConfig = speciesConfig.moods[mood];
  const motionName = getResolvedMotionName(species, mood, action);
  const rawMotion = speciesConfig.motions[motionName] || speciesConfig.motions[moodConfig.idleMotion];
  const idleMotion = moodConfig.idleMotion;
  const motion = cloneData(rawMotion);

  motion.name = motionName;
  motion.returnTo = motion.returnTo === 'current_idle' ? idleMotion : motion.returnTo;

  if (!Array.isArray(motion.hitArea)) {
    motion.hitArea = motion.hitArea ? [motion.hitArea] : [];
  }

  if (!Array.isArray(motion.fx)) {
    motion.fx = motion.fx ? [motion.fx] : [];
  }

  return motion;
}

function getDogTextureSet(emotion, action) {
  let headEmotion = emotion;

  if ((action === 'feed' || action === 'play' || action === 'pet') && emotion !== 'sick') {
    headEmotion = 'excited';
  } else if (action === 'recover' && emotion === 'sick') {
    headEmotion = 'normal';
  }

  return {
    body: DOG_TEXTURES.body,
    tail: DOG_TEXTURES.tail,
    blink: DOG_TEXTURES.blink,
    head: DOG_TEXTURES.head[headEmotion] || DOG_TEXTURES.head.normal,
    fallbackImage: DOG_TEXTURES.fallback[emotion] || DOG_TEXTURES.fallback.normal,
  };
}

function getPetRenderModel(options) {
  const source = options || {};
  const species = source.species || 'dog';
  const speciesConfig = getSpeciesConfig(species);
  const emotion = getResolvedMood(species, source.mood, source.hunger, source.happiness);
  const action = getResolvedAction(species, source.action);
  const moodConfig = speciesConfig.moods[emotion];
  const actionConfig = speciesConfig.actions[action];
  const motion = getResolvedMotion(species, emotion, action);
  const params = mergeParams(
    mergeParams(DEFAULT_PARAMS, moodConfig.params),
    actionConfig.params
  );
  const textureSet = getDogTextureSet(emotion, action);

  return {
    species,
    emotion,
    mood: emotion,
    action,
    motion,
    params,
    fx: motion.fx,
    fallbackImage: textureSet.fallbackImage,
    textureSet: textureSet,
    layers: {
      body: {
        type: 'texture',
        src: textureSet.body,
      },
      tail: {
        type: 'texture',
        src: textureSet.tail,
      },
      head: {
        type: 'texture',
        src: textureSet.head,
      },
      blink: {
        type: 'texture',
        src: textureSet.blink,
      },
    },
    placeholderSource: {
      type: 'layered-texture',
      body: textureSet.body,
      tail: textureSet.tail,
      head: textureSet.head,
      blink: textureSet.blink,
    },
    hitAreas: cloneData(speciesConfig.hitAreas),
    bubbleText: action === 'idle' ? moodConfig.bubbleText : actionConfig.bubbleText || moodConfig.bubbleText,
    anchor: cloneData(speciesConfig.anchor),
    sizeRatio: speciesConfig.sizeRatio,
  };
}

module.exports = {
  ACTIONS,
  MOODS,
  SPECIES_CONFIG,
  getPetRenderModel,
  getResolvedAction,
  getResolvedMood,
  getResolvedMotion,
  getResolvedMotionName,
  getSpeciesConfig,
};
