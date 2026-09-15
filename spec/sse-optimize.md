P0：统一前后端 SSE 基础设施

当前项目存在多个 SSE 实现和多个调用入口：

web/src/utils/sse-client.ts
web/src/hooks/useAIStream.ts
web/src/pages/goal/GoalAgentSession.tsx
web/src/hooks/useAgentSession.ts

请对现有 SSE 链路进行统一重构。

目标

建立唯一的 SSE 基础设施：

Page
  ↓
Hook
  ↓
sse-client
  ↓
FastAPI SSE endpoint

页面和业务 Hook 不允许自行处理 SSE authentication、SSE parsing、JSON.parse 和底层错误。

1. 统一 SSE Client

以 web/src/utils/sse-client.ts 为基础，建立唯一 SSE client。

统一负责：

Authorization
fetch SSE
SSE event parsing
JSON parsing
schema validation
connection error
stream error
abort/cancel

删除或迁移其他地方重复的 SSE 底层实现。

2. 统一事件协议

SSE 只保留以下标准事件：

status
delta
done
plan_ready
error

为每种事件定义 TypeScript 类型，并使用项目现有的 Zod 对事件 data 进行 runtime validation。

不允许业务页面直接 JSON.parse(event.data)。

3. 统一认证

所有 SSE 请求必须经过统一 SSE client 添加 Authorization。

删除 GoalAgentSession.tsx 等页面中的手动 token 注入。

修复 useAgentSession 当前没有 Authorization 的问题。

4. 统一错误处理

HTTP response 开始前发生的错误使用 HTTP status 返回。

SSE stream 开始后发生的异常必须转换成：

event: error
data: {
  code,
  message
}

前端收到 error 后必须进入统一 error state。

禁止只 console.log 后继续运行。

5. delta 消息处理

delta 不得创建新的 assistant message。

一个 assistant response 只创建一个 assistant message：

assistant message
  ↓
delta append
  ↓
delta append
  ↓
delta append
  ↓
done

确保长文本不会因为 delta 数量增加而产生大量 assistant message。

6. Hook 层

useAIStream 和 useAgentSession 可以保留，但只能负责业务状态，不负责底层 SSE 协议。

GoalAgentSession.tsx 不应该直接实现 SSE。

7. 后端

检查所有 SSE endpoint，统一事件格式和异常处理。

不修改 LangGraph Agent 的业务逻辑。

不增加新的 Agent。

不实现 reconnect，除非当前代码已经存在且不会增加本次重构范围。

8. 测试

至少覆盖：

正常 status → delta → done
plan_ready
HTTP 401
stream 中途 error
非法 JSON
非法 event data
abort/cancel
多个 delta 最终只产生一个 assistant message

完成后执行 frontend typecheck/lint/test 和 backend test。

输出：

修改文件
删除的重复 SSE 实现
新 SSE event schema
前后端 SSE 调用链
测试结果