import { parseSSE } from "@/utils/util"
import { useCallback, useRef, useState } from "react"

type AIStreamOptions = {
  url: string
  body: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  onEvent?: (type: string, data: any) => void
}

type Plan = {
  summary?: string
  milestones?: Array<{
    title?: string
    objective?: string
    tasks?: Array<{
      title?: string
      description?: string
      estimated_minutes?: number
    }>
  }>
}

function formatPlan(plan: Plan | undefined): string {
  if (!plan) return ""

  const milestones = (plan.milestones ?? [])
    .map((milestone, index) => {
      const tasks = (milestone.tasks ?? [])
        .map(
          (task) =>
            `- **${task.title ?? "未命名任务"}**：${task.description ?? ""}（${task.estimated_minutes ?? 0}分钟）`,
        )
        .join("\n")

      return [
        `### ${index + 1}. ${milestone.title ?? "未命名阶段"}`,
        milestone.objective ?? "",
        tasks,
      ].join("\n\n")
    })
    .join("\n\n")

  return [plan.summary ? `**学习计划**\n\n${plan.summary}` : "", milestones]
    .filter(Boolean)
    .join("\n\n")
}

const useAIStream = () => {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [stage, setStage] = useState<string | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const stream = useCallback(
    async function* ({
      url,
      body,
      headers,
      signal,
      onEvent,
    }: AIStreamOptions): AsyncGenerator<string, void, unknown> {
      controllerRef.current?.abort()

      const controller = new AbortController()
      controllerRef.current = controller

      const forwardAbort = () => controller.abort()
      signal?.addEventListener("abort", forwardAbort, { once: true })

      setContent("")
      setError(null)
      setStatus("")
      setPlan(null)
      setLoading(true)

      let buffer = ""
      let pendingText = ""
      let serverError: Error | null = null

      const handleEvent = (type: string, data: any) => {
        onEvent?.(type, data)

        if (type === "status") {
          setStatus(data.message ?? "")
          return
        }

        if (type === "delta") {
          pendingText += data.content ?? ""
          return
        }

        if (type === "plan_ready") {
          setStage(data.stage ?? "awaiting_plan_confirmation")
          setPlan(data.plan ?? null)
          pendingText += formatPlan(data.plan)
          setStatus("计划已生成，等待确认")
          return
        }

        if (type === "done") {
          setStage(data.stage ?? null)
          setStatus("等待你的回答")
          return
        }

        if (type === "error") {
          serverError = new Error(data.message ?? "流式请求失败")
          setError(serverError.message)
        }

      }

      const flushPendingText = async function* () {
        if (!pendingText) return

        const chunk = pendingText
        pendingText = ""
        setContent((previous) => previous + chunk)
        yield chunk
      }

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          const message = await response.text().catch(() => "")
          throw new Error(message || `流式请求失败（${response.status}）`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()

          if (value) {
            buffer += decoder.decode(value, { stream: true })
            buffer = parseSSE(buffer, handleEvent)

            if (serverError) throw serverError

            yield* flushPendingText()
          }

          if (done) break
        }

        buffer += decoder.decode()
        if (buffer.trim()) {
          parseSSE(`${buffer}\n\n`, handleEvent)
        }

        if (serverError) throw serverError
        yield* flushPendingText()
      } catch (exception) {
        if (exception instanceof DOMException && exception.name === "AbortError") {
          return
        }

        const message =
          exception instanceof Error ? exception.message : "流式请求失败"
        setError(message)
        throw exception
      } finally {
        signal?.removeEventListener("abort", forwardAbort)
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
        setLoading(false)
      }
    },
    [],
  )

  return {
    stream,
    abort,
    content,
    loading,
    error,
    status,
    stage,
    plan,
  }
}

export default useAIStream
