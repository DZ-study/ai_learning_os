import { Button } from "@/components/ui/button"
import { startGoal } from "@/services/goal"
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
import { ArrowLeft, Send, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

type Agent = { session_id: string; stage: string; message?: string; question?: string }

function parseSSE(buffer: string, onEvent: (type: string, data: any) => void) {
  buffer = buffer.replace(/\r\n/g, "\n")
  const blocks = buffer.split("\n\n")
  const remaining = blocks.pop() ?? ""
  for (const block of blocks) {
    const type = block.match(/^event:\s*(.+)$/m)?.[1]
    const data = block.match(/^data:\s*(.+)$/m)?.[1]
    if (type && data) { try { onEvent(type, JSON.parse(data)) } catch { /* wait for next complete event */ } }
  }
  return remaining
}

function GoalThread() {
  return <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
    <ThreadPrimitive.Viewport className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
      <ThreadPrimitive.Messages components={{
        UserMessage: () => <MessagePrimitive.Root className="flex justify-end"><div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"><MessagePrimitive.Content /></div></MessagePrimitive.Root>,
        AssistantMessage: () => <MessagePrimitive.Root className="flex gap-3"><div className="mt-1 rounded-full bg-primary/10 p-2 text-primary"><Sparkles size={16} /></div><div className="max-w-[85%] rounded-2xl bg-muted px-4 py-3 text-sm"><MessagePrimitive.Content /></div></MessagePrimitive.Root>,
      }} />
      <ThreadPrimitive.ScrollToBottom />
    </ThreadPrimitive.Viewport>
    <ComposerPrimitive.Root className="m-4 flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm sm:m-6">
      <ComposerPrimitive.Input autoFocus placeholder="输入你的回答…" className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none" />
      <ComposerPrimitive.Send asChild><Button size="icon" aria-label="发送"><Send size={16} /></Button></ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  </ThreadPrimitive.Root>
}

export default function GoalAgentPage() {
  const { goalId } = useParams(); const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [status, setStatus] = useState("正在启动 Agent…")

  useEffect(() => {
    if (!goalId) return;
    startGoal(Number(goalId)).then(({ data }) => {
      setAgent(data); setStatus("等待你的回答")
    })
  }, [goalId])

  const adapter = useMemo<ChatModelAdapter | null>(() => {
    if (!agent || !goalId) return null
    return {
      async *run({ messages, abortSignal }) {
        const last = messages[messages.length - 1]
        const text = typeof last.content === "string" ? last.content : last.content.map((part: any) => part.text ?? "").join("")
        const response = await fetch(`/api/goals/${goalId}/agent/messages/stream`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` }, body: JSON.stringify({ session_id: agent.session_id, message: text }), signal: abortSignal })
        if (!response.ok || !response.body) throw new Error("Agent 请求失败")
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let content = ""
        while (true) {
          const { done, value } = await reader.read(); if (done) break
          buffer += decoder.decode(value, { stream: true })
          buffer = parseSSE(buffer, (type, data) => { if (type === "status") setStatus(data.message); if (type === "delta") content += data.content; if (type === "done" || type === "plan_ready") { setAgent((old) => old ? { ...old, stage: data.stage } : old); setStatus(type === "plan_ready" ? "计划已生成，等待确认" : "等待你的回答") } if (type === "error") setStatus(data.message) })
          yield { content: [{ type: "text", text: content }] }
        }
          if (content) yield { content: [{ type: "text", text: content }] }
      },
    }
  }, [agent, goalId])

  const initialMessages = useMemo<ThreadMessageLike[]>(() => agent ? [{ role: "assistant", content: `${agent.message ?? ""}\n\n${agent.question ?? ""}` }] : [], [agent])
  const runtime = useLocalRuntime(adapter ?? { async *run() { yield { content: [{ type: "text", text: "正在启动…" }] } } }, { initialMessages })

  return <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
    <div className="mb-4 flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => navigate("/goals")}><ArrowLeft /></Button><div><h1 className="text-2xl font-bold">目标规划 Agent</h1><p className="text-sm text-muted-foreground">{status}</p></div></div>
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl border shadow-sm"><AssistantRuntimeProvider runtime={runtime}><GoalThread /></AssistantRuntimeProvider></div>
  </div>
}
