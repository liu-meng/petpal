# PetPal Session A Handoff

> 目标 session：`Session A`
> 目标阶段：`Phase 0 + Phase 1`
> 当前日期：`2026-05-01`
> 当前仓库状态：只有文档和素材，尚未开始代码实现

## 1. 先读这些文件

必读顺序：

1. `docs/PetPal-Execution-Checklist.md`
2. `HANDOVER.md`
3. `docs/PetPal-Development-Plan.md`

补充参考：

- `docs/petpal-product-design_20260427.md`
- `docs/petpal-prototype-spec_20260427.md`

## 2. 本 session 的唯一目标

完成总控清单中的以下内容：

- `Phase 0：工程落地与范围冻结`
- `Phase 1：状态存储基座`

不要进入 `Phase 2` 及之后的实现。

## 3. 允许修改的文件范围

本 session 只允许修改或新增以下范围：

- `app.js`
- `app.json`
- `app.wxss`
- `utils/storage.js`
- `utils/state.js`
- `utils/time.js`
- `docs/PetPal-Execution-Checklist.md`

如确实需要补目录结构，可新增空目录或占位文件到以下范围：

- `pages/`
- `components/`
- `utils/`
- `assets/pet/`

## 4. 禁止修改的范围

本 session 不要实现或修改以下内容：

- `utils/decay.js`
- `utils/pet-renderer.js`
- `components/pet-avatar/`
- `components/stat-bar/`
- `components/action-btn/`
- `pages/onboarding/`
- `pages/index/`
- `pages/tasks/`
- `pages/parent/`
- 任何任务、审核、角色动画、素材细节实现

## 5. 实现要求

### 5.1 工程要求

- 使用微信小程序原生结构
- 不新增任何第三方依赖
- 默认只做最小必要修改
- 状态管理保持简单，不引入 Redux / MobX / Taro

### 5.2 数据要求

需要建立并封装 `petpal_state` 默认结构，至少包含：

- `initialized`
- `createdAt`
- `pet`
- `points`
- `tasks`
- `checkins`
- `achievements`
- `parentPin`
- `settings`

其中 `pet` 至少包含：

- `name`
- `type`
- `stage`
- `hunger`
- `happiness`
- `totalPointsEarned`
- `lastDecayAt`

其中 `settings` 至少包含：

- `decaySpeed`
- `soundEnabled`

### 5.3 工具层职责

- `utils/storage.js`
  - 封装 storage key
  - 封装读写 state
  - 对空值和异常做最小防御

- `utils/state.js`
  - 提供默认 state
  - 提供初始化逻辑
  - 提供读取当前 state、保存 state、重置 state 的基础方法
  - 提供与“今日任务状态”相关的基础查询辅助

- `utils/time.js`
  - 提供 `YYYY-MM-DD` 日期格式化
  - 提供“是否今天”的判断
  - 提供跨日判断辅助

## 6. 交付清单

完成后至少要满足以下结果：

- 小程序空工程可以编译
- `app.json` 路由已配置四个页面占位路径
- `petpal_state` 首次打开时可初始化
- 刷新后 state 可恢复
- 时间工具可支持后续任务页判断“今天是否已打卡”
- `docs/PetPal-Execution-Checklist.md` 中 `Phase 0`、`Phase 1` 已完成项被打钩

## 7. 验收要求

至少完成以下验证：

- 验证 `wx.getStorageSync('petpal_state')` 可读
- 验证默认 state 可写入
- 验证二次读取能拿到相同结构
- 验证日期工具可区分“今天”和“非今天”
- 验证页面路由配置无语法错误

## 8. 回填要求

完成后必须更新 `docs/PetPal-Execution-Checklist.md`：

- 勾选已完成的交付项
- 勾选已通过的验证项
- 在文档末尾追加一段 `Session A 回填`

回填格式：

```md
### Session A 回填
- 日期：
- 改动文件：
- 完成项：
- 风险点：
- 验证结果：
- 是否可交给下一个 session：是 / 否
```

## 9. 给下个 session 的执行提示

如果你是新 session，请直接开始实现，不要重复产出计划。

推荐开场提示词：

```md
请按 `docs/Session-A-Handoff.md` 执行 Session A。
先读取 `docs/PetPal-Execution-Checklist.md` 和 handoff 文档，再直接开始实现。
只完成 Phase 0 和 Phase 1，不要进入 Phase 2。
完成后更新 checklist 勾选状态，并给出：改动摘要、为什么这样改、风险点、验证结果。
```
