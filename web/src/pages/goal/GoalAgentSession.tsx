import { Button } from "@/components/ui/button"
import { useAgentSession } from "@/hooks/useAgentSession"
import type { AgentStage } from "@/types/index"
import { Send, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type TPlan = {
  stage: string
  session_id: number
  plan: Record<string, unknown>
}

const stageLabels: Record<AgentStage, string> = {
  idle: "agent.stage.idle",
  analyzing: "agent.stage.analyzing",
  collecting_info: "agent.stage.collecting_info",
  awaiting_plan_confirmation: "agent.stage.awaiting_plan_confirmation",
}

export default function GoalAgentSession({
  goalId,
  onGetPlan,
}: {
  goalId: number | null
  onGetPlan: (plan: TPlan) => void
}) {
  const [draft, setDraft] = useState("")
  const { t } = useTranslation()
  const session = useAgentSession(goalId ?? 0)
  const { start } = session

  useEffect(() => {
    if (goalId) void start()
  }, [goalId, start])

  useEffect(() => {
    if (session.plan && session.sessionId) {
      onGetPlan({
        stage: session.stage,
        session_id: session.sessionId,
        plan: session.plan,
      })
    }
  }, [onGetPlan, session.plan, session.sessionId, session.stage])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.trim() || session.loading) return
    const message = draft
    setDraft("")
    await session.sendMessage(message)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles size={16} />
        </div>
        <div>
          <p className="font-medium">{t("agent.planning")}</p>
          <p className="text-xs text-muted-foreground">{t(stageLabels[session.stage])}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {session.messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[82%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-2xl border bg-card px-4 py-3 text-sm leading-6"
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        {session.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {session.error}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="m-4 flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={session.loading || !goalId}
          placeholder={t("agent.input_placeholder")}
          className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
          rows={2}
        />
        <Button type="submit" size="icon" aria-label={t("common.send")} disabled={session.loading || !draft.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}
