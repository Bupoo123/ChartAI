@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set URL=http://localhost:6002

:: 检查端口 6002 是否已被占用
netstat -ano | findstr ":6002" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo 端口 6002 已被占用，服务已在运行，直接打开浏览器...
    start "" "%URL%"
    exit /b 0
)

echo 正在启动 ChartAI 开发服务器...
start "ChartAI Dev Server" cmd /k "npm run dev"

echo 等待服务启动（约 8 秒）...
timeout /t 8 /nobreak >nul

start "" "%URL%"
echo 已用默认浏览器打开 %URL%
echo.
echo 关闭上方「ChartAI Dev Server」窗口即可停止服务。
pause
