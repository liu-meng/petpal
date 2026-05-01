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
    costLabel: {
      type: String,
      value: '',
    },
    action: {
      type: String,
      value: '',
    },
    disabled: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    handleTap() {
      this.triggerEvent('tapaction', {
        action: this.properties.action,
        disabled: this.properties.disabled,
      });
    },
  },
});
