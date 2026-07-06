# 🚀 "我买我卖"项目部署指南

> 版本：v5.0.0 | 更新时间：2026-07-06

本文档提供四种完整的部署方案，从零基础到高级用户都能找到适合自己的方式。

---

## 📋 目录

- [方案对比总览](#方案对比总览)
- [方案1：Vercel + Railway（推荐）](#方案1vercel--railway推荐)
- [方案2：Vercel + Render](#方案2vercel--render)
- [方案3：Cloudflare 全栈方案](#方案3cloudflare-全栈方案)
- [方案4：阿里云/腾讯云 + 宝塔面板](#方案4阿里云腾讯云--宝塔面板)
- [通用配置](#通用配置)
- [常见问题](#常见问题)

---

## 方案对比总览

| 维度 | 方案1：Vercel + Railway | 方案2：Vercel + Render | 方案3：Cloudflare 全栈 | 方案4：云服务器 + 宝塔 |
|------|------------------------|----------------------|----------------------|----------------------|
| **难度** | ⭐⭐ 简单 | ⭐⭐ 简单 | ⭐⭐⭐⭐ 较难 | ⭐⭐⭐ 中等 |
| **月费用** | $0-5 | $0-7 | $0 | ¥50-100 |
| **适合人群** | 个人开发者、中小项目 | 个人开发者 | 前端熟悉 Cloudflare 的开发者 | 国内用户、需要备案 |
| **国内访问** | 一般（需备案域名） | 一般（需备案域名） | 一般（需备案域名） | ✅ 优秀 |
| **自动扩缩** | ✅ | ✅ | ✅ | ❌ 手动 |
| **SSL 证书** | ✅ 自动 | ✅ 自动 | ✅ 自动 | ⚠️ 需手动配置 |
| **数据库** | PostgreSQL | PostgreSQL | D1 (SQLite) | MySQL/PostgreSQL |

### 🎯 选择建议

- **新手/快速上线** → 选择 **方案1** 或 **方案2**
- **国内用户为主** → 选择 **方案4**（需备案）
- **全栈 Cloudflare 生态** → 选择 **方案3**（需 Serverless 改造）
- **预算有限** → 选择 **方案1**（Railway 每月 $5 免费额度）

---

## 方案1：Vercel + Railway（推荐）

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 前端免费托管（Vercel） | ⚠️ Railway 免费额度有限（$5/月） |
| ✅ 自动 HTTPS + CDN | ⚠️ 国内访问速度一般 |
| ✅ 自动部署（Git push 触发） | ⚠️ 冷启动可能延迟 |
| ✅ Railway 自带 PostgreSQL | ⚠️ 需要绑定信用卡（免费额度用完后） |
| ✅ 部署简单，5分钟搞定 | |

### 费用说明

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| Vercel | 无限静态站点 | Pro: $20/月 |
| Railway | $5/月 | $0.000463/min (512MB) |
| PostgreSQL (Railway) | 包含在 $5 额度内 | 按用量计费 |

**预估月费用**：个人项目 $0，中小项目 $5-10

---

### 详细步骤

#### 第一步：准备工作

1. **注册账号**
   - [GitHub](https://github.com) - 代码托管
   - [Vercel](https://vercel.com) - 前端托管
   - [Railway](https://railway.app) - 后端 + 数据库

2. **确保代码已推送到 GitHub**
   ```bash
   # 在项目根目录执行
   git add .
   git commit -m "feat: 部署准备"
   git push origin main
   ```

#### 第二步：部署后端到 Railway

1. **登录 Railway**
   - 访问 [https://railway.app](https://railway.app)
   - 点击 "Login" → 选择 GitHub 登录

2. **创建新项目**
   - 点击 "New Project" → "Empty Project"
   - 项目命名：`lucky-shop-backend`

3. **连接 GitHub 仓库**
   - 点击 "Settings" → "GitHub"
   - 选择你的 `lucky-shop` 仓库
   - **关键配置**：
     ```
     Root Directory: server
     ```

4. **添加 PostgreSQL 数据库**
   - 在项目页面点击 "+ New" → "Database" → "PostgreSQL"
   - Railway 会自动创建数据库并注入环境变量

5. **配置环境变量**
   - 点击 "Settings" → "Environment Variables"
   - 添加以下变量：

   ```env
   # 必填
   NODE_ENV=production
   JWT_SECRET=your-32-char-random-string-here-12345
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   # 建议配置
   CORS_ORIGIN=https://your-app.vercel.app
   LOG_LEVEL=warn
   ```

   > ⚠️ 生成安全的 JWT_SECRET：
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```

6. **触发部署**
   - 保存环境变量后，Railway 会自动重新部署
   - 等待构建完成（约 2-3 分钟）
   - 部署成功后，点击 "Settings" → "Networking" → "Generate Domain"
   - 记录生成的域名，如：`lucky-shop-backend-production.up.railway.app`

7. **运行数据库迁移**
   - 在 Railway 项目页面，点击 "Settings" → "Deployments"
   - 点击最新部署 → "View Logs"
   - Railway 会自动执行 `prisma migrate deploy`（需要配置构建脚本）
   
   **如果需要手动执行**：
   - 安装 Railway CLI：`npm install -g @railway/cli`
   - 执行迁移：
     ```bash
     railway login
     railway link
     railway run npx prisma migrate deploy
     railway run npx prisma db seed
     ```

8. **验证后端部署**
   - 访问 `https://lucky-shop-backend-production.up.railway.app/api/health`
   - 应返回：`{"success": true, "data": {"status": "ok"}}`

#### 第三步：部署前端到 Vercel

1. **登录 Vercel**
   - 访问 [https://vercel.com](https://vercel.com)
   - 点击 "Login" → 选择 GitHub 登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 在 "Import Git Repository" 中选择 `lucky-shop` 仓库
   - 点击 "Import"

3. **配置构建设置**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **配置环境变量**
   - 展开 "Environment Variables" 部分
   - 添加：

   ```env
   VITE_API_BASE_URL=https://lucky-shop-backend-production.up.railway.app/api
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 1-2 分钟）
   - 部署成功后，Vercel 会分配一个域名，如：`lucky-shop.vercel.app`

6. **更新后端 CORS 配置**
   - 回到 Railway，更新环境变量：
   ```env
   CORS_ORIGIN=https://lucky-shop.vercel.app
   ```
   - Railway 会自动重新部署

#### 第四步：验证完整部署

1. 访问 `https://lucky-shop.vercel.app`
2. 使用演示账号登录：
   - 邮箱：`admin@luckyshop.com`
   - 密码：`admin123`
3. 测试完整流程：浏览商品 → 加入购物车 → 下单

---

### 常见问题

**Q1: Railway 部署后数据库连接失败？**
- 检查 `DATABASE_URL` 是否正确引用了 PostgreSQL 变量
- 确保 `prisma/schema.prisma` 中的 `provider` 为 `postgresql`

**Q2: Vercel 前端无法连接后端？**
- 检查 `VITE_API_BASE_URL` 是否正确
- 确保后端 CORS 配置包含 Vercel 域名
- 注意：环境变量修改后需要重新部署

**Q3: Railway 免费额度用完怎么办？**
- 升级到 Hobby Plan（$5/月）
- 或迁移到其他平台

**Q4: 如何自定义域名？**
- Vercel：Settings → Domains → 添加域名
- Railway：Settings → Networking → Custom Domain

---

### 注意事项

1. **JWT_SECRET 必须更改**：不要使用默认值
2. **数据库备份**：Railway 免费版不支持自动备份，建议定期手动导出
3. **监控用量**：关注 Railway 的用量面板，避免超出预算
4. **日志查看**：Railway 和 Vercel 都提供在线日志查看功能

---

## 方案2：Vercel + Render

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ Render 免费层可无限期使用 | ⚠️ 免费层有冷启动延迟（约30秒） |
| ✅ 无需绑定信用卡 | ⚠️ 免费层有 750 小时/月限制 |
| ✅ 自动部署 | ⚠️ 国内访问速度一般 |
| ✅ 内置 PostgreSQL | ⚠️ 免费层数据库 90 天后自动删除 |

### 费用说明

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| Vercel | 无限静态站点 | Pro: $20/月 |
| Render | 750 小时/月 | $7/月 (512MB) |
| PostgreSQL (Render) | 90 天免费 | $7/月 |

**预估月费用**：$0（但有冷启动）

---

### 详细步骤

#### 第一步：部署后端到 Render

1. **登录 Render**
   - 访问 [https://render.com](https://render.com)
   - 点击 "Get Started" → 使用 GitHub 登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接你的 `lucky-shop` 仓库

3. **配置服务**
   - **Name**: `lucky-shop-backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     cd server && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     cd server && npm run start
     ```
   - **Instance Type**: `Free`

4. **创建 PostgreSQL 数据库**
   - 返回 Dashboard，点击 "New +" → "PostgreSQL"
   - **Name**: `lucky-shop-db`
   - **Database**: `luckyshop`
   - **Instance Type**: `Free`

5. **获取数据库连接字符串**
   - 在 PostgreSQL 服务页面，找到 "External Database URL"
   - 复制连接字符串，格式如：
     ```
     postgres://user:password@host:5432/luckyshop
     ```

6. **配置后端环境变量**
   - 在 Web Service 页面，点击 "Environment" 选项卡
   - 添加：

   ```env
   NODE_ENV=production
   JWT_SECRET=your-32-char-random-string-here-12345
   DATABASE_URL=postgres://user:password@host:5432/luckyshop
   CORS_ORIGIN=https://your-app.vercel.app
   LOG_LEVEL=warn
   ```

7. **配置构建命令**
   - 在 "Build & Deploy" 选项卡，添加 Post-Deploy Command：
   ```bash
   cd server && npx prisma migrate deploy
   ```

8. **部署**
   - 保存后，Render 会自动开始构建
   - 等待构建完成（约 3-5 分钟）
   - 部署成功后，获取服务 URL，如：`https://lucky-shop-backend.onrender.com`

#### 第二步：部署前端到 Vercel

（与方案1相同，略）

#### 第三步：更新 CORS 配置

更新后端环境变量：
```env
CORS_ORIGIN=https://lucky-shop.vercel.app
```

---

### 常见问题

**Q1: Render 免费层冷启动很慢怎么办？**
- 这是 Render 免费层的限制
- 解决方案：
  1. 升级到 Paid Plan（$7/月，无冷启动）
  2. 使用 UptimeRobot 等服务定期 ping 保持活跃

**Q2: Render 免费层数据库 90 天后会删除？**
- 是的，免费层 PostgreSQL 数据库会在 90 天后自动删除
- 建议：
  1. 定期备份数据
  2. 或升级到 Paid Plan

**Q3: 如何在 Render 执行数据库迁移？**
- 在 "Build & Deploy" → "Post-Deploy Command" 中添加：
  ```bash
  cd server && npx prisma migrate deploy
  ```

---

### 注意事项

1. **冷启动问题**：免费层有约 30 秒冷启动，用户首次访问会等待
2. **数据库生命周期**：免费层数据库 90 天后删除，需注意备份
3. **小时限制**：750 小时/月，约 25 小时/天，基本够用

---

## 方案3：Cloudflare 全栈方案

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 完全免费 | ⚠️ 需要改造代码为 Serverless 标准 |
| ✅ 全球 CDN 加速 | ⚠️ D1 数据库有存储限制（免费 5GB） |
| ✅ D1 数据库零配置 | ⚠️ 冷函数有执行时间限制 |
| ✅ 无需管理服务器 | ⚠️ Express 中间件需适配 |

### 费用说明

| 服务 | 免费额度 |
|------|----------|
| Cloudflare Pages | 无限请求 |
| Cloudflare Workers | 100,000 请求/天 |
| D1 数据库 | 5GB 存储 + 1000 万行读取/天 |

**预估月费用**：$0

---

### 前置要求

⚠️ **重要**：此方案需要将后端改造为 Cloudflare Workers 支持的格式。

改造要点：
1. 使用 [Hono](https://hono.dev) 替代 Express（或使用适配器）
2. 数据库改用 D1（SQLite 兼容）
3. 文件上传改用 R2 存储

---

### 详细步骤

#### 第一步：安装 Cloudflare 工具

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

#### 第二步：创建 D1 数据库

```bash
# 在项目根目录执行
wrangler d1 create lucky-shop-db

# 记录输出的 database_id，稍后使用
```

#### 第三步：创建 Workers 项目

1. **改造后端代码**

   安装 Hono：
   ```bash
   cd server
   npm install hono @hono/node-server
   ```

   创建 `server/src/index.worker.ts`：
   ```typescript
   import { Hono } from 'hono'
   import { cors } from 'hono/cors'
   import { PrismaClient } from '@prisma/client'

   const app = new Hono()

   // CORS
   app.use('*', cors({
     origin: ['https://your-app.pages.dev'],
     credentials: true,
   }))

   // 健康检查
   app.get('/api/health', (c) => {
     return c.json({ success: true, data: { status: 'ok' } })
   })

   // 其他路由...

   export default app
   ```

2. **配置 wrangler.toml**

   在 `server/` 目录创建 `wrangler.toml`：
   ```toml
   name = "lucky-shop-backend"
   main = "src/index.worker.ts"
   compatibility_date = "2024-01-01"

   [vars]
   NODE_ENV = "production"

   [[d1_databases]]
   binding = "DB"
   database_name = "lucky-shop-db"
   database_id = "your-database-id-from-step-2"
   ```

3. **部署后端**
   ```bash
   cd server
   wrangler deploy
   ```

#### 第四步：部署前端到 Cloudflare Pages

1. **构建前端**
   ```bash
   cd client
   npm run build
   ```

2. **部署**
   ```bash
   # 方式1：使用 Wrangler
   wrangler pages deploy dist --project-name=lucky-shop-frontend

   # 方式2：连接 GitHub 自动部署
   # 在 Cloudflare Dashboard → Pages → Create a project → 连接 GitHub
   ```

3. **配置环境变量**

   在 Cloudflare Pages 项目设置中添加：
   ```env
   VITE_API_BASE_URL=https://lucky-shop-backend.your-subdomain.workers.dev/api
   ```

#### 第五步：初始化数据库

```bash
# 使用 Wrangler 执行数据库迁移
cd server
wrangler d1 execute lucky-shop-db --file=../prisma/migrations/migration.sql
```

---

### 常见问题

**Q1: Express 中间件不兼容 Cloudflare Workers？**
- 解决方案：使用 Hono 框架，它原生支持 Workers
- 或使用 `@hono/node-server` 适配器

**Q2: D1 数据库和 PostgreSQL 语法差异？**
- D1 基于 SQLite，大部分语法兼容
- 注意：不支持 `enum` 类型，需改为 `TEXT`

**Q3: 如何处理文件上传？**
- 使用 Cloudflare R2 存储
- 参考文档：https://developers.cloudflare.com/r2/

---

### 注意事项

1. **代码改造**：需要将 Express 代码适配为 Workers 格式
2. **测试充分**：Workers 环境与 Node.js 有差异，需充分测试
3. **数据库限制**：D1 免费版有存储和读写限制

---

## 方案4：阿里云/腾讯云 + 宝塔面板

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 国内访问速度快 | ⚠️ 需要购买服务器 |
| ✅ 可备案域名 | ⚠️ 需要手动维护 |
| ✅ 宝塔面板可视化管理 | ⚠️ 有一定的学习成本 |
| ✅ 无平台限制 | ⚠️ SSL 证书需手动配置 |

### 费用说明

| 服务 | 费用 |
|------|------|
| 云服务器 (2核2G) | ¥50-100/月 |
| 域名 | ¥50-100/年 |
| SSL 证书 | 免费 (Let's Encrypt) |

**预估月费用**：¥50-100

---

### 详细步骤

#### 第一步：购买云服务器

**阿里云**：
1. 访问 [https://www.aliyun.com](https://www.aliyun.com)
2. 进入 "云服务器 ECS"
3. 选择配置：
   - 地域：华东/华北（根据用户分布选择）
   - 实例规格：2核2G（入门）或 2核4G（推荐）
   - 镜像：Ubuntu 22.04 或 CentOS 7.9
   - 带宽：1-5 Mbps
4. 购买并设置 root 密码

**腾讯云**：
1. 访问 [https://cloud.tencent.com](https://cloud.tencent.com)
2. 进入 "云服务器 CVM"
3. 类似配置购买

#### 第二步：安全组配置

在云服务器控制台，配置安全组规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 8888 | 你的IP | 宝塔面板（建议限制IP） |

#### 第三步：安装宝塔面板

1. **SSH 连接服务器**
   ```bash
   # Windows 使用 PowerShell 或 CMD
   ssh root@你的服务器IP
   
   # 或使用 PuTTY 等工具
   ```

2. **安装宝塔面板**

   **Ubuntu/Debian**：
   ```bash
   wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0_en.sh && sudo bash install.sh
   ```

   **CentOS**：
   ```bash
   yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0_en.sh && bash install.sh
   ```

3. **记录安装信息**

   安装完成后，会显示：
   ```
   宝塔面板地址: http://你的IP:8888/xxxxxx
   用户名: xxxxxx
   密码: xxxxxx
   ```

   > ⚠️ 请妥善保存这些信息！

#### 第四步：配置宝塔面板

1. **登录宝塔面板**
   - 浏览器访问 `http://你的IP:8888/xxxxxx`
   - 输入用户名和密码登录

2. **安装必要软件**
   - 首次登录会弹出软件推荐
   - 安装以下软件：
     - Nginx（推荐 1.22+）
     - Node.js（推荐 20.x）
     - PostgreSQL（推荐 14+）
     - PM2 管理器

3. **配置防火墙**
   - 宝塔面板 → 安全 → 放行端口
   - 放行：80, 443, 8888

#### 第五步：部署代码

1. **上传代码**
   - 宝塔面板 → 文件 → 进入 `/www/wwwroot/`
   - 点击 "上传" → 上传项目 zip 包
   - 或使用 Git：
     ```bash
     cd /www/wwwroot
     git clone https://github.com/your-username/lucky-shop.git
     ```

2. **解压代码**
   ```bash
   cd /www/wwwroot
   unzip lucky-shop.zip
   ```

3. **安装依赖**
   ```bash
   cd /www/wwwroot/lucky-shop
   
   # 安装根目录依赖
   npm install
   
   # 安装各工作空间依赖
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   cd shared && npm install && cd ..
   ```

4. **配置环境变量**
   ```bash
   cd /www/wwwroot/lucky-shop
   cp .env.example .env
   nano .env
   ```

   修改为：
   ```env
   NODE_ENV=production
   PORT=4000
   HOST=0.0.0.0
   DATABASE_PROVIDER=postgresql
   DATABASE_URL="postgresql://luckyshop:你的密码@127.0.0.1:5432/luckyshop"
   JWT_SECRET=你的32位随机字符串
   CORS_ORIGIN=https://你的域名
   LOG_LEVEL=warn
   ```

5. **配置数据库**
   - 宝塔面板 → 数据库 → PostgreSQL
   - 创建数据库：`luckyshop`
   - 设置密码并记录

6. **构建项目**
   ```bash
   cd /www/wwwroot/lucky-shop
   
   # 生成 Prisma Client
   npx prisma generate --schema=prisma/schema.prisma
   
   # 执行数据库迁移
   npx prisma migrate deploy --schema=prisma/schema.prisma
   
   # 填充种子数据
   node --import tsx/esm prisma/seed.ts
   
   # 构建前端
   npm run build
   ```

7. **使用 PM2 启动后端**
   ```bash
   cd /www/wwwroot/lucky-shop
   
   # 启动后端
   pm2 start server/dist/index.js --name lucky-shop-server
   
   # 查看状态
   pm2 status
   
   # 设置开机自启
   pm2 save
   pm2 startup
   ```

#### 第六步：配置 Nginx

1. **宝塔面板 → 网站 → 添加站点**
   - 域名：你的域名
   - 根目录：`/www/wwwroot/lucky-shop/client/dist`
   - PHP 版本：选择 "纯静态"

2. **配置反向代理**
   - 点击站点名称 → 反向代理 → 添加反向代理
   - 代理名称：`api`
   - 目标 URL：`http://127.0.0.1:4000`
   - 发送域名：`127.0.0.1`

3. **修改 Nginx 配置**
   - 点击站点名称 → 配置文件
   - 修改为：

   ```nginx
   # LuckyShop Nginx 配置
   server {
       listen 80;
       server_name 你的域名;
       root /www/wwwroot/lucky-shop/client/dist;
       index index.html;

       # 安全头
       add_header X-Frame-Options "SAMEORIGIN";
       add_header X-XSS-Protection "1; mode=block";
       add_header X-Content-Type-Options "nosniff";

       # API 反向代理
       location /api/ {
           proxy_pass http://127.0.0.1:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # 静态文件缓存
       location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
           expires 30d;
           add_header Cache-Control "public, immutable";
       }

       # SPA 路由支持
       location / {
           try_files $uri $uri/ /index.html;
       }

       # gzip 压缩
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. **重启 Nginx**
   - 宝塔面板 → Nginx → 重启

#### 第七步：配置 HTTPS

1. **域名解析**
   - 在域名服务商处，添加 A 记录：
     - 主机记录：@ 或 www
     - 记录值：你的服务器 IP

2. **申请 SSL 证书**
   - 宝塔面板 → 网站 → 点击站点名称 → SSL
   - 选择 "Let's Encrypt" → 勾选域名 → 申请
   - 申请成功后，开启 "强制 HTTPS"

#### 第八步：验证部署

1. 访问 `https://你的域名`
2. 使用演示账号登录测试
3. 检查各项功能是否正常

---

### 常见问题

**Q1: 宝塔面板打不开？**
- 检查安全组是否放行 8888 端口
- 检查宝塔面板是否运行：`bt default`
- 重启宝塔：`bt restart`

**Q2: 网站 502 Bad Gateway？**
- 检查 PM2 进程是否运行：`pm2 status`
- 检查后端日志：`pm2 logs lucky-shop-server`
- 检查 Nginx 反向代理配置

**Q3: 如何更新代码？**
   ```bash
   cd /www/wwwroot/lucky-shop
   git pull origin main
   npm install
   npm run build
   pm2 restart lucky-shop-server
   ```

**Q4: 如何备份数据？**
- 宝塔面板 → 数据库 → 导出
- 或使用命令行：
  ```bash
  pg_dump -U postgres luckyshop > backup.sql
  ```

---

### 注意事项

1. **定期更新**：定期更新系统和软件包
2. **安全设置**：修改宝塔面板默认密码，限制访问 IP
3. **监控资源**：关注服务器 CPU、内存、磁盘使用情况
4. **数据备份**：定期备份数据库和代码

---

## 通用配置

### 环境变量完整说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | 是（生产设为 `production`） |
| `PORT` | 后端端口 | `4000` | 否 |
| `DATABASE_PROVIDER` | 数据库类型 | `sqlite` | 是 |
| `DATABASE_URL` | 数据库连接串 | - | 是 |
| `JWT_SECRET` | JWT 密钥 | - | 是（至少32位） |
| `JWT_EXPIRES_IN` | Token 有效期 | `7d` | 否 |
| `CORS_ORIGIN` | 允许的前端域名 | `http://localhost:5173` | 是 |
| `LOG_LEVEL` | 日志级别 | `info` | 否 |
| `REDIS_URL` | Redis 连接（可选） | - | 否 |
| `VITE_API_BASE_URL` | 前端请求后端地址 | `http://localhost:4000/api` | 是（前端） |

### 数据库 Provider 配置

**SQLite（开发环境）**：
```env
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./prisma/dev.db"
```

**PostgreSQL（生产环境）**：
```env
DATABASE_PROVIDER=postgresql
DATABASE_URL="postgresql://user:password@host:5432/luckyshop?schema=public"
```

### 生成安全密钥

```bash
# 生成 32 字节随机字符串（64 字符十六进制）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 常见问题

### Q1: 部署后前端无法连接后端？

**排查步骤**：
1. 检查 `VITE_API_BASE_URL` 是否正确
2. 检查后端 CORS 配置是否包含前端域名
3. 浏览器 F12 查看网络请求，查看具体错误
4. 检查后端服务是否正常运行

### Q2: 数据库连接失败？

**排查步骤**：
1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库服务已启动
3. 确认用户名、密码、数据库名正确
4. 检查数据库是否允许远程连接

### Q3: 如何查看后端日志？

**各平台查看日志方式**：
- **Railway**：项目页面 → Deployments → 点击部署 → Logs
- **Render**：项目页面 → Logs
- **PM2**：`pm2 logs lucky-shop-server`
- **Vercel**：项目页面 → Deployments → 点击部署 → Logs

### Q4: 如何重置数据库？

```bash
# 重置数据库（会删除所有数据）
npx prisma migrate reset --force

# 重新填充种子数据
node --import tsx/esm prisma/seed.ts
```

### Q5: 如何自定义域名？

**Vercel**：
1. 项目设置 → Domains
2. 添加域名
3. 在域名服务商添加 CNAME 记录

**Railway**：
1. 项目设置 → Networking → Custom Domain
2. 添加域名
3. 在域名服务商添加 CNAME 记录

---

## 🔗 相关资源

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Vite 部署指南](https://vitejs.dev/guide/build.html)
- [Railway 文档](https://docs.railway.app)
- [Render 文档](https://render.com/docs)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [宝塔面板官网](https://www.bt.cn)

---

## 📝 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-07-06 | 初始版本，包含四种部署方案 |

---

> 💡 如有问题，请在 GitHub Issues 中反馈
