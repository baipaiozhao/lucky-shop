@echo off
chcp 65001 >nul
title LuckyShop Development Server

echo.
echo ========================================
echo   LuckyShop Development Server
echo ========================================
echo.

REM 获取脚本所在目录
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo [1/4] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js >= 20.0.0 from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   Node.js: %NODE_VERSION%

echo.
echo [2/4] Installing dependencies...
if not exist "node_modules" (
    echo   Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo   Dependencies already installed
)

echo.
echo [3/4] Initializing database...
if not exist "prisma\dev.db" (
    echo   Creating database...
    call npm run prisma:migrate
    call npm run prisma:seed
    echo   Database initialized with seed data
) else (
    echo   Database already exists
)

echo.
echo [4/4] Starting servers...
echo.

REM 启动后端
echo Starting Backend (port 4000^)...
start "LuckyShop-Backend" cmd /k "cd /d "%PROJECT_DIR%server" && title LuckyShop-Backend && npx tsx src/index.ts"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端
echo Starting Frontend (port 5173^)...
start "LuckyShop-Frontend" cmd /k "cd /d "%PROJECT_DIR%client" && title LuckyShop-Frontend && npx vite"

echo.
echo ========================================
echo   Servers are starting...
echo ========================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:4000/api
echo   Health:    http://localhost:4000/api/health
echo.
echo   Demo Accounts:
echo     Admin: admin@luckyshop.com / admin123
echo     User:  test@luckyshop.com / test123
echo.
echo ========================================
echo.

REM 等待服务启动后打开浏览器
echo Waiting for servers to start (8s^)...
timeout /t 8 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo   LuckyShop is running!
echo ========================================
echo.
echo   Press any key to open browser again...
echo   Close the Backend/Frontend windows to stop.
echo.
pause >nul
start http://localhost:5173
