// 数字分身聊天功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const suggestedButtons = document.querySelectorAll('.suggested-btn');

    // 后端API配置 - 动态使用当前主机名，便于局域网访问
    const API_BASE_URL = `http://${window.location.hostname}:3000/api`;
    const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;
    const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;

    // 本地知识库：作为后端不可用时的备用
    const knowledgeBase = {
        '你现在在做什么？': '我最近在搭建自己的个人主页，整理作品集，同时也在学习如何更好地应用AI工具来提升内容创作的效率和质量。',
        '你有哪些作品？': '我主要专注于内容策划和AI应用领域，目前有几个代表性作品：1) AI内容创作指南 - 帮助创作者用AI工具提升效率；2) 知识整理方法论 - 系统化的知识管理工作流；3) 个人品牌搭建案例 - 从0到1的内容策略。你可以在左侧的"作品展示"区域看到更多细节。',
        '怎么联系你？': '你可以通过以下方式联系我：<br>1. <strong>GitHub</strong>: <a href="https://github.com/reyihyou" target="_blank">github.com/reyihyou</a><br>2. <strong>Email</strong>: <a href="mailto:71547214@qq.com">71547214@qq.com</a><br>3. <strong>QQ</strong>: <a href="https://wpa.qq.com/msgrd?v=3&uin=71547214&site=qq&menu=yes" target="_blank">71547214</a><br><br>我通常会在1-2个工作日内回复。',
        '你是谁？': '我是冷冰的数字分身。冷冰是一个正在学习用AI做产品的内容策划，擅长内容表达、AI应用和知识整理。',
        '你的职业是什么？': '我是一名内容策划，专注于将复杂的信息转化为易懂的内容，并探索AI在内容创作中的应用。',
        '你擅长什么？': '我擅长内容表达、AI应用和知识整理。特别喜欢把复杂问题讲成人话，让专业知识更容易被理解。',
        '你的兴趣是什么？': '我对AI应用、写作和旅行都很感兴趣。喜欢探索新技术如何改变内容创作的方式。',
        '你最近在忙什么？': '最近在搭建这个个人主页，整理过去的作品集，同时也在研究最新的AI内容创作工具。',
        '你有什么特点？': '我最大的特点就是喜欢把复杂问题讲成人话，让专业知识变得通俗易懂。',
        '你能帮我什么？': '我可以回答关于冷冰的各种问题，包括他的工作、作品、兴趣和联系方式。',
        '这个网站是你做的吗？': '是的，这个个人主页是我（冷冰）设计搭建的，目的是展示个人信息和作品，同时提供一个数字分身聊天的体验。',
        '网站用了什么技术？': '这个网站使用了HTML5、CSS3和JavaScript，没有依赖任何框架，确保快速加载和良好兼容性。',
        '网站设计有什么特点？': '设计风格追求简约、清爽，带有科技感。使用了深蓝色和白色的配色方案，并且完全响应式，在各种设备上都能良好显示。',
        'default': '这是一个好问题！不过我的知识主要聚焦在冷冰的个人信息和工作方面。你可以问我关于他工作、作品、兴趣或联系方式的问题。试试问："你现在在做什么？"或"你有哪些作品？"'
    };

    // 添加消息到聊天窗口
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

        const time = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
            <div class="message-time">${time}</div>
        `;

        chatMessages.appendChild(messageDiv);
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 如果是用户消息，稍后调用AI回复
        if (isUser) {
            setTimeout(() => {
                getAIResponse(text);
            }, 500);
        }
    }

    // 显示加载状态
    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        loadingDiv.id = 'loading-message';

        loadingDiv.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-spinner fa-spin"></i> 思考中...</p>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 隐藏加载状态
    function hideLoading() {
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }

    // 显示错误消息
    function showError(message) {
        hideLoading();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message error-message';

        errorDiv.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-exclamation-triangle"></i> ${message}</p>
                <p class="error-hint">将使用本地知识库回答...</p>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 调用DeepSeek API获取AI回复
    async function getAIResponse(question) {
        // 先显示加载状态
        showLoading();

        try {
            const response = await fetch(CHAT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: question })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP错误 ${response.status}`);
            }

            if (data.success && data.response) {
                // 成功获取AI回复
                hideLoading();
                displayResponse(data.response);
            } else {
                throw new Error(data.error || '未知错误');
            }

        } catch (error) {
            console.error('调用AI服务失败:', error);

            // 显示错误信息
            showError(`抱歉，AI服务暂时不可用: ${error.message}`);

            // 使用本地知识库作为备用
            setTimeout(() => {
                hideLoading();
                getLocalResponse(question);
            }, 1000);
        }
    }

    // 使用本地知识库回复
    function getLocalResponse(question) {
        let response = knowledgeBase[question];

        if (!response) {
            // 尝试模糊匹配
            const lowerQuestion = question.toLowerCase();
            for (const key in knowledgeBase) {
                if (key !== 'default' && lowerQuestion.includes(key.toLowerCase())) {
                    response = knowledgeBase[key];
                    break;
                }
            }

            // 如果还是没找到，使用默认回复
            if (!response) {
                response = knowledgeBase['default'];
            }
        }

        displayResponse(response);
    }

    // 显示回复（带打字机效果）
    function displayResponse(response) {
        hideLoading();

        let index = 0;
        const typingSpeed = 20; // 毫秒每字符
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message bot-message';

        const time = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        responseDiv.innerHTML = `
            <div class="message-content">
                <p id="typing-text"></p>
            </div>
            <div class="message-time">${time}</div>
        `;

        chatMessages.appendChild(responseDiv);

        const typingText = document.getElementById('typing-text');

        function typeWriter() {
            if (index < response.length) {
                typingText.innerHTML += response.charAt(index);
                index++;
                setTimeout(typeWriter, typingSpeed);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // 移除旧元素的id（防止重复）
        typingText.removeAttribute('id');
        responseDiv.querySelector('.message-content p').id = 'typing-text';

        setTimeout(typeWriter, 300);
    }

    // 检查后端服务是否可用
    async function checkBackendHealth() {
        try {
            const response = await fetch(HEALTH_ENDPOINT, { timeout: 3000 });
            return response.ok;
        } catch (error) {
            console.warn('后端服务不可用，将使用本地知识库:', error.message);
            return false;
        }
    }

    // 发送消息
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            addMessage(text, true);
            messageInput.value = '';
            messageInput.focus();
        }
    }

    // 事件监听
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 建议问题按钮
    suggestedButtons.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            addMessage(question, true);
        });
    });

    // 页面加载后检查后端状态并显示问候语
    async function initializeChat() {
        const isBackendAlive = await checkBackendHealth();

        const greetings = [
            '你好！我是冷冰的数字分身。有什么想了解的吗？',
            '欢迎来到我的个人主页！我是冷冰的数字分身，可以回答关于我的问题。',
            '嗨！我可以告诉你关于冷冰的工作、作品和兴趣。试试问我问题吧！'
        ];

        // 添加问候语
        setTimeout(() => {
            let greeting = greetings[Math.floor(Math.random() * greetings.length)];

            if (!isBackendAlive) {
                greeting += ' (当前使用本地知识库模式)';
            }

            addMessage(greeting);
        }, 1000);

        // 在控制台显示状态
        console.log(`后端服务状态: ${isBackendAlive ? '✅ 已连接' : '⚠️ 未连接，使用本地模式'}`);
    }

    // 初始化聊天
    initializeChat();

    // 自动聚焦输入框
    messageInput.focus();

    // 添加一些交互效果
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 5px 15px rgba(30, 58, 138, 0.1)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl+/ 或 Cmd+/ 聚焦输入框
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            messageInput.focus();
        }

        // Esc 清空输入框
        if (e.key === 'Escape') {
            messageInput.value = '';
        }
    });

    // 初始化聊天区域高度
    function adjustChatHeight() {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const windowHeight = window.innerHeight;
        const chatSection = document.querySelector('.chat-container');

        if (windowHeight - headerHeight > 600) {
            chatSection.style.height = '600px';
        } else {
            chatSection.style.height = (windowHeight - headerHeight - 100) + 'px';
        }
    }

    // 窗口大小改变时调整
    window.addEventListener('resize', adjustChatHeight);
    // 初始调整
    setTimeout(adjustChatHeight, 100);
});