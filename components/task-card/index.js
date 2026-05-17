Component({
  properties: {
    task: {
      type: Object,
      value: null,
    },
    highlighted: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    handleTap() {
      const task = this.properties.task || {};

      this.triggerEvent('taptask', {
        taskId: task.id || '',
      });
    },
  },
});
