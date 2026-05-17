const STORAGE_KEY = 'petpal_state';
let memoryState = null;

function isStateLike(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getStoredState() {
  if (typeof wx === 'undefined' || !wx || typeof wx.getStorageSync !== 'function') {
    return isStateLike(memoryState) ? memoryState : null;
  }

  try {
    const state = wx.getStorageSync(STORAGE_KEY);
    return isStateLike(state) ? state : null;
  } catch (error) {
    return isStateLike(memoryState) ? memoryState : null;
  }
}

function setStoredState(state) {
  if (!isStateLike(state)) {
    return false;
  }

  if (typeof wx === 'undefined' || !wx || typeof wx.setStorageSync !== 'function') {
    memoryState = state;
    return true;
  }

  try {
    wx.setStorageSync(STORAGE_KEY, state);
    memoryState = state;
    return true;
  } catch (error) {
    memoryState = state;
    return true;
  }
}

function clearStoredState() {
  memoryState = null;

  if (typeof wx === 'undefined' || !wx || typeof wx.removeStorageSync !== 'function') {
    return true;
  }

  try {
    wx.removeStorageSync(STORAGE_KEY);
    return true;
  } catch (error) {
    return true;
  }
}

module.exports = {
  STORAGE_KEY,
  clearStoredState,
  getStoredState,
  setStoredState,
};
