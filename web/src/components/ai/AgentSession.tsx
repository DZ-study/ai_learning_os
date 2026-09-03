import { Button } from '@/components/ui/button'
import { AssistantRuntimeProvider, ComposerPrimitive, MessagePrimitive, ThreadPrimitive, type AssistantRuntime } from '@assistant-ui/react'
import { Send, Sparkles } from 'lucide-react'
import type { Component } from 'react'

type AgentType = "goal_planning" | "tutor"

interface AgentSessionProps {
  sessionId: number
  agentType: AgentType
  stage?: string,
  renderMessage?: () => Component
  runtime: AssistantRuntime
}

function AgentSession({
  sessionId,
  agentType,
  renderMessage,
  stage,
  runtime,
}: AgentSessionProps) {

  const canConfirmPlan =
    stage === "awaiting_plan_confirmation"

  return (
    <div className="min-h-0 flex-1">
      <AssistantRuntimeProvider runtime={runtime}>
        <ThreadPrimitive.Root className="flex min-h-0 h-full flex-col bg-background">
          <ThreadPrimitive.Viewport className="flex-1 space-y-5 overflow-y-auto px-5 py-7 sm:px-8">
            <ThreadPrimitive.Messages components={{
              UserMessage: () => (
                <MessagePrimitive.Root className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"><MessagePrimitive.Content /></div>
                </MessagePrimitive.Root>
              ),
              AssistantMessage: () => (
                <MessagePrimitive.Root className="flex gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary"><Sparkles size={16} /></div>
                  <div className="max-w-[85%] rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6">
                    <MessagePrimitive.Content />
                  </div>
                </MessagePrimitive.Root>
              ),
            }} />
            {canConfirmPlan && <div className="flex justify-end"><Button size="lg" className="cursor-pointer">确认计划</Button></div>}
            <ThreadPrimitive.ScrollToBottom />
          </ThreadPrimitive.Viewport>
          <ComposerPrimitive.Root className="m-4 flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm sm:m-6">
            <ComposerPrimitive.Input autoFocus placeholder="输入你的回答…" className="min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none" />
            <ComposerPrimitive.Send asChild><Button size="icon" aria-label="发送"><Send size={16} /></Button></ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </AssistantRuntimeProvider>
    </div>
  )
}


export default AgentSession