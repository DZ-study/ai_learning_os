# AI Learning Assistant

一个基于大语言模型（LLM）的智能学习助手，帮助用户制定学习目标、生成学习计划、分析学习路径，并通过 AI 对话持续优化学习方案。

项目目标是探索 **AI 应用开发完整流程**，从前端交互、后端服务、LLM 接入，到数据管理与工程化部署，构建一个真实可用的 AI 产品。

---

## ✨ 项目介绍

传统学习规划通常需要用户自行拆解目标、搜索资料、制定计划，过程复杂且难以持续。

AI Learning Assistant 通过接入大语言模型，将用户自然语言需求转换为结构化学习目标，并提供：

* AI 智能分析学习需求
* 自动生成学习目标
* 自动生成阶段学习计划
* AI 对话优化学习路径
* 实时流式输出 AI 思考结果
* 学习目标管理

用户只需要描述：

> "我想三个月掌握 React 并找到前端工作"

AI 会分析目标、拆解任务，并生成可执行的学习计划。

---

# 📸 项目展示

> 项目截图持续更新

---

# 🏗️ 技术架构

```
                  User
                   |
                   |
              React Web App
                   |
                   |
              FastAPI Backend
                   |
        -----------------------
        |                     |
   Business Service       AI Service
        |                     |
        |                LLM Provider
        |
   PostgreSQL Database
```

---

# 🛠️ 技术栈

## 前端

* React 18
* TypeScript
* Vite
* TailwindCSS
* shadcn/ui
* React Query
* React Hook Form
* Zod

主要负责：

* 用户交互
* AI 对话界面
* 流式数据展示
* 表单管理
* 状态管理

## 后端

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Redis

主要负责：

* REST API
* 用户认证
* 数据持久化
* AI 服务封装
* 业务逻辑处理

## AI 技术

* LLM API 接入
* Prompt Engineering
* Streaming Response
* Structured Output
* AI Agent 基础实践

---

# 🚀 核心功能

## 1. AI 学习目标生成

用户输入自然语言目标：

```
我要三个月学会 React，并达到找工作的水平
```

AI 自动分析：

* 学习方向
* 技术栈
* 阶段目标
* 学习周期
* 每周任务

生成结构化数据：

```json
{
  "title": "React高级开发学习计划",
  "duration": "3个月",
  "tasks": [
    "React Hooks深入理解",
    "状态管理学习",
    "性能优化实践"
  ]
}
```

---

## 2. AI 流式对话

采用 Streaming Response 实现类似 ChatGPT 的交互体验。

特点：

* 后端 Async Generator
* 前端实时读取 Stream
* 边生成边展示
* 降低用户等待时间

流程：

```
用户输入
   |
Frontend Fetch Stream
   |
FastAPI StreamingResponse
   |
LLM Token Stream
   |
实时渲染 UI
```

---

## 3. 学习目标管理

支持：

* 创建学习目标
* 编辑目标
* 查看详情
* AI 分析
* 学习计划管理

---

# 🔐 用户认证

实现完整用户认证流程：

* Email 登录
* 验证码认证
* JWT Token
* Refresh Token

认证流程：

```
用户输入邮箱

      ↓

发送验证码

      ↓

验证验证码

      ↓

生成 JWT

      ↓

访问业务接口
```

---

# 📂 项目结构

## Frontend

```
frontend
├── src
│   ├── components
│   ├── features
│   ├── hooks
│   ├── services
│   ├── stores
│   └── pages
```

## Backend

```
backend
├── app
│   ├── api
│   ├── services
│   ├── repositories
│   ├── models
│   ├── schemas
│   └── core
```

采用分层设计：

```
Router
  |
Service
  |
Repository
  |
Database
```

---

# 🧩 工程实践

## 前端

* TypeScript 类型约束
* 组件抽象
* Hooks 封装
* React Query 管理服务状态
* 表单 Schema 校验

## 后端

* FastAPI 依赖注入
* Service Layer 业务隔离
* Repository 数据访问层
* SQLAlchemy ORM
* 异步数据库访问

---

# 📦 本地运行

## 环境要求

* Node.js >= 18
* Python >= 3.11
* PostgreSQL
* Redis

## 前端启动

```bash
cd frontend

pnpm install

pnpm dev
```

## 后端启动

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

# 🗺️ Roadmap

## 已完成

* [x] React + TypeScript 项目搭建
* [x] FastAPI 服务搭建
* [x] PostgreSQL 数据存储
* [x] 用户认证
* [x] LLM 接入
* [x] AI 流式输出

## 计划中

* [ ] AI 自动生成学习目标
* [ ] RAG 知识库
* [ ] AI Agent 工作流
* [ ] 学习资料自动整理
* [ ] 学习进度分析
* [ ] 多模型切换
* [ ] Docker 部署
* [ ] CI/CD

---

# 🎯 项目价值

通过该项目实践：

* 从传统前端开发转向 AI 应用开发
* 掌握 LLM 应用完整开发流程
* 理解 AI 产品从需求到落地过程
* 提升前后端协作和系统设计能力

---

# 👨‍💻 Author

Frontend Engineer

技术方向：

* React / TypeScript
* FastAPI
* AI Application Development
* LLM Engineering
