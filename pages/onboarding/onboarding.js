const {
  getState,
  saveState,
} = require('../../utils/state');
const { decayState } = require('../../utils/decay');

const DEFAULT_PET_NAME = '旺财';

function getSafePetName(name) {
  const trimmedName = String(name || '').trim();
  return trimmedName || DEFAULT_PET_NAME;
}

Page({
  data: {
    name: DEFAULT_PET_NAME,
    submitting: false,
  },

  onLoad() {
    this.syncFromState();
  },

  onShow() {
    this.syncFromState();
  },

  syncFromState() {
    const state = getState();

    if (state.initialized) {
      wx.reLaunch({
        url: '/pages/index/index',
      });
      return;
    }

    this.setData({
      name: getSafePetName(state.pet && state.pet.name),
      submitting: false,
    });
  },

  handleNameInput(event) {
    this.setData({
      name: String(event.detail.value || '').slice(0, 12),
    });
  },

  handleSubmit() {
    if (this.data.submitting) {
      return;
    }

    const now = Date.now();
    const state = decayState(getState(), now);
    const petName = getSafePetName(this.data.name);
    const nextState = saveState(Object.assign({}, state, {
      initialized: true,
      pet: Object.assign({}, state.pet, {
        name: petName,
        lastDecayAt: now,
      }),
    }));
    const app = getApp();

    if (app && app.globalData) {
      app.globalData.state = nextState;
    }

    this.setData({
      submitting: true,
      name: petName,
    });

    wx.reLaunch({
      url: '/pages/index/index',
    });
  },
});
