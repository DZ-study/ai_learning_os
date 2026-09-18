1. 模块概述
模块名：Orchestrator（全局控制器）
定位：系统唯一入口，接收所有用户输入，解析意图，分发任务给对应 Worker，汇总结果返回前端。
核心原则：控制器本身不处理业务逻辑，只负责“路由”。

2. 输入 / 输出定义
输入（前端发给后端）：

json
{
  "user_input": "帮我加一节英语口语课",
  "context": {
    "goal_id": "goal_123",
    "current_course_id": "course_456",
    "current_cards": [
      {"id": "card_1", "type": "slide", "title": "自我介绍"},
      {"id": "card_2", "type": "question", "title": "数一数"}
    ]
  }
}
输出（后端返回给前端）：

json
{
  "reply": "已为你生成英语口语课程",
  "intent": {
    "action": "generate_course",
    "params": {"course_name": "英语口语"}
  },
  "changes": [
    {"action": "add", "target": "course", "id": "course_789", "title": "英语口语"}
  ],
  "options": [],
  "tool_calls": [
    {"tool": "generate_course", "status": "success"}
  ]
}
3. 意图解析规则
支持的意图（Action）清单：

generate_course：生成新课程

add_chapter：生成章节内容

delete_card：删除画布上的卡片

ask_clarification：意图不明确时，返回选项询问用户

Prompt 规则：

你是一个任务路由器。根据用户输入和当前画布状态，判断意图，只返回 JSON。如果意图不明确（比如“删除图片”但有多张图片），返回 ask_clarification，并列出 2-4 个候选选项。

4. 工具列表
工具名	入参	出参	说明
generate_course	{course_name}	{course_id, title, chapters}	生成课程大纲
add_chapter	{course_id, chapter_name}	{cards: [...]}	生成章节内容（Slide/Question）
delete_card	{card_id}	{success: true}	删除指定卡片
ask_clarification	{question, options}	{options: [...]}	返回给前端渲染选项
5. 状态管理
每次操作记录一条 batch 日志，包含 batch_id、操作类型、影响的卡片 ID。

前端根据 changes 显示“N canvas changes”，并提供撤销入口。

撤销时，根据 batch_id 回滚到操作前的状态。

6. 错误处理
LLM 返回格式错误 → 重试 1 次

工具调用失败 → 返回 {"error": "操作失败，请重试"}

超时 → 返回 {"error": "服务暂时不可用"}