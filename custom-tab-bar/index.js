// custom-tab-bar/index.js
// 自定义 TabBar 组件 - 支持动画与角标

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前选中的 tab 索引（由页面 onShow 设置）
    selected: {
      type: Number,
      value: 0,
      observer(newVal) {
        this.setData({ selected: newVal });
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    animations: [], // 动画实例数组
    list: [
      {
        pagePath: '/pages/tasks/tasks',
        text: '任务',
        iconPath: '/assets/tab-icons/tasks.png?v=7',
        selectedIconPath: '/assets/tab-icons/tasks-active.png?v=7',
        badge: 0 // 角标数量
      },
      {
        pagePath: '/pages/index/index',
        text: '宠物',
        iconPath: '/assets/tab-icons/pet.png?v=7',
        selectedIconPath: '/assets/tab-icons/pet-active.png?v=7',
        badge: 0
      },
      {
        pagePath: '/pages/parent/parent',
        text: '家长',
        iconPath: '/assets/tab-icons/parent.png?v=7',
        selectedIconPath: '/assets/tab-icons/parent-active.png?v=7',
        badge: 0
      }
    ]
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件挂载后，初始化动画
      this._initAnimations();
      
      // 读取角标数据（待审核任务数量）
      this._updateBadge();
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
      // 预创建动画（实际点击时再启动）
      const animations = this.data.list.map((_, index) => null);
      this.setData({ animations });
    },

    /**
     * 切换 Tab
     */
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      const selected = this.data.selected;
      
      // 避免重复点击当前 tab
      if (selected === index) {
        return;
      }

      // 播放点击动画
      this._playClickAnimation(index);

      // 切换页面
      wx.switchTab({
        url: path,
        fail(err) {
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
     * 更新角标（待审核任务数量）
     */
    _updateBadge() {
      try {
        const state = wx.getStorageSync('petpal_state') || {};
        const checkinHistory = state.checkinHistory || [];
        
        // 统计 pending 状态的打卡数量
        const pendingCount = checkinHistory.filter(c => c.status === 'pending').length;
        
        // 更新任务 tab 的角标
        const list = [...this.data.list];
        list[0].badge = pendingCount; // 任务 tab 显示待审核数量
        
        this.setData({ list });
      } catch (err) {
        console.error('[TabBar] 更新角标失败:', err);
      }
    },

    /**
     * 对外暴露：更新角标
     * 页面可以通过 this.getTabBar().updateBadge() 调用
     */
    updateBadge() {
      this._updateBadge();
    }
  }
});
