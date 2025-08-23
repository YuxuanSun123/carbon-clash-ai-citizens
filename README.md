# 🌍 Carbon Clash - 碳冲突大富翁游戏

一个基于环保主题的多人大富翁游戏，融合了经济发展与环境保护的策略决策。玩家需要在追求经济利益的同时，平衡碳排放和生态保护，体验可持续发展的挑战。

## ✨ 游戏特色

### 🎮 核心玩法
- **大富翁棋盘**: 经典40格环形棋盘设计
- **建筑系统**: 工厂、住宅、绿色建筑三大类型，每种都有不同的经济和环境影响
- **升级机制**: 建筑可升级，提升收益和效果
- **事件系统**: 随机事件影响游戏进程
- **政策选择**: 面临环保政策时的策略决策

### 🤖 AI 智能对手
- **商业 AI**: 专注经济利益最大化，智能投资策略
- **环保 AI**: 注重可持续发展，优先环保选择
- **智能决策**: AI 会分析局势做出合理的建筑和政策选择

### 🎯 游戏目标
平衡以下三个关键指标：
- 💰 **金钱**: 经济收益和资金管理
- 🏭 **CO2**: 碳排放控制
- 🌱 **生态值**: 环境保护贡献

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/YuxuanSun123/HCI-Carbon-Clash.git
cd HCI-Carbon-Clash
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **打开浏览器**
访问 `http://localhost:5173` 开始游戏

## 🤖 AI 集成设置（可选）

为了体验智能 AI 对手，您可以配置 DeepSeek API：

### 1. 获取 API 密钥
- 访问 [DeepSeek 平台](https://platform.deepseek.com/)
- 注册并获取 API 密钥

### 2. 配置环境变量
创建 `.env` 文件：
```bash
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

### 3. 重启服务器
```bash
npm run dev
```

详细设置请参考 [DEEPSEEK_SETUP.md](./DEEPSEEK_SETUP.md)

## 🎮 游戏规则

### 基础规则
1. **回合制**: 玩家轮流掷骰子移动
2. **建筑**: 在可建造格子上选择建筑类型
3. **收益**: 每回合根据建筑获得金钱收入
4. **环境影响**: 建筑会产生CO2或生态值
5. **事件**: 随机触发影响所有玩家的事件

### 建筑类型
| 建筑类型 | 图标 | 特点 | 升级效果 |
|---------|------|------|----------|
| 🏭 工厂 | 高收益 | 产生CO2 | 收益↑ CO2↑ |
| 🏘️ 住宅 | 平衡型 | 中等收益和环境影响 | 全面提升 |
| 🌳 绿色建筑 | 环保型 | 产生生态值 | 生态值↑ 收益↑ |

### 胜利条件
游戏结束时，综合评分最高的玩家获胜。评分考虑：
- 金钱数量
- 环境影响（CO2 vs 生态值）
- 建筑资产价值

## 🛠️ 技术栈

### 前端框架
- **React 19**: 现代化UI框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速构建工具

### 样式设计
- **Tailwind CSS**: 实用优先的CSS框架
- **响应式设计**: 支持多种屏幕尺寸
- **现代UI**: 渐变、阴影、动画效果

### AI 集成
- **DeepSeek API**: 智能AI决策
- **环境变量**: 安全的API密钥管理

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── GameMap.tsx     # 游戏地图
│   ├── DiceRoller.tsx  # 骰子组件
│   ├── BuildMenu.tsx   # 建筑菜单
│   └── ...
├── hooks/              # 自定义Hook
│   ├── useGameState.ts # 游戏状态管理
│   └── useMultiPlayerGameState.ts
├── data/               # 游戏数据
│   ├── buildings.ts    # 建筑配置
│   └── events.ts       # 事件配置
├── services/           # 外部服务
│   └── deepseekApi.ts  # AI API集成
└── utils/              # 工具函数
    └── path.ts         # 路径坐标
```

## 🎨 UI 设计特色

- **3D 视觉效果**: 立体感的游戏界面
- **动态交互**: 悬停、点击动画效果
- **主题色彩**: 环保绿色与科技蓝的搭配
- **响应式布局**: 适配桌面和移动设备
- **直观图标**: 清晰的建筑和状态图标

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🌟 未来计划

- [ ] 多语言支持
- [ ] 更多建筑类型
- [ ] 联机对战功能
- [ ] 成就系统
- [ ] 数据统计面板
- [ ] 自定义规则

---

**开始您的环保经济之旅，在Carbon Clash中找到发展与保护的完美平衡！** 🌍💚
