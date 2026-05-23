# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

PetPal 是一款面向 4-7 岁儿童的微信小程序，通过照顾虚拟宠物（小狗）帮助孩子养成日常好习惯。核心循环：孩子完成任务 → 家长审核 → 获得积分 → 用积分喂食/陪玩宠物。

## 开发环境

无 npm/构建命令。使用**微信开发者工具**开发：
1. 导入项目目录
2. AppID 使用 `touristappid`（测试）
3. 预览或真机调试

## 架构

**原生微信小程序**，零第三方依赖。状态全部存储在 `wx.setStorageSync`，键名 `petpal_state`。

### 核心模块

- `utils/state.js` — 状态读写中枢，所有页面通过此模块操作数据
- `utils/decay.js` — 宠物属性衰减引擎（饱食/快乐随时间下降）
- `utils/task-schedule.js` — 任务时间窗口计算与状态派生
- `utils/storage.js` — `wx.setStorageSync` 封装，无 `wx` 时降级为内存存储
- `utils/time.js` — 日期工具（`formatDate`、`isSameDay`、`hasCrossedDay`）

### 页面（4个）

| 页面 | 职责 |
|------|------|
| `pages/onboarding/` | 首次设置，输入宠物名字 |
| `pages/index/` | 宠物主界面，喂食/玩耍/抚摸互动 |
| `pages/tasks/` | 今日任务列表与打卡 |
| `pages/parent/` | 家长 PIN 验证 + 审核打卡 |

### 数据模型

```javascript
// petpal_state 结构
{
  pet: { name, type, stage, hunger, happiness, lastDecayAt, decayCarry },
  points: Number,
  tasks: [{ id, label, icon, points, enabled, requireConfirm, schedule, sortOrder }],
  checkins: [{ taskId, date, status, createdAt, confirmedAt }],
  parentPin: String|null,
  settings: { decaySpeed: 'relaxed|standard|strict', soundEnabled }
}
```

### 宠物情绪计算

```javascript
mood = (hunger + happiness) / 2
// >= 8 → excited, >= 5 → normal, >= 2 → sad, else → sick
```

衰减速度（每小时）：`relaxed` (-0.5/-0.33)、`standard` (-1/-0.5)、`strict` (-2/-1)

### 任务状态机

`ready` → 打卡 → `pending` → 家长审核 → `approved`（积分+1）或 `rejected`（可重做）

时间窗口外：`upcoming`（未到时间）或 `overdue`（已过期）

## 关键约定

- 所有状态变更必须通过 `utils/state.js` 的 API，不直接操作 storage
- `utils/storage.js` 的降级逻辑保证在无 `wx` 环境（如单元测试）下可运行
- 宠物图片对应情绪：`happy_doge.png` / `normal_dog.png` / `sad_dog.png` / `sick_dog.png`
- `docs/` 目录有完整产品设计文档，`HANDOVER.md` 是项目交接总览
