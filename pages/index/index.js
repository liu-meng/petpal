const {
  getState,
  saveState,
} = require('../../utils/state');
const {
  clampStat,
  decayState,
  getMood,
} = require('../../utils/decay');
const { formatDate } = require('../../utils/time');

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

const ACTION_ANIMATION_DURATION = 1200;

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

function getPetBubbleText(pet) {
  const sourcePet = pet || {};
  const hunger = Number(sourcePet.hunger) || 0;
  const happiness = Number(sourcePet.happiness) || 0;
  const mood = getMood(hunger, happiness);

  if (mood === 'sick') {
    return '我不舒服……需要你照顾我';
  }

  if (hunger <= 2) {
    return '我好饿……肚子咕咕叫';
  }

  if (happiness <= 2) {
    return '我有点不开心……';
  }

  if (hunger >= 8) {
    return '我吃饱啦！好幸福～';
  }

  if (happiness >= 8) {
    return '我好开心！你是最好的主人！';
  }

  return '今天过得怎么样？';
}

function buildViewState(state, activeAction) {
  const sourceState = state || {};
  const pet = sourceState.pet || {};
  const mood = getMood(pet.hunger, pet.happiness);
  const points = Math.max(0, Number(sourceState.points) || 0);

  return {
    state: sourceState,
    petName: pet.name || '旺财',
    points,
    pet,
    mood,
    activeAction: activeAction || 'idle',
    bubbleText: getPetBubbleText(pet),
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
    pendingTaskCount: 0,
    feedDisabled: true,
    playDisabled: true,
  },

  actionResetTimer: null,

  onLoad() {
    this.syncPageState();
  },

  onShow() {
    this.syncPageState();
  },

  onUnload() {
    this.clearActionResetTimer();
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
      pendingTaskCount: viewState.pendingTaskCount,
      feedDisabled: viewState.feedDisabled,
      playDisabled: viewState.playDisabled,
    });
  },

  clearActionResetTimer() {
    if (this.actionResetTimer) {
      clearTimeout(this.actionResetTimer);
      this.actionResetTimer = null;
    }
  },

  scheduleActionReset() {
    this.clearActionResetTimer();
    this.actionResetTimer = setTimeout(() => {
      this.actionResetTimer = null;
      this.applyViewState(getState(), 'idle');
    }, ACTION_ANIMATION_DURATION);
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

    const effect = ACTION_EFFECTS[actionKey];
    const currentState = getState();
    const decayedState = decayState(currentState, Date.now());

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

    if (app && app.globalData) {
      app.globalData.state = savedState;
    }

    this.applyViewState(savedState, effect.action);
    this.scheduleActionReset();
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
