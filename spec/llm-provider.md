### 1. 功能目标
#### 1.1 背景
系统需要接入大语言模型能力，例如：

AI 学习目标解析
AI 学习计划生成
AI 助手对话
AI 内容生成

为了避免业务代码直接依赖具体模型厂商，需要设计统一的大模型接入层。

### 2. 设计原则
#### 2.1 业务层禁止直接调用模型SDK
业务代码不能知道项目接入的是什么模型：
OpenAI
DeepSeek
Claude
Gemini

#### 2.2 统一模型接口
业务层调用：
```python
llm.generate()
```

eg.
```python
result = await llm.generate(messages=[{"role": "user", "content": "帮我制定学习计划"}])
```

### 3. 架构设计
                    Business Layer
                         |
                         |
                    LLM Service
                         |
                         |
                 LLM Provider Interface
                         |
        --------------------------------
        |              |               |
 OpenAIProvider  DeepSeekProvider  ClaudeProvider
        |              |               |
 OpenAI SDK      DeepSeek API     Anthropic SDK

### 4. 目录设计
app/

├── infrastructure/
│    ai/
|    │   ├── __init__.py
|    │
|    │   ├── client.py
|    │   │
|    │   ├── config.py
|    │   │
|    │   ├── providers/
|    │   │
|    │   │   ├── base.py
|    │   │   ├── openai.py
|    │   │   ├── deepseek.py
|    │   │   └── claude.py
|    │   │
|    │   ├── schemas.py
|    │   │
|    │   └── exceptions.py
|    |   |        
|    |   └─ service.py

### 5. 核心接口设计
#### 5.1 Base Provider
文件：
ai/providers/base.py
职责：
定义所有模型必须实现的方法
接口：

#### 5.2 LLM Client
文件：
ai/client.py
职责：
- 提供统一调用入口
- 管理Provider

支持流式生成

#### 5.3 业务调用
文件：
ai/services/learning_plan.py

### 6. 异步要求

所有模型调用必须基于 async/await。
禁止同步阻塞调用。
Provider接口：
async generate()
async stream()
原因：
- 避免阻塞 FastAPI event loop
- 支持高并发请求


### 7. 使用场景
#### 学习目标解析

输入：
用户自然语言目标

输出：
结构化学习目标数据


#### 学习计划生成

输入：
学习目标

输出：
阶段计划


### 8. 验收标准

- 修改配置即可切换模型
- Service层无需修改代码
- 新增模型只需增加 Provider

#### 9. Prompt管理

Prompt不允许散落在业务代码。
统一管理：
ai/prompts/
├── learning_goal.yaml
├── learning_plan.yaml
└── assistant.yaml
Prompt负责：
系统提示词
输出格式要求
任务描述




