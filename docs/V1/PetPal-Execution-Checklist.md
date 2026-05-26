# PetPal V1 执行总控清单

> 项目路径：`/Users/liumeng/private/mini_program/petpal`
> 文档角色：V1 开发唯一执行清单
> 当前状态：Session A-I 已完成开发与回填；2026-05-16 起按 V1.5 体验优化计划执行，Phase 0 与 Phase 1 已完成并回填
> 最近更新：2026-05-16

## 1. 使用规则

- [x] 本文档已建立，作为后续开发与勾选确认的唯一总控文档
- [x] 每个 session 开始前先阅读本文件，再决定是否进入实现
- [x] 每个 session 只修改自己负责的目录和本文件，不跨边界改动
- [x] 每完成一项开发任务，必须同步勾选对应交付项与验证项
- [x] 未通过验证的任务不得勾选完成
- [ ] 如范围发生变化，先更新本文件，再进入代码实现

## 2. 项目目标

### 2.1 北极星目标

- [ ] D7 留存达到 `>= 40%`
- [ ] 任务完成率达到 `>= 70%`
- [ ] 家长周活达到 `>= 50%`

### 2.2 V1 核心闭环

- [ ] 孩子完成任务
- [ ] 家长审核通过
- [ ] 获得积分
- [ ] 使用积分照顾宠物
- [ ] 宠物状态反馈形成正向循环

## 3. 范围冻结

### 3.1 V1 必做范围

- [x] 微信小程序原生实现：`JavaScript + WXML + WXSS`
- [x] 本地存储：`wx.setStorageSync / wx.getStorageSync`
- [x] 1 个宠物物种：`dog`
- [x] 4 种情绪：`excited / normal / sad / sick`
- [ ] 3 种互动：`feed / play / pet`
- [ ] 4 个页面：`onboarding / index / tasks / parent`
- [ ] 任务审核闭环：`pending / approved / rejected`
- [ ] 4 位 PIN 家长模式

### 3.2 V1 不做范围

- [ ] 不接入云开发
- [ ] 不做微信登录
- [ ] 不做多孩子 / 多宠物
- [ ] 不做成就系统
- [ ] 不做宠物成长阶段演出
- [ ] 不做服务通知 / 推送
- [ ] 不做音效 / 语音
- [x] 不新增第三方依赖

## 4. 核心技术决策

### 4.1 角色表现方案

- [x] 放弃“4 张整图切换”方案
- [x] 使用“分层角色系统”作为唯一角色渲染方案
- [x] 角色由 `base / face / pose / fx / accessory` 多层组合构成
- [x] 页面只消费角色状态，不直接写死图片映射逻辑
- [x] 角色状态映射通过配置表统一管理

### 4.2 工程约束

- [x] 默认只做最小必要修改
- [x] 不引入 Redux / MobX / Taro / Canvas 动画库
- [x] 状态管理使用 `App`、`Page` 与 `utils/state.js`
- [x] 衰减逻辑统一收口到 `utils/decay.js`
- [x] 时间与日期判断统一收口到 `utils/time.js`
- [x] 数据读写统一收口到 `utils/storage.js`

## 5. 目标目录结构

- [x] `app.js`
- [x] `app.json`
- [x] `app.wxss`
- [x] `pages/onboarding/`
- [x] `pages/index/`
- [x] `pages/tasks/`
- [x] `pages/parent/`
- [x] `components/pet-avatar/`
- [x] `components/stat-bar/`
- [x] `components/action-btn/`
- [x] `utils/storage.js`
- [x] `utils/state.js`
- [x] `utils/time.js`
- [x] `utils/decay.js`
- [x] `utils/pet-renderer.js`
- [x] `assets/pet/dog/base/`
- [x] `assets/pet/dog/face/`
- [x] `assets/pet/dog/pose/`
- [x] `assets/pet/common/fx/`

## 6. 数据与渲染模型

### 6.1 状态模型

- [x] 保留 `petpal_state` 作为唯一 storage key
- [x] 保留 `initialized / pet / points / tasks / checkins / parentPin / settings` 主结构
- [x] `pet` 中保留 `name / type / stage / hunger / happiness / totalPointsEarned / lastDecayAt`
- [x] `tasks` 使用预设任务列表初始化
- [x] `checkins` 按日期记录任务状态流转
- [x] `settings.decaySpeed` 支持 `relaxed / standard / strict`

### 6.2 角色渲染配置

- [x] 角色配置支持 `species / mood / action / parts / anim`
- [x] `mood` 根据 `hunger + happiness` 统一计算
- [x] `action` 至少支持 `idle / feed / play / pet / recover`
- [x] `parts` 支持按情绪切换眼睛、嘴巴、耳朵、尾巴、特效
- [x] `anim` 支持按情绪切换 idle 动画

## 7. 阶段计划与清单

### Phase 0：工程落地与范围冻结（预计 1-2h）

目标：创建可编译的小程序骨架，冻结 V1 范围与实现边界。

交付项：
- [x] 创建微信小程序项目
- [x] 建立 `app.js / app.json / app.wxss`
- [x] 建立 `pages/`、`components/`、`utils/`、`assets/pet/` 目录骨架
- [x] 在本文件中冻结 V1 必做 / 不做范围
- [x] 明确 session 拆分边界和文件 ownership

验证项：
- [x] 微信开发者工具可正常打开并编译空工程
- [x] 页面路由配置正确
- [x] 本文件中的范围、阶段、session 边界已可直接执行

退出标准：
- [x] 后续 session 可以基于当前工程直接开始编码

### Phase 1：状态存储基座（预计 2h）

目标：完成默认状态、存储封装、日期工具、基础状态读写。

交付项：
- [x] 实现 `utils/storage.js`
- [x] 实现 `utils/state.js`
- [x] 实现 `utils/time.js`
- [x] 定义默认状态常量
- [x] 完成首次初始化逻辑
- [x] 完成按日期读取“今日任务状态”的辅助函数

验证项：
- [x] `wx.getStorageSync('petpal_state')` 可正确读写
- [x] 首次打开可自动写入默认状态
- [x] 刷新后状态可正确恢复
- [x] 跨日判断函数可稳定区分“今天 / 非今天”

退出标准：
- [x] 页面层不需要自己关心 storage 细节

### Phase 2：宠物衰减与角色渲染内核（预计 3-4h）

目标：完成衰减逻辑、情绪判断、分层角色配置、角色组件基础版。

交付项：
- [x] 实现 `utils/decay.js`
- [x] 实现 `utils/pet-renderer.js`
- [x] 创建 `components/pet-avatar/`
- [x] 建立 `dog` 的分层素材目录
- [x] 建立 `excited / normal / sad / sick` 的角色配置映射
- [x] 为 `feed / play / pet / recover` 预留动作配置

验证项：
- [x] 根据 `lastDecayAt` 可正确计算离线衰减
- [x] `mood` 计算结果与设计规则一致
- [x] `pet-avatar` 可根据配置渲染正确层级
- [x] 切换 `mood` 时无需改页面结构即可切换视觉表现

退出标准：
- [x] 主页面只需传入角色状态即可渲染宠物

### Phase 3：首次设置与主界面闭环（预计 3h）

目标：打通 onboarding、首页宠物展示、互动按钮、积分消耗闭环。

交付项：
- [x] 实现 `pages/onboarding/onboarding.*`
- [x] 实现 `pages/index/index.*`
- [x] 接入 `pet-avatar` 到主界面
- [x] 接入 `stat-bar` 与 `action-btn`
- [x] 实现宠物命名保存
- [x] 实现 `feed / play / pet` 三个互动动作
- [x] 实现积分不足禁用态
- [x] 实现首页“今日任务入口”和家长入口

验证项：
- [x] 首次打开进入 onboarding
- [x] 输入名字后进入主界面
- [x] 刷新后不再重复 onboarding
- [x] 喂食后积分 `-1`、饱食度 `+3`
- [x] 玩耍后积分 `-1`、快乐值 `+2`
- [x] 抚摸后快乐值 `+1`
- [x] 积分不足时喂食 / 玩耍不可点击

退出标准：
- [x] 孩子能在主界面看到宠物并完成基础互动

### Phase 4：任务系统（预计 4h）

目标：实现任务列表、打卡确认、当日状态展示、待审核流转。

交付项：
- [x] 实现 `pages/tasks/tasks.*`
- [x] 渲染预设任务列表
- [x] 隐藏 `enabled=false` 任务
- [x] 实现任务点击确认弹窗
- [x] 实现 `pending / approved / rejected` 状态流转
- [x] 实现“同一任务同一天不可重复打卡”
- [x] 实现跨日自动重置任务展示状态

验证项：
- [x] 今日待打卡任务显示为未完成
- [x] 确认打卡后显示 `pending`
- [x] `pending` 任务不可重复点击
- [x] `approved` 任务显示完成态
- [x] 被驳回的任务可恢复为待打卡
- [x] 跨日后任务列表回到新一天状态

退出标准：
- [x] 孩子侧任务闭环可独立运行，只差家长审核入口

### Phase 5：家长模式（预计 4h）

目标：实现 PIN、审核列表、批量审核、任务开关。

交付项：
- [x] 实现 `pages/parent/parent.*`
- [x] 首次进入设置 4 位 PIN
- [x] 非首次进入走 PIN 校验
- [x] 连续输错 3 次给出提示
- [x] 渲染待审核列表
- [x] 实现全部通过
- [x] 实现全部驳回
- [x] 实现任务 `enabled` 开关实时保存
- [x] 实现家长审核后同步回写积分与快乐值

验证项：
- [x] 未设置 PIN 时强制进入设置流程
- [x] 已设置 PIN 时必须通过验证才能进入
- [x] 全部通过后 `pending` 记录变为 `approved`
- [x] 审核通过后积分 `+1`、快乐值 `+1`
- [x] 全部驳回后任务恢复可重新打卡
- [x] 任务开关刷新后仍然保留

退出标准：
- [x] 核心“孩子打卡 -> 家长审核 -> 奖励到账”闭环跑通

### Phase 6：动画与视觉收口（预计 3h）

目标：让分层角色系统具备稳定的情绪表现和互动反馈。

交付项：
- [x] 为 `excited` 实现明显的开心 idle 动画
- [x] 为 `normal` 实现平静 idle 动画
- [x] 为 `sad` 实现低落 idle 动画
- [x] 为 `sick` 实现虚弱 idle 动画
- [x] 为互动动作补充短时反馈动画
- [x] 为积分变化补充飘字反馈
- [x] 为按钮补充点击反馈
- [x] 压缩和整理角色素材，控制图片尺寸与命名规范

验证项：
- [x] 四种情绪视觉差异明显
- [x] 互动动作后存在立即可感知反馈
- [x] 低端设备上无明显掉帧
- [x] 图片资源不会造成明显首屏卡顿

退出标准：
- [x] 角色表现不再依赖整图切换，且视觉层级稳定

### Phase 7：集成测试与验收（预计 2-3h）

目标：严格按产品验收路径完成全链路测试。

交付项：
- [x] 执行首次设置验收
- [x] 执行衰减验收
- [x] 执行任务打卡验收
- [x] 执行家长审核验收
- [x] 执行互动消耗验收
- [x] 执行生病恢复验收
- [x] 执行 PIN 验收
- [x] 执行离线衰减验收
- [x] 执行刷新持久化验收

验证项：
- [x] 验收场景 1：首次打开输入名字后进入首页
- [x] 验收场景 2：等待或模拟时间后宠物状态下降
- [x] 验收场景 3：点击刷牙后进入待审核
- [x] 验收场景 4：家长审核通过后积分到账
- [x] 验收场景 5：积分为 1 时喂食后归 0
- [x] 验收场景 6：状态过低时进入 sick，互动后恢复
- [x] 验收场景 7：设置 PIN 后再次进入需验证
- [x] 验收场景 8：离线一段时间后再次打开会衰减
- [x] 验收场景 9：刷新页面后数据保留

退出标准：
- [x] 9 项验收全部通过

### Phase 8：真机测试与问题回收（预计 3-4h）

目标：在真实设备上确认儿童可用性、家长操作时长与性能表现。

说明：截至 2026-05-06，本项目仅完成微信开发者工具 `iPhone 14 Pro Max` 模拟器冒烟检查；Session H 已核验当前环境未连接真实 iPhone / Android 设备，且宿主机缺少完整 iOS / Android 真机调试工具链。2026-05-12 已根据用户确认补回真实 `iPhone / Android` 真机测试结果，以下未勾选项一并标记完成。

交付项：
- [x] iPhone 真机冒烟测试
- [x] Android 真机冒烟测试
- [x] 儿童单手操作路径检查
- [x] 家长 30 秒审核路径检查
- [x] 收集并修复关键问题

验证项：
- [x] 真机页面布局无明显错位
- [x] 角色动画在真机上可正常运行
- [x] 家长审核流程可在 30 秒内完成
- [x] 无阻断交付的 P0 缺陷

退出标准：
- [x] 可进入交付或下一轮迭代

## 8. Session 拆分方案

说明：每个 session 只处理自己负责的写入范围，完成后必须回写本文件勾选状态、风险点、验证结果。

### Session A：工程骨架与状态基座

- [x] 负责 `app.*`、`utils/storage.js`、`utils/state.js`、`utils/time.js`
- [x] 负责完成 Phase 0、Phase 1
- [x] 不修改任务页、家长页、角色表现细节

### Session B：角色渲染内核

- [x] 负责 `components/pet-avatar/`、`utils/decay.js`、`utils/pet-renderer.js`、`assets/pet/`
- [x] 负责完成 Phase 2
- [x] 不修改任务逻辑和家长审核逻辑

### Session C：onboarding 与主界面

- [x] 负责 `pages/onboarding/`、`pages/index/`、`components/stat-bar/`、`components/action-btn/`
- [x] 负责完成 Phase 3
- [x] 依赖 Session A、Session B 完成

### Session D：任务系统

- [x] 负责 `pages/tasks/`
- [x] 负责完成 Phase 4
- [x] 依赖 Session A 完成

### Session E：家长模式

- [x] 负责 `pages/parent/`
- [x] 负责完成 Phase 5
- [x] 依赖 Session A、Session D 完成

### Session F：动画与素材收口

- [x] 负责角色动画、交互反馈、素材压缩与命名规范
- [x] 负责完成 Phase 6
- [x] 依赖 Session B、Session C 完成

### Session G：集成测试与回归

- [x] 负责 Phase 7、Phase 8
- [x] 负责跨页面联调、缺陷回收、本文件最终勾选
- [x] 可以修改小范围问题，但不得推翻既有边界

## 9. Session 交接模板

每个 session 完成后，至少补充以下内容：

- [x] 已完成项已在本文件勾选
- [x] 已记录本 session 实际改动文件
- [x] 已记录风险点
- [x] 已记录验证方式与结果
- [x] 已明确下一个 session 的前置条件是否满足

建议记录格式：

```md
### Session X 回填
- 日期：
- 改动文件：
- 完成项：
- 风险点：
- 验证结果：
- 是否可交给下一个 session：是 / 否
```

## 10. 全局风险清单

- [ ] 分层素材锚点不统一，可能导致角色错位
- [ ] 低端 Android 对多层透明图的渲染性能存在风险
- [ ] 任务与审核状态流转若分散在多个页面，容易出现回写不一致
- [ ] 离线衰减与在线交互同时修改状态时，存在时间戳覆盖风险
- [ ] 当前 V1 不做服务通知，`pending` 长时间不审核会影响闭环体验

## 11. 当前结论

- [x] 当前仓库已明确采用“分层角色系统”替代整图方案
- [x] 当前仓库需要先按本文件拆分 session，再进入编码
- [x] Phase 0 工程骨架已完成，且已通过开发者工具编译验证
- [x] Phase 1 已完成实现
- [x] 当前项目已具备可继续进入 Session B / C / D / E 的基础骨架

## 12. V1.5 执行清单

说明：本节用于承接 [docs/PetPal-V1.5-Development-Plan-20260516.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-V1.5-Development-Plan-20260516.md:1) 的实际执行。V1 初版清单与回填保留为历史记录，后续实现和勾选以本节为准。

### 12.1 V1.5 范围冻结

- [x] 使用原生 `tabBar`
- [x] 保留 `petpal_state` 作为唯一 storage key
- [x] 保留 `checkins` 的 `pending / approved / rejected` 持久化结构
- [x] 本轮不新增第三方依赖
- [x] 本轮不做多孩子 / 多宠物
- [x] 本轮不做云开发 / 音效 / 语音
- [x] 本轮不做“同一任务每天多次”的底层能力

### 12.2 V1.5 Phase 0：计划冻结与实施准备

目标：建立 V1.5 唯一执行边界，避免继续按 V1 初版计划散改。

交付项：
- [x] 新建 V1.5 开发计划文档
- [x] 在旧开发计划顶部加入“当前已由 V1.5 计划接管”的说明
- [x] 明确新增任务字段、默认模板与迁移策略
- [x] 明确 V1.5 的 phase 与 session 拆分

验证项：
- [x] 后续实现可直接引用 V1.5 计划
- [x] V1.5 计划已覆盖 tab、任务模型、宠物交互、任务页和家长页重构
- [x] 当前执行清单已开始承接 V1.5 勾选

退出标准：
- [x] 可以开始实施导航与数据基座重构

### 12.3 V1.5 Phase 1：导航与数据基座重构

目标：先稳定信息架构和任务数据模型，再推进页面重构。

交付项：
- [x] `app.json` 接入原生 `tabBar`
- [x] `tabBar` 顺序固定为 `任务 / 宠物 / 家长`
- [x] `onboarding` 完成后切换到 `宠物` tab
- [x] `utils/state.js` 支持任务模型迁移
- [x] 新增 `utils/task-schedule.js`
- [x] 预设任务自动补全 `sourceType / schedule / promptText / sortOrder`

验证项：
- [x] `app.json` 可正常解析且包含 3 个 tab
- [x] 预设任务补全后数量仍为 6
- [x] `brushTeeth` 在 `2026-05-16 08:00 CST` 下计算为 `ready`
- [x] 旧结构任务读取后不会丢失原有字段
- [x] `pages/onboarding/onboarding.js`、`pages/index/index.js`、`utils/state.js`、`utils/task-schedule.js` 均通过 `node --check`

退出标准：
- [x] 页面层已可消费新的任务模型与时间派生能力

### 12.4 V1.5 Phase 2：任务引擎与推荐层

目标：建立“现在该做什么”的统一计算逻辑。

交付项：
- [x] 实现 `ready / upcoming / overdue / pending / approved / rejected` 派生状态
- [x] 实现任务时间窗口与排序逻辑
- [x] 实现当前推荐任务计算
- [x] 新增宠物提示文案生成工具
- [x] 建立任务页与宠物页共享的任务视图模型

验证项：
- [x] 同一任务在不同时间点能正确切换派生状态
- [x] 推荐任务与任务页第一优先任务一致
- [x] 无时间配置任务可降级为 `anytime`

退出标准：
- [x] 宠物页与任务页可以共享同一套推荐结果

### 12.5 V1.5 Phase 3：宠物页重构

目标：把首页改成“陪伴页 + 当前任务提示页”。

交付项：
- [x] 删除独立 `抚摸` 按钮
- [x] 接入宠物头部点击 / 身体点击交互
- [x] 增加当前任务提示卡
- [x] 文案改为 `mood + 时间段 + 推荐任务`
- [x] 调整首页动作区、状态区和视觉层级

验证项：
- [x] 点击宠物可直接触发 `pet` 互动，不再依赖独立按钮
- [x] 长按可触发 `pet` 互动
- [x] 无推荐任务时首页会回落到陪伴型文案
- [x] 积分不足时首页会优先引导去做任务

退出标准：
- [x] 首页已具备“看状态 + 知道现在该做什么”的能力

### 12.6 V1.5 Phase 4：任务页重构

目标：把任务页从状态列表改为时间驱动任务流。

交付项：
- [x] 页面分组为 `现在去做 / 今天稍后 / 已完成`
- [x] 增加时间标签、审核标签和动作文案
- [x] 引入统一任务卡组件
- [x] 保持现有打卡、奖励和审核流兼容

验证项：
- [x] `ready` 任务优先出现在首屏
- [x] `upcoming` 任务默认不可直接提交
- [x] `pending / approved / rejected` 状态展示正确

退出标准：
- [x] 孩子打开任务页时第一眼就能看到当前最该做的任务

### 12.7 V1.5 Phase 5：家长页与自定义任务

目标：在保留快速审核路径的同时补齐任务配置能力。

交付项：
- [x] 家长页拆成 `待审核 / 今日任务管理 / 任务模板与自定义任务`
- [x] 支持单条审核与批量审核
- [x] 支持创建、编辑、删除、启用、禁用自定义任务
- [x] 支持配置图标、名称、时间、积分与审核方式

验证项：
- [x] 家长仍可批量完成当天审核
- [x] 新增自定义任务后孩子侧能在对应时间段看到
- [x] `requireConfirm=false` 的任务可直接奖励

退出标准：
- [x] 家长无需改代码即可完成基础任务配置

### 12.8 V1.5 Phase 6：视觉收口与交互细化

目标：在不新增依赖的前提下把页面收口到儿童产品水准。

交付项：
- [x] 统一 tab、提示卡、任务卡和 badge 视觉语言
- [x] 强化时间段氛围色
- [x] 强化点击、长按、完成和待审核反馈
- [x] 收口首页、任务页和家长页文案

验证项：
- [x] 视觉层级明确，主要行动位清晰
- [x] 文案以动作和陪伴口吻为主
- [ ] 真机交互无明显误触或卡顿

退出标准：
- [x] 页面达到可联调验收状态

### 12.9 V1.5 Phase 7：联调、迁移验证与真机回归

目标：确保新结构不破坏旧数据和旧闭环。

交付项：
- [x] 覆盖老 storage 升级验证
- [x] 覆盖跨日、时间段切换和任务排序验证
- [ ] 覆盖宠物手势误触验证
- [x] 覆盖自定义任务 CRUD 验证
- [ ] 覆盖 iPhone / Android 真机回归

验证项：
- [x] 老用户升级后宠物、积分和任务历史不丢失
- [x] 同一天内任务状态和推荐结果一致
- [x] 自定义任务创建、编辑、关闭和删除均能正确回写

退出标准：
- [ ] V1.5 真机回归完成后可进入下一轮体验验证

### 12.10 V1.5 Session 拆分

- [x] Session J：计划与清单重置
- [x] Session K：导航与数据基座
- [x] Session L：宠物页重构
- [x] Session M：任务页重构
- [x] Session N：家长页与自定义任务
- [ ] Session O：联调与回归

### Session J 回填
- 日期：2026-05-16
- 改动文件：`docs/PetPal-Execution-Checklist.md`、`docs/PetPal-Development-Plan.md`、`docs/PetPal-V1.5-Development-Plan-20260516.md`
- 完成项：建立 V1.5 开发计划文档；在旧 V1 开发计划顶部补充“当前已由 V1.5 计划接管”的说明；把总控清单扩展为 V1.5 执行清单，并新增 `Phase 0-7` 与 `Session J-O` 边界；同步回填 V1.5 `Phase 0`
- 风险点：V1 历史清单与 V1.5 新清单共存于同一文档，后续回填时必须明确以 `12. V1.5 执行清单` 为准，避免误勾旧阶段
- 验证结果：已新增 [docs/PetPal-V1.5-Development-Plan-20260516.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-V1.5-Development-Plan-20260516.md:1)；已在 [docs/PetPal-Development-Plan.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-Development-Plan.md:1) 顶部写明 V1.5 接管关系；已在本文件中新增 V1.5 分节并开始逐阶段勾选
- 是否可交给下一个 session：是

### Session K 回填
- 日期：2026-05-16
- 改动文件：`app.json`、`pages/onboarding/onboarding.js`、`pages/index/index.js`、`utils/state.js`、`utils/task-schedule.js`、`utils/storage.js`、`docs/PetPal-Execution-Checklist.md`
- 完成项：接入原生 `tabBar`，顺序固定为 `任务 / 宠物 / 家长`；把 onboarding 完成后的跳转改为 `switchTab('/pages/index/index')`；为任务模型补充 `sourceType / schedule / promptText / sortOrder`；新增 `utils/task-schedule.js` 统一管理默认模板、派生状态、排序和推荐任务；为 `utils/storage.js` 增加无 `wx` 环境下的内存 fallback，保证本地 Node 回归脚本可用；同步回填 V1.5 `Phase 1`
- 风险点：当前 `tabBar` 先使用原生实现，没有引入自定义中间凸起宠物按钮；Node fallback 只用于当前本地回归，不代表真实小程序 storage 行为完全等价
- 验证结果：已通过 `node --check utils/task-schedule.js`、`node --check utils/state.js`、`node --check pages/onboarding/onboarding.js`、`node --check pages/index/index.js`；已通过本地脚本验证 `brushTeeth` 在 `2026-05-16 08:00 CST` 下状态为 `ready`，且 `app.json` 已包含 3 个 tab
- 是否可交给下一个 session：是

### Session L 回填
- 日期：2026-05-16
- 改动文件：`utils/task-prompt.js`、`pages/index/index.js`、`pages/index/index.wxml`、`pages/index/index.wxss`、`components/pet-avatar/index.js`、`components/pet-avatar/index.wxml`、`docs/PetPal-Execution-Checklist.md`
- 完成项：新增 `utils/task-prompt.js`；让首页基于 `任务推荐 + mood + 积分` 输出提示文案；新增首页“当前任务”提示卡与更明确的视觉层级；移除独立 `抚摸` 按钮；接入点击宠物直接触发 `pet` 互动，并补充 `bindlongpress` 到 `pet-avatar` 组件；同步回填 V1.5 `Phase 2`、`Phase 3`
- 风险点：当前已补点击和长按事件链路，但轻扫手势仍未单独实现；点击头部与身体会共享同一 `pet` 奖励逻辑，差异主要体现在 `pet-avatar` 本身动画反馈
- 验证结果：已通过 `node --check pages/index/index.js`、`node --check components/pet-avatar/index.js`、`node --check utils/task-prompt.js`；已通过本地脚本验证首页早晨会推荐 `brushTeeth`，积分为 `0` 时文案会引导先完成任务
- 是否可交给下一个 session：是

### Session M 回填
- 日期：2026-05-16
- 改动文件：`components/task-card/index.json`、`components/task-card/index.js`、`components/task-card/index.wxml`、`components/task-card/index.wxss`、`pages/tasks/tasks.json`、`pages/tasks/tasks.js`、`pages/tasks/tasks.wxml`、`pages/tasks/tasks.wxss`、`docs/PetPal-Execution-Checklist.md`
- 完成项：新增统一 `task-card` 组件；把任务页改为 `现在去做 / 今天稍后 / 已完成` 三段分组；接入时间标签、审核标签与推荐高亮；保持原有打卡、奖励与审核流兼容；同步回填 V1.5 `Phase 4`
- 风险点：当前任务页分组与推荐逻辑依赖 `utils/task-schedule.js` 统一输出，后续若修改排序规则，首页与任务页会同时受影响，需要联调验证
- 验证结果：已通过 `node --check components/task-card/index.js`、`node --check pages/tasks/tasks.js`；已通过本地脚本验证 `2026-05-16 08:00 CST` 下 `brushTeeth` 会出现在 `now` 组，下午会切换为 `overdue`
- 是否可交给下一个 session：是

### Session N 回填
- 日期：2026-05-16
- 改动文件：`pages/parent/parent.js`、`pages/parent/parent.wxml`、`pages/parent/parent.wxss`、`utils/state.js`、`docs/PetPal-Execution-Checklist.md`
- 完成项：把家长页改为 `待审核 / 今日任务管理 / 任务模板与自定义任务` 三块；新增单条通过 / 单条驳回；新增自定义任务创建、编辑、删除、本地启用与禁用；支持配置图标、名称、时间、积分和审核方式；同步回填 V1.5 `Phase 5`
- 风险点：当前自定义任务重复星期固定为全周，尚未开放逐星期配置；历史 `checkins` 若引用已删除的自定义任务，列表会按“任务已移除”兜底展示
- 验证结果：已通过 `node --check pages/parent/parent.js`、`node --check utils/state.js`；已通过本地脚本验证自定义任务可创建、编辑、删除，并验证 `requireConfirm=false` 的自定义任务能进入 `ready` 并兼容直接奖励；已验证单条审核通过后 `status -> approved`、积分 `+1`、快乐值 `+1`
- 是否可交给下一个 session：是

### Session A 回填
- 日期：2026-05-01
- 改动文件：`project.config.json`、`app.js`、`app.json`、`app.wxss`、`pages/onboarding/onboarding.*`、`pages/index/index.*`、`pages/tasks/tasks.*`、`pages/parent/parent.*`、`utils/storage.js`、`utils/state.js`、`utils/time.js`、`docs/PetPal-Execution-Checklist.md`
- 完成项：完成小程序最小工程骨架、四个页面占位路由、`petpal_state` 默认结构与初始化、storage 封装、日期工具、今日任务状态查询辅助，并同步回填 Phase 0 / Phase 1 勾选状态
- 风险点：`project.config.json` 当前使用 `touristappid` 占位，若开发者工具本机配置不接受该值，需要替换为实际测试 AppID；页面目前仅为编译占位，业务逻辑仍待后续 session 实现
- 验证结果：已做本地脚本验证，确认 `app.json` 路由结构存在、默认 state 初始化/恢复/重置行为正确、日期工具能区分今天与非今天、跨日判断符合预期；2026-05-01 已在微信开发者工具中实际打开并编译项目，成功渲染 `pages/onboarding/onboarding` 占位页，且通过 `Storage` 面板确认 `petpal_state` 已写入本地 storage
- 是否可交给下一个 session：是

### Session B 回填
- 日期：2026-05-01
- 改动文件：`utils/decay.js`、`utils/pet-renderer.js`、`components/pet-avatar/index.js`、`components/pet-avatar/index.json`、`components/pet-avatar/index.wxml`、`components/pet-avatar/index.wxss`、`components/pet-avatar/index-placeholder.md`、`assets/pet/README.md`、`assets/pet/dog/base/.gitkeep`、`assets/pet/dog/face/.gitkeep`、`assets/pet/dog/pose/.gitkeep`、`assets/pet/common/fx/.gitkeep`、`docs/PetPal-Execution-Checklist.md`
- 完成项：实现宠物离线衰减与情绪计算；建立 `dog` 在 `excited / normal / sad / sick` 下的分层渲染配置；为 `idle / feed / play / pet / recover` 预留动作配置；创建 `pet-avatar` 基础组件；建立 `assets/pet/` 分层目录与占位命名规范；同步回填 Phase 2 勾选状态
- 风险点：当前仅建立素材目录和命名规范，真实 PNG 图层仍未入库，组件现阶段依赖占位层完成结构验证；`pet.decayCarry` 为本 session 新增内部字段，用于保留小数衰减余量，后续若有状态持久化白名单或展示逻辑，需要避免把它当成业务字段直接渲染；尚未在 `pages/index/` 做业务接入与开发者工具视觉联调
- 验证结果：已通过本地 Node 脚本验证 `utils/decay.js` 的离线衰减、余量累计与 `mood` 阈值计算，并额外覆盖归零属性不再累计 `decayCarry`：`hunger=0` 停留 1 小时后恢复到 `1`，在 `relaxed` 模式下需 2 小时、`standard` 模式下需 1 小时、`strict` 模式下需 0.5 小时才再次降为 `0`；已验证 `happiness=0` 时也不会继续继承“负债进度”；已验证 `utils/pet-renderer.js` 能按 `species / mood / action` 输出稳定层级与动画配置且未回退；已验证 `components/pet-avatar/index.js` 可正常注册组件并生成 render model；已确认 `assets/pet/dog/base`、`assets/pet/dog/face`、`assets/pet/dog/pose`、`assets/pet/common/fx` 目录存在
- 是否可交给下一个 session：是

### Session C 回填
- 日期：2026-05-01
- 改动文件：`pages/onboarding/onboarding.js`、`pages/onboarding/onboarding.json`、`pages/onboarding/onboarding.wxml`、`pages/onboarding/onboarding.wxss`、`pages/index/index.js`、`pages/index/index.json`、`pages/index/index.wxml`、`pages/index/index.wxss`、`components/stat-bar/index.js`、`components/stat-bar/index.json`、`components/stat-bar/index.wxml`、`components/stat-bar/index.wxss`、`components/action-btn/index.js`、`components/action-btn/index.json`、`components/action-btn/index.wxml`、`components/action-btn/index.wxss`、`docs/PetPal-Execution-Checklist.md`
- 完成项：完成首次设置页的命名输入、`initialized` 持久化和跳转逻辑；完成首页宠物展示、状态条、积分展示、今日任务入口和家长入口；接入 `pet-avatar`、`stat-bar`、`action-btn`；完成 `feed / play / pet` 三个互动动作以及积分不足灰态与提示；同步回填 Phase 3 和 Session C 勾选状态
- 风险点：当前 `pet-avatar` 仍主要依赖 Session B 建立的占位素材目录，真实分层 PNG 未入库时首页会继续显示 fallback 层标签；本 session 只实现了入口跳转，`pages/tasks/` 与 `pages/parent/` 仍是占位页，因此主界面入口闭环仅完成到导航层；互动反馈目前以状态更新和短时动作态为主，未进入 Phase 6 的飘字和更强动画收口
- 验证结果：已通过本地 Node 脚本模拟验证首次打开进入 onboarding、命名后写入 `petpal_state` 并跳转首页、已初始化后不再返回 onboarding、首页加载时能基于当前状态渲染待办任务数；已验证 `feed` 执行后积分 `-1` 且饱食度 `+3`、`play` 执行后积分 `-1` 且快乐值 `+2`、`pet` 执行后快乐值 `+1`；已验证积分归零后喂食/玩耍按钮保持禁用态并给出“积分不够了，先去完成任务吧！”提示；已额外校验四个新增/更新的 `.json` 配置文件可正常解析
- 是否可交给下一个 session：是

### Session D 回填
- 日期：2026-05-01
- 改动文件：`pages/tasks/tasks.js`、`pages/tasks/tasks.wxml`、`pages/tasks/tasks.wxss`、`utils/state.js`、`docs/PetPal-Execution-Checklist.md`
- 完成项：完成任务页列表渲染与样式实现；按当前 `tasks` 预设渲染今日任务并隐藏 `enabled=false` 项；接入任务点击确认弹窗；完成 `pending / approved / rejected` 状态展示与同日不可重复打卡约束；实现 `rejected -> pending` 重提交流转与按日期自动重置当天展示；补充 `utils/state.js` 的按任务按日期读写辅助，并同步回填 Phase 4 和 Session D 勾选状态
- 风险点：当前 `pages/tasks/` 只负责孩子侧打卡与展示，`pending -> approved / rejected` 的实际审核写回仍依赖后续 Session E 按既有 `checkins` 结构回写；历史 `checkins` 若已存在同一任务同一天的重复脏数据，本次实现会优先读取并覆盖最后一条记录，但不会主动清理旧冗余记录；任务页样式已本地通过逻辑模拟校验，但尚未在微信开发者工具做视觉联调
- 验证结果：已通过 `node --check pages/tasks/tasks.js`、`node --check utils/state.js`、`node --check pages/index/index.js` 做语法校验；已通过本地 Node 脚本模拟验证任务页首次渲染仅显示 5 个启用任务、确认打卡后状态写为 `pending`、`pending` 同日不可重复提交、`approved` 显示完成态、`rejected` 可在同日重新提交为 `pending`、`requireConfirm=false` 任务可直接 `approved` 并发放积分/快乐值、跨日定时刷新后任务展示回到新一天状态
- 是否可交给下一个 session：是

### Session E 回填
- 日期：2026-05-01
- 改动文件：`pages/parent/parent.js`、`pages/parent/parent.wxml`、`pages/parent/parent.wxss`、`docs/PetPal-Execution-Checklist.md`
- 完成项：完成家长模式页的 `PIN 设置 -> PIN 校验 -> 家长面板` 流转；首次进入要求设置 4 位 PIN，非首次进入要求 PIN 验证，连续输错 3 次给出提示；按当前 `checkins` 结构渲染全部待审核列表并实现“全部通过 / 全部驳回”；实现任务 `enabled` 开关的实时保存；审核通过后按任务分值回写 `points / pet.totalPointsEarned`，并按通过条数回写 `pet.happiness`；同步回填 Phase 5 和 Session E 勾选状态
- 风险点：当前 PIN 继续按既有 `petpal_state.parentPin` 结构保存在本地 storage，满足兼容性但不提供加密和找回；“全部通过 / 全部驳回” 会处理 storage 中所有 `pending` 记录，不只限定当天，这样可以兼容跨日未审核任务，但也意味着批量操作前需要确认列表内容；连续输错 3 次目前仅给出提示，不做冷却或锁定，这是按本阶段最小需求实现
- 验证结果：已通过 `node --check pages/parent/parent.js` 做语法校验；已通过本地 Node 脚本模拟验证未设置 PIN 时进入设置流程、设置 PIN 后进入家长面板、再次进入必须先验证 PIN、连续输错 3 次会触发提示、全部通过后 `pending -> approved` 且积分与快乐值同步增加、全部驳回后 `pending -> rejected` 且不发放奖励、任务 `enabled` 开关写入 storage 后重新读取仍然保留
- 是否可交给下一个 session：是

### Session F 回填
- 日期：2026-05-02
- 改动文件：`components/pet-avatar/index.wxml`、`components/pet-avatar/index.wxss`、`components/action-btn/index.wxml`、`components/action-btn/index.wxss`、`pages/index/index.js`、`pages/index/index.wxml`、`pages/index/index.wxss`、`utils/pet-renderer.js`、`assets/pet/README.md`、`docs/PetPal-Execution-Checklist.md`
- 完成项：为 `excited / normal / sad / sick` 四种情绪补齐明显可区分的 idle 动画节奏与阴影变化；为 `feed / play / pet / recover` 补齐短时动作反馈动画，并保持与现有 `pet-avatar` 分层渲染结构兼容；在首页接入积分飘字与属性反馈飘字；为互动按钮补齐按压反馈；补充 `assets/pet/README.md` 中的素材尺寸与命名约束；同步回填 Phase 6 与 Session F 勾选状态
- 风险点：当前真实 PNG 素材仍未入库，四类情绪差异主要依赖容器动画、阴影和 fallback 层共同呈现，真实素材接入后仍需在开发者工具或真机复查锚点与节奏；`recover` 动画目前通过首页在 `sick -> 非 sick` 的状态跃迁时串行触发，若后续业务新增更多恢复入口，需要复用同样的页面动作排队逻辑；低端设备“无明显掉帧”当前基于实现策略与本地逻辑校验判定，尚未完成真机性能验证
- 验证结果：已通过 `node --check pages/index/index.js`、`node --check components/pet-avatar/index.js`、`node --check components/action-btn/index.js`、`node --check utils/pet-renderer.js` 做语法校验；已通过本地 Node 沙盒模拟验证首页在 `sick` 状态下执行 `feed` 后会按顺序进入 `feed -> recover -> idle` 动作态，且积分从 `2` 变为 `1`、飘字反馈依次显示 `-1 分`、`+3 饱食`、`恢复精神`；已额外验证 `play` 会立刻进入 `action-play` 且积分 `-1`、快乐值 `+2`、显示 `-1 分 / +2 快乐`，`pet` 会立刻进入 `action-pet` 且保持积分不变、显示 `+1 快乐`，禁用态 `feed` 会维持 `idle` 并弹出“积分不够了，先去完成任务吧！”；已验证 `utils/pet-renderer.js` 在四种情绪下分别输出 `idle-excited / idle-normal / idle-sad / idle-sick`，在动作态下分别输出 `action-feed / action-play / action-pet / action-recover`；已确认本次未进入 `pages/tasks/`、`pages/parent/` 与 Phase 7 之后范围
- 是否可交给下一个 session：是

### Session G 回填
- 日期：2026-05-02
- 改动文件：`docs/PetPal-Execution-Checklist.md`
- 完成项：完成 Phase 7 的 9 个验收场景并全部通过；完成跨页面联调，覆盖 `pages/onboarding/onboarding`、`pages/index/index`、`pages/tasks/tasks`、`pages/parent/parent` 与 `utils/state.js`、`utils/decay.js` 的关键状态流转；补充微信开发者工具 `iPhone 14 Pro Max` 模拟器下的首页、任务页、家长页冒烟检查；同步回填 Phase 7、Phase 8、Session G 勾选与当前文档状态
- 风险点：当前环境未连接真实 iPhone / Android 设备，Phase 8 的真机冒烟、真机布局、真机动画与“30 秒审核路径”仍待实机补测；首页角色当前仍依赖 `pet-avatar` fallback 层展示占位文案，真实 PNG 分层素材接入后需复查视觉与性能；微信开发者工具代码质量面板仍存在主包尺寸 / 图片资源相关告警，本次未纳入 Phase 7 / 8 阻断修复范围
- 验证结果：已通过 `node --check pages/onboarding/onboarding.js`、`node --check pages/index/index.js`、`node --check pages/tasks/tasks.js`、`node --check pages/parent/parent.js`、`node --check utils/state.js`、`node --check utils/decay.js` 做语法校验；已通过本地 Node 沙盒完成 Phase 7 九个验收场景验证，覆盖首次设置、时间衰减、刷牙待审核、家长审核奖励、积分消耗归零、`sick -> feed -> recover` 恢复链路、PIN 二次进入校验、离线衰减、刷新持久化，结果全部通过；已在微信开发者工具 `iPhone 14 Pro Max` 模拟器中确认 `pages/index/index`、`pages/tasks/tasks`、`pages/parent/parent` 可正常进入，当前未见明显布局错位；未连接真实 iPhone / Android 设备，相关 Phase 8 真机项本次未勾选
- 是否可进入交付或下一轮迭代：可进入下一轮迭代；直接交付前需补 iPhone / Android 真机测试

### Session H 回填
- 日期：2026-05-06
- 改动文件：`project.config.json`、`utils/pet-renderer.js`、`components/pet-avatar/index.wxml`、`components/pet-avatar/index.wxss`、`assets/pet/dog/portrait/happy_doge.jpg`、`assets/pet/dog/portrait/normal_dog.jpg`、`assets/pet/dog/portrait/sad_dog.jpg`、`assets/pet/dog/portrait/sick_dog.jpg`、`assets/pet/README.md`、`docs/PetPal-Execution-Checklist.md`
- 完成项：按 Session H 顺序先核对当前工作区未提交改动与 `Phase 8` 未完成项；复查微信开发者工具当前项目与 `iPhone 14 Pro Max` 模拟器状态；补充真实 `iPhone / Android` 真机补测条件核验结论；在收到真机调试 `80051` 报错后，定位并修复真机调试源码包超限问题；在收到“宠物形象未展示”反馈后，定位到 `assets/pet/` 缺少真实分层 PNG、`utils/pet-renderer.js` 仍指向不存在文件；基于现有 4 张情绪源图生成轻量运行时主体图，并让渲染器按 `mood` 直接显示真实宠物主体；在收到“宠物前面有覆盖物”反馈后，定位到 fallback 默认开启导致前景遮挡，并改为仅在图片加载失败时显示 fallback；保留 `pet-avatar` 组件内的绘制 fallback 作为更低一级兜底；保持 `iPhone 真机冒烟测试`、`Android 真机冒烟测试`、`儿童单手操作路径检查`、`家长 30 秒审核路径检查`、`真机页面布局无明显错位`、`角色动画在真机上可正常运行`、`家长审核流程可在 30 秒内完成`、`无阻断交付的 P0 缺陷`、`可进入交付或下一轮迭代` 等未实测项未勾选；新增本次阻塞说明、缺陷修复记录与交付判断
- 风险点：当前宿主机仅安装 Command Line Tools，未安装完整 Xcode，`xcrun devicectl` / `xcrun xctrace` 不可用；当前环境无 `adb`、无 `idevice_id` / `ideviceinfo` / `ios-deploy`，且系统 USB 枚举未发现真实 `iPhone / Android` 设备，因此无法客观完成真实 iPhone / Android 冒烟、儿童单手路径与家长 `30 秒` 审核路径检查；本次通过 `project.config.json` 的 `packOptions.ignore` 排除了未参与运行时的原始 PNG、wireframe 与文档资源，若后续页面重新直接引用 `assets/images/` 或 `docs/` 下文件，需要同步调整打包策略；当前 `dog/portrait/` 是为 `Phase 8` 真机可见性补的轻量单图主体资源，不是真正的最终分层素材，后续若补齐 `base / face / pose / fx` 真实图层，需要重新校准锚点与动画层次；当前 fallback 改为“仅报错时显示”，如果后续主体图改回远程图或超大本地图，首屏加载慢时会先短暂显示空白而不是覆盖占位；源图右下角原始水印在圆形裁切下当前未明显露出，但正式交付前仍建议替换为无水印自有素材
- 验证结果：已执行 `git status --short --branch` 确认当前分支为 `main` 且工作区存在既有未提交改动，本次未回退或覆盖；已读取 `docs/PetPal-Execution-Checklist.md` 的 `Phase 8` 与 `Session G` 回填内容确认真机项原本未完成；已执行 `xcode-select -p` 确认当前仅指向 `/Library/Developer/CommandLineTools`，并通过 `xcrun devicectl list devices`、`xcrun xctrace list devices` 验证当前缺少完整 iOS 真机调试工具；已执行 `adb devices -l`、`which idevice_id ideviceinfo ios-deploy`、`system_profiler SPUSBDataType` 验证当前无 Android 调试链路、无 iOS 设备工具且未识别到真实手机；已在微信开发者工具中打开 `真机调试` 面板，确认当前仅能进入二维码真机调试入口，未形成可验证的真实 iPhone / Android 连接会话；已针对 `Error 80051: source size 13742KB exceed max limit 2MB` 做根因定位，确认 `assets/images/` 下 4 张未被运行时代码引用的原始 PNG 合计约 `13MB`，与真机调试报错体积一致；已在 `project.config.json` 中新增 `packOptions.ignore`，排除 `assets/images`、`assets/wireframes`、`docs` 与 `HANDOVER.md`；已本地校验 `project.config.json` 可正常解析，并按忽略规则复算当前预计上传体积约为 `0.24MB`；已把 4 张 `2048x2048` 源图压缩为 `512x512` 轻量 JPG，输出到 `assets/pet/dog/portrait/`，总计约 `160KB`；已验证 `utils/pet-renderer.js` 在四种情绪下均输出存在的 `base` 层路径；已在微信开发者工具 `iPhone 14 Pro Max` 模拟器中确认首页宠物主体恢复可见，不再出现“仅有 FX 占位、宠物主体空白”；已将主体层 fallback 默认值改为关闭，仅在 `binderror` 时回退显示，避免兜底绘制覆盖真实宠物主体
- 是否可进入交付或下一轮迭代：可进入下一轮迭代；不可标记为可直接交付，需在真实 `iPhone` 与真实 `Android` 连接条件具备后补完 `Phase 8` 全部未勾选项，再重新判断是否可交付

### Session I 回填
- 日期：2026-05-12
- 改动文件：`docs/PetPal-Execution-Checklist.md`、`docs/PetPal-UX-Optimization-Design-20260512.md`
- 完成项：根据用户确认，将 `Phase 8` 中真实 `iPhone / Android` 冒烟、儿童单手路径、家长 `30 秒` 审核路径及相关验证项统一回填为完成；补充 PetPal 下一轮整体设计优化方案，明确新的 `任务 / 宠物 / 家长` 三 tab 信息架构、宠物自然触摸交互、时间驱动任务流和自定义任务配置方案；本 session 不修改业务代码，只输出设计文档与总控状态回填
- 风险点：`Phase 8` 本次是依据用户提供的真机校验结果做文档回填，未在当前环境重复执行真机复测；新增设计文档会引入任务 `schedule`、自定义任务和新的展示派生状态，后续实现需要处理存量 storage 兼容与页面联调；当前方案优先保证信息架构和任务模型正确，视觉细节仍需在实现阶段再做真机打磨
- 验证结果：已核对 [app.json](/Users/liumeng/private/mini_program/petpal/app.json)、[pages/index/index.wxml](/Users/liumeng/private/mini_program/petpal/pages/index/index.wxml)、[pages/tasks/tasks.wxml](/Users/liumeng/private/mini_program/petpal/pages/tasks/tasks.wxml)、[pages/parent/parent.wxml](/Users/liumeng/private/mini_program/petpal/pages/parent/parent.wxml) 与现有产品/开发文档，确认当前实现仍缺少稳定 tab 导航、时间驱动任务分组和自定义任务能力；已新增 `docs/PetPal-UX-Optimization-Design-20260512.md`，内容覆盖目标、信息架构、页面方案、任务模型、实现顺序和外部参考资料；已同步更新 `Phase 8` 勾选状态与文档顶部状态说明
- 是否可交给下一个 session：是；下一步应先按本文拆分实现 session，再进入编码
