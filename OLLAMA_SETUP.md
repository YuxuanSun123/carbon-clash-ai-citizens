# Ollama 本地部署 DeepSeek 指南

本指南将帮助你使用 Ollama 在本地部署 DeepSeek 模型，并将其集成到游戏中。

## 1. 安装 Ollama

### Windows
1. 访问 [Ollama 官网](https://ollama.ai/)
2. 下载 Windows 版本的安装包
3. 运行安装程序并按照提示完成安装

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 2. 下载 DeepSeek 模型

安装完成后，在终端中运行以下命令下载 DeepSeek 模型：

```bash
# 下载 DeepSeek R1 1.5B 模型（推荐，体积较小）
ollama pull deepseek-r1:1.5b

# 或者下载完整版本（体积较大，性能更好）
ollama pull deepseek-r1:7b
```

## 3. 启动 Ollama 服务

```bash
ollama serve
```

服务将在 `http://localhost:11434` 启动。

## 4. 配置游戏

1. 复制 `.env.example` 文件为 `.env`
2. 在 `.env` 文件中使用以下配置：

```env
# Ollama 本地部署配置
VITE_DEEPSEEK_API_URL=http://localhost:11434/v1/chat/completions
VITE_DEEPSEEK_MODEL=deepseek-r1:1.5b
VITE_DEEPSEEK_API_KEY=
```

注意：
- `VITE_DEEPSEEK_API_KEY` 可以留空，Ollama 不需要 API 密钥
- 如果你下载的是其他版本的模型，请相应修改 `VITE_DEEPSEEK_MODEL`

## 5. 测试连接

启动游戏开发服务器：

```bash
npm run dev
```

在游戏中触发 AI 行动，查看浏览器控制台的日志。你应该能看到类似以下的输出：

```
🚀 开始调用AI API...
🔗 API地址: http://localhost:11434/v1/chat/completions
🤖 使用模型: deepseek-r1:1.5b
✅ API响应成功
```

## 6. 故障排除

### 连接失败
- 确保 Ollama 服务正在运行：`ollama serve`
- 检查端口是否被占用
- 确认模型已正确下载：`ollama list`

### 模型响应慢
- 考虑使用更小的模型（如 1.5b 版本）
- 确保你的硬件配置足够（建议至少 8GB RAM）

### API 格式错误
- 确认 Ollama 版本支持 OpenAI 兼容的 API 格式
- 检查 API URL 是否正确

## 7. 优势

使用 Ollama 本地部署的优势：
- **隐私保护**：数据不会发送到外部服务器
- **无需付费**：不需要购买 API 调用次数
- **低延迟**：本地处理，响应更快
- **离线使用**：无需网络连接

## 8. 模型选择建议

| 模型 | 大小 | 内存需求 | 性能 | 推荐场景 |
|------|------|----------|------|----------|
| deepseek-r1:1.5b | ~1GB | 4GB+ | 良好 | 轻量级使用，快速响应 |
| deepseek-r1:7b | ~4GB | 8GB+ | 优秀 | 高质量对话，更好的推理 |
| deepseek-r1:32b | ~18GB | 32GB+ | 卓越 | 专业级应用，最佳性能 |

根据你的硬件配置选择合适的模型版本。