const {
  getState,
  saveState,
  setTaskCheckinStatus,
} = require('../../utils/state');
const { clampStat } = require('../../utils/decay');
const { formatDate } = require('../../utils/time');
const {
  buildTaskCollections,
} = require('../../utils/task-schedule');

function buildPageViewModel(state, dateLike) {
  const currentDate = formatDate(dateLike || Date.now());
  const collections = buildTaskCollections(
    Array.isArray(state.tasks) ? state.tasks : [],
    Array.isArray(state.checkins) ? state.checkins : [],
    dateLike || Date.now()
  );
  const visibleTasks = collections.tasks;

  return {
    currentDate,
    tasks: visibleTasks,
    taskCount: visibleTasks.length,
    todoCount: collections.counts.actionable,
    pendingCount: collections.counts.pending,
    approvedCount: collections.counts.approved,
    nowTasks: collections.groups.now,
    laterTasks: collections.groups.later,
    doneTasks: collections.groups.done,
    recommendedTaskId: collections.recommendedTask ? collections.recommendedTask.id : '',
  };
}

function syncGlobalState(state) {
  const app = getApp();

  if (app && app.globalData) {
    app.globalData.state = state;
  }
}

function applyApprovedReward(state, task) {
  const sourceState = state || {};
  const sourcePet = sourceState.pet || {};
  const pointsDelta = Math.max(0, Number(task && task.points) || 0);
  const nextState = Object.assign({}, sourceState, {
    points: Math.max(0, Number(sourceState.points) || 0) + pointsDelta,
    pet: Object.assign({}, sourcePet, {
      happiness: clampStat((Number(sourcePet.happiness) || 0) + 1),
      totalPointsEarned: Math.max(0, Number(sourcePet.totalPointsEarned) || 0) + pointsDelta,
    }),
  });

  return saveState(nextState);
}

function getLockedToast(status) {
  if (status === 'pending') {
    return '这个任务还在等待家长确认';
  }

  if (status === 'approved') {
    return '这个任务今天已经完成过啦';
  }

  if (status === 'upcoming') {
    return '还没到这个任务的时间';
  }

  return '这个任务暂时不能重复打卡';
}

Page({
  data: {
    currentDate: '',
    taskCount: 0,
    todoCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    tasks: [],
    nowTasks: [],
    laterTasks: [],
    doneTasks: [],
    recommendedTaskId: '',
  },

  crossDayResetTimer: null,

  onLoad() {
    wx.setNavigationBarTitle({
      title: '今日任务',
    });
    this.syncPageState();
  },

  onShow() {
    this.syncPageState();
  },

  onHide() {
    this.clearCrossDayResetTimer();
  },

  onUnload() {
    this.clearCrossDayResetTimer();
  },

  clearCrossDayResetTimer() {
    if (this.crossDayResetTimer) {
      clearTimeout(this.crossDayResetTimer);
      this.crossDayResetTimer = null;
    }
  },

  scheduleCrossDayReset() {
    this.clearCrossDayResetTimer();

    const now = new Date();
    const nextDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      50
    );
    const delay = Math.max(50, nextDay.getTime() - now.getTime());

    this.crossDayResetTimer = setTimeout(() => {
      this.crossDayResetTimer = null;
      this.syncPageState();
    }, delay);
  },

  syncPageState(stateLike) {
    const state = stateLike || getState();

    if (!state.initialized) {
      wx.reLaunch({
        url: '/pages/onboarding/onboarding',
      });
      return;
    }

    this.setData(buildPageViewModel(state, Date.now()));
    this.scheduleCrossDayReset();
  },

  handleTaskTap(event) {
    const taskId = (event.detail && event.detail.taskId) || event.currentTarget.dataset.taskId;
    const task = (this.data.tasks || []).find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    if (this.data.currentDate !== formatDate(Date.now())) {
      this.syncPageState();
      return;
    }

    if (!task.canCheckin) {
      wx.showToast({
        title: getLockedToast(task.status),
        icon: 'none',
      });
      return;
    }

    if (task.requireConfirm === false) {
      this.submitTaskCheckin(task);
      return;
    }

    wx.showModal({
      title: task.status === 'rejected' ? '重新提交打卡' : '确认打卡',
      content: `确定已经完成“${task.label}”了吗？`,
      cancelText: '还没',
      confirmText: '完成了',
      success: (result) => {
        if (!result.confirm) {
          return;
        }

        this.submitTaskCheckin(task);
      },
    });
  },

  submitTaskCheckin(task) {
    const now = Date.now();
    const latestState = getState();
    const latestViewModel = buildPageViewModel(latestState, now);
    const latestTask = latestViewModel.tasks.find((item) => item.id === task.id);

    if (!latestTask || !latestTask.canCheckin) {
      wx.showToast({
        title: getLockedToast(latestTask ? latestTask.status : task.status),
        icon: 'none',
      });
      this.syncPageState(latestState);
      return;
    }

    const nextStatus = task.requireConfirm === false ? 'approved' : 'pending';
    let savedState = setTaskCheckinStatus(task.id, nextStatus, {
      dateLike: now,
      now,
    });

    if (nextStatus === 'approved') {
      savedState = applyApprovedReward(savedState, task);
    }

    syncGlobalState(savedState);
    this.syncPageState(savedState);

    wx.showToast({
      title: nextStatus === 'approved' ? '任务已完成' : '已提交，等待家长确认',
      icon: 'none',
    });
  },
});
