# Pet Avatar Placeholder Spec

当前阶段只建立分层素材目录和命名规范，不提交真实 PNG 资源。

占位原则：

- `base/`：主体轮廓与身体主色，默认使用 `body-brown.png`
- `face/`：只承载表情差异，默认包含 `excited-smile.png`、`normal-smile.png`、`sad-mouth.png`、`sick-dizzy.png`
- `pose/`：只承载姿态差异，默认包含 `idle-tail-up.png`、`idle-neutral.png`、`idle-droop.png`、`idle-weak.png`，以及动作预留 `eat.png`、`play.png`、`recover.png`
- `common/fx/`：跨物种复用特效，默认包含 `confetti.png`、`sparkle.png`、`heart.png`、`heal.png`、`droplet.png`、`sick-stars.png`

锚点规范：

- 所有 PNG 使用相同画布尺寸，建议 `512x512`
- 狗主体视觉中心保持在画布水平中线，脚底落点保持一致
- `face`、`pose`、`fx` 只允许做透明叠加，不改变主体缩放比例
- 所有图层文件使用透明背景

接入约束：

- 页面层只传 `species / mood / action / hunger / happiness`
- 视觉映射只允许在 `utils/pet-renderer.js` 维护
- 新增物种时复用同一目录结构与命名规则
