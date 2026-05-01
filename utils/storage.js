const STORAGE_KEY = 'petpal_state';

function isStateLike(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getStoredState() {
  try {
    const state = wx.getStorageSync(STORAGE_KEY);
    return isStateLike(state) ? state : null;
  } catch (error) {
    return null;
  }
}

function setStoredState(state) {
  if (!isStateLike(state)) {
    return false;
  }

  try {
    wx.setStorageSync(STORAGE_KEY, state);
    return true;
  } catch (error) {
    return false;
  }
}

function clearStoredState() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  STORAGE_KEY,
  clearStoredState,
  getStoredState,
  setStoredState,
};
