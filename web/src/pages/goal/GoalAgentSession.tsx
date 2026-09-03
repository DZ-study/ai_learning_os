
import { Button } from "@/components/ui/button"
import type { Agent } from "@/types/goal"
import { streamSSE } from '@/utils/sse-client'
import { getAccessToken } from "@/utils/token"
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessageLike,
} from "@assistant-ui/react"
import { Send, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from "react"

export type TPlan = {
  stage: string
  session_id: number
  plan: Object
}

export default function GoalAgentSession({
  goalId,
  onGetPlan
}: {
  goalId: number | null,
  onGetPlan: (plan: TPlan) => void
}) {
  const [agent, setAgent] = useState<Agent | null>(null)

  const sseOptions = {
    url: `/api/goals/${goalId}/agent/messages/stream`,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    }
  }

  /*
   * 启动 Goal Agent Session
   */
  useEffect(() => {
    if (!goalId) return
    const controller = new AbortController()
    void (async () => {
      try {
        for await (const _chunk of streamSSE({
          ...sseOptions,
          body: {
            session_id: null,
            message: "",
          },
          signal: controller.signal,
        })) {
          const { event, data } = _chunk
          const dataObj = JSON.parse(data)
          if (event === "done" || event === "plan_ready") {
            setAgent((previous) => ({
              session_id: dataObj.session_id ?? previous?.session_id ?? 0,
              stage: dataObj.stage ?? previous?.stage ?? "collecting_info",
              question: dataObj.question ?? previous?.question,
            }))
          }
          if (event === "error") {
            console.log(dataObj.message ?? "流式请求失败")
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.log(error instanceof Error ? error.message : "启动 Agent 失败")
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [goalId])

  const sessionId = agent?.session_id

  /*
   * assistant-ui Adapter
   *
   * assistant-ui 不直接知道我们的 SSE。
   * Adapter 负责把用户消息转换成 SSE 请求，
   * 再把 SSE 数据转换成 assistant-ui 能理解的内容。
   */
  const adapter = useMemo<ChatModelAdapter>(() => {
    if (!goalId || !sessionId) {
      return {
        async *run() {
          yield {
            content: [
              {
                type: "text",
                text: "正在启动…",
              },
            ],
          }
        },
      }
    }

    return {
      async *run({ messages, abortSignal }) {
        const last = messages[messages.length - 1]

        if (!last) return

        const text =
          typeof last.content === "string"
            ? last.content
            : last.content
              .map((part: any) => part.text ?? "")
              .join("")

        for await (const chunk of streamSSE({
          ...sseOptions,
          body: {
            session_id: sessionId,
            message: text,
          },
          signal: abortSignal,
        })) {
          const data = chunk ? JSON.parse(chunk.data) : {}
          if (chunk.event === "plan_ready") {
            onGetPlan(data)
          }
          yield {
            content: [
              {
                type: "text",
                text: data.message || data.question || JSON.stringify(data.plan) || JSON.stringify(data),
              },
            ],
          }
        }
      },
    }
  }, [goalId, sessionId])

  /*
   * Agent 启动后，后端可能已经返回第一条 Agent 消息。
   * 将它作为 assistant-ui 的初始消息。
   */
  const initialMessages = useMemo<ThreadMessageLike[]>(() => {
    return agent
      ? [{
        role: "assistant",
        content: `${agent.message ?? ""}${agent.question ?? ""}`,
      }] : []
  }, [agent])

  const runtime = useLocalRuntime(adapter, {
    initialMessages,
  })

  return (
    <div className="h-full flex-1">
      <AssistantRuntimeProvider key={sessionId ?? "pending"} runtime={runtime}>
        <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col bg-background">
          {/* 消息区域 */}
          <ThreadPrimitive.Viewport className="flex-1 space-y-5 overflow-y-auto px-5 py-7 sm:px-8">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: () => (
                  <MessagePrimitive.Root className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                      <MessagePrimitive.Content />
                    </div>
                  </MessagePrimitive.Root>
                ),
                AssistantMessage: () => (
                  <MessagePrimitive.Root className="flex gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                      <Sparkles size={16} />
                    </div>
                    <div className="max-w-[85%] rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6">
                      <MessagePrimitive.Content unstable_showEmptyOnNonTextEnd={false} />
                    </div>
                  </MessagePrimitive.Root>
                ),
              }}
            />
            <ThreadPrimitive.ScrollToBottom />
          </ThreadPrimitive.Viewport>

          {/* 输入区域 */}
          <ComposerPrimitive.Root className="m-4 flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm sm:m-6">
            <ComposerPrimitive.Input
              autoFocus
              placeholder="输入你的回答…"
              className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
            />

            <ComposerPrimitive.Send asChild>
              <Button
                size="icon"
                aria-label="发送"
              >
                <Send size={16} />
              </Button>
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>

        </ThreadPrimitive.Root>
      </AssistantRuntimeProvider>
    </div>
  )
}
