Component({
  properties: {
    icon: {
      type: String,
      value: '',
    },
    label: {
      type: String,
      value: '',
    },
    value: {
      type: Number,
      value: 0,
    },
    max: {
      type: Number,
      value: 10,
    },
    color: {
      type: String,
      value: '#ffb43c',
    },
  },

  data: {
    fillStyle: '',
    ratio: 0,
  },

  lifetimes: {
    attached() {
      this.syncFillStyle();
    },
  },

  observers: {
    'value,max,color': function observeBarProps() {
      this.syncFillStyle();
    },
  },

  methods: {
    syncFillStyle() {
      const max = this.properties.max > 0 ? this.properties.max : 10;
      const value = Math.max(0, Math.min(max, Number(this.properties.value) || 0));
      const ratio = Math.round((value / max) * 100);

      this.setData({
        ratio,
        fillStyle: `width:${ratio}%;background:${this.properties.color};`,
      });
    },
  },
});
