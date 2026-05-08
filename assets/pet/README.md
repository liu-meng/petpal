# Pet Assets

`assets/pet/` 当前同时承载三类内容：

- 概念资产母版
- 第一版运行时目录骨架
- 旧版原型期立绘与占位资源

当前接入目标是先把角色系统代码骨架、状态映射和 canvas 占位渲染跑通，不把概念母版直接当成最终运行时素材。

## 当前目录说明

- `concept/`
  - 概念母版资产来源。
  - 当前使用文件：`petpal_dog_asset_sheet.png`
  - 只用于占位渲染、动作规范对齐和后续拆层参考。

- `runtime/dog/textures/`
  - 第一版运行时占位纹理。
  - 当前已接入 `dog_body_rig.png`、`dog_tail_rig.png`、`dog_blink_closed.png`、`dog_head_*.png` 和 `dog_fallback_*.png`。
  - 这些纹理均由概念母版导出，用于透明舞台上的 2D rig 渲染和低端机 fallback。

- `runtime/dog/model/`
  - 角色分层规范与命名规范。
  - 参考文件：[assets/pet/runtime/dog/model/layer-spec.md](/Users/liumeng/private/mini_program/petpal/assets/pet/runtime/dog/model/layer-spec.md)

- `runtime/dog/motions/`
  - 动作与热区规范。
  - 参考文件：[assets/pet/runtime/dog/motions/motion-spec.json](/Users/liumeng/private/mini_program/petpal/assets/pet/runtime/dog/motions/motion-spec.json)

- `runtime/dog/fx/`
  - 未来角色专属 FX 资源目录。

- `preview/`
  - 评审截图、导出预览或联调参考图的预留目录。

- `dog/portrait/`
  - 旧版原型期单图立绘。
  - 仅作为历史资源保留，不再作为默认运行时 fallback。

- `dog/base/`、`dog/face/`、`dog/pose/`、`common/fx/`
  - 历史占位结构。
  - 允许继续保留，但不再扩张，也不作为未来正式规范。

## 代码职责边界

- [utils/pet-renderer.js](/Users/liumeng/private/mini_program/petpal/utils/pet-renderer.js)
  - 负责把业务状态映射成角色渲染描述对象。

- [components/pet-avatar/index.js](/Users/liumeng/private/mini_program/petpal/components/pet-avatar/index.js)
  - 负责 canvas 占位渲染、动作播放、热区点击和降级显示。

## 资源接入规则

- 不把 `concept/` 下的母版图当成长期最终运行时方案。
- 运行时纹理允许先使用由概念母版导出的临时拆层图，但命名仍按 `runtime/dog/textures/` 的正式目标维护。
- 后续替换正式素材时，优先替换 `runtime/dog/textures/` 内容，并保持 `pet-renderer` 输出结构和 `pet-avatar` 组件 API 不变。
- 页面层不直接判断热区和动画细节，只消费组件事件和业务状态。

## 后续替换顺序

1. 设计按 `layer-spec.md` 输出正式拆层 PNG。
2. 将拆层 PNG 放入 `runtime/dog/textures/`。
3. 按真实动作配置更新 `motion-spec.json`。
4. 让 `pet-avatar` 从概念母版占位绘制切换到真实拆层绘制。
5. 保持首页仍只调用 `pet-avatar`，不直接操作 canvas。
