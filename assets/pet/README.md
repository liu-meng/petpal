# Pet Assets Placeholder Spec

Phase 2 先提交目录结构与命名规范，真实分层 PNG 素材后续由 Session F 统一补齐和压缩。

目录约定：

- `dog/base/`：主体底图
- `dog/face/`：眼睛、嘴巴、表情类覆盖层
- `dog/pose/`：尾巴、耳朵、身体姿态层
- `common/fx/`：跨物种复用特效层

当前 `utils/pet-renderer.js` 默认引用以下占位文件名：

- `dog/base/body-brown.png`
- `dog/face/excited-smile.png`
- `dog/face/normal-smile.png`
- `dog/face/sad-mouth.png`
- `dog/face/sick-dizzy.png`
- `dog/pose/idle-tail-up.png`
- `dog/pose/idle-neutral.png`
- `dog/pose/idle-droop.png`
- `dog/pose/idle-weak.png`
- `dog/pose/eat.png`
- `dog/pose/play.png`
- `dog/pose/recover.png`
- `common/fx/confetti.png`
- `common/fx/sparkle.png`
- `common/fx/heart.png`
- `common/fx/heal.png`
- `common/fx/droplet.png`
- `common/fx/sick-stars.png`

后续真实素材落地时请保持：

- 文件名不变
- 画布尺寸一致
- 角色主体锚点一致
- 透明背景一致
