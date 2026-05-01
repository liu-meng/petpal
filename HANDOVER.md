# PetPal 小程序开发 - 交接给 Codex

> **项目路径**: `/Users/liumeng/private/mini_program/petpal`  
> **交接对象**: Codex / Claude 执行开发者  
> **产品负责人**: Alex（产品经理智能体）  
> **Date**: 2026-05-01

---

## 一、项目概述

**PetPal** 是微信小程序 V1 项目，目标是帮助 4-7 岁孩子通过照顾一只"会饿、会开心"的虚拟小狗，把日常习惯（刷牙、吃饭、睡觉等）变成主动行为。

### 核心体验

```
孩子完成任务（刷牙/吃饭/睡觉）
    → 家长审核通过
        → 获得积分
            → 用积分喂食/陪玩宠物
                → 宠物开心，孩子满足
                    → 下次主动回来
```

### 北极星指标
- **D7留存** ≥ 40%（上线60天）
- 任务完成率 ≥ 70%
- 家长周活 ≥ 50%

---

## 二、项目目录结构

```
/Users/liumeng/private/mini_program/petpal/
├── docs/                              ← 必读文档
│   ├── PetPal-Development-Plan.md      ← 开发计划（含7阶段、验收标准）
│   ├── petpal-product-design_20260427.md ← 完整产品方案（含竞品分析、数据结构）
│   └── petpal-prototype-spec_20260427.md ← 技术原型规格（参考）
├── assets/
│   ├── images/                        ← 宠物4状态图片（2048x2048，AI生成）
│   │   ├── happy_doge.png
│   │   ├── normal_dog.png
│   │   ├── sad_dog.png
│   │   └── sick_dog.png
│   └── wireframes/
│       └── petpal-wireframe-v2.html    ← 交互线框图（参考设计）
```

---

## 三、关键文档索引

### 📘 必须先读

| 文档 | 作用 |
|-----|------|
| `docs/PetPal-Development-Plan.md` | **开发行动计划**，包含7个阶段的详细实施步骤、交付物、验收标准 |
| `docs/petpal-product-design_20260427.md` | 产品设计方案，包含用户故事、竞品分析、风险分析 |

### 快速参考

- 数据结构 → 见 Development-Plan 第四章
- 页面规格 → 见 Development-Plan 第六章
- 宠物状态机 → 见 Development-Plan 第五章
- 衰减规则 → 见 Development-Plan 第五章

---

## 四、技术栈

- **框架**: 微信小程序原生开发（JavaScript + WXML + WXSS）
- **状态管理**: 内置 `App` + `Page` 数据对象
- **本地存储**: `wx.setStorageSync` / `wx.getStorageSync`
- **图片资源**: `assets/images/` 下的4张 PNG（需裁剪到小程序尺寸）

---

## 五、开发阶段参考

Development-Plan 中定义了7个阶段，建议按顺序执行：

| 阶段 | 内容 | 预计时间 |
|-----|------|---------|
| Phase 1 | 项目初始化 + 数据存储 | 2h |
| Phase 2 | 核心数据逻辑（衰减+积分） | 3h |
| Phase 3 | 首次设置流程 | 2h |
| Phase 4 | 任务系统 + 家长审核 | 4h |
| Phase 5 | UI优化 + 动画 | 3h |
| Phase 6 | 集成测试 + 验收 | 2h |
| Phase 7 | 真机测试 | 4h |

**总计约 20 小时**

---

## 六、核心数据模型（localStorage）

```javascript
// Storage Key: "petpal_state"
{
  "initialized": false,           // 是否已完成首次设置
  "createdAt": "timestamp",

  "pet": {
    "name": "旺财",
    "type": "dog",
    "stage": "adult",           // egg|baby|adult
    "hunger": 10,            // 0-10
    "happiness": 10,         // 0-10
    "totalPointsEarned": 0,
    "lastDecayAt": timestamp
  },

  "points": 0,

  "tasks": [
    { "id": "brushTeeth",  "icon": "🪥", "label": "刷牙",     "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "eatMeal",     "icon": "🍚", "label": "吃饭",     "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "sleepOnTime", "icon": "🛏️", "label": "按时睡觉", "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "readBook",    "icon": "📚", "label": "读绘本",   "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "tidyToys",    "icon": "🧹", "label": "整理玩具", "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "bathe",       "icon": "🚿", "label": "洗澡",     "points": 1, "enabled": false, "requireConfirm": true }
  ],

  "checkins": [
    { "taskId": "brushTeeth", "date": "2026-05-01", "status": "pending", "createdAt": timestamp, "confirmedAt": null }
  ],

  "achievements": [],

  "parentPin": null,             // 4位数字

  "settings": {
    "decaySpeed": "relaxed",
    "soundEnabled": true
  }
}
```

---

## 七、宠物状态机

### 衰减规则

| 速度模式 | 饱食度/小时 | 快乐值/小时 |
|---------|-----------|-----------|
| relaxed | -0.5 | -0.33 |
| standard | -1 | -0.5 |
| strict | -2 | -1 |

### 情绪计算

```javascript
mood = (hunger + happiness) / 2;
if (mood >= 8) return 'excited';    // happy_doge.png
if (mood >= 5) return 'normal';     // normal_dog.png
if (mood >= 2) return 'sad';        // sad_dog.png
else return 'sick';                  // sick_dog.png
```

### 互动效果

| 动作 | 消耗积分 | 效果 |
|-----|---------|------|
| 喂食 | 1分 | 饱食度+3（上限10） |
| 玩耍 | 1分 | 快乐值+2（上限10） |
| 抚摸 | 0分 | 快乐值+1（上限10） |

---

## 八、4个页面

| 页面 | 路由 | 说明 |
|-----|------|------|
| 首次设置 | `/pages/onboarding/onboarding` | 名字输入 → initialized=true |
| 宠物主界面 | `/pages/index/index` | 宠物展示 + 互动 + 状态栏 + 任务入口 |
| 任务列表 | `/pages/tasks/tasks` | 打卡 + pending → approved |
| 家长模式 | `/pages/parent/parent` | PIN验证 + 审核 |

---

## 九、验收测试清单（Phase 6 使用）

| # | 测试场景 | 预期结果 |
|---|---------|---------|
| 1 | 首次打开，输入名字"小白" | 进入主界面，显示"小白" |
| 2 | 等待1分钟刷新 | 宠物状态下降 |
| 3 | 点击刷牙 → 确认完成 | 显示⏳，出现在家长审核 |
| 4 | 进入家长模式 → 审核通过 | 积分+1，任务✅ |
| 5 | 积分=1，点击喂食 | 饱食+3，积分归0 |
| 6 | 宠物状态跌到0 | 显示生病，点击任一互动治愈 |
| 7 | 家长设置密码后退出 | 再次进入需验证密码 |
| 8 | 离线12小时后再打开 | 宠物大幅衰减 |
| 9 | 刷新页面 | 数据保留 |

---

## 十、已知风险 + 应对

| 风险 | 应对 |
|-----|------|
| 微信个人主体审核被拒 | 选择"工具>生活"类目，避免"教育" |
| 4-7岁孩子不认识字 | 全程图标 + 语音引导，不依赖文字 |
| 家长懒得审核打卡 | 默认30天未审核自动通过 |

---

## 十一、下一步行动

1. **启动 Phase 1**：在微信开发者工具中创建小程序项目，初始化目录结构
2. **参考 Development-Plan**：按阶段执行，每阶段有明确的交付物和验收标准
3. **使用 assets/images/ 中的4张图**：需要裁剪到小程序合适尺寸（如 180x180）
4. **完成后执行 Phase 6 验收测试**：9项全部通过才能交付

---

## 十二、联系

- **产品问题**: 参考 `docs/petpal-product-design_20260427.md`
- **开发问题**: 参考 `docs/PetPal-Development-Plan.md`
- **设计参考**: 打开 `assets/wireframes/petpal-wireframe-v2.html`

---

*祝开发顺利！🎉*