# AI Learning OS

> 基于 LLM + Agent + Learning Workflow 构建的 AI 学习目标达成系统。

AI Learning OS 是一个面向自主学习场景的 AI 学习系统。

它不是简单的 AI Chat 或“一次性生成课程”，而是围绕用户的长期学习目标，建立：

**目标规划 → 学习计划 → 课程生成 → 学习执行 → 测验反馈 → 进度跟踪 → 动态调整 → 复习巩固**

的完整学习闭环。

```text
学习目标
   ↓
Goal Planning Agent
   ↓
结构化学习计划
   ↓
Course / Chapter / Lesson
   ↓
Tutor Agent
   ↓
结构化学习内容
   ↓
学习 / 提问 / 测验
   ↓
学习状态与反馈
   ↓
Review / Plan Adjustment
```

---

## ✨ 核心能力

### 🎯 1. 目标驱动的学习规划

用户首先输入一个学习目标，例如：

```text
目标：三个月掌握 React
基础：有 JavaScript 开发经验
时间：每天 1 小时
偏好：希望通过项目实战学习
```

系统不会立即生成一份固定课程，而是由 **Goal Planning Agent** 判断当前信息是否足够。

```text
Goal
 ↓
Evaluate Information
 ↓
Missing Information?
 ├── Yes → Ask Question
 └── No  → Generate Plan
```

如果缺少关键学习信息，Agent 会继续追问。

信息充分后生成结构化 `StudyPlan`，并等待用户确认。

只有用户确认计划后，系统才会真正创建学习计划、章节和 Lesson。

---

## 🧠 2. 双层 Agent 编排架构

系统没有将所有 AI 能力堆进一个大型 Agent，而是采用：

**Orchestrator + Domain Worker**

的双层编排架构。

```text
User / Application Event
          │
          ▼
     Orchestrator
          │
     Decision Engine
          │
        Policy
          │
      Dispatcher
          │
   ┌──────┼────────┐
   ▼      ▼        ▼
Planning Tutor    Review
Worker   Worker   Worker
```

### Orchestrator

负责全局任务判断和 Worker 调度。

当前定义的 Action：

```text
DELEGATE
WAIT_USER
RESUME
COMPLETE
RETRY
FAIL
```

### Worker

负责具体领域中的推理任务，例如：

* `GoalPlanningWorker`
* `TutorWorker`
* `ReviewWorker`

### Tool / Service

负责确定性的业务操作，例如：

* 创建学习计划
* 查询 Lesson
* 保存 LessonContent
* 更新学习状态
* 查询学习资料

通过这种方式，将：

**AI 推理能力**

与

**确定性业务能力**

进行分离。

---

# 🗺 Goal Planning Agent

Goal Planning Agent 负责将模糊的学习目标转化为结构化学习计划。

当前规划流程基于 LangGraph：

```text
evaluate_info
      ↓
evaluate_missing
   ↙        ↘
ask_question   generate_plan
     ↓             ↓
evaluate_info     END
```

主要职责：

* 收集用户学习目标
* 判断信息完整度
* 多轮追问缺失信息
* 生成结构化 StudyPlan
* 等待用户确认
* 确认后持久化正式学习计划

---

# 📚 分层学习数据模型

学习计划不是以一整段 JSON 保存，而是转换为真实的分层业务实体。

```text
Goal
 └── GoalPlan
      └── GoalPlanItem / Chapter
           └── LearningTask / Lesson
                └── LessonContent
```

分别表示：

```text
Goal
学习目标

GoalPlan
当前目标对应的学习计划

GoalPlanItem
计划阶段 / Chapter

LearningTask
具体 Lesson

LessonContent
Tutor 为 Lesson 生成的学习内容
```

这种设计使系统可以进一步支持：

* Lesson 独立学习
* Lesson 状态跟踪
* 学习进度计算
* Quiz / Question 交互
* Tutor 学习反馈
* 动态调整后续计划
* Review Agent
* 学习数据分析

---

# 🎓 Tutor Agent

Tutor Worker 负责具体 Lesson 的教学内容生成。

Tutor 不直接读取 Goal Planning Agent 的全部聊天记录，而是使用经过裁剪的 Lesson Context：

```text
Goal Summary
      +
Plan Summary
      +
Current Chapter
      +
Current Lesson
      +
Learning Context
        ↓
    Tutor Worker
        ↓
Structured Lesson Content
```

这样可以避免将大量无关信息传入模型，减少：

* Context Pollution
* Token 消耗
* Worker 间隐式耦合

同时提高 Agent 行为的可测试性和稳定性。

---

## 🧩 结构化 Lesson Content

Tutor 不会直接生成一整篇 Markdown。

每个 Lesson 由多个有序 Block 组成：

```text
Lesson
 ├── explanation
 ├── example
 ├── explanation
 ├── code
 ├── question
 ├── explanation
 ├── quiz
 ├── quiz
 └── summary
```

当前支持：

```text
explanation   知识讲解
example       示例
code          代码
question      学习过程中的互动问题
quiz          可判定结果的知识测验
summary       本节总结
```

同一种 Block 可以出现多次。

例如一个复杂知识点可以：

```text
讲解
 ↓
示例
 ↓
进一步讲解
 ↓
代码
 ↓
互动问题
 ↓
补充讲解
 ↓
测验
 ↓
测验
 ↓
总结
```

Tutor 会根据：

* Lesson Objective
* 用户当前水平
* Lesson 难度
* Estimated Minutes
* 当前学习上下文

动态决定 Block 的类型、数量和教学顺序，而不是使用固定课程模板。

Block 示例：

```json
{
  "type": "code",
  "title": "创建第一个 React Component",
  "content": {
    "language": "tsx",
    "code": "function App() { ... }"
  },
  "order": 4
}
```

其中：

**LLM 负责决定“教什么、怎么教、先教什么”；应用程序负责 ID、order、状态等确定性数据。**

---

# 📖 学习状态

LessonContent 和用户学习状态是两个不同概念。

```text
LessonContent
系统生成了什么内容

Learning Progress
用户实际学习到了哪里
```

Lesson 生命周期：

```text
pending
   ↓
in_progress
   ↓
completed
```

计划记录：

```text
status
started_at
completed_at
current_block
```

后续将结合 Question / Quiz 的答题数据计算学习掌握度。

Goal 总体进度可以根据 Lesson 完成情况计算：

```text
已完成 Lesson
────────────── × 100%
全部 Lesson
```

---

# 🖥 Learning Space

每一个 Goal 都对应一个独立的学习空间。

整体采用三栏布局：

```text
┌────────────┬───────────────────────────┬──────────────┐
│            │                           │              │
│ Navigation │      Learning Canvas      │     Chat     │
│            │                           │              │
│   Goals    │ Course / Note / Document  │   AI Tutor   │
│            │                           │              │
└────────────┴───────────────────────────┴──────────────┘
```

学习空间中的资源统一抽象为：

```text
SpaceNode
 ├── course
 ├── note
 └── document
```

当前 Course 来源于 Goal Planning Agent 生成并经用户确认的学习计划。

后续可以继续加入：

* 用户笔记
* PDF
* 学习文档
* RAG Knowledge Base
* AI 生成资料

---

# 💬 AI Chat

Learning Space 右侧保留长期 AI Chat。

Chat 不只是普通的 LLM 问答入口，而是整个 Agent System 的自然语言交互入口。

例如：

```text
“这个知识点我还是没理解，再解释一次。”

“根据我刚才做错的题再出两道题。”

“后面的 React 源码部分太难了，调整一下计划。”

“我今天只有 20 分钟，帮我调整今天的学习内容。”

“根据我上传的 PDF 给我讲这一节。”
```

Orchestrator 根据用户意图，将任务路由到对应 Worker / Tool。

---

# 🔐 Authentication

系统支持邮箱验证码免注册登录。

```text
Email
 ↓
Send OTP
 ↓
Redis Rate Limit
 ↓
Verify OTP
 ↓
Create / Load User
 ↓
JWT
```

当前实现：

* Email OTP
* 首次登录自动创建用户
* JWT Access / Refresh Token
* Redis 验证码缓存
* 60 秒发送冷却
* 每日发送次数限制

---

# ⚡ SSE 流式交互

Agent Chat 使用 SSE（Server-Sent Events）完成流式通信。

当前事件包括：

```text
status
answer
plan
error
```

对于 Lesson 内容生成，由于最终结果采用 Structured Output，因此不需要将整个 JSON 逐 Token 输出。

可以通过状态事件表达生成过程：

```text
loading_context
      ↓
generating
      ↓
content_ready
      ↓
done
```

---

# 🏗 系统架构

```text
                     ┌──────────────────┐
                     │      React       │
                     │  Learning Space  │
                     └────────┬─────────┘
                              │
                           HTTP/SSE
                              │
                     ┌────────▼─────────┐
                     │     FastAPI      │
                     └────────┬─────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
          Application Service       Agent System
                 │                         │
                 │                  ┌──────▼──────┐
                 │                  │Orchestrator │
                 │                  └──────┬──────┘
                 │                         │
                 │                    Dispatcher
                 │                         │
                 │             ┌───────────┼───────────┐
                 │             │           │           │
                 │          Planning     Tutor       Review
                 │          Worker       Worker      Worker
                 │             │           │           │
                 │             └───────────┼───────────┘
                 │                         │
                 │                    Tool Layer
                 │                         │
                 └──────────────┬──────────┘
                                │
                         Domain Services
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                PostgreSQL    Redis       LLM
```

---

# 🛠 技术栈

## Frontend

* React 18
* TypeScript
* Vite
* React Router
* TanStack Query
* Zustand
* Assistant UI
* Tailwind CSS
* shadcn/ui
* dnd-kit
* Resizable Panels
* eventsource-parser

## Backend

* Python
* FastAPI
* SQLAlchemy 2.x Async
* Pydantic v2
* Alembic
* PostgreSQL
* Redis
* JWT
* SSE

## AI / Agent

* LangChain
* LangGraph
* Structured Output
* Agent Orchestrator
* Worker / Tool Architecture
* Context Isolation
* LLM Decision Engine

## Infrastructure

* Docker
* Docker Compose
* PostgreSQL 16
* Redis 7
* GitHub Actions

---

# 📂 项目结构

```text
ai-learn-os
├── web
│   └── src
│       ├── components
│       ├── pages
│       │   ├── learning-space
│       │   └── lesson
│       ├── services
│       ├── stores
│       ├── types
│       └── utils
│
└── server
    └── app
        ├── infrastructure
        │   └── ai
        │
        ├── modules
        │   ├── agents
        │   │   ├── orchestrator
        │   │   ├── registry
        │   │   ├── session
        │   │   ├── tools
        │   │   └── workflow
        │   │       ├── goal_planning
        │   │       ├── tutor
        │   │       └── review
        │   │
        │   ├── goals
        │   ├── lessons
        │   ├── nodes
        │   └── users
        │
        └── shared
```

---

# 💡 核心设计原则

## 1. LLM 处理不确定性，代码处理确定性

LLM 负责：

```text
应该教什么？
应该如何解释？
使用什么案例？
应该先讲什么？
下一步应该问什么？
```

应用程序负责：

```text
ID
order
权限
事务
状态流转
数据持久化
进度计算
```

避免让 LLM 承担可以通过普通程序稳定完成的工作。

---

## 2. Context Isolation

不同 Worker 只获取当前任务真正需要的上下文。

例如 Tutor Worker 不直接获取 Goal Planning Agent 的全部历史消息，而是使用裁剪后的 Lesson Context。

目标是降低：

* Token 消耗
* 上下文污染
* Agent 间耦合
* 不相关历史信息对模型决策的干扰

---

## 3. Worker 与 Tool 分离

Worker 负责：

**思考、判断、生成、决策。**

例如：

```text
GoalPlanningWorker
TutorWorker
ReviewWorker
```

Tool / Service 负责：

**执行确定性业务操作。**

例如：

```text
Create Plan
Read Lesson
Save LessonContent
Update Lesson Status
Search Knowledge
```

Worker 可以决定调用某项能力，但 Tool 本身不承担 Agent 推理职责。

---

# 🚧 当前进度

## 已完成 / 已接入

* [x] 邮箱 OTP 登录
* [x] JWT Authentication
* [x] Redis 限流
* [x] Goal 管理
* [x] Goal Planning Agent
* [x] 多轮信息收集
* [x] LangGraph 规划 Workflow
* [x] Structured StudyPlan
* [x] 用户确认学习计划
* [x] 学习计划分层持久化
* [x] Goal / Plan / Chapter / Lesson 数据模型
* [x] Learning Space
* [x] SpaceNode
* [x] Agent Session
* [x] SSE Chat
* [x] Global Orchestrator
* [x] LLM Decision Engine
* [x] Agent Registry / Dispatcher
* [x] Worker / Tool 分层
* [x] Tutor Worker 基础能力
* [x] Structured LessonContent
* [x] 多 Block Lesson 内容生成
* [x] LessonContent 持久化
* [x] 已生成内容复用

## 正在开发

* [ ] Lesson 学习状态
* [ ] Lesson 学习进度
* [ ] 前端真实 LessonContent 联调
* [ ] Question / Quiz 交互
* [ ] Tutor 答题反馈
* [ ] Goal Progress

## 后续规划

* [ ] Tutor 上下文对话
* [ ] 学习掌握度评估
* [ ] 根据学习表现动态调整计划
* [ ] Review Agent
* [ ] Spaced Repetition
* [ ] RAG
* [ ] 用户资料上传
* [ ] Knowledge Base
* [ ] Notes
* [ ] Learning Analytics
* [ ] 云端部署
* [ ] CI/CD

---

# 🗓 Roadmap

## Phase 1：学习规划

```text
Goal
 → Multi-turn Planning
 → StudyPlan
 → Confirmation
 → Persistence
```

**状态：已完成**

---

## Phase 2：学习执行

```text
Lesson
 → Tutor
 → Structured Content
 → Learning
 → Quiz
 → Feedback
 → Progress
```

**状态：开发中**

---

## Phase 3：自适应学习

```text
Learning Result
 → Mastery Evaluation
 → Detect Weakness
 → Adjust Future Lessons
 → Update Plan
```

**状态：规划中**

---

## Phase 4：知识库与复习

```text
Documents
 → Chunking
 → Embedding
 → Retrieval
 → Tutor
```

以及：

```text
Learning History
 → Review Agent
 → Quiz
 → Spaced Repetition
```

**状态：规划中**

---

# 🌱 项目目标

传统 AI 学习产品通常停留在：

```text
用户
 ↓
Chat
 ↓
LLM
 ↓
回答
```

AI Learning OS 希望进一步建立一个长期运行的学习系统：

```text
Goal
 ↓
Plan
 ↓
Learn
 ↓
Practice
 ↓
Evaluate
 ↓
Adapt
 ↓
Review
 ↓
Goal Completion
```

系统关注的不只是：

> **“如何回答用户当前的问题？”**

而是：

> **“如何持续帮助用户完成一个长期学习目标？”**
