const {
  getState,
  saveState,
  upsertTask,
  removeTask,
} = require('../../utils/state');
const { clampStat } = require('../../utils/decay');
const {
  normalizeTask,
  normalizeTaskList,
  normalizeClockTime,
} = require('../../utils/task-schedule');

const CUSTOM_TASK_ICONS = ['⭐', '🎨', '🧩', '🪥', '📚', '🍚', '🧸', '🚿'];

function hasValidParentPin(state) {
  return !!(
    state &&
    typeof state.parentPin === 'string' &&
    /^\d{4}$/.test(state.parentPin)
  );
}

function syncGlobalState(state) {
  const app = getApp();

  if (app && app.globalData) {
    app.globalData.state = state;
  }
}

function getTaskMap(tasks) {
  return (Array.isArray(tasks) ? tasks : []).reduce((result, task) => {
    if (task && task.id) {
      result[task.id] = task;
    }

    return result;
  }, {});
}

function getPendingCountByTask(checkins) {
  return (Array.isArray(checkins) ? checkins : []).reduce((result, checkin) => {
    if (!checkin || checkin.status !== 'pending' || !checkin.taskId) {
      return result;
    }

    result[checkin.taskId] = (result[checkin.taskId] || 0) + 1;
    return result;
  }, {});
}

function getCheckinSortTimestamp(checkin) {
  if (!checkin) {
    return 0;
  }

  if (typeof checkin.createdAt === 'number') {
    return checkin.createdAt;
  }

  if (typeof checkin.confirmedAt === 'number') {
    return checkin.confirmedAt;
  }

  if (typeof checkin.date === 'string') {
    const timestamp = new Date(checkin.date).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return 0;
}

function buildPendingItem(checkin, taskMap) {
  const task = taskMap[checkin.taskId] || null;
  const taskPoints = Math.max(0, Number(task && task.points) || 0);
  const taskTag = task
    ? (task.enabled === false ? '已关闭' : '')
    : '任务已移除';

  return {
    key: `${checkin.taskId}_${checkin.date}_${checkin.createdAt || 0}`,
    taskId: checkin.taskId,
    createdAt: checkin.createdAt || 0,
    icon: task && task.icon ? task.icon : '📝',
    label: task && task.label ? task.label : checkin.taskId,
    date: checkin.date || '',
    points: taskPoints,
    taskTag,
  };
}

function buildTaskItem(task, pendingCount) {
  return {
    id: task.id,
    icon: task.icon || '📝',
    label: task.label || task.id,
    points: Math.max(0, Number(task.points) || 0),
    enabled: task.enabled !== false,
    requireConfirm: task.requireConfirm !== false,
    sourceType: task.sourceType || 'preset',
    scheduleLabel: task.schedule
      ? `${task.schedule.startAt || '00:00'}-${task.schedule.endAt || '23:59'}`
      : '全天',
    pendingCount: pendingCount || 0,
  };
}

function buildPageViewModel(state, isAuthed) {
  const sourceState = state || {};
  const tasks = Array.isArray(sourceState.tasks) ? sourceState.tasks : [];
  const checkins = Array.isArray(sourceState.checkins) ? sourceState.checkins : [];
  const taskMap = getTaskMap(tasks);
  const pendingCheckins = checkins
    .filter((checkin) => checkin && checkin.status === 'pending')
    .sort((prev, next) => getCheckinSortTimestamp(next) - getCheckinSortTimestamp(prev))
    .map((checkin) => buildPendingItem(checkin, taskMap));
  const pendingCountByTask = getPendingCountByTask(checkins);
  const taskItems = tasks.map((task) => buildTaskItem(task, pendingCountByTask[task.id]));
  const hasPin = hasValidParentPin(sourceState);
  const authMode = hasPin ? (isAuthed ? 'panel' : 'verify') : 'setup';

  return {
    authMode,
    isAuthed: authMode === 'panel',
    pendingCheckins,
    pendingCount: pendingCheckins.length,
    taskCount: taskItems.length,
    enabledTaskCount: taskItems.filter((task) => task.enabled).length,
    tasks: taskItems,
    customTaskCount: taskItems.filter((task) => task.sourceType === 'custom').length,
  };
}

function resolvePendingCheckins(state, status, now) {
  const sourceState = state || {};
  const sourceCheckins = Array.isArray(sourceState.checkins) ? sourceState.checkins : [];
  const taskMap = getTaskMap(sourceState.tasks);
  let handledCount = 0;
  let rewardPoints = 0;

  const nextCheckins = sourceCheckins.map((checkin) => {
    if (!checkin || checkin.status !== 'pending') {
      return checkin;
    }

    handledCount += 1;

    if (status === 'approved') {
      const task = taskMap[checkin.taskId] || null;
      rewardPoints += Math.max(0, Number(task && task.points) || 0);
    }

    return Object.assign({}, checkin, {
      status,
      confirmedAt: now,
    });
  });

  let nextState = Object.assign({}, sourceState, {
    checkins: nextCheckins,
  });

  if (status === 'approved' && handledCount > 0) {
    const sourcePet = sourceState.pet || {};

    nextState = Object.assign({}, nextState, {
      points: Math.max(0, Number(sourceState.points) || 0) + rewardPoints,
      pet: Object.assign({}, sourcePet, {
        happiness: clampStat((Number(sourcePet.happiness) || 0) + handledCount),
        totalPointsEarned: Math.max(0, Number(sourcePet.totalPointsEarned) || 0) + rewardPoints,
      }),
    });
  }

  return {
    handledCount,
    rewardPoints,
    state: nextState,
  };
}

Page({
  data: {
    authMode: 'setup',
    isAuthed: false,
    pinValue: '',
    canSubmitPin: false,
    failedAttempts: 0,
    pendingCount: 0,
    pendingCheckins: [],
    taskCount: 0,
    enabledTaskCount: 0,
    tasks: [],
    customTaskCount: 0,
    customTaskFormVisible: false,
    customTaskDraft: {
      id: '',
      sourceType: 'custom',
      icon: CUSTOM_TASK_ICONS[0],
      label: '',
      startAt: '18:00',
      endAt: '19:00',
      points: 1,
      requireConfirm: true,
      enabled: true,
    },
    customTaskIcons: CUSTOM_TASK_ICONS,
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '家长模式',
    });
    this.syncPageState();
  },

  onShow() {
    this.syncPageState(null, {
      preserveAuth: this.data.isAuthed,
    });
  },

  onHide() {
    this.lockParentPanel();
  },

  onUnload() {
    this.lockParentPanel();
  },

  lockParentPanel() {
    const state = getState();
    const authMode = hasValidParentPin(state) ? 'verify' : 'setup';

    this.setData({
      authMode,
      isAuthed: false,
      pinValue: '',
      canSubmitPin: false,
      failedAttempts: 0,
    });
  },

  syncPageState(stateLike, options) {
    const state = stateLike || getState();

    if (!state.initialized) {
      wx.reLaunch({
        url: '/pages/onboarding/onboarding',
      });
      return;
    }

    const preserveAuth = !!(options && options.preserveAuth);
    const viewModel = buildPageViewModel(state, preserveAuth);

    this.setData({
      authMode: viewModel.authMode,
      isAuthed: viewModel.isAuthed,
      pinValue: '',
      canSubmitPin: false,
      failedAttempts: viewModel.isAuthed ? 0 : (viewModel.authMode === 'setup' ? 0 : this.data.failedAttempts),
      pendingCount: viewModel.pendingCount,
      pendingCheckins: viewModel.pendingCheckins,
      taskCount: viewModel.taskCount,
      enabledTaskCount: viewModel.enabledTaskCount,
      tasks: viewModel.tasks,
      customTaskCount: viewModel.customTaskCount,
    });
  },

  openCreateTaskForm() {
    if (this.data.authMode !== 'panel') {
      return;
    }

    this.setData({
      customTaskFormVisible: true,
      customTaskDraft: {
        id: '',
        sourceType: 'custom',
        icon: CUSTOM_TASK_ICONS[0],
        label: '',
        startAt: '18:00',
        endAt: '19:00',
        points: 1,
        requireConfirm: true,
        enabled: true,
      },
    });
  },

  closeCreateTaskForm() {
    this.setData({
      customTaskFormVisible: false,
    });
  },

  openEditTaskForm(event) {
    if (this.data.authMode !== 'panel') {
      return;
    }

    const taskId = event.currentTarget.dataset.taskId;
    const task = (this.data.tasks || []).find((item) => item.id === taskId);

    if (!task || task.sourceType !== 'custom') {
      return;
    }

    this.setData({
      customTaskFormVisible: true,
      customTaskDraft: {
        id: task.id,
        sourceType: 'custom',
        icon: task.icon || CUSTOM_TASK_ICONS[0],
        label: task.label || '',
        startAt: (task.scheduleLabel || '18:00-19:00').split('-')[0] || '18:00',
        endAt: (task.scheduleLabel || '18:00-19:00').split('-')[1] || '19:00',
        points: task.points || 1,
        requireConfirm: task.requireConfirm !== false,
        enabled: task.enabled !== false,
      },
    });
  },

  handleDraftLabelInput(event) {
    this.setData({
      'customTaskDraft.label': String(event.detail.value || '').slice(0, 12),
    });
  },

  handleDraftStartInput(event) {
    this.setData({
      'customTaskDraft.startAt': normalizeClockTime(event.detail.value, '18:00'),
    });
  },

  handleDraftEndInput(event) {
    this.setData({
      'customTaskDraft.endAt': normalizeClockTime(event.detail.value, '19:00'),
    });
  },

  handleDraftPointsInput(event) {
    const value = Math.max(1, Math.min(5, Number(event.detail.value) || 1));

    this.setData({
      'customTaskDraft.points': value,
    });
  },

  handleDraftRequireConfirmChange(event) {
    this.setData({
      'customTaskDraft.requireConfirm': !!(event.detail && event.detail.value),
    });
  },

  handleDraftEnabledChange(event) {
    this.setData({
      'customTaskDraft.enabled': !!(event.detail && event.detail.value),
    });
  },

  handleDraftIconTap(event) {
    const icon = event.currentTarget.dataset.icon;

    if (!icon) {
      return;
    }

    this.setData({
      'customTaskDraft.icon': icon,
    });
  },

  handleCreateTask() {
    if (this.data.authMode !== 'panel') {
      return;
    }

    const draft = this.data.customTaskDraft || {};
    const label = String(draft.label || '').trim();

    if (!label) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none',
      });
      return;
    }

    const now = Date.now();
    const taskId = draft.id || `custom_${now}`;
    const nextTask = normalizeTask({
      id: taskId,
      sourceType: 'custom',
      icon: draft.icon || CUSTOM_TASK_ICONS[0],
      label,
      points: draft.points,
      enabled: draft.enabled !== false,
      requireConfirm: draft.requireConfirm !== false,
      schedule: {
        period: 'anytime',
        startAt: normalizeClockTime(draft.startAt, '18:00'),
        endAt: normalizeClockTime(draft.endAt, '19:00'),
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      },
      promptText: `先去完成${label}吧`,
      sortOrder: 1000 + now,
      createdAt: now,
      updatedAt: now,
    });

    const savedState = upsertTask(nextTask, { now });

    syncGlobalState(savedState);
    this.syncPageState(savedState, {
      preserveAuth: true,
    });
    this.closeCreateTaskForm();

    wx.showToast({
      title: draft.id ? '自定义任务已更新' : '自定义任务已添加',
      icon: 'none',
    });
  },

  handleApproveOne(event) {
    this.applySingleReview(event.currentTarget.dataset, 'approved');
  },

  handleRejectOne(event) {
    this.applySingleReview(event.currentTarget.dataset, 'rejected');
  },

  applySingleReview(dataset, status) {
    if (this.data.authMode !== 'panel') {
      return;
    }

    const taskId = dataset.taskId;
    const date = dataset.date;
    const createdAt = Number(dataset.createdAt) || 0;
    const latestState = getState();
    const checkins = Array.isArray(latestState.checkins) ? latestState.checkins : [];
    const taskMap = getTaskMap(latestState.tasks);
    let rewardPoints = 0;
    let handledCount = 0;

    const nextCheckins = checkins.map((checkin) => {
      if (
        !checkin
        || checkin.status !== 'pending'
        || checkin.taskId !== taskId
        || checkin.date !== date
        || (Number(checkin.createdAt) || 0) !== createdAt
      ) {
        return checkin;
      }

      handledCount += 1;

      if (status === 'approved') {
        const task = taskMap[checkin.taskId] || null;
        rewardPoints += Math.max(0, Number(task && task.points) || 0);
      }

      return Object.assign({}, checkin, {
        status,
        confirmedAt: Date.now(),
      });
    });

    if (handledCount <= 0) {
      wx.showToast({
        title: '这条待审核任务已更新',
        icon: 'none',
      });
      return;
    }

    const sourcePet = latestState.pet || {};
    const savedState = saveState(Object.assign({}, latestState, {
      checkins: nextCheckins,
      points: status === 'approved'
        ? Math.max(0, Number(latestState.points) || 0) + rewardPoints
        : Math.max(0, Number(latestState.points) || 0),
      pet: status === 'approved'
        ? Object.assign({}, sourcePet, {
          happiness: clampStat((Number(sourcePet.happiness) || 0) + handledCount),
          totalPointsEarned: Math.max(0, Number(sourcePet.totalPointsEarned) || 0) + rewardPoints,
        })
        : sourcePet,
    }));

    syncGlobalState(savedState);
    this.syncPageState(savedState, {
      preserveAuth: true,
    });

    wx.showToast({
      title: status === 'approved' ? '已通过 1 项' : '已驳回 1 项',
      icon: 'none',
    });
  },

  handleDeleteTask(event) {
    if (this.data.authMode !== 'panel') {
      return;
    }

    const taskId = event.currentTarget.dataset.taskId;
    const task = (this.data.tasks || []).find((item) => item.id === taskId);

    if (!task || task.sourceType !== 'custom') {
      return;
    }

    wx.showModal({
      title: '删除任务',
      content: `确认删除“${task.label}”吗？`,
      confirmColor: '#c15465',
      success: (result) => {
        if (!result.confirm) {
          return;
        }

        const savedState = removeTask(taskId);
        syncGlobalState(savedState);
        this.syncPageState(savedState, {
          preserveAuth: true,
        });

        wx.showToast({
          title: '任务已删除',
          icon: 'none',
        });
      },
    });
  },

  handlePinInput(event) {
    const rawValue = event.detail && event.detail.value ? String(event.detail.value) : '';
    const pinValue = rawValue.replace(/\D/g, '').slice(0, 4);

    this.setData({
      pinValue,
      canSubmitPin: pinValue.length === 4,
    });
  },

  handlePinSubmit() {
    const pinValue = this.data.pinValue;

    if (!/^\d{4}$/.test(pinValue)) {
      wx.showToast({
        title: '请输入 4 位数字 PIN',
        icon: 'none',
      });
      return;
    }

    if (this.data.authMode === 'setup') {
      const state = getState();
      const savedState = saveState(Object.assign({}, state, {
        parentPin: pinValue,
      }));

      syncGlobalState(savedState);
      this.syncPageState(savedState, {
        preserveAuth: true,
      });

      wx.showToast({
        title: 'PIN 已设置',
        icon: 'none',
      });
      return;
    }

    const state = getState();

    if (state.parentPin === pinValue) {
      this.syncPageState(state, {
        preserveAuth: true,
      });

      wx.showToast({
        title: '验证通过',
        icon: 'none',
      });
      return;
    }

    const failedAttempts = this.data.failedAttempts + 1;

    this.setData({
      pinValue: '',
      canSubmitPin: false,
      failedAttempts,
    });

    wx.showToast({
      title: 'PIN 不正确',
      icon: 'none',
    });

    if (failedAttempts >= 3) {
      wx.showModal({
        title: '连续输错 3 次',
        content: '请确认家长 PIN 后再重试。',
        showCancel: false,
      });
    }
  },

  handleApproveAll() {
    this.confirmBulkReview('approved');
  },

  handleRejectAll() {
    this.confirmBulkReview('rejected');
  },

  confirmBulkReview(status) {
    if (this.data.authMode !== 'panel') {
      return;
    }

    if (this.data.pendingCount <= 0) {
      wx.showToast({
        title: '没有待审核任务',
        icon: 'none',
      });
      return;
    }

    const isApprove = status === 'approved';

    wx.showModal({
      title: isApprove ? '全部通过' : '全部驳回',
      content: isApprove
        ? `确认通过全部 ${this.data.pendingCount} 条待审核任务吗？`
        : `确认驳回全部 ${this.data.pendingCount} 条待审核任务吗？`,
      confirmColor: isApprove ? '#2e7a47' : '#cf5e6e',
      success: (result) => {
        if (!result.confirm) {
          return;
        }

        this.applyBulkReview(status);
      },
    });
  },

  applyBulkReview(status) {
    const latestState = getState();
    const result = resolvePendingCheckins(latestState, status, Date.now());

    if (result.handledCount <= 0) {
      this.syncPageState(latestState, {
        preserveAuth: true,
      });
      wx.showToast({
        title: '没有待审核任务',
        icon: 'none',
      });
      return;
    }

    const savedState = saveState(result.state);

    syncGlobalState(savedState);
    this.syncPageState(savedState, {
      preserveAuth: true,
    });

    wx.showToast({
      title: status === 'approved'
        ? `已通过 ${result.handledCount} 项`
        : `已驳回 ${result.handledCount} 项`,
      icon: 'none',
    });
  },

  handleTaskSwitchChange(event) {
    if (this.data.authMode !== 'panel') {
      return;
    }

    const taskId = event.currentTarget.dataset.taskId;
    const enabled = !!(event.detail && event.detail.value);
    const state = getState();
    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    let hasChanged = false;

    const nextTasks = tasks.map((task) => {
      if (!task || task.id !== taskId) {
        return task;
      }

      hasChanged = true;
      return Object.assign({}, task, {
        enabled,
      });
    });

    if (!hasChanged) {
      return;
    }

    const savedState = saveState(Object.assign({}, state, {
      tasks: nextTasks,
    }));

    syncGlobalState(savedState);
    this.syncPageState(savedState, {
      preserveAuth: true,
    });
  },
});
