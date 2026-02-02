#!/bin/bash
# Next AI Draw.io - 一键切换 AI 提供商并修改 API Key
# 双击运行或在终端执行 ./set-api.command

cd "$(dirname "$0")"
ENV_FILE=".env.local"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "未找到 .env.local，正在从 env.example 复制..."
    cp env.example "$ENV_FILE"
fi

# 读取当前配置
current_provider=$(grep -E '^AI_PROVIDER=' "$ENV_FILE" 2>/dev/null | cut -d= -f2)
current_model=$(grep -E '^AI_MODEL=' "$ENV_FILE" 2>/dev/null | cut -d= -f2)

echo "=========================================="
echo "  Next AI Draw.io - 切换/修改 API"
echo "=========================================="
echo ""
echo "当前: AI_PROVIDER=$current_provider   AI_MODEL=$current_model"
echo ""

# 菜单
echo "请选择要使用的 AI 提供商："
echo "  1) DeepSeek（深度求索）"
echo "  2) 豆包 Doubao（字节跳动火山引擎）"
echo "  3) Kimi（月之暗面，通过 OpenRouter）"
echo "  4) OpenAI（如 GPT-4o）"
echo "  5) Anthropic（如 Claude）"
echo "  6) Ollama（本地，无需 API Key）"
echo "  7) 仅打开 .env.local 手动编辑"
echo "  0) 退出"
echo ""
read -p "请输入数字 [0-7]: " choice

case "$choice" in
    1)
        PROVIDER="deepseek"
        MODEL="deepseek-chat"
        KEY_VAR="DEEPSEEK_API_KEY"
        KEY_HINT="https://platform.deepseek.com 获取"
        ;;
    2)
        PROVIDER="doubao"
        MODEL="doubao-pro-32k-241215"
        KEY_VAR="DOUBAO_API_KEY"
        KEY_HINT="https://ark.cn-beijing.volces.com 火山引擎 ARK 获取"
        ;;
    3)
        PROVIDER="openrouter"
        MODEL="moonshotai/kimi-k2.5"
        KEY_VAR="OPENROUTER_API_KEY"
        KEY_HINT="https://openrouter.ai 获取（可选 Kimi 等模型）"
        ;;
    4)
        PROVIDER="openai"
        MODEL="gpt-4o"
        KEY_VAR="OPENAI_API_KEY"
        KEY_HINT="https://platform.openai.com 获取"
        ;;
    5)
        PROVIDER="anthropic"
        MODEL="claude-sonnet-4-20250514"
        KEY_VAR="ANTHROPIC_API_KEY"
        KEY_HINT="https://console.anthropic.com 获取"
        ;;
    6)
        PROVIDER="ollama"
        MODEL="llama3.2"
        KEY_VAR=""
        KEY_HINT="本地运行，需先安装 Ollama 并 ollama pull <模型名>"
        ;;
    7)
        echo "正在打开 .env.local ..."
        open -e "$ENV_FILE" 2>/dev/null || ${EDITOR:-nano} "$ENV_FILE"
        echo "保存后请重启开发服务 (npm run dev)。"
        exit 0
        ;;
    0)
        echo "已退出。"
        exit 0
        ;;
    *)
        echo "无效选择，已退出。"
        exit 1
        ;;
esac

# 更新 AI_PROVIDER 和 AI_MODEL
sed -i.bak "s/^AI_PROVIDER=.*/AI_PROVIDER=$PROVIDER/" "$ENV_FILE"
sed -i.bak "s/^AI_MODEL=.*/AI_MODEL=$MODEL/" "$ENV_FILE"
rm -f "${ENV_FILE}.bak"

if [[ -n "$KEY_VAR" ]]; then
    current_key=$(grep -E "^#? *${KEY_VAR}=" "$ENV_FILE" 2>/dev/null | sed 's/^#* *.*=//')
    if [[ -n "$current_key" && "$current_key" != "your-"* && "$current_key" != "sk-你的"* ]]; then
        echo "当前 ${KEY_VAR} 已设置（已隐藏）。"
    fi
    echo "获取 API Key: $KEY_HINT"
    read -p "请输入 ${KEY_VAR}（直接回车则保留原值）: " new_key
    if [[ -n "$new_key" ]]; then
        # 兼容已注释或未注释的行
        if grep -qE "^#? *${KEY_VAR}=" "$ENV_FILE"; then
            sed -i.bak "s|^#* *${KEY_VAR}=.*|${KEY_VAR}=${new_key}|" "$ENV_FILE"
        else
            echo "${KEY_VAR}=${new_key}" >> "$ENV_FILE"
        fi
        rm -f "${ENV_FILE}.bak"
        echo "已更新 ${KEY_VAR}。"
    fi
else
    echo "已切换为 Ollama，无需 API Key。"
fi

echo ""
echo "=========================================="
echo "  已切换为: $PROVIDER"
echo "  默认模型: $MODEL"
echo "=========================================="
echo "请重启开发服务 (npm run dev 或 双击 start.command) 后生效。"
echo ""
