# PetPal V1.5 开发计划

> **项目**：PetPal 微信小程序体验优化  
> **计划日期**：2026-05-16  
> **状态**：待执行  
> **适用范围**：基于 [PetPal-UX-Optimization-Design-20260512.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-UX-Optimization-Design-20260512.md:1) 的下一轮实现  
> **替代关系**：本计划用于替代 V1 初版功能开发计划，不回退已完成的 V1 基础闭环

---

## 一、计划目标

### 1.1 本轮要解决什么

PetPal 当前已经具备可用的 V1 闭环，但信息架构、任务时间感、宠物交互自然度和家长配置能力仍不足以支撑“让孩子主动回来完成当前习惯任务”的产品目标。

本轮开发计划要完成四件事：

1. 把顶层结构改成稳定的 `任务 / 宠物 / 家长` 三 tab
2. 把任务系统从“状态列表”升级为“时间驱动任务流”
3. 把宠物首页从“功能首页”升级为“陪伴页 + 当前任务提示页”
4. 把家长页从“审核页”升级为“审核 + 任务配置中心”，支持自定义任务

### 1.2 本轮完成标准

- 孩子默认进入 `宠物` tab，但可稳定切换 `任务 / 宠物 / 家长`
- 任务可基于时间段展示为 `现在去做 / 今天稍后 / 已完成`
- 宠物可通过点击 / 长按触发自然互动，不再依赖独立 `抚摸` 按钮
- 家长可新增、编辑、启用、禁用自定义任务
- 老用户已有 storage 数据可无破坏迁移

---

## 二、范围定义

### 2.1 本轮必做范围

- 原生 `tabBar`
- 任务模型补充 `sourceType / schedule / promptText / sortOrder`
- 任务展示派生状态：`upcoming / ready / overdue / pending / approved / rejected`
- 宠物页的当前任务提示卡
- 宠物自然触摸交互
- 时间分组任务页
- 家长页的任务配置能力
- 自定义任务创建与编辑

### 2.2 本轮明确不做

- 不接入云开发
- 不做多孩子 / 多宠物
- 不引入第三方依赖
- 不做音效 / 语音
- 不做成就系统 / 商店 / 宠物成长扩展
- 不在本轮支持“同一任务每天多次”的底层能力
- 不做复杂周报和数据分析页

---

## 三、当前基线与主要差距

### 3.1 已有基础

当前仓库已经完成：

- `onboarding / index / tasks / parent` 四页基础闭环
- `pending / approved / rejected` 审核流
- `feed / play / pet` 三种互动动作
- 宠物情绪、衰减和基础动画
- PIN 家长模式
- 真机补测结果回填

### 3.2 当前差距

| 维度 | 当前状态 | 目标状态 |
|-----|---------|---------|
| 顶层导航 | 首页内按钮跳页 | 底部三 tab 稳定切换 |
| 任务组织 | 仅按完成状态平铺 | 按时间段和优先级组织 |
| 宠物交互 | `抚摸` 仍是按钮 | 直接触摸宠物触发 |
| 宠物提示 | 主要按 mood 文案 | mood + 时间段 + 推荐任务联合驱动 |
| 家长配置 | 仅任务开关 | 可增删改自定义任务 |
| 数据模型 | 任务只有基础字段 | 任务具备 schedule 和排序能力 |

---

## 四、关键实现决策

### 4.1 导航策略

- 使用小程序原生 `tabBar`
- `tabBar` 顺序固定为：`任务 / 宠物 / 家长`
- 默认体验仍从 `宠物` 开始

实现策略：

- 保留 `pages/onboarding/onboarding` 作为冷启动入口门卫页
- 未初始化时停留 onboarding
- 已初始化时由 onboarding 或启动逻辑跳转到 `/pages/index/index`
- `tasks / index / parent` 三页纳入 `tabBar`

这样可以同时满足：

- tab 顺序按新设计执行
- 默认落点仍是宠物
- 不引入自定义 tabBar 的额外复杂度

### 4.2 状态兼容策略

- 继续使用唯一 storage key：`petpal_state`
- 继续保留 `checkins` 结构，不改历史记录模型
- 在 `utils/state.js` 的 normalize 流程中补任务模型迁移
- 老任务缺字段时，自动注入默认 `schedule / promptText / sourceType / sortOrder`

### 4.3 任务模型策略

本轮不推翻现有任务结构，而是在原结构上扩展：

```js
{
  id: "brushTeeth",
  sourceType: "preset",     // preset | custom
  icon: "🪥",
  label: "刷牙",
  points: 1,
  enabled: true,
  requireConfirm: true,
  schedule: {
    period: "morning",
    startAt: "07:00",
    endAt: "09:00",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
  },
  promptText: "先去刷牙吧",
  sortOrder: 10,
  createdAt: 0,
  updatedAt: 0
}
```

### 4.4 派生状态策略

底层持久化仍只保存：

- `pending`
- `approved`
- `rejected`

页面展示层新增派生状态：

- `upcoming`
- `ready`
- `overdue`
- `pending`
- `approved`
- `rejected`

这样可以减少历史数据迁移成本，同时满足新的 UI 组织方式。

### 4.5 交互策略

- `喂食`、`玩耍` 保留按钮
- `抚摸` 按钮删除，但内部动作名 `pet` 保留，避免大规模逻辑重写
- `pet-avatar` 继续承担命中区域和动作承载
- 首页业务层只消费“宠物触摸事件”和“当前推荐任务”

---

## 五、建议文件调整

### 5.1 必改文件

- [app.json](/Users/liumeng/private/mini_program/petpal/app.json:1)
- [pages/onboarding/onboarding.js](/Users/liumeng/private/mini_program/petpal/pages/onboarding/onboarding.js:1)
- [pages/index/index.js](/Users/liumeng/private/mini_program/petpal/pages/index/index.js:1)
- [pages/index/index.wxml](/Users/liumeng/private/mini_program/petpal/pages/index/index.wxml:1)
- [pages/index/index.wxss](/Users/liumeng/private/mini_program/petpal/pages/index/index.wxss:1)
- [pages/tasks/tasks.js](/Users/liumeng/private/mini_program/petpal/pages/tasks/tasks.js:1)
- [pages/tasks/tasks.wxml](/Users/liumeng/private/mini_program/petpal/pages/tasks/tasks.wxml:1)
- [pages/tasks/tasks.wxss](/Users/liumeng/private/mini_program/petpal/pages/tasks/tasks.wxss:1)
- [pages/parent/parent.js](/Users/liumeng/private/mini_program/petpal/pages/parent/parent.js:1)
- [pages/parent/parent.wxml](/Users/liumeng/private/mini_program/petpal/pages/parent/parent.wxml:1)
- [pages/parent/parent.wxss](/Users/liumeng/private/mini_program/petpal/pages/parent/parent.wxss:1)
- [utils/state.js](/Users/liumeng/private/mini_program/petpal/utils/state.js:1)
- [utils/time.js](/Users/liumeng/private/mini_program/petpal/utils/time.js:1)
- [utils/pet-renderer.js](/Users/liumeng/private/mini_program/petpal/utils/pet-renderer.js:1)

### 5.2 建议新增文件

- `utils/task-schedule.js`
  负责时间段、推荐任务、派生状态和排序计算
- `utils/task-prompt.js`
  负责宠物页提示文案生成
- `components/task-card/`
  统一承载任务卡片结构，避免 `tasks` 和 `parent` 重复拼装

### 5.3 暂缓文件

- `custom-tab-bar/`
  本轮不做，除非原生 `tabBar` 无法满足视觉要求

---

## 六、默认任务模板

为兼容现有预设任务，本轮先使用以下默认时间配置：

| 任务 ID | 名称 | period | startAt | endAt | 默认状态 |
|--------|------|--------|---------|-------|---------|
| `brushTeeth` | 刷牙 | `morning` | `07:00` | `09:00` | 启用 |
| `eatMeal` | 吃饭 | `evening` | `17:30` | `19:30` | 启用 |
| `sleepOnTime` | 按时睡觉 | `bedtime` | `20:00` | `21:30` | 启用 |
| `readBook` | 读绘本 | `bedtime` | `19:30` | `20:30` | 启用 |
| `tidyToys` | 整理玩具 | `evening` | `18:30` | `20:00` | 启用 |
| `bathe` | 洗澡 | `bedtime` | `19:00` | `20:30` | 默认关闭 |

说明：

- 现有预设任务 ID 不改，避免破坏旧 `checkins`
- `吃饭` 先保守保留为单任务，后续通过自定义任务覆盖更细的家庭作息
- 无时间配置的任务，降级为 `anytime`

---

## 七、阶段计划

### Phase 0：计划冻结与实施准备（预计 0.5 天）

**目标**：把新设计方案转成可执行边界，避免直接散改页面。

**交付物**：

- [ ] 确认本计划作为 V1.5 的唯一开发计划
- [ ] 更新执行清单中的阶段与 session 边界
- [ ] 明确新增字段、迁移逻辑和默认任务模板
- [ ] 明确页面 ownership 和联调边界

**验证标准**：

- [ ] 后续 session 不再以旧 V1 计划为实现依据
- [ ] 新增字段和默认模板已有明确文档
- [ ] 执行清单可直接用于下一轮勾选

**退出标准**：

- [ ] 可以开始改数据模型和导航层

---

### Phase 1：导航与数据基座重构（预计 1-1.5 天）

**目标**：先稳定信息架构和数据模型，再改页面细节。

**交付物**：

- [ ] `app.json` 接入原生 `tabBar`
- [ ] 冷启动路由改为 `onboarding -> pet`
- [ ] `utils/state.js` 支持任务模型迁移
- [ ] 新增 `utils/task-schedule.js`
- [ ] 老任务自动补全 `sourceType / schedule / promptText / sortOrder`

**验证标准**：

- [ ] 已初始化用户冷启动后默认进入 `宠物` tab
- [ ] 未初始化用户仍进入 onboarding
- [ ] 老 storage 数据不丢失，页面仍能正常打开
- [ ] 新任务字段缺失时可自动补默认值

**退出标准**：

- [ ] 页面层已可消费新的任务模型和派生状态

---

### Phase 2：任务引擎与推荐层（预计 1 天）

**目标**：先把“现在该做什么”的判断算清楚。

**交付物**：

- [ ] 实现时间窗口判断
- [ ] 实现 `ready / upcoming / overdue / pending / approved / rejected` 派生状态
- [ ] 实现任务优先级排序
- [ ] 实现当前推荐任务计算
- [ ] 新增宠物提示文案生成逻辑

**验证标准**：

- [ ] 同一任务在不同时间段能正确切换 `upcoming / ready / overdue`
- [ ] 有 `pending / approved / rejected` 记录时优先显示真实完成态
- [ ] 当前推荐任务与任务页第一优先任务一致
- [ ] 无时间配置任务时可降级展示，不报错

**退出标准**：

- [ ] 宠物页和任务页都能共享同一套推荐结果

---

### Phase 3：宠物页重构（预计 1-1.5 天）

**目标**：把首页改成真正的陪伴页和当前任务提示页。

**交付物**：

- [ ] 删除独立 `抚摸` 按钮
- [ ] 接入宠物头部点击、身体点击、长按或轻扫事件
- [ ] 增加“当前任务提示卡”
- [ ] 文案从纯 mood 改为 `mood + 时间段 + 推荐任务`
- [ ] 增加时间感视觉氛围

**验证标准**：

- [ ] 头部点击和身体点击能产生不同反馈
- [ ] 长按或轻扫可触发 `pet` 互动
- [ ] 无推荐任务时首页能回落到陪伴型文案
- [ ] 积分不足时提示文案能正确引导去做任务

**退出标准**：

- [ ] 孩子进入首页后能同时理解“宠物状态”和“当前该做什么”

---

### Phase 4：任务页重构（预计 1-1.5 天）

**目标**：把任务页从状态列表改成时间驱动任务流。

**交付物**：

- [ ] 任务页分为 `现在去做 / 今天稍后 / 已完成`
- [ ] 增加任务时间标签、审核标签和主按钮文案
- [ ] 增加 `overdue` 的视觉区分
- [ ] 引入统一任务卡组件
- [ ] 保持现有打卡、审核与奖励逻辑兼容

**验证标准**：

- [ ] `ready` 任务优先出现在首屏
- [ ] `upcoming` 任务默认不可直接提交
- [ ] `pending`、`approved`、`rejected` 状态展示正确
- [ ] 家长关闭任务后，孩子侧自动隐藏

**退出标准**：

- [ ] 孩子打开任务页时第一眼总能看到当前最该做的任务

---

### Phase 5：家长页与自定义任务（预计 2 天）

**目标**：保留 30 秒审核路径，同时补足可配置性。

**交付物**：

- [ ] 家长页拆成 `待审核 / 今日任务管理 / 任务模板与自定义任务`
- [ ] 待审核支持单条和批量处理
- [ ] 新增自定义任务创建入口
- [ ] 支持编辑任务图标、名称、时间、积分、审核方式、开关、重复星期
- [ ] 支持预设任务和自定义任务共存

**验证标准**：

- [ ] 家长 30 秒内可完成当天待审核处理
- [ ] 新增自定义任务后，孩子侧当天或对应时间段可见
- [ ] `requireConfirm=false` 的自定义任务可直接奖励
- [ ] 关闭任务后立即影响孩子侧展示

**退出标准**：

- [ ] 家长不改代码、不改文档即可完成任务管理

---

### Phase 6：视觉收口与交互细化（预计 1 天）

**目标**：在不新增依赖的前提下，让页面更像儿童产品，而不是表单工具。

**交付物**：

- [ ] 统一 tab、任务卡、提示卡和 badge 视觉语言
- [ ] 强化时间段氛围色
- [ ] 强化点击、长按、完成、待审核等反馈
- [ ] 收口首页、任务页、家长页文案

**验证标准**：

- [ ] 视觉层级明确，孩子第一眼能看到主要行动位
- [ ] 文案以动作指令和陪伴口吻为主，不偏系统术语
- [ ] 真机操作中没有明显误触或卡顿

**退出标准**：

- [ ] 页面已达到可联调验收的完成度

---

### Phase 7：联调、迁移验证与真机回归（预计 1 天）

**目标**：确保新结构不破坏旧数据和旧闭环。

**交付物**：

- [ ] 覆盖老 storage 升级验证
- [ ] 覆盖跨日、时间段切换和任务排序验证
- [ ] 覆盖宠物手势误触验证
- [ ] 覆盖自定义任务 CRUD 验证
- [ ] 覆盖 iPhone / Android 真机回归

**验证标准**：

- [ ] 老用户升级后宠物、积分、任务历史不丢失
- [ ] 同一天内任务状态和推荐结果一致
- [ ] 宠物交互不会频繁误触喂食或玩耍
- [ ] 自定义任务创建、编辑、关闭、删除都能正确回写

**退出标准**：

- [ ] V1.5 可以进入下一轮体验验证或继续迭代

---

## 八、建议 Session 拆分

### Session J：计划与清单重置

- 负责本计划与执行清单同步
- 不写业务代码

### Session K：导航与数据基座

- 负责 `app.json`、`utils/state.js`、`utils/task-schedule.js`
- 不改页面结构细节

### Session L：宠物页重构

- 负责 `pages/index/`、`utils/task-prompt.js`、`components/pet-avatar/`
- 依赖 Session K

### Session M：任务页重构

- 负责 `pages/tasks/`、`components/task-card/`
- 依赖 Session K

### Session N：家长页与自定义任务

- 负责 `pages/parent/`
- 依赖 Session K、Session M

### Session O：联调与回归

- 负责跨页面验证、数据迁移回归和清单回填
- 可做小范围修复，但不推翻前面模块边界

---

## 九、关键验证清单

| # | 场景 | 预期结果 |
|---|------|---------|
| 1 | 老用户升级后打开应用 | 直接进入 `宠物` tab，旧积分和宠物状态保留 |
| 2 | 早晨 08:00 打开应用 | `刷牙` 显示在 `现在去做`，宠物提示“先去刷牙” |
| 3 | 晚上 19:45 打开应用 | `读绘本 / 洗澡 / 整理玩具` 根据时间窗口正确排序 |
| 4 | 点击宠物头部 | 触发轻拍反馈，不消耗积分 |
| 5 | 长按宠物身体 | 触发抚摸互动，快乐值增加 |
| 6 | 任务 `requireConfirm=false` | 孩子完成后直接奖励，不进入待审核 |
| 7 | 家长新增一个自定义任务 | 孩子侧在对应时间段可见该任务 |
| 8 | 家长关闭一个任务 | 孩子侧立即隐藏该任务 |
| 9 | 跨日后重新打开 | 新一天的任务状态正确重置，旧历史保留 |
| 10 | 真机快速审核 | 家长可在 30 秒内完成当天审核 |

---

## 十、风险点

1. 任务模型迁移写得不稳，会直接影响老用户数据兼容。
2. 原生 `tabBar` 与 onboarding 门卫页的跳转顺序如果处理不好，容易造成启动闪页。
3. 宠物交互从按钮改为手势后，需要重点验证低龄儿童误触率。
4. 自定义任务加入后，任务排序、删除和历史记录引用都更容易出现脏数据。
5. `吃饭` 等泛化任务在本轮仍比较粗，若不控制文案和默认时间段，推荐结果可能不够自然。

---

## 十一、当前建议

### 11.1 先做什么

先做 `Phase 1 + Phase 2`，不要跳过任务模型直接改 UI。

### 11.2 哪些地方要保守

- 保留现有预设任务 ID
- 保留 `checkins` 历史结构
- 保留内部动作名 `pet`
- 第一轮不做“每天多次任务”

### 11.3 哪些地方可以大胆优化

- 首页排版和视觉层级
- 任务卡样式和按钮文案
- 家长页的信息密度和入口组织

---

## 十二、与现有文档的关系

- 体验设计依据：
  [PetPal-UX-Optimization-Design-20260512.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-UX-Optimization-Design-20260512.md:1)
- 当前执行总控：
  [PetPal-Execution-Checklist.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-Execution-Checklist.md:1)
- V1 初版开发计划：
  [PetPal-Development-Plan.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-Development-Plan.md:1)

后续如果开始编码，必须先把执行清单同步成 V1.5 的阶段与勾选结构，再进入实现。
