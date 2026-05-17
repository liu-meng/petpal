const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const ALL_WEEK_DAYS = WEEKDAY_ORDER.slice();
const DEFAULT_SCHEDULE = {
  period: 'anytime',
  startAt: '00:00',
  endAt: '23:59',
  daysOfWeek: ALL_WEEK_DAYS,
};

const PERIOD_LABELS = {
  morning: '早晨',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  bedtime: '睡前',
  anytime: '今天',
};

const TASK_STATUS_ORDER = {
  ready: 0,
  overdue: 1,
  upcoming: 2,
  rejected: 3,
  pending: 4,
  approved: 5,
};

const PRESET_TASK_DEFINITIONS = {
  brushTeeth: {
    id: 'brushTeeth',
    sourceType: 'preset',
    icon: '🪥',
    label: '刷牙',
    points: 1,
    enabled: true,
    requireConfirm: true,
    schedule: {
      period: 'morning',
      startAt: '07:00',
      endAt: '09:00',
      daysOfWeek: ALL_WEEK_DAYS,
    },
    promptText: '先去刷牙吧',
    sortOrder: 10,
  },
  eatMeal: {
    id: 'eatMeal',
    sourceType: 'preset',
    icon: '🍚',
    label: '吃饭',
    points: 1,
    enabled: true,
    requireConfirm: true,
    schedule: {
      period: 'evening',
      startAt: '17:30',
      endAt: '19:30',
      daysOfWeek: ALL_WEEK_DAYS,
    },
    promptText: '先把饭吃完吧',
    sortOrder: 20,
  },
  sleepOnTime: {
    id: 'sleepOnTime',
    sourceType: 'preset',
    icon: '🛏️',
    label: '按时睡觉',
    points: 1,
    enabled: true,
    requireConfirm: true,
    schedule: {
      period: 'bedtime',
      startAt: '20:00',
      endAt: '21:30',
      daysOfWeek: ALL_WEEK_DAYS,
    },
    promptText: '准备按时睡觉啦',
    sortOrder: 30,
  },
  readBook: {
    id: 'readBook',
    sourceType: 'preset',
    icon: '📚',
    label: '读绘本',
    points: 1,
    enabled: true,
    requireConfirm: true,
    schedule: {
      period: 'bedtime',
      startAt: '19:30',
      endAt: '20:30',
      daysOfWeek: ALL_WEEK_DAYS,
    },
    promptText: '先读绘本吧',
    sortOrder: 40,
  },
  tidyToys: {
    id: 'tidyToys',
    sourceType: 'preset',
    icon: '🧹',
    label: '整理玩具',
    points: 1,
    enabled: true,
    requireConfirm: true,
    schedule: {
      period: 'evening',
      startAt: '18:30',
      endAt: '20:00',
      daysOfWeek: ALL_WEEK_DAYS,
    },
    promptText: '先把玩具整理好吧',
    sortOrder: 50,
  },
  bathe: {
    id: 'bathe',
    sourceType: 'preset',
    icon: '🚿',
    label: '洗澡',
    points: 1,
    enabled: false,
    requireConfirm: true,
    schedule: {
      period: 'bedtime',
      startAt: '19:00',
      endAt: '20:30',
      daysOfWeek: ALL_WEEK_DAYS,
    },
    promptText: '准备去洗澡吧',
    sortOrder: 60,
  },
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clampInteger(value, fallback) {
  const nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return Math.max(0, Math.round(nextValue));
}

function normalizeClockTime(value, fallback) {
  const rawValue = String(value || '').trim();
  const match = rawValue.match(/^(\d{1,2}):(\d{1,2})$/);

  if (!match) {
    return fallback;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return fallback;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return fallback;
  }

  return `${pad(hours)}:${pad(minutes)}`;
}

function parseClockTime(value) {
  const normalizedTime = normalizeClockTime(value, '');

  if (!normalizedTime) {
    return null;
  }

  const [hours, minutes] = normalizedTime.split(':').map(Number);
  return hours * 60 + minutes;
}

function getMinutesOfDay(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike || Date.now());

  return (date.getHours() * 60) + date.getMinutes();
}

function getWeekday(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike || Date.now());
  return date.getDay();
}

function normalizeDaysOfWeek(daysOfWeek) {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length <= 0) {
    return ALL_WEEK_DAYS.slice();
  }

  const normalizedDays = [];

  daysOfWeek.forEach((item) => {
    const day = Number(item);

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return;
    }

    if (!normalizedDays.includes(day)) {
      normalizedDays.push(day);
    }
  });

  return normalizedDays.length > 0 ? normalizedDays : ALL_WEEK_DAYS.slice();
}

function normalizeSchedule(schedule, fallbackSchedule) {
  const source = isObject(schedule) ? schedule : {};
  const fallback = isObject(fallbackSchedule) ? fallbackSchedule : DEFAULT_SCHEDULE;
  const startAt = normalizeClockTime(source.startAt, normalizeClockTime(fallback.startAt, DEFAULT_SCHEDULE.startAt));
  const endAt = normalizeClockTime(source.endAt, normalizeClockTime(fallback.endAt, DEFAULT_SCHEDULE.endAt));
  const startMinutes = parseClockTime(startAt);
  const endMinutes = parseClockTime(endAt);

  return {
    period: source.period || fallback.period || DEFAULT_SCHEDULE.period,
    startAt,
    endAt: startMinutes != null && endMinutes != null && endMinutes >= startMinutes
      ? endAt
      : normalizeClockTime(fallback.endAt, DEFAULT_SCHEDULE.endAt),
    daysOfWeek: normalizeDaysOfWeek(source.daysOfWeek || fallback.daysOfWeek),
  };
}

function getPresetTaskDefinition(taskId) {
  const preset = PRESET_TASK_DEFINITIONS[taskId];
  return preset ? Object.assign({}, preset, {
    schedule: Object.assign({}, preset.schedule, {
      daysOfWeek: normalizeDaysOfWeek(preset.schedule && preset.schedule.daysOfWeek),
    }),
  }) : null;
}

function createDefaultTasks() {
  return Object.keys(PRESET_TASK_DEFINITIONS)
    .map((taskId, index) => normalizeTask(getPresetTaskDefinition(taskId), index));
}

function normalizeTask(task, index) {
  const source = isObject(task) ? task : {};
  const preset = source.id ? getPresetTaskDefinition(source.id) : null;
  const fallbackLabel = source.label || (preset && preset.label) || '新任务';
  const fallbackPrompt = `先去完成${fallbackLabel}吧`;
  const sortOrder = clampInteger(
    Object.prototype.hasOwnProperty.call(source, 'sortOrder') ? source.sortOrder : (preset && preset.sortOrder),
    (index + 1) * 10
  );

  return {
    id: source.id || (preset && preset.id) || `custom_${index}`,
    sourceType: source.sourceType || (preset ? 'preset' : 'custom'),
    icon: source.icon || (preset && preset.icon) || '📝',
    label: fallbackLabel,
    points: clampInteger(
      Object.prototype.hasOwnProperty.call(source, 'points') ? source.points : (preset && preset.points),
      1
    ),
    enabled: Object.prototype.hasOwnProperty.call(source, 'enabled')
      ? source.enabled !== false
      : !preset || preset.enabled !== false,
    requireConfirm: Object.prototype.hasOwnProperty.call(source, 'requireConfirm')
      ? source.requireConfirm !== false
      : !preset || preset.requireConfirm !== false,
    schedule: normalizeSchedule(source.schedule, preset && preset.schedule),
    promptText: String(source.promptText || (preset && preset.promptText) || fallbackPrompt),
    sortOrder,
    createdAt: clampInteger(source.createdAt, 0),
    updatedAt: clampInteger(source.updatedAt, 0),
  };
}

function normalizeTaskList(tasks) {
  if (!Array.isArray(tasks) || tasks.length <= 0) {
    return createDefaultTasks();
  }

  return tasks.map((task, index) => normalizeTask(task, index));
}

function isTaskScheduledForDate(task, dateLike) {
  const sourceTask = task || {};
  const schedule = normalizeSchedule(sourceTask.schedule, DEFAULT_SCHEDULE);
  return schedule.daysOfWeek.includes(getWeekday(dateLike));
}

function getTaskTimeWindow(task, dateLike) {
  const sourceTask = task || {};
  const schedule = normalizeSchedule(sourceTask.schedule, DEFAULT_SCHEDULE);
  const startMinutes = parseClockTime(schedule.startAt);
  const endMinutes = parseClockTime(schedule.endAt);

  return {
    period: schedule.period,
    periodLabel: PERIOD_LABELS[schedule.period] || PERIOD_LABELS.anytime,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    startMinutes: startMinutes == null ? 0 : startMinutes,
    endMinutes: endMinutes == null ? (23 * 60) + 59 : Math.max(endMinutes, startMinutes == null ? 0 : startMinutes),
  };
}

function getTaskDisplayTime(task) {
  const timeWindow = getTaskTimeWindow(task);

  if (timeWindow.period === 'anytime') {
    return timeWindow.periodLabel;
  }

  return `${timeWindow.periodLabel} ${timeWindow.startAt}-${timeWindow.endAt}`;
}

function getTaskDerivedStatus(task, checkin, dateLike) {
  if (checkin && checkin.status) {
    return checkin.status;
  }

  const timeWindow = getTaskTimeWindow(task, dateLike);
  const currentMinutes = getMinutesOfDay(dateLike);

  if (currentMinutes < timeWindow.startMinutes) {
    return 'upcoming';
  }

  if (currentMinutes > timeWindow.endMinutes) {
    return 'overdue';
  }

  return 'ready';
}

function getTaskGroup(status) {
  if (status === 'ready' || status === 'overdue') {
    return 'now';
  }

  if (status === 'upcoming') {
    return 'later';
  }

  return 'done';
}

function getTaskStatusMeta(status) {
  if (status === 'pending') {
    return {
      badgeClass: 'is-pending',
      badgeIcon: '⏳',
      badgeLabel: '待确认',
      helperText: '等家长确认',
      actionLabel: '等家长确认',
      canCheckin: false,
    };
  }

  if (status === 'approved') {
    return {
      badgeClass: 'is-approved',
      badgeIcon: '✓',
      badgeLabel: '已完成',
      helperText: '今天完成啦',
      actionLabel: '今天完成',
      canCheckin: false,
    };
  }

  if (status === 'rejected') {
    return {
      badgeClass: 'is-rejected',
      badgeIcon: '↺',
      badgeLabel: '重新完成',
      helperText: '可以重新提交',
      actionLabel: '重新完成',
      canCheckin: true,
    };
  }

  if (status === 'upcoming') {
    return {
      badgeClass: 'is-upcoming',
      badgeIcon: '◔',
      badgeLabel: '稍后再做',
      helperText: '还没到时间',
      actionLabel: '稍后再做',
      canCheckin: false,
    };
  }

  if (status === 'overdue') {
    return {
      badgeClass: 'is-overdue',
      badgeIcon: '!',
      badgeLabel: '现在补做',
      helperText: '现在补上也可以',
      actionLabel: '去完成',
      canCheckin: true,
    };
  }

  return {
    badgeClass: 'is-ready',
    badgeIcon: '●',
    badgeLabel: '现在去做',
    helperText: '现在正适合完成',
    actionLabel: '去完成',
    canCheckin: true,
  };
}

function compareTasks(a, b) {
  const firstStatusRank = Object.prototype.hasOwnProperty.call(TASK_STATUS_ORDER, a.status)
    ? TASK_STATUS_ORDER[a.status]
    : 99;
  const secondStatusRank = Object.prototype.hasOwnProperty.call(TASK_STATUS_ORDER, b.status)
    ? TASK_STATUS_ORDER[b.status]
    : 99;

  if (firstStatusRank !== secondStatusRank) {
    return firstStatusRank - secondStatusRank;
  }

  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }

  return String(a.label || '').localeCompare(String(b.label || ''), 'zh-Hans-CN');
}

function buildTaskViewModel(task, checkin, dateLike) {
  const normalizedTask = normalizeTask(task, 0);
  const status = getTaskDerivedStatus(normalizedTask, checkin, dateLike);
  const statusMeta = getTaskStatusMeta(status);
  const timeWindow = getTaskTimeWindow(normalizedTask, dateLike);

  return Object.assign({}, normalizedTask, statusMeta, {
    status,
    group: getTaskGroup(status),
    scheduleLabel: getTaskDisplayTime(normalizedTask),
    period: timeWindow.period,
    periodLabel: timeWindow.periodLabel,
    startAt: timeWindow.startAt,
    endAt: timeWindow.endAt,
  });
}

function getTaskCheckinForDate(checkins, taskId, dateKey) {
  const sourceCheckins = Array.isArray(checkins) ? checkins : [];

  for (let index = sourceCheckins.length - 1; index >= 0; index -= 1) {
    const checkin = sourceCheckins[index];

    if (checkin && checkin.taskId === taskId && checkin.date === dateKey) {
      return checkin;
    }
  }

  return null;
}

function buildTaskCollections(tasks, checkins, dateLike) {
  const sourceTasks = normalizeTaskList(tasks);
  const sourceCheckins = Array.isArray(checkins) ? checkins : [];
  const currentDate = dateLike instanceof Date ? dateLike : new Date(dateLike || Date.now());
  const dateKey = [
    currentDate.getFullYear(),
    pad(currentDate.getMonth() + 1),
    pad(currentDate.getDate()),
  ].join('-');

  const visibleTasks = sourceTasks
    .filter((task) => task && task.enabled && isTaskScheduledForDate(task, currentDate))
    .map((task) => buildTaskViewModel(
      task,
      getTaskCheckinForDate(sourceCheckins, task.id, dateKey),
      currentDate
    ))
    .sort(compareTasks);

  const groups = {
    now: visibleTasks.filter((task) => task.group === 'now'),
    later: visibleTasks.filter((task) => task.group === 'later'),
    done: visibleTasks.filter((task) => task.group === 'done'),
  };

  const recommendedTask = groups.now.find((task) => task.status === 'ready' || task.status === 'overdue')
    || groups.later[0]
    || null;

  return {
    dateKey,
    tasks: visibleTasks,
    groups,
    recommendedTask,
    counts: {
      total: visibleTasks.length,
      ready: visibleTasks.filter((task) => task.status === 'ready').length,
      overdue: visibleTasks.filter((task) => task.status === 'overdue').length,
      upcoming: visibleTasks.filter((task) => task.status === 'upcoming').length,
      pending: visibleTasks.filter((task) => task.status === 'pending').length,
      approved: visibleTasks.filter((task) => task.status === 'approved').length,
      rejected: visibleTasks.filter((task) => task.status === 'rejected').length,
      actionable: visibleTasks.filter((task) => task.canCheckin).length,
    },
  };
}

module.exports = {
  ALL_WEEK_DAYS,
  DEFAULT_SCHEDULE,
  PERIOD_LABELS,
  PRESET_TASK_DEFINITIONS,
  TASK_STATUS_ORDER,
  buildTaskCollections,
  buildTaskViewModel,
  compareTasks,
  createDefaultTasks,
  getMinutesOfDay,
  getTaskCheckinForDate,
  getTaskDerivedStatus,
  getTaskDisplayTime,
  getTaskGroup,
  getTaskStatusMeta,
  getTaskTimeWindow,
  getWeekday,
  isTaskScheduledForDate,
  normalizeClockTime,
  normalizeDaysOfWeek,
  normalizeSchedule,
  normalizeTask,
  normalizeTaskList,
  parseClockTime,
};
