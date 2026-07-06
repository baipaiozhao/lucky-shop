# 🚀 LuckyShop 部署与使用指南

欢迎使用 LuckyShop 购物游戏平台！本指南将帮助你快速部署和使用项目。

## ✅ 当前项目状态

- **后端测试**: 218 个测试全部通过 ✅
- **类型检查**: TypeScript 类型检查通过 ✅
- **游戏积分功能**: 已修复并正常工作 ✅
- **优惠券功能**: 已修复并正常工作 ✅

---

## 📦 快速部署（局域网）

让同一 WiFi/局域网下的其他用户访问你的项目。

### 方法一：使用自动脚本（推荐）

在 PowerShell 中运行：

```powershell
.\start-server.ps1
```

脚本会自动：
- 🔍 获取本机 IP 地址
- ⚙️ 创建配置文件
- 📦 安装依赖（如果需要）
- 🗄️ 初始化数据库（如果需要）
- 🚀 启动前后端服务

### 方法二：手动启动

#### 1. 安装依赖

```powershell
npm install
```

#### 2. 创建环境变量文件

复制 `.env.example` 为 `.env`

#### 3. 初始化数据库

```powershell
npm run prisma:migrate
npm run prisma:seed
```

#### 4. 启动服务

```powershell
npm run dev
```

---

## 🌐 访问地址

启动后，可以通过以下地址访问：

| 访问方式 | 前端地址 | 后端 API |
|---------|---------|---------|
| **本机访问** | http://localhost:5173 | http://localhost:4000/api |
| **局域网访问** | `http://你的IP:5173` | `http://你的IP:4000/api` |

### 如何查看本机 IP

```powershell
ipconfig
```

查找 `IPv4 地址`，例如: `192.168.1.100`

---

## 🔑 演示账号

| 角色 | 邮箱 | 密码 |
|-----|------|------|
| 👑 管理员 | admin@luckyshop.com | admin123 |
| 👤 测试用户 | test@luckyshop.com | test123 |
| 🎮 演示用户 | demo@luckyshop.com | demo123 |

---

## 🎯 主要功能

### 🎮 游戏系统
- 幸运大转盘
- 反应速度游戏
- 刮刮乐
- 2048小游戏
- 记忆翻牌

### 💰 积分与优惠券系统
- ✅ 游戏获得积分奖励
- ✅ 游戏获得优惠券奖励
- ✅ 结账时使用积分抵扣
- ✅ 结账时使用优惠券
- ✅ 积分最多抵扣订单金额的 30%

### 🛒 购物功能
- 商品浏览与搜索
- 购物车管理
- 订单创建与管理
- 用户成就系统
- 通知系统

---

## 🐳 Docker 部署（可选）

项目已配置 Docker Compose 支持：

```powershell
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

> ⚠️ 注意：需要先安装 Docker Desktop

---

## 🔧 常见问题

### Q: 其他人无法访问我的网站？
**A:** 请检查：
1. 确保所有设备在同一 WiFi 网络
2. 检查 Windows 防火墙设置，允许 Node.js 通过
3. 确认 IP 地址正确

### Q: API 连接失败？
**A:**
1. 确认后端服务在 4000 端口运行
2. 检查 `.env` 文件中的 `CORS_ORIGIN` 配置

### Q: 如何修改端口？
**A:**
- 修改 `.env` 中的 `PORT` 变量（后端）
- 修改 `client/vite.config.ts` 中的 `server.port`（前端）

### Q: 忘记密码？
**A:**
- 开发环境可直接使用演示账号登录
- 或使用"忘记密码"功能重设密码

---

## 📊 项目技术栈

| 层级 | 技术 |
|-----|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design |
| 状态管理 | Zustand + React Query |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |
| ORM | Prisma |
| 测试 | Jest + Vitest |

---

## 📝 进一步部署（公网访问）

如果需要让互联网上的用户访问，可以考虑：

1. **云服务器部署**（阿里云/腾讯云/AWS）
2. **Vercel + Railway** 部署（详见 `docs/DEPLOY.md`）
3. **内网穿透**（ngrok/frp，仅用于测试）

---

## 🆘 技术支持

如有问题，请检查：
1. 控制台错误信息
2. 后端日志输出
3. 网络连接状态

祝使用愉快！🎉

---

**最后更新**: 2026年6月
**项目版本**: 5.1
