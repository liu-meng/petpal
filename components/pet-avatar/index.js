const { getPetRenderModel } = require('../../utils/pet-renderer');

Component({
  properties: {
    species: {
      type: String,
      value: 'dog',
    },
    mood: {
      type: String,
      value: '',
    },
    action: {
      type: String,
      value: 'idle',
    },
    hunger: {
      type: Number,
      value: 10,
    },
    happiness: {
      type: Number,
      value: 10,
    },
    size: {
      type: Number,
      value: 180,
    },
  },

  data: {
    renderModel: null,
    shellStyle: '',
  },

  lifetimes: {
    attached() {
      this.syncRenderModel();
    },
  },

  observers: {
    'species,mood,action,hunger,happiness,size': function observeProps() {
      this.syncRenderModel();
    },
  },

  methods: {
    onLayerLoad(event) {
      this.setLayerFallback(event.currentTarget.dataset.key, false);
    },

    onLayerError(event) {
      this.setLayerFallback(event.currentTarget.dataset.key, true);
    },

    setLayerFallback(layerKey, useFallback) {
      const layers = (this.data.renderModel && this.data.renderModel.layers) || [];
      const targetIndex = layers.findIndex((layer) => layer.key === layerKey);

      if (targetIndex < 0) {
        return;
      }

      const path = `renderModel.layers[${targetIndex}].useFallback`;
      this.setData({
        [path]: useFallback,
      });
    },

    syncRenderModel() {
      const renderModel = getPetRenderModel({
        species: this.properties.species,
        mood: this.properties.mood,
        action: this.properties.action,
        hunger: this.properties.hunger,
        happiness: this.properties.happiness,
      });
      const shellStyle = `width:${this.properties.size}rpx;height:${this.properties.size}rpx;`;

      this.setData({
        renderModel,
        shellStyle,
      });
    },
  },
});
