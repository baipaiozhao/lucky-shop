# LuckyShop 部署指南

## 本地开发

```bash
cd lucky-shop
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:4000
- 数据库: `prisma/dev.db`

## Docker 部署

```bash
docker-compose up -d
```

服务启动后:

- 前端: http://localhost:3000
- 后端: http://localhost:4000

## PM2 生产部署

适用于自有服务器或 VPS：

```bash
# 1. 构建项目
npm run build

# 2. 使用 pm2 启动
pm2 start ecosystem.config.js

# 3. 查看状态
pm2 status

# 4. 查看日志
pm2 logs lucky-shop-server

# 5. 设置开机自启
pm2 startup
pm2 save
```

### PM2 常用命令

```bash
pm2 restart lucky-shop-server  # 重启
pm2 stop lucky-shop-server     # 停止
pm2 delete lucky-shop-server   # 删除
pm2 monit                      # 监控面板
```

## Vercel + Railway 部署

### 前端 (Vercel)

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 设置 Root Directory 为 `client`
4. 设置环境变量 `VITE_API_BASE_URL=https://your-railway-url.railway.app/api`
5. 部署

### 后端 (Railway)

1. 在 Railway 创建新项目
2. 连接 GitHub 仓库
3. 设置 Root Directory 为 `server`
4. 添加环境变量:
   - `DATABASE_URL`: Railway PostgreSQL 连接字符串
   - `JWT_SECRET`: 随机 32 位字符串
   - `NODE_ENV`: production
5. 部署后执行:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 环境变量

| 变量                | 说明          | 默认值                      |
| ------------------- | ------------- | --------------------------- |
| `DATABASE_URL`      | 数据库连接    | `file:./dev.db`             |
| `JWT_SECRET`        | JWT 密钥      | 必填                        |
| `JWT_EXPIRES_IN`    | Token 有效期  | `7d`                        |
| `PORT`              | 后端端口      | `4000`                      |
| `CORS_ORIGIN`       | 前端域名      | `http://localhost:5173`     |
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:4000/api` |

## 演示账号

| 角色     | 邮箱                | 密码     |
| -------- | ------------------- | -------- |
| 管理员   | admin@luckyshop.com | admin123 |
| 测试用户 | test@luckyshop.com  | test123  |
| 演示用户 | demo@luckyshop.com  | demo123  |
