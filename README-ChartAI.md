# ChartAI

基于 [Next AI Draw.io](https://github.com/DayuanJiang/next-ai-draw-io) 的 AI 图表工具：用自然语言描述即可生成/编辑 draw.io 流程图、架构图等。

支持 **macOS** 与 **Windows** 一键启动与 API 配置。

---

## ⚠️ 使用前必读：配置 API Key

**本应用需要 AI 接口才能生成图表。默认使用 DeepSeek，请先配置 API Key。**

1. 获取 **DeepSeek API Key**：打开 [https://platform.deepseek.com](https://platform.deepseek.com) 注册/登录，在「API Keys」中创建并复制 Key（形如 `sk-...`）。
2. 在项目根目录找到 **`.env.local`**（若没有则从 `env.example` 复制一份），设置：
   - `AI_PROVIDER=deepseek`
   - `AI_MODEL=deepseek-chat`
   - `DEEPSEEK_API_KEY=sk-你的密钥`
3. 保存后重启开发服务。

也可使用豆包、Kimi、OpenAI、Anthropic、Ollama 等，详见项目内 `env.example` 注释或运行 **「切换/修改 API」** 脚本。

---

## 快速开始

### 环境要求

- **Node.js** 20+（推荐 22 LTS）
- **npm** 或 **pnpm**

### 1. 克隆与安装

```bash
git clone https://github.com/你的用户名/ChartAI.git
cd ChartAI
npm install
```

### 2. 配置 API（必做）

- **macOS**：双击 **`set-api.command`**，按提示选择 DeepSeek 并输入 API Key。
- **Windows**：双击 **`set-api.bat`**，用记事本编辑 `.env.local`，填写 `DEEPSEEK_API_KEY=sk-你的密钥` 等，保存退出。

或手动复制环境配置：

```bash
cp env.example .env.local
# 编辑 .env.local，设置 AI_PROVIDER=deepseek 和 DEEPSEEK_API_KEY=sk-...
```

### 3. 启动

- **macOS**：双击 **`start.command`**，或终端执行 `./start.command`。会自动打开浏览器访问 http://localhost:6002。
- **Windows**：双击 **`start.bat`**。会新开一个命令行窗口运行服务，约 8 秒后自动用默认浏览器打开 http://localhost:6002。

或使用命令行：

```bash
npm run dev
```

然后在浏览器打开 **http://localhost:6002**。

---

## 脚本说明

| 脚本 | macOS | Windows | 说明 |
|------|--------|---------|------|
| 一键启动 | `start.command` | `start.bat` | 启动开发服务并打开浏览器；若端口 6002 已被占用则只打开浏览器。 |
| 切换/修改 API | `set-api.command` | `set-api.bat` | macOS 下可交互选择提供商并填写 Key；Windows 下打开 `.env.local` 供编辑。 |

---

## 输入模版（减少生成错误）

复杂描述（如流程清单、多阶段责任与输出）建议先按「输入模版」整理文字，避免 `&`、`<`、`>` 等符号导致 XML 转义错误：

- 应用内：点击输入框旁的 **「下载输入模版」** 图标，下载 `diagram-input-template.md`。
- 按模版中的「避免使用的字符」和「推荐结构」修改内容后再粘贴到输入框，可大幅降低「需要修复 XML 特殊字符转义」类报错。

---

## 技术栈与致谢

- [Next.js](https://nextjs.org/) + [Vercel AI SDK](https://sdk.vercel.ai/) + [react-drawio](https://github.com/react-drawio/react-drawio)
- 上游项目：[Next AI Draw.io](https://github.com/DayuanJiang/next-ai-draw-io)（Apache 2.0）

---

## License

Apache-2.0（与上游一致）
