const {
  initializeState,
} = require('./utils/state');

App({
  globalData: {
    state: null,
  },

  onLaunch() {
    this.globalData.state = initializeState();
  },
});
