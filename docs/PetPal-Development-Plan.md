# PetPal 开发计划

> **说明**：本文件记录的是 2026-04-28 的 V1 初版开发计划，当前优化迭代请改读 [PetPal-V1.5-Development-Plan-20260516.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-V1.5-Development-Plan-20260516.md:1)。  
> **当前适用文档**：V1.5 体验优化与实现拆分以 [PetPal-UX-Optimization-Design-20260512.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-UX-Optimization-Design-20260512.md:1) 和 [PetPal-V1.5-Development-Plan-20260516.md](/Users/liumeng/private/mini_program/petpal/docs/PetPal-V1.5-Development-Plan-20260516.md:1) 为准。

> **项目**：PetPal 微信小程序 - 4-7岁儿童习惯养成宠物游戏  
> **产品负责人**：Alex（产品经理智能体）  
> **Date**: 2026-04-28  
> **目标读者**：Adam（产品owner）+ Codex/Claude（执行开发者）

---

## 一、产品概览

### 核心体验

```
孩子完成任务（刷牙/吃饭/睡觉等）
    → 家长审核通过
        → 获得积分
            → 用积分喂食/陪玩宠物
                → 宠物开心，孩子满足
                    → 下次主动回来
```

### 北极星指标

| 指标 | 目标 |
|-----|------|
| D7留存 | ≥ 40%（上线60天） |
| 任务完成率 | ≥ 70% |
| 家长周活 | ≥ 50% |

### 资产文件清单

| 文件 | 说明 |
|-----|------|
| `petpal-product-design_20260427.md` | 完整产品方案（含竞品分析、用户故事） |
| `petpal-prototype-spec_20260427.md` | 技术规格书（含数据结构、验收标准） |
| `happy_doge.png` | 宠物开心状态图（AI生成，2048x2048） |
| `normal_dog.png` | 宠物正常状态图 |
| `sad_dog.png` | 宠物难过状态图 |
| `sick_dog.png` | 宠物生病状态图 |
| `petpal-wireframe-v2.html` | 交互线框图（参考设计） |

---

## 二、技术选型

### 方案A：微信小程序（推荐，V1目标）

```
框架：微信小程序原生开发
语言：JavaScript / WXML / WXSS
状态管理：Redux / MobX（按需）
本地存储：wx.setStorageSync / wx.getStorageSync
云开发：微信云开发（可选，V2阶段）
```

### 方案B：H5跨平台（快速验证期）

如果微信小程序 AppID 申请需要时间，先用 H5 版本验证：

```
框架：React 18（CDN引入，无需构建）
样式：内联 CSS（避免构建工具）
存储：localStorage
部署：静态托管（Vercel / 腾讯云COS）
```

**本计划以方案A为主，方案B作为备选快速验证路径。**

---

## 三、文件结构

```
/petpal
├── app.js                    # 小程序入口，全局状态初始化
├── app.json                  # 小程序配置（页面路由、窗口样式）
├── app.wxss                  # 全局样式
├── pages/
│   ├── index/
│   │   ├── index.js          # 宠物主界面逻辑
│   │   ├── index.wxml        # 宠物主界面结构
│   │   └── index.wxss        # 宠物主界面样式
│   ├── onboarding/
│   │   ├── onboarding.js     # 首次设置流程
│   │   ├── onboarding.wxml
│   │   └── onboarding.wxss
│   ├── tasks/
│   │   ├── tasks.js          # 任务列表 + 打卡逻辑
│   │   ├── tasks.wxml
│   │   └── tasks.wxss
│   └── parent/
│       ├── parent.js          # 家长模式（审核 + 设置）
│       ├── parent.wxml
│       └── parent.wxss
├── components/
│   ├── pet-avatar/           # 宠物头像组件（4状态）
│   ├── stat-bar/             # 饱食度/快乐值进度条
│   ├── task-card/             # 任务卡片组件
│   └── action-btn/            # 互动按钮组件
├── utils/
│   ├── storage.js            # localStorage 读写封装
│   ├── state.js              # 全局状态管理（pet/hunger/happiness/points）
│   ├── decay.js              # 宠物状态衰减逻辑
│   └── time.js               # 时间工具（离线衰减计算）
└── assets/
    └── images/               # 宠物4状态图片（AI生成图需裁剪到小程序尺寸）
```

---

## 四、数据模型（localStorage）

```javascript
// Storage Key: "petpal_state"
// 存储结构：
{
  // ── 初始化标记 ──
  "initialized": false,          // Boolean，是否已完成首次设置
  "createdAt": "2026-04-28T00:00:00.000Z",

  // ── 宠物信息 ──
  "pet": {
    "name": "旺财",              // String，用户自定义名字
    "type": "dog",               // String，V1只有 dog
    "stage": "adult",            // String，egg|baby|adult，V1默认 adult
    "hunger": 10,                // Number，0-10，饱食度
    "happiness": 10,             // Number，0-10，快乐值
    "totalPointsEarned": 0,      // Number，累计获得积分（用于成长判断）
    "lastDecayAt": 1745774400000 // Number，timestamp，最后衰减时间
  },

  // ── 积分 ──
  "points": 0,                   // Number，当前可用积分

  // ── 任务列表（V1预设6个） ──
  "tasks": [
    { "id": "brushTeeth",  "icon": "🪥", "label": "刷牙",     "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "eatMeal",     "icon": "🍚", "label": "吃饭",     "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "sleepOnTime", "icon": "🛏️", "label": "按时睡觉", "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "readBook",    "icon": "📚", "label": "读绘本",   "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "tidyToys",    "icon": "🧹", "label": "整理玩具", "points": 1, "enabled": true,  "requireConfirm": true },
    { "id": "bathe",       "icon": "🚿", "label": "洗澡",     "points": 1, "enabled": false, "requireConfirm": true }
  ],

  // ── 打卡记录 ──
  "checkins": [
    {
      "taskId": "brushTeeth",
      "date": "2026-04-28",
      "status": "pending",       // String，pending|approved|rejected
      "createdAt": 1745774400000,
      "confirmedAt": null        // null 或 timestamp
    }
  ],

  // ── 成就（V1先不做） ──
  "achievements": [],

  // ── 家长模式 ──
  "parentPin": null,            // String|null，4位数字密码

  // ── 设置 ──
  "settings": {
    "decaySpeed": "relaxed",    // String，relaxed|standard|strict
    "soundEnabled": true
  }
}
```

---

## 五、宠物状态机

### 衰减规则

| 速度模式 | 饱食度衰减 | 快乐值衰减 | 适用场景 |
|---------|-----------|-----------|---------|
| `relaxed` | 每2小时-1 | 每3小时-1 | 默认，4-7岁孩子 |
| `standard` | 每1小时-1 | 每2小时-1 | 稍大孩子 |
| `strict` | 每30分钟-1 | 每1小时-1 | 挑战模式 |

### 情绪计算

```javascript
// mood = (hunger + happiness) / 2
// mood >= 8  → excited（超级开心）→ happy_doge.png
// mood >= 5  → normal（正常）    → normal_dog.png
// mood >= 2  → sad（难过）      → sad_dog.png
// mood < 2   → sick（生病）      → sick_dog.png
```

### 互动效果

| 动作 | 消耗积分 | 效果 | 图片切换 |
|-----|---------|------|---------|
| 喂食 | 1分 | 饱食度+3（上限10） | → happy |
| 玩耍 | 1分 | 快乐值+2（上限10） | → happy |
| 抚摸 | 0分 | 快乐值+1（上限10） | → normal |
| 任意互动 | 0 | 生病状态治愈 | → normal |

---

## 六、页面规格

### 页面1：首次设置（onboarding）

**路由**：`/pages/onboarding/onboarding`  
**入口**：initialized = false  
**流程**：

```
Step 1: 展示宠物图片（happy_doge.png） + 标题"你想养一只小狗吗？"
Step 2: 名字输入框（placeholder="给宠物取个名字..."，默认"旺财"）
Step 3: 点击"开始养它！" → initialized=true → 跳转主界面
```

**验收标准**：
- [ ] 宠物图片居中显示，有摇尾巴动画（CSS animation: bounce）
- [ ] 输入框支持自定义名字，输入时实时预览
- [ ] 点击"开始养它！"后数据写入 localStorage，进入主界面
- [ ] 刷新后不再出现此页面

---

### 页面2：宠物主界面（index）

**路由**：`/pages/index/index`  
**入口**：孩子默认视图，每次打开的第一个页面  
**布局**：

```
┌────────────────────────┐
│ 🐕 [宠物名字]      [🔒] │  ← 右上角家长入口
├────────────────────────┤
│                        │
│   [宠物头像 180x180]   │  ← 根据 mood 切换4张图片
│   "[宠物说话文字]"     │
│                        │
│  🍖 饱食 ██████░░░░ 6  │  ← 进度条 + 数字
│  💛 快乐 ████████░░ 8  │
│                        │
│  💰 积分：3 分         │
│                        │
│  ┌──────────────────┐  │
│  │ 📋 今日任务 (2) ▶ │  │  ← 点击跳转任务列表
│  └──────────────────┘  │
│                        │
│  ┌────┐ ┌────┐ ┌────┐ │
│  │🍖  │ │🎾  │ │🤚  │ │
│  │喂食│ │玩耍│ │抚摸│ │
│  │-1分│ │-1分│ │免费│ │
│  └────┘ └────┘ └────┘ │
└────────────────────────┘
```

**宠物说话文字映射**：

| 状态 | 条件 | 显示文字 |
|-----|------|---------|
| 饱食低 | hunger ≤ 2 | "我好饿……肚子咕咕叫" |
| 饱食高 | hunger ≥ 8 | "我吃饱啦！好幸福～" |
| 快乐低 | happiness ≤ 2 | "我有点不开心……" |
| 快乐高 | happiness ≥ 8 | "我好开心！你是最好的主人！" |
| 生病 | mood < 2 | "我不舒服……需要你照顾我" |
| 默认 | — | "今天过得怎么样？" |

**验收标准**：
- [ ] 宠物图片根据 mood 自动切换（4种状态）
- [ ] 饱食度和快乐值实时显示，数值正确
- [ ] 积分不足时，喂食/玩耍按钮显示灰色+禁用态
- [ ] 点击喂食：积分-1，饱食+3，播放动画，图片切换到开心
- [ ] 点击玩耍：积分-1，快乐+2，播放动画，图片切换到开心
- [ ] 点击抚摸：快乐+1，播放动画
- [ ] 每次互动后更新 lastDecayAt
- [ ] 进入页面时先执行离线衰减（根据 lastDecayAt 和当前时间差）

---

### 页面3：任务列表（tasks）

**路由**：`/pages/tasks/tasks`  
**入口**：从主界面点击"今日任务"进入  
**布局**：

```
┌────────────────────────┐
│ ← 返回       今日任务    │
├────────────────────────┤
│                        │
│  🪥 刷牙              ○ │  ← ○待打卡  ●已完成  ⏳待审核
│  🍚 吃饭              ○ │
│  🛏️ 按时睡觉           ● │
│  📚 读绘本             ○ │
│  🧹 整理玩具            ⏳ │  ← 家长审核中
│                        │
│  本日完成 1/4          │
└────────────────────────┘
```

**打卡流程**：

```
点击任务（requireConfirm=true）：
  → 弹窗"完成了吗？"
  → "完成了" → checkin status=pending → 显示⏳
  → "还没" → 关闭弹窗

点击任务（requireConfirm=false）：
  → 直接 approved → 积分+1 → 快乐+1 → 动画反馈
```

**验收标准**：
- [ ] 任务列表显示今日所有任务（含enabled=false的隐藏任务不显示）
- [ ] 今日已打卡的任务显示 ✅ + 不可再点
- [ ] pending 状态显示 ⏳ + 不可再点
- [ ] 点击待打卡任务弹出确认弹窗
- [ ] 确认后状态变为 pending，出现在家长审核列表
- [ ] 家长审核通过后，任务变为 ✅ + 积分+1 + 快乐+1
- [ ] 每日凌晨自动重置打卡状态（根据日期判断）

---

### 页面4：家长模式（parent）

**路由**：`/pages/parent/parent`  
**入口**：点击主界面右上角 🔒 图标  
**流程**：

```
parentPin = null → 设置密码界面（4位数字键盘）
parentPin ≠ null → 输入密码验证 → 通过后进入审核界面
```

**布局（审核界面）**：

```
┌────────────────────────┐
│ ← 退出      👨‍👩‍👧 家长模式  │
├────────────────────────┤
│                        │
│  本周完成  3/4 天      │
│  连续打卡  🔥 2 天     │
│                        │
│  ────────────────────  │
│  待审核 (1)             │
│                        │
│  🪥 刷牙 — 今天 10:30  │
│  [全部通过] [全部驳回]  │
│                        │
│  ────────────────────  │
│  任务设置              │
│  [ ] 刷牙 [✓] 吃饭     │  ← 开关任务
│  [ ] 按时睡觉 [✓] 读绘本│
│  [✓] 整理玩具          │
└────────────────────────┘
```

**验收标准**：
- [ ] 首次进入强制设置4位密码，保存到 parentPin
- [ ] 再次进入需验证密码，错3次提示"忘记密码请联系客服"
- [ ] 待审核列表显示所有 status=pending 的打卡记录
- [ ] "全部通过"：遍历所有 pending → approved → 积分+1/人 + 快乐+1/人
- [ ] "全部驳回"：遍历所有 pending → rejected，状态恢复
- [ ] 任务开关（enabled）实时保存
- [ ] 家长审核完成后自动返回主界面

---

## 七、动画规格（CSS/Taro）

### 宠物动画

```css
/* 开心状态 - 蹦跳 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 正常状态 - 呼吸 */
@keyframes breathing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* 难过状态 - 下垂 */
@keyframes droop {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(5px) rotate(-3deg); }
}

/* 生病状态 - 虚弱颤抖 */
@keyframes sick {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

### 交互反馈动画

```css
/* 积分增加 +1 */
@keyframes pointUp {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}

/* 进度条上涨 */
@keyframes growBar {
  from { width: 0%; }
  to { width: [targetWidth]%; }
}

/* 任务完成打勾 */
@keyframes checkMark {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

---

## 八、实施阶段

### Phase 1：项目初始化（2小时）

**目标**：搭建小程序框架，打通数据存储

**交付物**：
- [ ] 微信开发者工具项目创建完成
- [ ] 目录结构建立（参考第二章文件结构）
- [ ] app.js 全局状态初始化逻辑
- [ ] utils/storage.js 读写封装
- [ ] utils/state.js 状态管理基础

**验收标准**：
- [ ] `wx.getStorageSync('petpal_state')` 能正确读写
- [ ] 首次打开自动初始化默认状态（initialized=false）
- [ ] 项目能正常编译运行

---

### Phase 2：核心数据逻辑（3小时）

**目标**：宠物状态衰减系统 + 积分系统

**交付物**：
- [ ] utils/decay.js - 宠物衰减逻辑（含离线衰减）
- [ ] utils/time.js - 时间工具函数
- [ ] index 页面 - 宠物状态渲染（4种表情图片）
- [ ] 进度条组件 - 饱食度 + 快乐值
- [ ] 互动按钮 - 喂食/玩耍/抚摸（含积分判断）

**验收标准**：
- [ ] 等待1分钟，宠物状态自动-1（使用模拟时间加速测试）
- [ ] 离线10分钟后重新打开，宠物已衰减
- [ ] 积分=0时喂食/玩耍按钮禁用
- [ ] 喂食/玩耍后宠物状态和积分正确更新

---

### Phase 3：首次设置流程（2小时）

**目标**：onboarding 页面完成

**交付物**：
- [ ] onboarding 页面 - 宠物展示 + 名字输入
- [ ] 名字保存到 pet.name
- [ ] initialized=true 后跳转 index
- [ ] index 页面顶部显示宠物名字

**验收标准**：
- [ ] 首次打开显示 onboarding
- [ ] 输入名字后点击"开始养它"进入主界面
- [ ] 刷新后直接进入主界面（不再出现 onboarding）
- [ ] 宠物名字正确显示在主界面

---

### Phase 4：任务系统（4小时）

**目标**：任务列表 + 打卡流程 + 家长审核

**交付物**：
- [ ] tasks 页面 - 任务列表渲染
- [ ] 打卡弹窗 - 确认完成
- [ ] 打卡逻辑 - pending / approved / rejected 状态流转
- [ ] parent 页面 - 密码设置 + 审核界面
- [ ] 审核通过/驳回逻辑

**验收标准**：
- [ ] 任务列表显示6个预设任务（enabled=true的）
- [ ] 点击打卡 → pending → 出现在家长审核列表
- [ ] 家长审核通过 → 积分+1 + 快乐+1
- [ ] 家长审核驳回 → 任务恢复未打卡状态
- [ ] 每日打卡状态根据日期重置

---

### Phase 5：UI优化 + 动画（3小时）

**目标**：交互动画完善，提升体验

**交付物**：
- [ ] 宠物4种状态 CSS 动画（bounce/breathing/droop/sick）
- [ ] 积分增加 +1 飘字动画
- [ ] 进度条上涨动画
- [ ] 任务完成打勾动画
- [ ] 按钮点击反馈（scale 效果）
- [ ] 页面切换动画（slide-in）

**验收标准**：
- [ ] 4种宠物状态各有明显不同的动画
- [ ] 积分变化有 +1 飘字视觉反馈
- [ ] 交互流畅，无明显卡顿

---

### Phase 6：集成测试 + 验收（2小时）

**目标**：完整走通核心路径，修复问题

**验收测试清单**：

| # | 测试场景 | 预期结果 | 通过 |
|---|---------|---------|-----|
| 1 | 首次打开，输入名字"小白" | 进入主界面，显示"小白" | ☐ |
| 2 | 等待1分钟刷新 | 宠物状态下降 | ☐ |
| 3 | 点击刷牙 → 确认完成 | 显示⏳，出现在家长审核 | ☐ |
| 4 | 进入家长模式 → 审核通过 | 积分+1，任务✅ | ☐ |
| 5 | 积分=1，点击喂食 | 饱食+3，积分归0 | ☐ |
| 6 | 宠物状态跌到0 | 显示生病，点击任一互动治愈 | ☐ |
| 7 | 家长设置密码后退出 | 再次进入需验证密码 | ☐ |
| 8 | 离线12小时后再打开 | 宠物大幅衰减（离线衰减生效） | ☐ |
| 9 | 刷新页面 | 数据保留（localStorage） | ☐ |

**通过标准**：9/9 全部通过

---

### Phase 7：真机测试 + 修复（4小时）

**目标**：在真实设备上测试，发现并修复问题

**测试设备清单**：
- iPhone 12 / iPhone 14（iOS 16+）
- 小米 / OPPO / Vivo（Android 12+）

**测试任务**：
1. 扫码打开小程序，完成首次设置
2. 让孩子（4-7岁）独立操作，确认无需文字引导
3. 家长审核流程，确认30秒内完成
4. 第二天让孩子主动打开，确认留存动机

---

## 九、已知风险 + 应对

| 风险 | 概率 | 影响 | 应对方案 |
|-----|------|------|---------|
| 微信个人主体审核被拒 | 中 | 高 | 选择"工具>生活"类目，避免"教育"类目资质要求 |
| 4-7岁孩子不认识字 | 高 | 中 | 全程语音引导 + 纯图标交互，不依赖文字 |
| 家长懒得审核打卡 | 高 | 高 | 默认30天未审核自动通过；可一键全通过 |
| 孩子沉迷小程序 | 中 | 中 | 无强制时长限制但有"今日陪伴X分钟"提示 |

---

## 十、后续迭代计划（V1完成后）

### V1.1（小步迭代）
- 成就徽章（连续3天/7天）
- 自定义任务（家长可添加自定义任务 + emoji）
- 宠物外观解锁（累计积分解锁不同皮肤）

### V1.2（增长）
- 微信推送通知（任务提醒）
- 爷爷奶奶分享视图（只读，查看孩子完成情况）
- 多宠物解锁（猫/兔子）

### V2（云化）
- 微信云开发（多设备同步）
- 家庭多孩子支持
- 数据导出备份

---

## 附录：关键代码片段

### 离线衰减计算

```javascript
// utils/decay.js
function calculateDecay(state) {
  const now = Date.now();
  const elapsed = (now - state.pet.lastDecayAt) / 1000 / 60 / 60; // 小时
  const { hungerPerHour, happinessPerHour } = DECAY_RULES[state.settings.decaySpeed];
  
  const hungerDecay = Math.floor(elapsed * hungerPerHour);
  const happinessDecay = Math.floor(elapsed * happinessPerHour);
  
  return {
    hunger: Math.max(0, state.pet.hunger - hungerDecay),
    happiness: Math.max(0, state.pet.happiness - happinessDecay),
    lastDecayAt: now
  };
}
```

### 情绪判断

```javascript
// utils/state.js
function getMood(hunger, happiness) {
  const avg = (hunger + happiness) / 2;
  if (avg >= 8) return 'excited';    // happy_doge.png
  if (avg >= 5) return 'normal';     // normal_dog.png
  if (avg >= 2) return 'sad';        // sad_dog.png
  return 'sick';                     // sick_dog.png
}
```

### 打卡审核通过

```javascript
// 家长审核通过
function approveCheckin(checkinId) {
  const state = getState();
  const checkin = state.checkins.find(c => c.id === checkinId);
  if (!checkin) return;
  
  checkin.status = 'approved';
  checkin.confirmedAt = Date.now();
  state.points += 1;
  state.pet.happiness = Math.min(10, state.pet.happiness + 1);
  state.pet.totalPointsEarned += 1;
  
  saveState(state);
}
```

---

*计划版本：v1.0 | 开发执行请参考本计划和 petpal-product-design_20260427.md*
