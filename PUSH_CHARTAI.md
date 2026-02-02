# 推送到新仓库 ChartAI

按以下步骤将当前项目推送到你的 GitHub 新仓库 **ChartAI**。

## 1. 在 GitHub 上新建仓库

1. 打开 [GitHub 新建仓库](https://github.com/new)。
2. **Repository name** 填写：`ChartAI`。
3. 选择 **Public**，**不要**勾选 “Add a README file”。
4. 点击 **Create repository**。

## 2. 本地准备（可选：用 ChartAI 的 README 作为主 README）

若希望新仓库首页显示 ChartAI 说明（含 DeepSeek API 提醒），可先替换 README：

```bash
cd /Users/bupoo/Github/next-ai-draw-io
mv README.md README-upstream.md
mv README-ChartAI.md README.md
git add README.md README-upstream.md
git commit -m "docs: use ChartAI README with DeepSeek API reminder"
```

（若保留原 README 也可，ChartAI 说明在 `README-ChartAI.md`。）

## 3. 添加远程并推送

将 `YOUR_USERNAME` 替换为你的 GitHub 用户名：

```bash
git remote add chartai https://github.com/YOUR_USERNAME/ChartAI.git
git branch -M main
git push -u chartai main
```

若当前分支是 `master`：

```bash
git remote add chartai https://github.com/YOUR_USERNAME/ChartAI.git
git push -u chartai master
```

## 4. 确认新仓库内容

打开 `https://github.com/YOUR_USERNAME/ChartAI`，确认包含：

- `README.md`（ChartAI 说明与 DeepSeek API 提醒）
- `start.command` / `start.bat`（macOS / Windows 一键启动）
- `set-api.command` / `set-api.bat`（切换/设置 API）
- `diagram-input-template.md`（输入模版，在 `public/` 下）
- 其余项目文件

之后克隆 ChartAI 时使用：

```bash
git clone https://github.com/YOUR_USERNAME/ChartAI.git
```
