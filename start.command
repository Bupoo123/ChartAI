#!/bin/bash
# Next AI Draw.io 一键启动：启动开发服务并用 Chrome 打开前端
# 可直接双击此文件或在终端执行 ./start.command

cd "$(dirname "$0")"
URL="http://localhost:6002"

# 若端口已被占用，直接打开浏览器并退出
if lsof -i :6002 -t >/dev/null 2>&1; then
    echo "端口 6002 已被占用，服务已在运行，直接打开浏览器..."
    if open -a "Google Chrome" "$URL" 2>/dev/null; then
        echo "已用 Chrome 打开 $URL"
    else
        open "$URL"
    fi
    exit 0
fi

echo "正在启动 Next AI Draw.io 开发服务器..."
npm run dev &
DEV_PID=$!

echo "等待服务启动（约 5 秒）..."
sleep 5

if open -a "Google Chrome" "$URL" 2>/dev/null; then
    echo "已用 Chrome 打开 $URL"
else
    echo "未找到 Chrome，使用默认浏览器打开..."
    open "$URL"
fi

wait $DEV_PID
