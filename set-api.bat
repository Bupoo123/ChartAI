@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set ENV_FILE=.env.local

if not exist "%ENV_FILE%" (
    echo 未找到 .env.local，正在从 env.example 复制...
    copy env.example "%ENV_FILE%"
    echo.
)

echo ==========================================
echo   ChartAI - 切换/修改 API 配置
echo ==========================================
echo.
echo 请确保在 .env.local 中设置：
echo   - AI_PROVIDER=deepseek   （或 openai、anthropic、ollama 等）
echo   - AI_MODEL=deepseek-chat （或对应模型的 ID）
echo   - DEEPSEEK_API_KEY=sk-你的密钥   （若使用 DeepSeek，必填）
echo.
echo 获取 DeepSeek API Key: https://platform.deepseek.com
echo 其他提供商见 env.example 中的注释。
echo.
echo 即将用记事本打开 .env.local，请编辑后保存并关闭。
echo.
pause
notepad "%ENV_FILE%"
echo.
echo 修改完成后请重启开发服务（重新运行 start.bat 或 npm run dev）。
pause
