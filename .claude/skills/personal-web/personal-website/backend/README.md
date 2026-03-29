# DeepSeek API 代理服务

为冷冰个人网站提供安全的DeepSeek API代理服务，保护API密钥不暴露在前端。

## 功能

- 安全的API密钥管理（后端存储）
- 统一的聊天接口
- 系统提示词管理
- 错误处理和降级机制
- CORS配置

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的DeepSeek API密钥：

```
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

### 3. 启动服务

开发模式（使用nodemon自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

## API接口

### 健康检查
```
GET /api/health
```

### 聊天接口
```
POST /api/chat
Content-Type: application/json

{
  "message": "用户的问题"
}
```

响应：
```json
{
  "success": true,
  "response": "AI回复内容",
  "model": "deepseek-chat",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

## 系统提示词

服务使用预定义的系统提示词，确保AI以冷冰的数字分身身份回答。提示词包含：

- 个人基本信息
- 职业和擅长领域
- 回答风格要求
- 对话指导原则

提示词可在 `server.js` 中的 `SYSTEM_PROMPT` 变量修改。

## 错误处理

- API密钥无效：返回401错误
- 请求频率过高：返回429错误
- 网络问题：返回500错误
- 所有错误都有友好的错误消息

## 安全说明

1. **API密钥保护**：密钥仅在后端服务中使用，不暴露给前端
2. **CORS配置**：仅允许指定的前端域名访问
3. **输入验证**：对用户输入进行基本验证
4. **错误信息过滤**：生产环境不返回详细错误信息

## 部署建议

### 本地开发
1. 启动后端服务：`npm run dev`
2. 启动前端服务：在 `personal-website` 目录运行 `python -m http.server 8000`
3. 访问 `http://localhost:8000`

### 生产部署
1. 设置 `NODE_ENV=production`
2. 使用PM2或Docker部署
3. 配置HTTPS证书
4. 设置防火墙规则

## 故障排除

### 服务无法启动
- 检查Node.js版本（需要16+）
- 检查端口3000是否被占用
- 检查依赖是否安装完整

### API调用失败
- 检查API密钥是否正确
- 检查网络连接
- 查看控制台日志

### CORS错误
- 检查前端访问地址是否在CORS白名单中
- 检查浏览器控制台错误信息

## 许可证

MIT