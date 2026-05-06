# Pet Assets Placeholder Spec

Phase 2 先提交目录结构与命名规范，真实分层 PNG 素材后续由 Session F 统一补齐和压缩。

目录约定：

- `dog/portrait/`：真机与模拟器运行时使用的轻量单图主体资源
- `dog/base/`：主体底图
- `dog/face/`：眼睛、嘴巴、表情类覆盖层
- `dog/pose/`：尾巴、耳朵、身体姿态层
- `common/fx/`：跨物种复用特效层

后续完整分层素材的目标文件名约定如下：

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
- 单张角色层建议控制在 `<= 80 KB`
- 单张通用特效层建议控制在 `<= 40 KB`
- 统一输出为不超过 `512 x 512` 的 PNG 画布，避免首屏首批资源过大

当前真实 PNG 尚未入库时：

- 运行时可先使用 `dog/portrait/` 下按情绪区分的轻量主体图保证页面可见
- 继续沿用现有占位文件名做结构联调
- 不新增无约束临时命名，避免后续替换成本上升
