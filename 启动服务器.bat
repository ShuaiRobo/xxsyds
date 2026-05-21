@echo off
title 答题系统服务器
color 0A
echo ========================================
echo     通用答题系统 - 服务器启动器
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] 安装依赖...
if not exist "node_modules" (
    npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo [3/3] 启动服务器...
echo.
echo ========================================
echo 服务器启动中...
echo ========================================
echo.

ipconfig | findstr /i "IPv4" > temp_ip.txt
set /p ip_line=<temp_ip.txt
set "ip=%ip_line:~39%"
del temp_ip.txt >nul 2>&1

echo.
echo ========================================
echo   答题系统已启动！
echo ========================================
echo.
echo   本机访问: http://localhost:3000
echo   局域网访问: http://%ip%:3000
echo.
echo   其他电脑请访问: http://%ip%:3000
echo.
echo ========================================
echo   按 Ctrl+C 停止服务器
echo ========================================
echo.

node saveTest.js
