const {
  getPetRenderModel,
  getResolvedMood,
} = require('../../utils/pet-renderer');

const DEFAULT_RENDER_SIZE = 180;
const LOW_END_BENCHMARK_LEVEL = 10;
const RIG_DRAW_RATIO = 0.96;
const STAGE_LAYOUT = {
  anchorX: 0.5,
  anchorY: 0.66,
};
const BODY_LAYOUT = {
  pivotX: 0.5,
  pivotY: 0.68,
};
const HEAD_LAYOUT = {
  pivotX: 0.5,
  pivotY: 0.54,
};
const TAIL_LAYOUT = {
  width: 105 / 420,
  height: 109 / 420,
  originX: (38 - 210) / 420,
  originY: (170 - 210) / 420,
  pivotX: 69 / 105,
  pivotY: 54 / 109,
};
const IDLE_LOCOMOTION_PROFILE = {
  excited: {
    travel: 0.016,
    bob: 0.018,
    sway: 0.04,
    pace: 2600,
    tail: 0.44,
  },
  normal: {
    travel: 0.012,
    bob: 0.014,
    sway: 0.03,
    pace: 3200,
    tail: 0.3,
  },
  sad: {
    travel: 0.008,
    bob: 0.01,
    sway: 0.018,
    pace: 4200,
    tail: 0.14,
  },
  sick: {
    travel: 0.004,
    bob: 0.008,
    sway: 0.012,
    pace: 5200,
    tail: 0.08,
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(value) {
  return 0.5 - Math.cos(clamp(value, 0, 1) * Math.PI) / 2;
}

function createRandomRange(min, max) {
  return min + Math.random() * (max - min);
}

function getCurrentPoint(event) {
  const touches = (event && event.changedTouches && event.changedTouches.length)
    ? event.changedTouches
    : (event && event.touches) || [];
  const point = touches[0] || event && event.detail || {};

  return {
    x: point.pageX != null ? point.pageX : point.x,
    y: point.pageY != null ? point.pageY : point.y,
  };
}

Component({
  properties: {
    species: {
      type: String,
      value: 'dog',
    },
    mood: {
      type: String,
      value: 'normal',
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
      value: DEFAULT_RENDER_SIZE,
    },
    enableAnimation: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    renderModel: null,
    shellStyle: '',
    canvasStyle: '',
    canvasPxSize: DEFAULT_RENDER_SIZE,
    showCanvas: true,
    showFallbackImage: true,
    animationEnabled: true,
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      const benchmarkLevel = Number(systemInfo && systemInfo.benchmarkLevel);

      this.rpxToPx = (systemInfo.windowWidth || 375) / 750;
      this.isLowEndDevice = !Number.isNaN(benchmarkLevel)
        && benchmarkLevel >= 0
        && benchmarkLevel < LOW_END_BENCHMARK_LEVEL;
      this.isReady = false;
      this.canvasContext = null;
      this.canvasRect = null;
      this.currentRenderModel = null;
      this.currentMotionStartedAt = 0;
      this.animationTimer = null;
      this.actionTimer = null;
      this.lastPropAction = null;
      this.runtimeMoodOverride = '';
      this.blinkState = this.createBlinkState();
      this.idleBehavior = null;
      this.updateShellMetrics();
    },

    ready() {
      this.isReady = true;
      this.refreshRenderState();
      this.measureShellRect();
    },

    detached() {
      this.clearTimers();
    },
  },

  observers: {
    'species,mood,action,hunger,happiness,size,enableAnimation': function observeProps() {
      this.updateShellMetrics();

      if (this.isReady) {
        this.refreshRenderState();
        this.measureShellRect();
      }
    },
  },

  methods: {
    createBlinkState() {
      const now = Date.now();

      return {
        nextBlinkAt: now + createRandomRange(1800, 3600),
        blinkEndAt: 0,
      };
    },

    createIdleBehavior(now, emotion, currentX, facingDirection) {
      const profile = IDLE_LOCOMOTION_PROFILE[emotion] || IDLE_LOCOMOTION_PROFILE.normal;
      const safeCurrentX = Number.isFinite(currentX) ? currentX : 0;
      return {
        mood: emotion,
        startAt: now,
        endAt: now + Math.round(profile.pace * createRandomRange(0.72, 1.16)),
        fromX: safeCurrentX,
        toX: clamp(createRandomRange(-profile.travel, profile.travel), -profile.travel, profile.travel),
        lookTilt: createRandomRange(-profile.sway, profile.sway),
        bob: profile.bob * createRandomRange(0.65, 1.1),
        tailBoost: createRandomRange(0.18, 0.42),
        facing: facingDirection || 1,
      };
    },

    sampleIdleBehavior(state, now) {
      if (!state) {
        return {
          x: 0,
          facing: 1,
          gaitWave: 0,
          gaitLift: 0,
          y: 0,
          look: 0,
          tailBoost: 0.32,
        };
      }

      const duration = Math.max(1, state.endAt - state.startAt);
      const progress = clamp((now - state.startAt) / duration, 0, 1);
      const eased = easeInOut(progress);
      const settleWave = Math.sin(progress * Math.PI);
      const swayWave = Math.sin(progress * Math.PI * 2);

      return {
        x: state.fromX + (state.toX - state.fromX) * eased,
        y: swayWave * state.bob * 0.6,
        facing: 1,
        gaitWave: swayWave * 0.18,
        gaitLift: Math.abs(settleWave) * 0.18,
        look: settleWave * state.lookTilt,
        tailBoost: state.tailBoost + Math.abs(swayWave) * 0.16,
      };
    },

    resolveIdleBehavior(now, emotion) {
      if (!this.idleBehavior || this.idleBehavior.mood !== emotion || now >= this.idleBehavior.endAt) {
        const previousSample = this.sampleIdleBehavior(
          this.idleBehavior,
          this.idleBehavior ? this.idleBehavior.endAt : now
        );

        this.idleBehavior = this.createIdleBehavior(
          now,
          emotion,
          previousSample.x,
          previousSample.facing
        );
      }

      return this.sampleIdleBehavior(this.idleBehavior, now);
    },

    clearTimers() {
      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }

      if (this.actionTimer) {
        clearTimeout(this.actionTimer);
        this.actionTimer = null;
      }
    },

    degradeToFallback() {
      this.clearTimers();
      this.setData({
        animationEnabled: false,
        showCanvas: false,
        showFallbackImage: true,
      });
    },

    resolveAnimationEnabled() {
      return this.properties.enableAnimation !== false && !this.isLowEndDevice;
    },

    updateShellMetrics() {
      const size = Number(this.properties.size) || DEFAULT_RENDER_SIZE;
      const pxSize = Math.max(1, Math.round(size * this.rpxToPx));
      const shellStyle = `width:${size}rpx;height:${size}rpx;`;
      const canvasStyle = `width:${size}rpx;height:${size}rpx;`;

      this.canvasPxSize = pxSize;
      this.setData({
        shellStyle,
        canvasStyle,
        canvasPxSize: pxSize,
        animationEnabled: this.resolveAnimationEnabled(),
        showCanvas: this.resolveAnimationEnabled(),
        showFallbackImage: !this.resolveAnimationEnabled(),
      });
    },

    measureShellRect() {
      const run = () => {
        const query = this.createSelectorQuery();

        query.select('.pet-avatar').boundingClientRect((rect) => {
          this.canvasRect = rect || null;
        }).exec();
      };

      if (typeof wx.nextTick === 'function') {
        wx.nextTick(run);
        return;
      }

      run();
    },

    refreshRenderState() {
      const nextAction = this.properties.action || 'idle';
      const shouldAnimate = this.resolveAnimationEnabled();
      const mood = this.getActiveMood();

      if (nextAction !== this.lastPropAction) {
        this.lastPropAction = nextAction;

        if (nextAction && nextAction !== 'idle') {
          this.playAction(nextAction, {
            source: 'prop',
            skipTrigger: false,
            force: true,
          });
          return;
        }
      }

      if (!this.currentRenderModel || this.currentRenderModel.action === 'idle') {
        this.renderIdleModel(mood, shouldAnimate);
        return;
      }

      this.setData({
        renderModel: this.currentRenderModel,
        animationEnabled: shouldAnimate,
        showCanvas: shouldAnimate,
        showFallbackImage: !shouldAnimate,
      });

      if (shouldAnimate) {
        this.ensureAnimationLoop();
        this.drawCurrentFrame();
      } else {
        this.stopAnimationLoop();
      }
    },

    getActiveMood() {
      const runtimeMood = this.runtimeMoodOverride || this.properties.mood;
      return getResolvedMood(
        this.properties.species,
        runtimeMood,
        this.properties.hunger,
        this.properties.happiness
      );
    },

    renderIdleModel(mood, shouldAnimate) {
      const nextMood = mood || this.getActiveMood();
      const renderModel = getPetRenderModel({
        species: this.properties.species,
        mood: nextMood,
        action: 'idle',
        hunger: this.properties.hunger,
        happiness: this.properties.happiness,
      });

      this.currentRenderModel = renderModel;
      this.currentMotionStartedAt = Date.now();
      this.setData({
        renderModel: renderModel,
        animationEnabled: shouldAnimate,
        showCanvas: shouldAnimate,
        showFallbackImage: !shouldAnimate,
      });

      if (shouldAnimate) {
        this.ensureAnimationLoop();
        this.drawCurrentFrame();
      } else {
        this.stopAnimationLoop();
      }
    },

    ensureCanvasContext() {
      if (this.canvasContext) {
        return this.canvasContext;
      }

      try {
        this.canvasContext = wx.createCanvasContext('pet-avatar-canvas', this);
        return this.canvasContext;
      } catch (error) {
        this.degradeToFallback();
        return null;
      }
    },

    ensureAnimationLoop() {
      if (!this.resolveAnimationEnabled() || this.animationTimer) {
        return;
      }

      const tick = () => {
        this.animationTimer = null;

        if (!this.resolveAnimationEnabled() || !this.currentRenderModel) {
          return;
        }

        this.drawCurrentFrame();
        this.animationTimer = setTimeout(tick, 1000 / 24);
      };

      this.animationTimer = setTimeout(tick, 0);
    },

    stopAnimationLoop() {
      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }
    },

    clearActionTimer() {
      if (this.actionTimer) {
        clearTimeout(this.actionTimer);
        this.actionTimer = null;
      }
    },

    buildEventDetail(renderModel, source) {
      return {
        species: renderModel.species,
        emotion: renderModel.emotion,
        mood: renderModel.emotion,
        action: renderModel.action,
        motion: renderModel.motion.name,
        bubbleText: renderModel.bubbleText,
        fx: renderModel.fx,
        hitArea: renderModel.motion.hitArea,
        source: source || 'api',
      };
    },

    playAction(action, options) {
      const source = options || {};
      const shouldAnimate = this.resolveAnimationEnabled();
      const nextMood = this.getActiveMood();
      const nextRenderModel = getPetRenderModel({
        species: this.properties.species,
        mood: nextMood,
        action: action,
        hunger: this.properties.hunger,
        happiness: this.properties.happiness,
      });
      const currentMotion = this.currentRenderModel && this.currentRenderModel.motion;

      if (
        !source.force
        && currentMotion
        && this.currentRenderModel.action !== 'idle'
        && currentMotion.interruptible === false
      ) {
        return false;
      }

      this.clearActionTimer();
      this.currentRenderModel = nextRenderModel;
      this.currentMotionStartedAt = Date.now();
      this.setData({
        renderModel: nextRenderModel,
        animationEnabled: shouldAnimate,
        showCanvas: shouldAnimate,
        showFallbackImage: !shouldAnimate,
      });

      if (shouldAnimate) {
        this.ensureAnimationLoop();
        this.drawCurrentFrame();
      } else {
        this.stopAnimationLoop();
      }

      if (!source.skipTrigger) {
        this.triggerEvent('actionstart', this.buildEventDetail(nextRenderModel, source.source || 'api'));
      }

      if (nextRenderModel.action !== 'idle') {
        this.actionTimer = setTimeout(() => {
          this.finishAction(nextRenderModel);
        }, Math.max(120, Number(nextRenderModel.motion.duration) || 0));
      }

      return true;
    },

    finishAction(renderModel) {
      const completedModel = renderModel || this.currentRenderModel;

      if (!completedModel || completedModel.action === 'idle') {
        return;
      }

      this.renderIdleModel(this.getActiveMood(), this.resolveAnimationEnabled());
      this.triggerEvent('actionend', {
        species: completedModel.species,
        emotion: completedModel.emotion,
        mood: completedModel.emotion,
        action: completedModel.action,
        motion: completedModel.motion.name,
        returnTo: completedModel.motion.returnTo,
        bubbleText: completedModel.bubbleText,
        fx: completedModel.fx,
        hitArea: completedModel.motion.hitArea,
        source: 'complete',
      });
    },

    setMood(mood) {
      this.runtimeMoodOverride = mood || '';

      if (!this.currentRenderModel || this.currentRenderModel.action === 'idle') {
        this.renderIdleModel(this.getActiveMood(), this.resolveAnimationEnabled());
      }

      return this.getActiveMood();
    },

    resetToIdle() {
      this.clearActionTimer();
      this.renderIdleModel(this.getActiveMood(), this.resolveAnimationEnabled());
      return true;
    },

    hitTest(x, y) {
      const model = this.currentRenderModel || this.data.renderModel;
      const rect = this.canvasRect;
      const width = rect && rect.width ? rect.width : this.properties.size || DEFAULT_RENDER_SIZE;
      const height = rect && rect.height ? rect.height : this.properties.size || DEFAULT_RENDER_SIZE;
      const normalizedX = clamp(width ? x / width : 0, 0, 1);
      const normalizedY = clamp(height ? y / height : 0, 0, 1);
      const hitAreas = model && model.hitAreas ? model.hitAreas : {};
      const order = ['head', 'body', 'tail'];

      for (let index = 0; index < order.length; index += 1) {
        const key = order[index];
        const area = hitAreas[key];

        if (area && this.pointInArea(area, normalizedX, normalizedY)) {
          return key;
        }
      }

      return '';
    },

    pointInArea(area, normalizedX, normalizedY) {
      if (!area) {
        return false;
      }

      if (area.shape === 'rect') {
        return normalizedX >= area.x
          && normalizedX <= area.x + area.width
          && normalizedY >= area.y
          && normalizedY <= area.y + area.height;
      }

      const dx = (normalizedX - area.cx) / area.rx;
      const dy = (normalizedY - area.cy) / area.ry;
      return dx * dx + dy * dy <= 1;
    },

    drawCurrentFrame() {
      const model = this.currentRenderModel;

      if (!model || !this.resolveAnimationEnabled()) {
        return;
      }

      try {
        const ctx = this.ensureCanvasContext();

        if (!ctx) {
          return;
        }

        const size = this.canvasPxSize || Math.max(1, Math.round((Number(this.properties.size) || DEFAULT_RENDER_SIZE) * this.rpxToPx));
        const frameState = this.computeFrameState(model, Date.now(), size);

        ctx.clearRect(0, 0, size, size);
        this.drawCharacter(ctx, size, model, frameState);
        this.drawFx(ctx, size, model, frameState);
        ctx.draw();
      } catch (error) {
        this.degradeToFallback();
      }
    },

    computeFrameState(model, now, size) {
      const params = model.params || {};
      const elapsed = now - this.currentMotionStartedAt;
      const motion = model.motion || {};
      const motionDuration = Math.max(240, Number(motion.duration) || 960);
      const locomotion = IDLE_LOCOMOTION_PROFILE[model.emotion] || IDLE_LOCOMOTION_PROFILE.normal;
      const idleBehavior = this.resolveIdleBehavior(now, model.emotion);
      const progress = model.action === 'idle'
        ? 0
        : clamp(elapsed / motionDuration, 0, 1);
      const idleWave = Math.sin((now % 2600) / 2600 * Math.PI * 2);
      const breathWave = Math.sin((now % 3600) / 3600 * Math.PI * 2);
      const breathLag = Math.sin((now % 3600) / 3600 * Math.PI * 2 + Math.PI / 3);
      const blink = this.getBlinkFactor(now, params.eyeOpen);
      const isTapHead = model.action === 'tap_head';
      const isTapBody = model.action === 'tap_body';
      const isPlay = model.action === 'play';
      const isFeed = model.action === 'feed';
      const isPet = model.action === 'pet';
      const isRecover = model.action === 'recover';
      let scaleX = 1 - params.bodyBreath * 0.018 + params.bodyBreath * 0.048 * breathWave;
      let scaleY = 1 + params.bodyBreath * 0.032 - params.bodyBreath * 0.066 * breathWave;
      let rotation = idleBehavior.look * 0.32 + params.headRotate * 0.07 + idleWave * 0.006;
      let offsetX = size * idleBehavior.x * 0.56;
      let offsetY = -size * Math.max(0, idleBehavior.y || 0) * 0.42;
      let headRotation = rotation + idleBehavior.look * 0.14 + params.headRotate * 0.06 + breathLag * params.earSwing * 0.012;
      let headOffsetX = size * idleBehavior.x * 0.1 + idleWave * size * 0.002;
      let headOffsetY = -size * 0.002 - breathWave * size * 0.002;
      let headScaleX = 1 + params.bodyBreath * 0.004 * breathLag;
      let headScaleY = 1 - params.bodyBreath * 0.005 * breathLag;
      let wanderX = 0;
      let wanderY = 0;
      let facingDirection = 1;
      let tailEnergy = params.tailSwing * (0.26 + locomotion.tail * 0.45 + idleBehavior.tailBoost);
      let tailWave = Math.sin((now % Math.max(1200, locomotion.pace * 0.42)) / Math.max(1200, locomotion.pace * 0.42) * Math.PI * 2);

      if (isTapHead) {
        const impact = Math.sin(progress * Math.PI);
        const rebound = Math.sin(progress * Math.PI * 2.2) * (1 - progress);

        scaleX += 0.02 * impact;
        scaleY -= 0.024 * impact;
        offsetY += size * 0.01 * impact;
        rotation += 0.01 * rebound;
        headRotation += 0.018 * impact - 0.01 * rebound;
        headOffsetY += size * 0.004 * impact;
        headOffsetX += size * 0.0015 * rebound;
        headScaleX += 0.004 * impact;
        headScaleY -= 0.004 * impact;
        tailEnergy += 0.05 * impact;
        tailWave += Math.sin(progress * Math.PI * 3.2) * 0.35;
      } else if (isTapBody) {
        const sway = Math.sin(progress * Math.PI * 2) * (1 - progress);

        scaleX += 0.018 * Math.abs(sway);
        scaleY += 0.026 * Math.abs(sway);
        offsetX += size * 0.016 * sway;
        rotation += 0.09 * sway;
        headRotation += 0.022 * sway;
        headOffsetX += size * 0.003 * sway;
        tailEnergy += 0.12 * Math.abs(sway);
        tailWave += sway * 0.42;
      } else if (isFeed) {
        const nod = Math.sin(progress * Math.PI * 2.4) * (1 - progress * 0.42);

        offsetY += size * 0.006 * Math.abs(nod);
        scaleY += 0.015 * Math.abs(nod);
        headRotation -= 0.07 * Math.abs(nod);
        headOffsetY += size * 0.006 * nod;
        tailEnergy += 0.06;
        tailWave += nod * 0.16;
      } else if (isPlay) {
        const bounce = Math.sin(progress * Math.PI * 2.6) * (1 - progress * 0.3);

        offsetY -= size * 0.03 * Math.abs(bounce);
        scaleX += 0.035 * Math.abs(bounce);
        scaleY += 0.05 * Math.abs(bounce);
        rotation += 0.03 * Math.sin(progress * Math.PI * 4);
        headRotation += 0.028 * Math.sin(progress * Math.PI * 4);
        headOffsetY -= size * 0.008 * Math.abs(bounce);
        tailEnergy += 0.22;
        tailWave += Math.sin(progress * Math.PI * 4.6) * 0.68;
      } else if (isPet) {
        const settle = Math.sin(progress * Math.PI * 2) * (1 - progress * 0.35);

        rotation += 0.04 * settle;
        headRotation += 0.03 * settle;
        headOffsetX += size * 0.004 * settle;
        headOffsetY -= size * 0.003 * Math.abs(settle);
        tailEnergy += 0.1;
        tailWave += settle * 0.28;
      } else if (isRecover) {
        const floatUp = Math.sin(progress * Math.PI);

        offsetY -= size * 0.02 * floatUp;
        scaleY += 0.03 * floatUp;
        headOffsetY -= size * 0.004 * floatUp;
        headRotation -= 0.014 * floatUp;
        tailEnergy += 0.08 * floatUp;
        tailWave += floatUp * 0.22;
      }

      return {
        progress: progress,
        scaleX: scaleX,
        scaleY: scaleY,
        rotation: rotation,
        offsetX: offsetX,
        offsetY: offsetY,
        headRotation: headRotation,
        headOffsetX: headOffsetX,
        headOffsetY: headOffsetY,
        headScaleX: headScaleX,
        headScaleY: headScaleY,
        wanderX: wanderX,
        wanderY: wanderY,
        tailEnergy: tailEnergy,
        tailWave: tailWave,
        facingDirection: facingDirection,
        eyeOpen: clamp(Math.min(params.eyeOpen, blink), 0, 1),
        mouthSmile: clamp(params.mouthSmile, 0, 1),
        earSwing: params.earSwing,
        tailSwing: params.tailSwing,
      };
    },

    getBlinkFactor(now, openAmount) {
      if (!this.blinkState) {
        this.blinkState = this.createBlinkState();
      }

      if (now >= this.blinkState.nextBlinkAt) {
        this.blinkState.blinkEndAt = now + 120;
        this.blinkState.nextBlinkAt = now + createRandomRange(1800, 3600);
      }

      if (now < this.blinkState.blinkEndAt) {
        const closingProgress = (this.blinkState.blinkEndAt - now) / 120;
        return clamp(openAmount * closingProgress, 0, 1);
      }

      return clamp(openAmount, 0, 1);
    },

    drawTextureLayer(ctx, src, centerX, centerY, width, height, rotation, scaleX, scaleY, alpha) {
      if (!src) {
        return;
      }

      const drawWidth = Math.max(1, width * (scaleX || 1));
      const drawHeight = Math.max(1, height * (scaleY || 1));

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      if (rotation) {
        ctx.rotate(rotation);
      }

      ctx.drawImage(
        src,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    },

    drawRigLayer(ctx, src, rigSize, layout, rotation, scaleX, scaleY, alpha, offsetX, offsetY) {
      if (!src) {
        return;
      }

      const pivotX = rigSize * layout.pivotX + (offsetX || 0);
      const pivotY = rigSize * layout.pivotY + (offsetY || 0);

      ctx.save();
      ctx.translate(-rigSize / 2 + pivotX, -rigSize / 2 + pivotY);
      ctx.globalAlpha = alpha == null ? 1 : alpha;

      if (rotation) {
        ctx.rotate(rotation);
      }

      ctx.scale(scaleX || 1, scaleY || 1);
      ctx.drawImage(
        src,
        -rigSize * layout.pivotX,
        -rigSize * layout.pivotY,
        rigSize,
        rigSize
      );
      ctx.restore();
    },

    drawCharacter(ctx, size, model, frameState) {
      const layers = model.layers || {};
      const placeholder = model.placeholderSource || {};
      const bodyLayer = layers.body || {};
      const tailLayer = layers.tail || {};
      const headLayer = layers.head || {};
      const blinkLayer = layers.blink || {};
      const rigSize = size * RIG_DRAW_RATIO;
      const anchorX = size * STAGE_LAYOUT.anchorX + frameState.offsetX + frameState.wanderX;
      const anchorY = size * STAGE_LAYOUT.anchorY + frameState.offsetY + frameState.wanderY;

      ctx.save();
      ctx.translate(anchorX, anchorY);
      if ((frameState.facingDirection || 1) < 0) {
        ctx.scale(-1, 1);
      }
      ctx.rotate(frameState.rotation);
      this.drawTailAccent(ctx, rigSize, model, frameState, tailLayer);
      this.drawRigLayer(
        ctx,
        bodyLayer.src || placeholder.body || placeholder.src,
        rigSize,
        BODY_LAYOUT,
        0,
        frameState.scaleX,
        frameState.scaleY
      );
      this.drawRigLayer(
        ctx,
        headLayer.src || placeholder.head || placeholder.src,
        rigSize,
        HEAD_LAYOUT,
        frameState.headRotation,
        frameState.headScaleX,
        frameState.headScaleY,
        1,
        frameState.headOffsetX,
        frameState.headOffsetY
      );

      this.drawHeadOverlay(ctx, rigSize, frameState, blinkLayer);
      ctx.restore();
    },

    drawHeadOverlay(ctx, rigSize, frameState, blinkLayer) {
      const blinkAmount = 1 - frameState.eyeOpen;

      if (!blinkLayer || !blinkLayer.src || blinkAmount <= 0.06) {
        return;
      }

      this.drawRigLayer(
        ctx,
        blinkLayer.src,
        rigSize,
        HEAD_LAYOUT,
        frameState.headRotation,
        frameState.headScaleX,
        frameState.headScaleY,
        clamp(blinkAmount * 1.18, 0, 1),
        frameState.headOffsetX,
        frameState.headOffsetY
      );
    },

    drawTailAccent(ctx, rigSize, model, frameState, tailLayer) {
      if (!tailLayer || !tailLayer.src) {
        return;
      }

      const tailWidth = rigSize * TAIL_LAYOUT.width;
      const tailHeight = rigSize * TAIL_LAYOUT.height;
      const tailBaseX = rigSize * TAIL_LAYOUT.originX;
      const tailBaseY = rigSize * TAIL_LAYOUT.originY;
      const tailRotation = -0.34
        + (frameState.tailEnergy || 0) * 0.62
        + (frameState.tailWave || 0) * 0.08;

      ctx.save();
      ctx.translate(
        tailBaseX + tailWidth * TAIL_LAYOUT.pivotX,
        tailBaseY + tailHeight * TAIL_LAYOUT.pivotY
      );
      ctx.rotate(tailRotation);
      ctx.drawImage(
        tailLayer.src,
        -tailWidth * TAIL_LAYOUT.pivotX,
        -tailHeight * TAIL_LAYOUT.pivotY,
        tailWidth,
        tailHeight
      );
      ctx.restore();
    },

    drawFx(ctx, size, model, frameState) {
      const fx = Array.isArray(model.fx) ? model.fx : [];

      for (let index = 0; index < fx.length; index += 1) {
        const item = fx[index];

        if (item === 'heart') {
          this.drawHeartFx(ctx, size, frameState, index);
        } else if (item === 'sparkle') {
          this.drawSparkleFx(ctx, size, frameState, index);
        } else if (item === 'heal') {
          this.drawHealFx(ctx, size, frameState, index);
        }
      }
    },

    drawHeartFx(ctx, size, frameState, slotIndex) {
      const progress = frameState.progress || 0;
      const alpha = 1 - progress;
      const baseX = size * 0.5 + (slotIndex === 0 ? -22 : 22);
      const baseY = size * 0.18 - progress * 34;
      const scale = 0.8 + alpha * 0.4;

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff6e9d';
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(-8, -2, -12, -8, -8, -14);
      ctx.bezierCurveTo(-3, -21, 6, -18, 0, -8);
      ctx.bezierCurveTo(-6, -18, 3, -21, 8, -14);
      ctx.bezierCurveTo(12, -8, 8, -2, 0, 6);
      ctx.fill();
      ctx.restore();
    },

    drawSparkleFx(ctx, size, frameState, slotIndex) {
      const progress = frameState.progress || 0;
      const alpha = 1 - progress;
      const baseX = size * (0.38 + slotIndex * 0.22);
      const baseY = size * 0.22 - progress * 28;

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.rotate(progress * Math.PI * 1.2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffcf54';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(3, -3);
      ctx.lineTo(10, 0);
      ctx.lineTo(3, 3);
      ctx.lineTo(0, 10);
      ctx.lineTo(-3, 3);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-3, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    drawHealFx(ctx, size, frameState, slotIndex) {
      const progress = frameState.progress || 0;
      const alpha = 1 - progress;
      const baseX = size * (0.42 + slotIndex * 0.12);
      const baseY = size * 0.24 - progress * 26;

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#72d37a';
      ctx.fillRect(-4, -12, 8, 24);
      ctx.fillRect(-12, -4, 24, 8);
      ctx.restore();
    },

    handleTap(event) {
      const point = getCurrentPoint(event);
      const rect = this.canvasRect;

      if (!rect) {
        this.measureShellRect();
        return;
      }

      const localX = point.x - rect.left;
      const localY = point.y - rect.top;
      const hitArea = this.hitTest(localX, localY) || (localX < rect.width * 0.5 ? 'head' : 'body');
      const tapAction = hitArea === 'head' ? 'tap_head' : 'tap_body';

      this.triggerEvent('pettap', {
        hitArea: hitArea,
        action: tapAction,
        x: localX,
        y: localY,
      });

      this.playAction(tapAction, {
        source: 'tap',
      });
    },

    handleLongPress(event) {
      const point = getCurrentPoint(event);
      const rect = this.canvasRect;

      if (!rect) {
        this.measureShellRect();
        return;
      }

      const localX = point.x - rect.left;
      const localY = point.y - rect.top;
      const hitArea = this.hitTest(localX, localY) || 'body';

      this.triggerEvent('petlongpress', {
        hitArea,
        action: 'pet',
        x: localX,
        y: localY,
      });
    },
  },
});
