const {
  getState,
  saveState,
  setTaskCheckinStatus,
} = require('../../utils/state');
const { clampStat } = require('../../utils/decay');
const { formatDate } = require('../../utils/time');

function getTaskCheckin(checkins, taskId, date) {
  const sourceCheckins = Array.isArray(checkins) ? checkins : [];

  for (let index = sourceCheckins.length - 1; index >= 0; index -= 1) {
    const checkin = sourceCheckins[index];

    if (checkin && checkin.taskId === taskId && checkin.date === date) {
      return checkin;
    }
  }

  return null;
}

function getStatusMeta(status) {
  if (status === 'pending') {
    return {
      badgeClass: 'is-pending',
      badgeIcon: '⏳',
      badgeLabel: '待确认',
      helperText: '等待家长确认',
      canCheckin: false,
    };
  }

  if (status === 'approved') {
    return {
      badgeClass: 'is-approved',
      badgeIcon: '✓',
      badgeLabel: '已完成',
      helperText: '今天已经完成啦',
      canCheckin: false,
    };
  }

  if (status === 'rejected') {
    return {
      badgeClass: 'is-rejected',
      badgeIcon: '↺',
      badgeLabel: '重新打卡',
      helperText: '未通过，可以重新完成',
      canCheckin: true,
    };
  }

  return {
    badgeClass: 'is-todo',
    badgeIcon: '○',
    badgeLabel: '待打卡',
    helperText: '点击后提交给家长确认',
    canCheckin: true,
  };
}

function buildTaskViewModel(task, checkin) {
  const status = checkin && checkin.status ? checkin.status : 'todo';
  const statusMeta = getStatusMeta(status);

  return Object.assign({}, task, statusMeta, {
    status,
  });
}

function buildPageViewModel(state, dateLike) {
  const currentDate = formatDate(dateLike || Date.now());
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const checkins = Array.isArray(state.checkins) ? state.checkins : [];
  const visibleTasks = tasks
    .filter((task) => task && task.enabled)
    .map((task) => {
      const todayCheckin = getTaskCheckin(checkins, task.id, currentDate);

      return buildTaskViewModel(task, todayCheckin);
    });

  return {
    currentDate,
    tasks: visibleTasks,
    taskCount: visibleTasks.length,
    todoCount: visibleTasks.filter((task) => task.canCheckin).length,
    pendingCount: visibleTasks.filter((task) => task.status === 'pending').length,
    approvedCount: visibleTasks.filter((task) => task.status === 'approved').length,
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
    const taskId = event.currentTarget.dataset.taskId;
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
