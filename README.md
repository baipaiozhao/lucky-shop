# 我买我卖 5.0 — 游戏化电商平台

> Gamified e-commerce platform with React + Express + Prisma + TypeScript

## 特性

- 🛒 **完整电商流程**：商品浏览、购物车、下单、支付（Mock）、订单管理
- 🎮 **5 款内置游戏**：Lucky Wheel / Scratch Card / Memory Match / 2048 / Reaction
- 🎁 **奖品系统**：积分、优惠券、实物奖品，概率权重分配
- 🏆 **成就 + 签到**：连续签到奖励、12 种游戏化成就
- 👥 **邀请系统**：邀请码 + 排行榜
- 🔐 **生产级安全**：Helmet / CSP / CORS / CSRF / Rate Limit / Idempotency Keys / bcrypt 12 rounds
- 📊 **管理后台**：Dashboard、CRUD 管理、订单跟踪

## 技术栈

| 层级   | 技术                               |
| ------ | ---------------------------------- |
| 前端   | React 18 + Vite + Ant Design       |
| 后端   | Express 4 + Prisma ORM + TypeScript |
| 数据库 | SQLite (dev) / PostgreSQL (prod)   |
| 缓存   | LRU in-memory (可选 Redis)        |
| 测试   | Jest + Supertest + Playwright E2E  |
| CI/CD  | GitHub Actions                     |

## 快速开始

### Windows 用户（推荐）

双击 `start.bat` 或运行 PowerShell 脚本：

```powershell
.\start-server.ps1
```

脚本会自动：
- 检查 Node.js 环境
- 安装依赖
- 初始化数据库
- 启动前后端服务
- 打开浏览器

### 手动启动

```bash
# 安装依赖
npm install

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 启动开发服务器
npm run dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:4000/api |
| Health Check | http://localhost:4000/api/health |
| Prisma Studio | `npm run prisma:studio` |

### 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@luckyshop.com | admin123 |
| 测试用户 | test@luckyshop.com | test123 |
| 演示用户 | demo@luckyshop.com | demo123 |

## 项目结构

```
lucky-shop/
├── client/          # React SPA 前端
│   └── src/
│       ├── api/     # API 客户端
│       ├── components/
│       ├── pages/   # 路由页面
│       └── store/   # Zustand 状态管理
├── server/          # Express 后端
│   └── src/
│       ├── middleware/  # auth, csrf, error, rate-limit...
│       ├── modules/    # 路由模块 (auth, product, order, game...)
│       ├── services/   # 业务逻辑层
│       ├── repositories/ # 数据访问层
│       └── __tests__/  # 215 单元测试
├── shared/          # 共享类型 + 校验 schema
├── prisma/          # Schema + 迁移 + 种子数据
├── e2e/             # Playwright E2E 测试
├── scripts/         # 数据库迁移脚本
└── docs/            # API.md, ARCHITECTURE.md, DEPLOY.md
```

## 测试

```bash
npm run test:server          # 215 单元测试
npm run test:client          # 前端测试
npm run test:server -- --coverage  # 覆盖率报告
cd e2e && npx playwright test      # 7 个 E2E 冒烟测试
```

**覆盖率门禁**: Statements ≥65% / Branches ≥48% / Functions ≥62% / Lines ≥70%

## 部署

### 本地测试（推荐）

```bash
# Windows
start.bat

# PowerShell
.\start-server.ps1
```

### Docker 部署

```bash
docker-compose up -d
```

### PM2 生产部署

```bash
# 构建
npm run build

# 使用 pm2 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs lucky-shop-server
```

### 云服务部署

详见 `docs/DEPLOY.md`：
- **前端**: Vercel (自动 HTTPS + CDN)
- **后端**: Railway / Render (Docker 容器)
- **数据库**: Railway PostgreSQL

## API 文档

详见 `docs/API.md`。

基础信息：
- Base URL: `http://localhost:4000/api`
- 版本化路径: `/api/v1/*`
- 认证: `Authorization: Bearer <jwt>`
- 统一响应: `{ success: true/false, data: T, error?: { code, message } }`
- 幂等键: `Idempotency-Key` header (POST/PUT/PATCH/DELETE)
- CSRF: `x-csrf-token` header (非 GET/HEAD/OPTIONS)

## 环境变量

复制 `.env.example` 为 `.env`，按需修改。生产环境务必：
1. 设置 `NODE_ENV=production`
2. 更换 `JWT_SECRET` 为 32+ 位随机串
3. 启用 Redis（可选但推荐）

## License

MIT