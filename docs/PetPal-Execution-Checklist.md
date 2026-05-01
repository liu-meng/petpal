# PetPal V1 执行总控清单

> 项目路径：`/Users/liumeng/private/mini_program/petpal`
> 文档角色：V1 开发唯一执行清单
> 当前状态：Session A 已完成工程骨架与状态基座，开发者工具编译验证待确认，后续阶段待实现
> 最近更新：2026-05-01

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
- [ ] 1 个宠物物种：`dog`
- [ ] 4 种情绪：`excited / normal / sad / sick`
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

- [ ] 放弃“4 张整图切换”方案
- [ ] 使用“分层角色系统”作为唯一角色渲染方案
- [ ] 角色由 `base / face / pose / fx / accessory` 多层组合构成
- [ ] 页面只消费角色状态，不直接写死图片映射逻辑
- [ ] 角色状态映射通过配置表统一管理

### 4.2 工程约束

- [x] 默认只做最小必要修改
- [x] 不引入 Redux / MobX / Taro / Canvas 动画库
- [x] 状态管理使用 `App`、`Page` 与 `utils/state.js`
- [ ] 衰减逻辑统一收口到 `utils/decay.js`
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
- [ ] `utils/decay.js`
- [ ] `utils/pet-renderer.js`
- [ ] `assets/pet/dog/base/`
- [ ] `assets/pet/dog/face/`
- [ ] `assets/pet/dog/pose/`
- [ ] `assets/pet/common/fx/`

## 6. 数据与渲染模型

### 6.1 状态模型

- [x] 保留 `petpal_state` 作为唯一 storage key
- [x] 保留 `initialized / pet / points / tasks / checkins / parentPin / settings` 主结构
- [x] `pet` 中保留 `name / type / stage / hunger / happiness / totalPointsEarned / lastDecayAt`
- [x] `tasks` 使用预设任务列表初始化
- [x] `checkins` 按日期记录任务状态流转
- [x] `settings.decaySpeed` 支持 `relaxed / standard / strict`

### 6.2 角色渲染配置

- [ ] 角色配置支持 `species / mood / action / parts / anim`
- [ ] `mood` 根据 `hunger + happiness` 统一计算
- [ ] `action` 至少支持 `idle / feed / play / pet / recover`
- [ ] `parts` 支持按情绪切换眼睛、嘴巴、耳朵、尾巴、特效
- [ ] `anim` 支持按情绪切换 idle 动画

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
- [ ] 微信开发者工具可正常打开并编译空工程
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
- [ ] 实现 `utils/decay.js`
- [ ] 实现 `utils/pet-renderer.js`
- [ ] 创建 `components/pet-avatar/`
- [ ] 建立 `dog` 的分层素材目录
- [ ] 建立 `excited / normal / sad / sick` 的角色配置映射
- [ ] 为 `feed / play / pet / recover` 预留动作配置

验证项：
- [ ] 根据 `lastDecayAt` 可正确计算离线衰减
- [ ] `mood` 计算结果与设计规则一致
- [ ] `pet-avatar` 可根据配置渲染正确层级
- [ ] 切换 `mood` 时无需改页面结构即可切换视觉表现

退出标准：
- [ ] 主页面只需传入角色状态即可渲染宠物

### Phase 3：首次设置与主界面闭环（预计 3h）

目标：打通 onboarding、首页宠物展示、互动按钮、积分消耗闭环。

交付项：
- [ ] 实现 `pages/onboarding/onboarding.*`
- [ ] 实现 `pages/index/index.*`
- [ ] 接入 `pet-avatar` 到主界面
- [ ] 接入 `stat-bar` 与 `action-btn`
- [ ] 实现宠物命名保存
- [ ] 实现 `feed / play / pet` 三个互动动作
- [ ] 实现积分不足禁用态
- [ ] 实现首页“今日任务入口”和家长入口

验证项：
- [ ] 首次打开进入 onboarding
- [ ] 输入名字后进入主界面
- [ ] 刷新后不再重复 onboarding
- [ ] 喂食后积分 `-1`、饱食度 `+3`
- [ ] 玩耍后积分 `-1`、快乐值 `+2`
- [ ] 抚摸后快乐值 `+1`
- [ ] 积分不足时喂食 / 玩耍不可点击

退出标准：
- [ ] 孩子能在主界面看到宠物并完成基础互动

### Phase 4：任务系统（预计 4h）

目标：实现任务列表、打卡确认、当日状态展示、待审核流转。

交付项：
- [ ] 实现 `pages/tasks/tasks.*`
- [ ] 渲染预设任务列表
- [ ] 隐藏 `enabled=false` 任务
- [ ] 实现任务点击确认弹窗
- [ ] 实现 `pending / approved / rejected` 状态流转
- [ ] 实现“同一任务同一天不可重复打卡”
- [ ] 实现跨日自动重置任务展示状态

验证项：
- [ ] 今日待打卡任务显示为未完成
- [ ] 确认打卡后显示 `pending`
- [ ] `pending` 任务不可重复点击
- [ ] `approved` 任务显示完成态
- [ ] 被驳回的任务可恢复为待打卡
- [ ] 跨日后任务列表回到新一天状态

退出标准：
- [ ] 孩子侧任务闭环可独立运行，只差家长审核入口

### Phase 5：家长模式（预计 4h）

目标：实现 PIN、审核列表、批量审核、任务开关。

交付项：
- [ ] 实现 `pages/parent/parent.*`
- [ ] 首次进入设置 4 位 PIN
- [ ] 非首次进入走 PIN 校验
- [ ] 连续输错 3 次给出提示
- [ ] 渲染待审核列表
- [ ] 实现全部通过
- [ ] 实现全部驳回
- [ ] 实现任务 `enabled` 开关实时保存
- [ ] 实现家长审核后同步回写积分与快乐值

验证项：
- [ ] 未设置 PIN 时强制进入设置流程
- [ ] 已设置 PIN 时必须通过验证才能进入
- [ ] 全部通过后 `pending` 记录变为 `approved`
- [ ] 审核通过后积分 `+1`、快乐值 `+1`
- [ ] 全部驳回后任务恢复可重新打卡
- [ ] 任务开关刷新后仍然保留

退出标准：
- [ ] 核心“孩子打卡 -> 家长审核 -> 奖励到账”闭环跑通

### Phase 6：动画与视觉收口（预计 3h）

目标：让分层角色系统具备稳定的情绪表现和互动反馈。

交付项：
- [ ] 为 `excited` 实现明显的开心 idle 动画
- [ ] 为 `normal` 实现平静 idle 动画
- [ ] 为 `sad` 实现低落 idle 动画
- [ ] 为 `sick` 实现虚弱 idle 动画
- [ ] 为互动动作补充短时反馈动画
- [ ] 为积分变化补充飘字反馈
- [ ] 为按钮补充点击反馈
- [ ] 压缩和整理角色素材，控制图片尺寸与命名规范

验证项：
- [ ] 四种情绪视觉差异明显
- [ ] 互动动作后存在立即可感知反馈
- [ ] 低端设备上无明显掉帧
- [ ] 图片资源不会造成明显首屏卡顿

退出标准：
- [ ] 角色表现不再依赖整图切换，且视觉层级稳定

### Phase 7：集成测试与验收（预计 2-3h）

目标：严格按产品验收路径完成全链路测试。

交付项：
- [ ] 执行首次设置验收
- [ ] 执行衰减验收
- [ ] 执行任务打卡验收
- [ ] 执行家长审核验收
- [ ] 执行互动消耗验收
- [ ] 执行生病恢复验收
- [ ] 执行 PIN 验收
- [ ] 执行离线衰减验收
- [ ] 执行刷新持久化验收

验证项：
- [ ] 验收场景 1：首次打开输入名字后进入首页
- [ ] 验收场景 2：等待或模拟时间后宠物状态下降
- [ ] 验收场景 3：点击刷牙后进入待审核
- [ ] 验收场景 4：家长审核通过后积分到账
- [ ] 验收场景 5：积分为 1 时喂食后归 0
- [ ] 验收场景 6：状态过低时进入 sick，互动后恢复
- [ ] 验收场景 7：设置 PIN 后再次进入需验证
- [ ] 验收场景 8：离线一段时间后再次打开会衰减
- [ ] 验收场景 9：刷新页面后数据保留

退出标准：
- [ ] 9 项验收全部通过

### Phase 8：真机测试与问题回收（预计 3-4h）

目标：在真实设备上确认儿童可用性、家长操作时长与性能表现。

交付项：
- [ ] iPhone 真机冒烟测试
- [ ] Android 真机冒烟测试
- [ ] 儿童单手操作路径检查
- [ ] 家长 30 秒审核路径检查
- [ ] 收集并修复关键问题

验证项：
- [ ] 真机页面布局无明显错位
- [ ] 角色动画在真机上可正常运行
- [ ] 家长审核流程可在 30 秒内完成
- [ ] 无阻断交付的 P0 缺陷

退出标准：
- [ ] 可进入交付或下一轮迭代

## 8. Session 拆分方案

说明：每个 session 只处理自己负责的写入范围，完成后必须回写本文件勾选状态、风险点、验证结果。

### Session A：工程骨架与状态基座

- [x] 负责 `app.*`、`utils/storage.js`、`utils/state.js`、`utils/time.js`
- [x] 负责完成 Phase 0、Phase 1
- [x] 不修改任务页、家长页、角色表现细节

### Session B：角色渲染内核

- [ ] 负责 `components/pet-avatar/`、`utils/decay.js`、`utils/pet-renderer.js`、`assets/pet/`
- [ ] 负责完成 Phase 2
- [ ] 不修改任务逻辑和家长审核逻辑

### Session C：onboarding 与主界面

- [ ] 负责 `pages/onboarding/`、`pages/index/`、`components/stat-bar/`、`components/action-btn/`
- [ ] 负责完成 Phase 3
- [ ] 依赖 Session A、Session B 完成

### Session D：任务系统

- [ ] 负责 `pages/tasks/`
- [ ] 负责完成 Phase 4
- [ ] 依赖 Session A 完成

### Session E：家长模式

- [ ] 负责 `pages/parent/`
- [ ] 负责完成 Phase 5
- [ ] 依赖 Session A、Session D 完成

### Session F：动画与素材收口

- [ ] 负责角色动画、交互反馈、素材压缩与命名规范
- [ ] 负责完成 Phase 6
- [ ] 依赖 Session B、Session C 完成

### Session G：集成测试与回归

- [ ] 负责 Phase 7、Phase 8
- [ ] 负责跨页面联调、缺陷回收、本文件最终勾选
- [ ] 可以修改小范围问题，但不得推翻既有边界

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
- [x] Phase 0 工程骨架已完成，开发者工具编译验证待确认
- [x] Phase 1 已完成实现
- [x] 当前项目已具备可继续进入 Session B / C / D / E 的基础骨架

### Session A 回填
- 日期：2026-05-01
- 改动文件：`project.config.json`、`app.js`、`app.json`、`app.wxss`、`pages/onboarding/onboarding.*`、`pages/index/index.*`、`pages/tasks/tasks.*`、`pages/parent/parent.*`、`utils/storage.js`、`utils/state.js`、`utils/time.js`、`docs/PetPal-Execution-Checklist.md`
- 完成项：完成小程序最小工程骨架、四个页面占位路由、`petpal_state` 默认结构与初始化、storage 封装、日期工具、今日任务状态查询辅助，并同步回填 Phase 0 / Phase 1 勾选状态
- 风险点：`project.config.json` 当前使用 `touristappid` 占位，若开发者工具本机配置不接受该值，需要替换为实际测试 AppID；页面目前仅为编译占位，业务逻辑仍待后续 session 实现
- 验证结果：已做本地脚本验证，确认 `app.json` 路由结构存在、默认 state 初始化/恢复/重置行为正确、日期工具能区分今天与非今天、跨日判断符合预期；当前环境未发现微信开发者工具应用，实际导入编译尚未执行，因此对应验证项暂未勾选
- 是否可交给下一个 session：是
