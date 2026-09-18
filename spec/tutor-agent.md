实现 Lesson 内容生成后台。

目标：
用户点击某个 Lesson 后，如果没有 LessonContent，则调用 AI 生成该 Lesson 的学习内容，并保存数据库。

要求：

1. 后端新增 Lesson 内容生成服务。

流程：

GET/POST lesson generate
    ↓
查询 lesson 信息
    ↓
获取：
- lesson title
- lesson description
- learning objectives
- 所属 chapter
- 所属 course
    ↓
调用现有 LLM service
    ↓
生成结构化 LessonContent
    ↓
保存 lesson_content 表
    ↓
返回内容


2. LLM 输出必须使用结构化 JSON。

格式：

{
  "title": "课程标题",
  "blocks": [
    {
      "type": "text",
      "data": {
        "markdown": "..."
      }
    },
    {
      "type": "code",
      "data": {
        "language": "typescript",
        "code": "..."
      }
    },
    {
      "type": "quiz",
      "data": {
        "question": "...",
        "options": [],
        "answer": "..."
      }
    }
  ]
}


3. Prompt 设计：

角色：
你是一名专业导师。

根据课程信息生成一节完整学习内容。

要求：
- 符合 lesson 学习目标
- 由浅入深
- 包含概念解释
- 包含示例
- 包含练习或检查理解的问题
- 内容适合当前学习阶段


4. 增加接口：

1) GET /api/lessons/{lesson_id}/content

功能：

- 根据 lesson_id 查询 LessonContent。

- 如果存在：
返回完整内容：

{
  "id": "",
  "lesson_id": "",
  "title": "",
  "blocks": [],
  "created_at": "",
  "updated_at": ""
}


- 如果不存在：
返回正常业务状态，不报错。

例如：

{
  "content": null,
  "status": "not_generated"
}

2) POST /api/lessons/{lesson_id}/generate-content

逻辑：

如果 lesson_content 已存在：
直接返回已有内容。

如果不存在：
调用 LLM 生成并保存。

5. 注意：

- 使用现有数据库模型和项目代码风格
- 不修改前端
- 不实现 RAG
- 不实现 Agent action
- 不重构已有 Global Agent

完成后输出：
1. 修改文件列表
2. API说明
3. 数据流说明
4. 测试结果