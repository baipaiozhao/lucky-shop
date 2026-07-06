# LuckyShop 快速启动脚本
# 适用于 Windows PowerShell

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LuckyShop Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取项目根目录
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PROJECT_DIR

# 检查 Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Node.js >= 20.0.0 from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 检查 npm
Write-Host ""
Write-Host "[2/5] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "  npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: npm is not installed" -ForegroundColor Red
    exit 1
}

# 获取本机 IP 地址
Write-Host ""
Write-Host "[3/5] Detecting network..." -ForegroundColor Yellow
try {
    $ipAddresses = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" 
    }).IPAddress

    if ($ipAddresses) {
        $LOCAL_IP = $ipAddresses | Select-Object -First 1
        Write-Host "  Local IP: $LOCAL_IP" -ForegroundColor Green
    } else {
        Write-Host "  Warning: Could not detect IP, using localhost" -ForegroundColor Yellow
        $LOCAL_IP = "localhost"
    }
} catch {
    Write-Host "  Warning: Could not detect IP" -ForegroundColor Yellow
    $LOCAL_IP = "localhost"
}

# 检查并创建 .env
Write-Host ""
Write-Host "[4/5] Checking environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "  Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" -Destination ".env"
    
    # 更新 CORS 配置
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "CORS_ORIGIN=http://localhost:5173", "CORS_ORIGIN=http://$LOCAL_IP`:5173,http://localhost:5173"
    Set-Content ".env" -Value $envContent -NoNewline
    
    Write-Host "  .env file created" -ForegroundColor Green
} else {
    Write-Host "  .env file exists" -ForegroundColor Green
}

# 检查并安装依赖
Write-Host ""
Write-Host "[5/5] Installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing npm packages..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  Dependencies already installed" -ForegroundColor Green
}

# 检查数据库
Write-Host ""
if (-not (Test-Path "prisma/dev.db")) {
    Write-Host "  Initializing database..." -ForegroundColor Yellow
    npm run prisma:migrate
    npm run prisma:seed
    Write-Host "  Database initialized with seed data" -ForegroundColor Green
} else {
    Write-Host "  Database already exists" -ForegroundColor Green
}

# 显示信息
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting LuckyShop..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Local Access:" -ForegroundColor White
Write-Host "    Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "    Backend:  http://localhost:4000/api" -ForegroundColor Green
Write-Host ""
Write-Host "  Network Access (share with friends):" -ForegroundColor White
Write-Host "    Frontend: http://$LOCAL_IP`:5173" -ForegroundColor Green
Write-Host "    Backend:  http://$LOCAL_IP`:4000/api" -ForegroundColor Green
Write-Host ""
Write-Host "  Demo Accounts:" -ForegroundColor White
Write-Host "    Admin: admin@luckyshop.com / admin123" -ForegroundColor Yellow
Write-Host "    User:  test@luckyshop.com / test123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# 启动开发服务器
npm run dev
