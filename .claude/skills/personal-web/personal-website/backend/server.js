const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-027898d4a90d43749536196da8ae7a89'; // 从环境变量读取，本地开发可使用默认值

// 系统提示词 - 定义数字分身角色
const SYSTEM_PROMPT = `你是冷冰的数字分身。请以第一人称回答关于冷冰的问题。

关于冷冰：
- 名字：冷冰
- 职业：内容策划
- 一句话介绍：一个正在学习用 AI 做产品的内容策划
- 近期工作：搭建自己的个人主页，整理作品集
- 擅长领域：内容表达、AI 应用、知识整理
- 兴趣：AI 应用、写作、旅行
- 个人特点：喜欢把复杂问题讲成人话

回答要求：
1. 以第一人称回答，比如"我最近在..."、"我擅长..."
2. 保持友好、专业、自然的语气
3. 如果问到联系方式，请引导用户查看页面顶部的社交媒体链接
4. 如果问到作品，请简要介绍并建议查看左侧的作品展示区
5. 如果问到技术问题，可以适当解释但不要过于技术化
6. 对于不了解的问题，可以礼貌地表示无法回答，并建议问其他相关问题

请根据以上信息回答用户的问题。`;

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'DeepSeek聊天代理服务运行正常', timestamp: new Date().toISOString() });
});

// 聊天端点
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: '消息内容不能为空' });
        }

        console.log(`收到用户消息: ${message.substring(0, 50)}...`);

        // 构建请求到DeepSeek API
        const requestData = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            stream: false,
            max_tokens: 500,
            temperature: 0.7
        };

        const response = await axios.post(DEEPSEEK_API_URL, requestData, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30秒超时
        });

        const aiResponse = response.data.choices[0].message.content;

        console.log(`AI回复完成，长度: ${aiResponse.length}字符`);

        res.json({
            success: true,
            response: aiResponse,
            model: response.data.model,
            usage: response.data.usage
        });

    } catch (error) {
        console.error('调用DeepSeek API失败:', error.message);

        let errorMessage = '抱歉，聊天服务暂时不可用，请稍后重试。';
        let statusCode = 500;

        if (error.response) {
            // DeepSeek API返回的错误
            console.error('API响应错误:', error.response.status, error.response.data);
            statusCode = error.response.status;

            if (error.response.status === 401) {
                errorMessage = 'API密钥验证失败，请检查配置。';
            } else if (error.response.status === 429) {
                errorMessage = '请求过于频繁，请稍后重试。';
            } else if (error.response.data && error.response.data.error) {
                errorMessage = `API错误: ${error.response.data.error.message || '未知错误'}`;
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            console.error('请求超时或网络错误:', error.request);
            errorMessage = '网络连接超时，请检查网络连接。';
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📡 聊天API端点: http://localhost:${PORT}/api/chat`);
    console.log(`🔧 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🔐 API密钥配置: ${DEEPSEEK_API_KEY ? '已配置' : '未配置，使用默认值'}`);
    console.log(`⚠️  注意：请确保前端页面与后端服务在同一个域名下，或配置正确的CORS`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('接收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('接收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});