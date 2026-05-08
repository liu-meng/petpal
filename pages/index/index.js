const {
  getState,
  saveState,
} = require('../../utils/state');
const {
  clampStat,
  decayState,
  getMood,
} = require('../../utils/decay');
const { getPetRenderModel } = require('../../utils/pet-renderer');
const { formatDate } = require('../../utils/time');

function shouldEnablePetAnimation() {
  try {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    const benchmarkLevel = Number(systemInfo.benchmarkLevel);

    if (!Number.isNaN(benchmarkLevel) && benchmarkLevel >= 0 && benchmarkLevel < 10) {
      return false;
    }

    return true;
  } catch (error) {
    return true;
  }
}

const ACTION_EFFECTS = {
  feed: {
    pointsCost: 1,
    hungerDelta: 3,
    happinessDelta: 0,
    action: 'feed',
  },
  play: {
    pointsCost: 1,
    hungerDelta: 0,
    happinessDelta: 2,
    action: 'play',
  },
  pet: {
    pointsCost: 0,
    hungerDelta: 0,
    happinessDelta: 1,
    action: 'pet',
  },
};

const SCORE_FLOAT_DURATION = 1400;

const ACTION_FEEDBACK = {
  feed: {
    pointsDelta: -1,
    statDelta: '+3 饱食',
  },
  play: {
    pointsDelta: -1,
    statDelta: '+2 快乐',
  },
  pet: {
    pointsDelta: 0,
    statDelta: '+1 快乐',
  },
  recover: {
    pointsDelta: 0,
    statDelta: '恢复精神',
  },
};

const MOOD_META = {
  excited: {
    label: '开心爆棚',
    hint: '最适合陪它玩一会儿',
  },
  normal: {
    label: '状态稳定',
    hint: '今天也在等你一起完成任务',
  },
  sad: {
    label: '有点失落',
    hint: '摸摸它或喂点东西会更快恢复',
  },
  sick: {
    label: '需要照顾',
    hint: '先补状态，再让它慢慢恢复精神',
  },
};

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function getPendingTaskCount(state) {
  const sourceState = state || {};
  const tasks = Array.isArray(sourceState.tasks) ? sourceState.tasks : [];
  const today = formatDate(Date.now());
  const todayCheckins = Array.isArray(sourceState.checkins) ? sourceState.checkins : [];

  return tasks.filter((task) => {
    if (!task || !task.enabled) {
      return false;
    }

    const todayCheckin = todayCheckins.find(
      (checkin) => checkin && checkin.taskId === task.id && checkin.date === today
    );

    return !todayCheckin || todayCheckin.status === 'rejected';
  }).length;
}

function buildViewState(state, activeAction) {
  const sourceState = state || {};
  const pet = sourceState.pet || {};
  const mood = getMood(pet.hunger, pet.happiness);
  const points = Math.max(0, Number(sourceState.points) || 0);
  const renderModel = getPetRenderModel({
    species: pet.type,
    mood,
    action: activeAction || 'idle',
    hunger: pet.hunger,
    happiness: pet.happiness,
  });
  const moodMeta = MOOD_META[mood] || MOOD_META.normal;

  return {
    state: sourceState,
    petName: pet.name || '旺财',
    points,
    pet,
    mood,
    activeAction: activeAction || 'idle',
    bubbleText: renderModel.bubbleText,
    moodLabel: moodMeta.label,
    moodHint: moodMeta.hint,
    pendingTaskCount: getPendingTaskCount(sourceState),
    feedDisabled: points < ACTION_EFFECTS.feed.pointsCost,
    playDisabled: points < ACTION_EFFECTS.play.pointsCost,
  };
}

Page({
  data: {
    petName: '旺财',
    points: 0,
    pet: {
      type: 'dog',
      hunger: 10,
      happiness: 10,
    },
    mood: 'normal',
    activeAction: 'idle',
    bubbleText: '',
    moodLabel: '',
    moodHint: '',
    pendingTaskCount: 0,
    feedDisabled: true,
    playDisabled: true,
    pointsFloatText: '',
    pointsFloatVisible: false,
    statFloatText: '',
    statFloatVisible: false,
    petAnimationEnabled: true,
  },

  pointsFloatTimer: null,
  statFloatTimer: null,
  pendingAvatarAction: '',
  isPetActionPlaying: false,

  onLoad() {
    this.setData({
      petAnimationEnabled: shouldEnablePetAnimation(),
    });
    this.syncPageState();
  },

  onShow() {
    this.syncPageState();
  },

  onUnload() {
    this.clearFeedbackTimers();
  },

  syncPageState() {
    const state = getState();

    if (!state.initialized) {
      wx.reLaunch({
        url: '/pages/onboarding/onboarding',
      });
      return;
    }

    const now = Date.now();
    const nextState = saveState(decayState(state, now));
    const app = getApp();

    if (app && app.globalData) {
      app.globalData.state = nextState;
    }

    this.applyViewState(nextState, 'idle');
  },

  applyViewState(state, activeAction) {
    const viewState = buildViewState(state, activeAction);

    this.setData({
      petName: viewState.petName,
      points: viewState.points,
      pet: viewState.pet,
      mood: viewState.mood,
      activeAction: viewState.activeAction,
      bubbleText: viewState.bubbleText,
      moodLabel: viewState.moodLabel,
      moodHint: viewState.moodHint,
      pendingTaskCount: viewState.pendingTaskCount,
      feedDisabled: viewState.feedDisabled,
      playDisabled: viewState.playDisabled,
    });
  },

  getPetAvatar() {
    return this.selectComponent('#petAvatar');
  },

  clearFeedbackTimers() {
    if (this.pointsFloatTimer) {
      clearTimeout(this.pointsFloatTimer);
      this.pointsFloatTimer = null;
    }

    if (this.statFloatTimer) {
      clearTimeout(this.statFloatTimer);
      this.statFloatTimer = null;
    }
  },

  playPetAvatarAction(action) {
    const petAvatar = this.getPetAvatar();

    if (!petAvatar || typeof petAvatar.playAction !== 'function') {
      return false;
    }

    return petAvatar.playAction(action);
  },

  handlePetTap(event) {
    const detail = event.detail || {};

    this.lastPetTapArea = detail.hitArea || '';
  },

  handlePetActionStart(event) {
    const detail = event.detail || {};

    this.isPetActionPlaying = true;
    this.setData({
      activeAction: detail.action || 'idle',
      bubbleText: detail.bubbleText || '',
    });

    if (detail.action === 'recover') {
      this.showFloatFeedback('recover');
    }
  },

  handlePetActionEnd(event) {
    const detail = event.detail || {};
    const nextAction = this.pendingAvatarAction;

    if (nextAction && nextAction !== detail.action) {
      this.pendingAvatarAction = '';
      this.isPetActionPlaying = false;

      if (this.playPetAvatarAction(nextAction)) {
        return;
      }
    }

    this.pendingAvatarAction = '';
    this.isPetActionPlaying = false;
    this.applyViewState(getState(), 'idle');
  },

  showFloatFeedback(actionKey) {
    const feedback = ACTION_FEEDBACK[actionKey];

    if (!feedback) {
      return;
    }

    this.clearFeedbackTimers();

    this.setData({
      pointsFloatText: feedback.pointsDelta === 0
        ? ''
        : `${feedback.pointsDelta > 0 ? '+' : ''}${feedback.pointsDelta} 分`,
      pointsFloatVisible: feedback.pointsDelta !== 0,
      statFloatText: feedback.statDelta,
      statFloatVisible: !!feedback.statDelta,
    });

    if (feedback.pointsDelta !== 0) {
      this.pointsFloatTimer = setTimeout(() => {
        this.pointsFloatTimer = null;
        this.setData({
          pointsFloatVisible: false,
        });
      }, SCORE_FLOAT_DURATION);
    }

    if (feedback.statDelta) {
      this.statFloatTimer = setTimeout(() => {
        this.statFloatTimer = null;
        this.setData({
          statFloatVisible: false,
        });
      }, SCORE_FLOAT_DURATION);
    }
  },

  handleActionTap(event) {
    const actionKey = event.detail && event.detail.action;
    const isDisabled = !!(event.detail && event.detail.disabled);

    if (!ACTION_EFFECTS[actionKey]) {
      return;
    }

    if (isDisabled) {
      wx.showToast({
        title: '积分不够了，先去完成任务吧！',
        icon: 'none',
      });
      return;
    }

    if (this.isPetActionPlaying || this.pendingAvatarAction) {
      return;
    }

    const effect = ACTION_EFFECTS[actionKey];
    const currentState = getState();
    const decayedState = decayState(currentState, Date.now());
    const previousMood = getMood(decayedState.pet.hunger, decayedState.pet.happiness);
    this.clearFeedbackTimers();

    if (effect.pointsCost > 0 && decayedState.points < effect.pointsCost) {
      const savedState = saveState(decayedState);
      const app = getApp();

      if (app && app.globalData) {
        app.globalData.state = savedState;
      }

      wx.showToast({
        title: '积分不够了，先去完成任务吧！',
        icon: 'none',
      });
      this.applyViewState(savedState, 'idle');
      return;
    }

    const nextState = cloneState(decayedState);
    const now = Date.now();

    nextState.points = Math.max(0, nextState.points - effect.pointsCost);
    nextState.pet.hunger = clampStat(nextState.pet.hunger + effect.hungerDelta);
    nextState.pet.happiness = clampStat(nextState.pet.happiness + effect.happinessDelta);
    nextState.pet.lastDecayAt = now;
    nextState.pet.decayCarry = {
      hunger: 0,
      happiness: 0,
    };

    const savedState = saveState(nextState);
    const app = getApp();
    const nextMood = getMood(savedState.pet.hunger, savedState.pet.happiness);
    const queuedAction = previousMood === 'sick' && nextMood !== 'sick' ? 'recover' : '';

    if (app && app.globalData) {
      app.globalData.state = savedState;
    }

    this.applyViewState(savedState, effect.action);
    this.showFloatFeedback(effect.action);
    this.pendingAvatarAction = queuedAction;

    if (!this.playPetAvatarAction(effect.action)) {
      this.pendingAvatarAction = '';
      this.isPetActionPlaying = false;
      this.applyViewState(savedState, 'idle');
    }
  },

  handleGoTasks() {
    wx.navigateTo({
      url: '/pages/tasks/tasks',
    });
  },

  handleGoParent() {
    wx.navigateTo({
      url: '/pages/parent/parent',
    });
  },
});
