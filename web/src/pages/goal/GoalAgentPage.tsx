import { startGoal } from "@/services/goal"
import type { Agent } from '@/types/goal'
import { getAccessToken } from "@/utils/token"
import { parseSSE } from "@/utils/util"
import {
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessageLike,
} from "@assistant-ui/react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import GoalAgent from "./GoalAgent"


export default function GoalAgentPage() {
  const { goalId } = useParams()
  const navigate = useNavigate()
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

  return <div className="w-full flex h-full flex-col gap-3 overflow-hidden">
    <div className="min-h-0 flex-1">
      <GoalAgent agent={agent} runtime={runtime} status={status} />
    </div>
  </div>
}
