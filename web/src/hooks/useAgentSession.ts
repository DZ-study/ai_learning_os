import { useCallback, useEffect, useRef, useState } from "react"

import i18next from "@/i18n"
import type { AgentMessage, AgentPlan, AgentStage } from "@/types/index"
import { streamSSE } from "@/utils/sse-client"

interface UseAgentSessionReturn {
  messages: AgentMessage[]
  stage: AgentStage
  plan: AgentPlan | null
  sessionId: number | null
  loading: boolean
  error: string | null
  start: () => Promise<void>
  sendMessage: (message: string) => Promise<void>
  abort: () => void
  reset: () => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function useAgentSession(goalId?: number, initialSessionId?: number | null): UseAgentSessionReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [stage, setStage] = useState<AgentStage>("idle")
  const [plan, setPlan] = useState<AgentPlan | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(initialSessionId ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const loadingRef = useRef(false)

  const appendAssistantDelta = useCallback((content: string) => {
    setMessages((previous) => {
      const last = previous[previous.length - 1]
      if (last?.role === "assistant") {
        return [...previous.slice(0, -1), { ...last, content: last.content + content }]
      }
      return [...previous, { role: "assistant", content }]
    })
  }, [])

  const consume = useCallback(
    async (message: string, requestedSessionId: number | null) => {
      if (loadingRef.current) return

      const controller = new AbortController()
      controllerRef.current?.abort()
      controllerRef.current = controller
      loadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        for await (const event of streamSSE({
          url: `/api/goals/${goalId}/agent/messages/stream`,
          body: { session_id: requestedSessionId, message },
          signal: controller.signal,
        })) {
          switch (event.event) {
            case "status":
              if (event.data.stage) setStage(event.data.stage as AgentStage)
              break
            case "delta":
              appendAssistantDelta(event.data.content)
              break
            case "plan_ready":
              setSessionId(event.data.session_id)
              setStage(event.data.stage as AgentStage)
              setPlan(event.data.plan as AgentPlan)
              break
            case "done":
              if (event.data.session_id) setSessionId(event.data.session_id)
              if (event.data.stage) setStage(event.data.stage as AgentStage)
              break
            case "error":
              setError(event.data.message)
              return
          }
        }
      } catch (caught) {
        if (!isAbortError(caught)) {
          setError(caught instanceof Error ? caught.message : i18next.t("error.send_message_failed"))
        }
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
        loadingRef.current = false
        setLoading(false)
      }
    },
    [appendAssistantDelta, goalId],
  )

  const start = useCallback(() => consume("", null), [consume])

  const sendMessage = useCallback(
    (message: string) => {
      const content = message.trim()
      if (!content || loadingRef.current) return Promise.resolve()
      setMessages((previous) => [...previous, { role: "user", content }])
      return consume(content, sessionId)
    },
    [consume, sessionId],
  )

  const abort = useCallback(() => controllerRef.current?.abort(), [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setMessages([])
    setStage("idle")
    setPlan(null)
    setSessionId(null)
    setLoading(false)
    setError(null)
    loadingRef.current = false
  }, [])

  useEffect(() => abort, [abort])

  useEffect(() => {
    setSessionId(initialSessionId ?? null)
  }, [initialSessionId])

  return { messages, stage, plan, sessionId, loading, error, start, sendMessage, abort, reset }
}
