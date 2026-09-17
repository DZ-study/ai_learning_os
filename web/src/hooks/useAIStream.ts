import { useCallback, useRef, useState } from "react"

import { streamSSE, type SSEEvent } from "@/utils/sse-client"
import i18next from "@/i18n"

type AIStreamOptions = {
  url: string
  body: unknown
  signal?: AbortSignal
  onEvent?: (event: SSEEvent) => void
}

type PlanTask = {
  title?: string
  description?: string
  estimated_minutes?: number
}

type PlanMilestone = {
  title?: string
  objective?: string
  tasks?: PlanTask[]
}

type Plan = {
  summary?: string
  milestones?: PlanMilestone[]
}

const formatPlan = (plan: Plan | null): string => {
  if (!plan) return ""

  const milestones = (plan.milestones ?? [])
    .map((milestone, index) => {
      const tasks = (milestone.tasks ?? [])
        .map(
          (task) =>
            `- **${task.title ?? i18next.t("agent.unnamed_task", { defaultValue: "Unnamed task" })}**: ${task.description ?? ""} (${task.estimated_minutes ?? 0} min)`,
        )
        .join("\n")

      return [
        `### ${index + 1}. ${milestone.title ?? i18next.t("agent.unnamed_stage", { defaultValue: "Unnamed stage" })}`,
        milestone.objective ?? "",
        tasks,
      ].join("\n\n")
    })
    .join("\n\n")

  return [plan.summary ? `**${i18next.t("goal.generate_plan")}**\n\n${plan.summary}` : "", milestones]
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

  const abort = useCallback(() => controllerRef.current?.abort(), [])

  const stream = useCallback(
    async function* ({ url, body, signal, onEvent }: AIStreamOptions): AsyncGenerator<string> {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const forwardAbort = () => controller.abort()
      signal?.addEventListener("abort", forwardAbort, { once: true })

      setContent("")
      setError(null)
      setStatus("")
      setStage(null)
      setPlan(null)
      setLoading(true)

      try {
        for await (const event of streamSSE({ url, body, signal: controller.signal })) {
          onEvent?.(event)
          let text = ""
          switch (event.event) {
            case "status":
              setStatus(event.data.message)
              if (event.data.stage) setStage(event.data.stage)
              break
            case "delta":
              text = event.data.content
              break
            case "plan_ready":
              setStage(event.data.stage)
              setPlan(event.data.plan as Plan)
              setStatus(i18next.t("agent.plan_ready"))
              text = formatPlan(event.data.plan)
              break
            case "done":
              if (event.data.stage) setStage(event.data.stage)
              break
            case "error":
              setError(event.data.message)
              return
          }

          if (text) {
            setContent((previous) => previous + text)
            yield text
          }
        }
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          const message = caught instanceof Error ? caught.message : i18next.t("error.stream_failed")
          setError(message)
          throw caught
        }
      } finally {
        signal?.removeEventListener("abort", forwardAbort)
        if (controllerRef.current === controller) controllerRef.current = null
        setLoading(false)
      }
    },
    [],
  )

  return { stream, abort, content, loading, error, status, stage, plan }
}

export default useAIStream
