// custom-tab-bar/index.js
// 自定义 TabBar 组件 - 支持动画与状态提示

const {
  buildTaskCollections,
} = require('../utils/task-schedule');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    animations: [],
    list: [
      {
        pagePath: '/pages/tasks/tasks',
        text: '做什么',
        iconPath: '/assets/tab-icons/tasks.png',
        selectedIconPath: '/assets/tab-icons/tasks-active.png',
        badge: 0,
        hasDot: false,
        needsCare: false
      },
      {
        pagePath: '/pages/index/index',
        text: '宠物',
        iconPath: '/assets/tab-icons/pet.png',
        selectedIconPath: '/assets/tab-icons/pet-active.png',
        badge: 0,
        hasDot: false,
        needsCare: false
      },
      {
        pagePath: '/pages/parent/parent',
        text: '爸爸妈妈',
        iconPath: '/assets/tab-icons/parent.png',
        selectedIconPath: '/assets/tab-icons/parent-active.png',
        badge: 0,
        hasDot: false,
        needsCare: false
      }
    ]
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this._initAnimations();
      this._updateIndicators();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化点击动画
     */
    _initAnimations() {
      const animations = this.data.list.map(() => null);
      this.setData({ animations });
    },

    /**
     * 切换 Tab
     */
    switchTab(e) {
      const { path } = e.currentTarget.dataset;
      const index = Number(e.currentTarget.dataset.index);
      const selected = this.data.selected;

      // 避免重复点击当前 tab
      if (selected === index) {
        return;
      }

      // 播放点击动画
      this._playClickAnimation(index);
      this.setData({ selected: index });

      // 切换页面
      wx.switchTab({
        url: path,
        fail: (err) => {
          this.setData({ selected });
          console.error('[TabBar] switchTab failed:', err);
        }
      });
    },

    /**
     * 播放点击缩放动画
     */
    _playClickAnimation(index) {
      const animation = wx.createAnimation({
        duration: 200,
        timingFunction: 'ease-out'
      });

      // 缩放动画：1.0 → 0.85 → 1.0
      animation.scale(0.85).step({ duration: 100 });
      animation.scale(1.0).step({ duration: 100 });

      const animations = [...this.data.animations];
      animations[index] = animation.export();
      this.setData({ animations });
    },

    /**
     * 更新 tab 状态提示。
     */
    _updateIndicators() {
      try {
        const state = wx.getStorageSync('petpal_state') || {};
        const checkins = Array.isArray(state.checkins) ? state.checkins : [];
        const pendingCount = checkins.filter((checkin) => checkin && checkin.status === 'pending').length;
        const collections = buildTaskCollections(
          Array.isArray(state.tasks) ? state.tasks : [],
          checkins,
          Date.now()
        );
        const todoCount = collections.counts.actionable;
        const pet = state.pet || {};
        const petNeedsCare = !!state.initialized && (
          Number(pet.hunger) <= 3 || Number(pet.happiness) <= 3
        );
        const list = [...this.data.list];

        list[0] = Object.assign({}, list[0], {
          badge: 0,
          hasDot: todoCount > 0,
          needsCare: false
        });
        list[1] = Object.assign({}, list[1], {
          badge: 0,
          hasDot: false,
          needsCare: petNeedsCare
        });
        list[2] = Object.assign({}, list[2], {
          badge: pendingCount,
          hasDot: false,
          needsCare: false
        });

        this.setData({ list });
      } catch (err) {
        console.error('[TabBar] 更新状态提示失败:', err);
      }
    },

    /**
     * 对外暴露：更新状态提示。
     * 页面可以继续通过 this.getTabBar().updateBadge() 调用。
     */
    updateIndicators() {
      this._updateIndicators();
    },

    updateBadge() {
      this._updateIndicators();
    }
  }
});
