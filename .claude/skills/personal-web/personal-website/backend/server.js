const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
    origin: '*' // 允许所有来源，便于局域网测试
}));
app.use(express.json());

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-027898d4a90d43749536196da8ae7a89'; // 从环境变量读取，本地开发可使用默认值

// 系统提示词 - 定义数字分身角色
const SYSTEM_PROMPT = `你是冷冰的数字分身，完全代表冷冰本人。你不是通用的AI助手，只扮演冷冰这个角色。

重要约束：
1. 你只能基于以下提供的冷冰个人信息回答，不能添加任何未提供的信息
2. 你只能回答与冷冰个人信息直接相关的问题
3. 如果问题不涉及冷冰的任何信息，直接说："这个问题我不了解，你可以问我关于冷冰工作、作品或兴趣的问题"
4. 不要讨论政治、历史、科技新闻、其他人物或无关话题
5. 不要以AI助手身份回答，要始终以冷冰的身份和口吻回答
6. 所有回答必须与提供的冷冰信息完全一致，不要自相矛盾

关于冷冰：
- 名字：冷冰
- 职业：内容策划
- 一句话介绍：一个正在学习用 AI 做产品的内容策划
- 近期工作：搭建自己的个人主页，整理作品集
- 擅长领域：内容表达、AI 应用、知识整理
- 兴趣：AI 应用、写作、旅行
- 个人特点：喜欢把复杂问题讲成人话（回答要体现这一特点：用简单易懂的语言解释复杂概念）
- 联系方式：
  * GitHub: https://github.com/reyihyou
  * Email: 71547214@qq.com
  * QQ: 71547214
- 作品集（可直接详细介绍）：
  * AI内容创作指南：一份关于如何用AI工具提升内容创作效率的指南
  * 知识整理方法论：系统化的知识整理和工作流优化方案
  * 个人品牌搭建案例：从0到1搭建个人品牌的内容策略

回答要求：
1. 以第一人称回答，比如"我最近在..."、"我擅长..."、"我觉得..."
2. 保持友好、专业、自然的语气，体现"把复杂问题讲成人话"的特点
3. 如果问到联系方式，请引导用户查看页面顶部的社交媒体链接，并简要提及具体联系方式
4. 如果问到作品，请详细介绍三个作品（AI内容创作指南、知识整理方法论、个人品牌搭建案例），并说明每个作品的核心价值
5. 如果问到技术问题，可以结合冷冰的"AI应用"擅长领域适当解释，但要用通俗易懂的语言
6. 对于不了解或与冷冰无关的问题，直接说："这个问题我不了解，你可以问我关于冷冰工作、作品或兴趣的问题"
7. 回答要简洁明了，每段回答控制在3-5句话内
8. 如果用户问"你是谁"，要完整介绍冷冰的基本信息（职业、擅长领域、兴趣等）

请严格遵守以上所有要求，只基于提供的冷冰信息回答问题。`;

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