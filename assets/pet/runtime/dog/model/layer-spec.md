# Dog Runtime Layer Spec

## 目的

这份文件定义 `runtime/dog/textures/` 的正式拆层目标，用于把当前概念母版过渡到真正可参数化的运行时角色。

当前第一版 `pet-avatar` 仍使用：

- `assets/pet/runtime/dog/textures/dog_body_rig.png` 作为身体底层
- `assets/pet/runtime/dog/textures/dog_tail_rig.png` 作为独立尾巴层
- `assets/pet/runtime/dog/textures/dog_head_*.png` 作为头部表情层
- `assets/pet/runtime/dog/textures/dog_blink_closed.png` 作为眨眼覆盖层
- `assets/pet/runtime/dog/textures/dog_fallback_*.png` 作为低端机 fallback

因此本文件描述的是“下一阶段正式接入目标”，不是当前已经提交的切图清单。

## 目录

- `assets/pet/runtime/dog/textures/`

## 基础原则

- 所有 PNG 使用统一坐标系，不自动裁边。
- 所有 PNG 保持一致画布尺寸，建议 `1024 x 1024` 或 `2048 x 2048`。
- 原点、落脚点、头部中心和身体中心在所有层之间保持稳定。
- 所有层透明背景。
- 文件名固定为英文 snake_case，不使用中文、空格、最终版、最新版。

## 建议首批拆层

- `dog_body_rig.png`
- `dog_tail_rig.png`
- `dog_head_normal.png`
- `dog_head_happy.png`
- `dog_head_sad.png`
- `dog_head_sick.png`
- `dog_blink_closed.png`
- `dog_fallback_normal.png`
- `dog_fallback_excited.png`
- `dog_fallback_sad.png`
- `dog_fallback_sick.png`

## 首批参数映射建议

- `eyeOpen`
  - 驱动开眼到闭眼切换，后续可扩展为半闭眼插值。

- `mouthSmile`
  - 驱动笑嘴、开嘴、委屈嘴的混合。

- `bodyBreath`
  - 驱动身体整体轻微缩放或躯干上下浮动。

- `headRotate`
  - 驱动头部轻微左右摆动。

- `earSwing`
  - 驱动双耳二级摆动。

- `tailSwing`
  - 驱动尾巴摆动幅度。

## 参考锚点

- 角色整体 anchor：`x=0.5`, `y=0.68`
- 头部热区中心建议：`x=0.50`, `y=0.30`
- 身体热区中心建议：`x=0.52`, `y=0.66`
- 尾巴热区中心建议：`x=0.22`, `y=0.63`

## 渲染顺序建议

1. `dog_shadow`
2. `dog_tail`
3. `dog_body`
4. `dog_head`
5. `dog_ear_l`
6. `dog_ear_r`
7. `dog_eye_*`
8. `dog_brow_*`
9. `dog_nose`
10. `dog_mouth_*`
11. `dog_cheek_*`
12. `fx_*`

## 与当前代码的对应关系

- [utils/pet-renderer.js](/Users/liumeng/private/mini_program/petpal/utils/pet-renderer.js)
  - 当前先输出参数和动作描述，不直接绑定真实拆层文件。

- [components/pet-avatar/index.js](/Users/liumeng/private/mini_program/petpal/components/pet-avatar/index.js)
  - 当前先用 body/head runtime textures 和 fallback 合成图。
  - 后续应把 `drawCharacter` 内的临时占位层替换为真实分层绘制流程。
