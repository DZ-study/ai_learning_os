import AgentSession from '@/components/ai/AgentSession'
import type { Agent } from "@/types/goal"
import {
  type AssistantRuntime
} from "@assistant-ui/react"
import { ChevronDown, ChevronRight, ListChecks, Sparkles, Target, TrendingUp } from "lucide-react"

type GoalAgentProps = {
  agent: Agent | null
  runtime: AssistantRuntime
  status: string
}

export function CurrentProgress({ progress = 65 }: { progress?: number }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold"><TrendingUp className="size-5 text-primary" />当前目标进度</h2><span className="font-semibold text-primary">{progress}%</span></div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      <p className="text-sm leading-6 text-muted-foreground">你正在稳步掌握 React。最近对组件生命周期的专注学习巩固了你的理解，下一项重要里程碑是状态管理。</p>
    </section>
  )
}

export function TodayTasks() {
  const tasks = [
    { label: "阅读 React 文档：自定义 Hooks", done: false },
    { label: "编码 2 小时：重构购物车组件", done: false },
    { label: "观看教程：Context API 与 Redux", done: true },
  ]
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><ListChecks className="size-5" />今日任务</h2><div className="space-y-4">{tasks.map((task) => <label key={task.label} className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" defaultChecked={task.done} className="mt-1 size-4 accent-primary" /><span className={task.done ? "text-muted-foreground line-through" : ""}>{task.label}</span></label>)}</div></section>
  )
}

export function GoalPlan() {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><Target className="size-5" />目标计划</h2><div className="space-y-1 text-sm"><div className="flex items-center justify-between border-b py-3 font-medium"><span className="flex items-center gap-2"><ChevronRight className="size-4" />模块 1：基础</span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">已完成</span></div><div className="border-b py-3"><div className="flex items-center justify-between font-medium"><span className="flex items-center gap-2"><ChevronDown className="size-4" />模块 2：深入学习</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">当前</span></div><ul className="ml-7 mt-3 list-disc space-y-2 text-muted-foreground"><li>深入理解 Hooks</li><li>Context API</li><li>性能优化</li></ul></div><div className="flex items-center justify-between py-3 font-medium"><span className="flex items-center gap-2"><ChevronRight className="size-4" />模块 3：生态</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">即将开始</span></div></div></section>
  )
}

export default function GoalAgent({ agent, runtime, status }: GoalAgentProps) {
  return <div className="flex h-full flex-col overflow-hidden border rounded-xl bg-background lg:flex-row">
    <main className="flex min-h-[34rem] min-w-0 flex-1 flex-col border-b lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">目标规划 Agent</h1>
          <p className="text-sm text-muted-foreground">{agent ? status : "正在启动 Agent…"}</p>
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
