import AgentSession from '@/components/ai/AgentSession'
import type { Agent } from "@/types/goal"
import {
  useLocalRuntime,
  type AssistantRuntime,
  type ChatModelAdapter,
  type ThreadMessageLike
} from "@assistant-ui/react"
import { ChevronDown, ChevronRight, ListChecks, Sparkles, Target, TrendingUp } from "lucide-react"
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type GoalAgentProps = {
  agent: Agent | null
  runtime: AssistantRuntime
  status: string
}

export function CurrentProgress({ progress = 65 }: { progress?: number }) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold"><TrendingUp className="size-5 text-primary" />{t("agent.progress")}</h2><span className="font-semibold text-primary">{progress}%</span></div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      <p className="text-sm leading-6 text-muted-foreground">{t("agent.progress_description")}</p>
    </section>
  )
}

export function TodayTasks() {
  const { t } = useTranslation()
  const tasks = [
    { label: t("agent.tasks.read_hooks"), done: false },
    { label: t("agent.tasks.refactor_cart"), done: false },
    { label: t("agent.tasks.watch_context"), done: true },
  ]
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><ListChecks className="size-5" />{t("agent.today_tasks")}</h2><div className="space-y-4">{tasks.map((task) => <label key={task.label} className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" defaultChecked={task.done} className="mt-1 size-4 accent-primary" /><span className={task.done ? "text-muted-foreground line-through" : ""}>{task.label}</span></label>)}</div></section>
  )
}

export function GoalPlan() {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><Target className="size-5" />{t("agent.goal_plan")}</h2><div className="space-y-1 text-sm"><div className="flex items-center justify-between border-b py-3 font-medium"><span className="flex items-center gap-2"><ChevronRight className="size-4" />{t("agent.modules.foundation")}</span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{t("agent.modules.completed")}</span></div><div className="border-b py-3"><div className="flex items-center justify-between font-medium"><span className="flex items-center gap-2"><ChevronDown className="size-4" />{t("agent.modules.deep_dive")}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{t("agent.modules.current")}</span></div><ul className="ml-7 mt-3 list-disc space-y-2 text-muted-foreground"><li>{t("agent.modules.hooks")}</li><li>{t("agent.modules.context")}</li><li>{t("agent.modules.performance")}</li></ul></div><div className="flex items-center justify-between py-3 font-medium"><span className="flex items-center gap-2"><ChevronRight className="size-4" />{t("agent.modules.ecosystem")}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{t("agent.modules.upcoming")}</span></div></div></section>
  )
}

export default function GoalAgent() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)

  /*
   * assistant-ui Adapter
   *
   * The assistant-ui adapter bridges our SSE endpoint and the chat runtime.
   */
  const adapter = useMemo<ChatModelAdapter>(() => {
    if (!sessionId) {
      return {
        async *run() {
          yield {
            content: [
              {
                type: "text",
                text: t("agent.starting"),
              },
            ],
          }
        },
      }
    }

    return {
      async *run({ messages }) {
        const last = messages[messages.length - 1]

        yield {
          content: [
            {
              type: "text",
              text: t("agent.start_learning"),
            },
          ],
        }
      },
    }
  }, [sessionId])

  /*
   * The backend may return the first agent message during startup.
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


  return <div className="flex h-full flex-col overflow-hidden border rounded-xl bg-background lg:flex-row">
    <main className="flex min-h-[34rem] min-w-0 flex-1 flex-col border-b lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("agent.tutor")}</h1>
          <p className="text-sm text-muted-foreground">{agent ? status : t("agent.starting_agent")}</p>
        </div>
      </div>
      <AgentSession sessionId={1} agentType='tutor' runtime={runtime} />
    </main>
    <div className="w-full space-y-5 overflow-y-auto bg-muted/20 p-5 lg:w-[23rem] lg:shrink-0">
      <CurrentProgress />
      <TodayTasks />
      <GoalPlan />
    </div>
  </div>
}
