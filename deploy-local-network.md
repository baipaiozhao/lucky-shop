# 局域网部署指南

让同一网络下的其他用户访问你的 LuckyShop 项目。

## 前提条件

1. 确保所有设备连接到同一个 WiFi/局域网
2. 找到你的电脑的局域网 IP 地址

### 查看本机 IP 地址

```powershell
ipconfig
```

查找 `IPv4 地址`，例如: `192.168.1.100`

## 部署步骤

### 1. 配置环境变量

创建 `.env` 文件（如果不存在）：

```env
# 后端配置
PORT=4000
JWT_SECRET=your-secret-key-change-this-in-production
DATABASE_URL=file:./dev.db
CORS_ORIGIN=http://你的IP:5173  # 例如 http://192.168.1.100:5173

# 前端配置
VITE_API_BASE_URL=http://你的IP:4000/api  # 例如 http://192.168.1.100:4000/api
```

### 2. 安装依赖

```powershell
npm install
```

### 3. 初始化数据库

```powershell
npm run prisma:migrate
npm run prisma:seed
```

### 4. 启动服务

**方式一：开发模式（推荐用于局域网测试）**

```powershell
npm run dev
```

**方式二：生产模式构建**

```powershell
# 构建后端
cd server
npm run build

# 构建前端
cd ../client
npm run build

# 使用 pm2 启动（需要先安装 pm2）
npm install -g pm2
cd ..
pm2 start ecosystem.config.js
```

### 5. 防火墙设置

确保 Windows 防火墙允许 Node.js 通过：

- 打开 Windows Defender 防火墙
- 点击"允许应用通过防火墙"
- 找到 Node.js，勾选"专用"和"公用"网络

### 6. 访问地址

其他用户可以通过以下地址访问：

```
前端: http://你的IP:5173
后端API: http://你的IP:4000/api
```

例如: `http://192.168.1.100:5173`

## 演示账号

| 角色     | 邮箱                | 密码     |
| -------- | ------------------- | -------- |
| 管理员   | admin@luckyshop.com | admin123 |
| 测试用户 | test@luckyshop.com  | test123  |
| 演示用户 | demo@luckyshop.com  | demo123  |

## 故障排查

1. **其他人无法访问**:
   - 检查是否在同一网络
   - 确认 IP 地址正确
   - 检查防火墙设置
   - 尝试临时关闭防火墙测试

2. **API 连接失败**:
   - 确认 `VITE_API_BASE_URL` 配置正确
   - 确认后端服务在 4000 端口运行

3. **端口被占用**:
   - 修改 `.env` 中的 `PORT` 变量
   - 修改 `client/vite.config.ts` 中的 server 端口
