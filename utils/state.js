const {
  clearStoredState,
  getStoredState,
  setStoredState,
} = require('./storage');
const {
  formatDate,
} = require('./time');

const DEFAULT_TASKS = [
  { id: 'brushTeeth', icon: '🪥', label: '刷牙', points: 1, enabled: true, requireConfirm: true },
  { id: 'eatMeal', icon: '🍚', label: '吃饭', points: 1, enabled: true, requireConfirm: true },
  { id: 'sleepOnTime', icon: '🛏️', label: '按时睡觉', points: 1, enabled: true, requireConfirm: true },
  { id: 'readBook', icon: '📚', label: '读绘本', points: 1, enabled: true, requireConfirm: true },
  { id: 'tidyToys', icon: '🧹', label: '整理玩具', points: 1, enabled: true, requireConfirm: true },
  { id: 'bathe', icon: '🚿', label: '洗澡', points: 1, enabled: false, requireConfirm: true },
];

function cloneTasks(tasks) {
  return tasks.map((task) => Object.assign({}, task));
}

function createDefaultState(now) {
  const timestamp = typeof now === 'number' ? now : Date.now();
  const createdAt = new Date(timestamp).toISOString();

  return {
    initialized: false,
    createdAt,
    pet: {
      name: '旺财',
      type: 'dog',
      stage: 'adult',
      hunger: 10,
      happiness: 10,
      totalPointsEarned: 0,
      lastDecayAt: timestamp,
    },
    points: 0,
    tasks: cloneTasks(DEFAULT_TASKS),
    checkins: [],
    achievements: [],
    parentPin: null,
    settings: {
      decaySpeed: 'relaxed',
      soundEnabled: true,
    },
  };
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeState(state) {
  const defaultState = createDefaultState();
  const source = isObject(state) ? state : {};
  const sourcePet = isObject(source.pet) ? source.pet : {};
  const sourceSettings = isObject(source.settings) ? source.settings : {};

  return Object.assign({}, defaultState, source, {
    pet: Object.assign({}, defaultState.pet, sourcePet),
    tasks: Array.isArray(source.tasks) ? source.tasks : defaultState.tasks,
    checkins: Array.isArray(source.checkins) ? source.checkins : defaultState.checkins,
    achievements: Array.isArray(source.achievements) ? source.achievements : defaultState.achievements,
    settings: Object.assign({}, defaultState.settings, sourceSettings),
    parentPin: Object.prototype.hasOwnProperty.call(source, 'parentPin') ? source.parentPin : defaultState.parentPin,
  });
}

function saveState(nextState) {
  const normalizedState = normalizeState(nextState);
  setStoredState(normalizedState);
  return normalizedState;
}

function getState() {
  return normalizeState(getStoredState());
}

function initializeState() {
  const storedState = getStoredState();

  if (storedState) {
    return saveState(storedState);
  }

  const initialState = createDefaultState();
  setStoredState(initialState);
  return initialState;
}

function resetState() {
  clearStoredState();
  const initialState = createDefaultState();
  setStoredState(initialState);
  return initialState;
}

function getTodayCheckins(dateLike) {
  const state = getState();
  const targetDate = formatDate(dateLike || Date.now());

  return state.checkins.filter((checkin) => checkin && checkin.date === targetDate);
}

function getTaskCheckin(taskId, dateLike, stateLike) {
  const state = stateLike ? normalizeState(stateLike) : getState();
  const targetDate = formatDate(dateLike || Date.now());
  const checkins = Array.isArray(state.checkins) ? state.checkins : [];

  for (let index = checkins.length - 1; index >= 0; index -= 1) {
    const checkin = checkins[index];

    if (checkin && checkin.taskId === taskId && checkin.date === targetDate) {
      return checkin;
    }
  }

  return null;
}

function getTodayTaskStatus(taskId, dateLike) {
  return getTaskCheckin(taskId, dateLike);
}

function setTaskCheckinStatus(taskId, status, options) {
  const config = isObject(options) ? options : {};
  const now = typeof config.now === 'number' ? config.now : Date.now();
  const targetDate = formatDate(
    Object.prototype.hasOwnProperty.call(config, 'dateLike') ? config.dateLike : now
  );
  const state = getState();
  const checkins = Array.isArray(state.checkins)
    ? state.checkins.map((checkin) => Object.assign({}, checkin))
    : [];
  let checkinIndex = -1;

  for (let index = checkins.length - 1; index >= 0; index -= 1) {
    const checkin = checkins[index];

    if (checkin && checkin.taskId === taskId && checkin.date === targetDate) {
      checkinIndex = index;
      break;
    }
  }
  const previousCheckin = checkinIndex >= 0 ? checkins[checkinIndex] : null;
  const hasCreatedAt = Object.prototype.hasOwnProperty.call(config, 'createdAt');
  const hasConfirmedAt = Object.prototype.hasOwnProperty.call(config, 'confirmedAt');

  const nextCheckin = Object.assign({}, previousCheckin, {
    taskId,
    date: targetDate,
    status,
    createdAt: hasCreatedAt
      ? config.createdAt
      : (
        previousCheckin &&
        typeof previousCheckin.createdAt === 'number' &&
        !(status === 'pending' && previousCheckin.status === 'rejected')
      )
        ? previousCheckin.createdAt
        : now,
    confirmedAt: status === 'pending'
      ? null
      : hasConfirmedAt
        ? config.confirmedAt
        : now,
  });

  if (checkinIndex >= 0) {
    checkins[checkinIndex] = nextCheckin;
  } else {
    checkins.push(nextCheckin);
  }

  return saveState(Object.assign({}, state, {
    checkins,
  }));
}

module.exports = {
  DEFAULT_TASKS,
  createDefaultState,
  getState,
  getTaskCheckin,
  getTodayCheckins,
  getTodayTaskStatus,
  initializeState,
  resetState,
  saveState,
  setTaskCheckinStatus,
};
