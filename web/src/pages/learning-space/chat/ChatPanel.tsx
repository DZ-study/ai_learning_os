import { Button } from '@/components/ui/button'
import { confirmPlan, getAgentSession, getSpaceNodes } from '@/services/goal'
import { useGoalStore } from '@/stores/goalStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { streamSSE } from '@/utils/sse-client'
import type {
  ChatModelAdapter,
  ThreadMessageLike,
} from '@assistant-ui/react'
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import { ArrowUp, Bot, Check, Maximize2, Minimize2, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

interface AddGoalNavigationState {
  type?: string
  message?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function toThreadMessages(messages: ChatMessage[]): ThreadMessageLike[] {
  return messages.map(({ role, content }) => ({
    role,
    content,
  }))
}

function getTextContent(message: ThreadMessageLike): string {
  if (typeof message.content === 'string') {
    return message.content
  }

  return message.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

type AgentPlan = {
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

function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      className="text-[12px] leading-5 text-[#5f5c62]"
      components={{
        h3: ({ node: _node, ...props }) => (
          <h3 className="mt-3 mb-1.5 text-[13px] font-semibold text-[#4b3f86]" {...props} />
        ),
        p: ({ node: _node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        ul: ({ node: _node, ...props }) => (
          <ul className="mb-2 list-disc space-y-1 pl-4" {...props} />
        ),
        ol: ({ node: _node, ...props }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-4" {...props} />
        ),
        strong: ({ node: _node, ...props }) => (
          <strong className="font-semibold text-[#5c4d95]" {...props} />
        ),
      }}
    />
  )
}

function formatPlan(plan: AgentPlan): string {
  return [
    plan.summary ? `**学习计划**\n\n${plan.summary}` : '',
    ...(plan.milestones ?? []).map((milestone, index) =>
      [
        `### ${index + 1}. ${milestone.title ?? '学习阶段'}`,
        milestone.objective ?? '',
        ...(milestone.tasks ?? []).map(
          (task) =>
            `- **${task.title ?? '学习任务'}**${task.estimated_minutes ? `（预计 ${task.estimated_minutes} 分钟）` : ''}${task.description ? `：${task.description}` : ''
            }`,
        ),
      ]
        .filter(Boolean)
        .join('\n\n'),
    ),
  ]
    .filter(Boolean)
    .join('\n\n')
}

interface ChatPanelProps {
  onMinimize?: () => void
  onMaximize?: () => void
  onRestore?: () => void
  isMaximized?: boolean
  onDragStart?: (event: React.PointerEvent<HTMLElement>) => void
  onDragMove?: (event: React.PointerEvent<HTMLElement>) => void
  onDragEnd?: () => void
}

export default function ChatPanel({
  onMinimize,
  onMaximize,
  onRestore,
  isMaximized = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentSessionId, setAgentSessionId] =
    useState<number | null>(null)
  const [historyLoadedGoalId, setHistoryLoadedGoalId] =
    useState<number | null>(null)
  const [pendingPlan, setPendingPlan] = useState<{
    sessionId: number
    plan: AgentPlan
  } | null>(null)
  const [sessionStage, setSessionStage] = useState('initial')
  const [sessionStatus, setSessionStatus] = useState('pending')
  const [confirmingPlan, setConfirmingPlan] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const navigationState = location.state as AddGoalNavigationState | null
  const initialMessage =
    navigationState?.type === 'add_goal'
      ? navigationState.message?.trim()
      : undefined

  const goal = useGoalStore((state) => state.currentGoal)
  const loadNodes = useWorkspaceStore((state) => state.loadNodes)

  const { t } = useTranslation()

  /**
   * 保留最新 sessionId，避免 adapter 闭包拿到旧值。
   */
  const agentSessionIdRef = useRef<number | null>(null)

  useEffect(() => {
    agentSessionIdRef.current = agentSessionId
  }, [agentSessionId])

  /**
   * 加载当前 goal 的历史会话。
   */
  useEffect(() => {
    if (!goal?.id) {
      setAgentSessionId(null)
      agentSessionIdRef.current = null
      setMessages([])
      setPendingPlan(null)
      return
    }

    let cancelled = false

    setAgentSessionId(null)
    agentSessionIdRef.current = null
    setMessages([])
      setPendingPlan(null)
      setSessionStage('initial')
      setSessionStatus('pending')

    void getAgentSession(goal.id)
      .then(({ data }) => {
        if (cancelled) return

        // 优先读取 agent_messages；兼容尚未执行迁移的旧会话，避免历史消息在
        // ChatPanel 因路由切换重新挂载后暂时显示为空。
        const legacyMessages = Array.isArray(data.context?.messages)
          ? data.context.messages as Array<{
            role: 'user' | 'assistant'
            content: string
            type?: string
            plan?: AgentPlan
          }>
          : []
        const history = data.messages?.length ? data.messages : legacyMessages

        const sessionId = data.session_id || null

        setAgentSessionId(sessionId)
        agentSessionIdRef.current = sessionId
        setSessionStage(data.stage)
        setSessionStatus(data.status)
        const storedPlan = data.context?.pending_plan as AgentPlan | undefined
        setPendingPlan(
          data.stage === 'awaiting_plan_confirmation' || data.stage === 'awaiting_confirmation'
            ? storedPlan ? { sessionId: sessionId!, plan: storedPlan } : null
            : null,
        )

        setMessages(
          history.map((message, index) => ({
            ...message,
            type: ('message_type' in message
              ? message.message_type === 'plan'
              : message.type === 'plan') ? 'plan' : undefined,
            plan: 'metadata' in message ? message.metadata?.plan : message.plan,
            id: `history-${goal.id}-${index}`,
          })),
        )
        setHistoryLoadedGoalId(goal.id)
      })
      .catch(() => {
        if (cancelled) return

        setAgentSessionId(null)
        agentSessionIdRef.current = null
        setMessages([])
        setHistoryLoadedGoalId(goal.id)
      })

    return () => {
      cancelled = true
    }
  }, [goal?.id])

  /**
   * Adapter 保持稳定。
   *
   * sessionId 不直接从闭包读取，而是从 ref 获取，
   * 避免 runtime 因 sessionId 更新而重新创建。
   */
  const adapter = useMemo<ChatModelAdapter>(
    () => ({
      async *run({ messages: threadMessages, abortSignal }) {
        const lastMessage =
          threadMessages[threadMessages.length - 1]

        const message = lastMessage
          ? getTextContent(lastMessage)
          : ''

        if (!message.trim() || !goal?.id) {
          return
        }

        for await (const event of streamSSE({
          url: `/api/goals/${goal.id}/agent/messages/stream`,
          body: {
            session_id: agentSessionIdRef.current,
            message,
          },
          signal: abortSignal,
        })) {
          if (event.event === 'status') {
            yield {
              content: [
                {
                  type: 'reasoning',
                  text: event.data.message,
                },
              ],
            }
          } else if (event.event === 'delta') {
            yield {
              content: [
                {
                  type: 'text',
                  text: event.data.content,
                },
              ],
            }
          } else if (
            event.event === 'done' &&
            event.data.session_id
          ) {
            const sessionId = event.data.session_id

            agentSessionIdRef.current = sessionId
            setAgentSessionId(sessionId)
            setSessionStage(event.data.stage ?? 'collecting_info')
            setSessionStatus('active')
          } else if (event.event === 'plan_ready') {
            const sessionId = event.data.session_id

            agentSessionIdRef.current = sessionId
            setAgentSessionId(sessionId)
            setSessionStage(event.data.stage ?? 'awaiting_plan_confirmation')
            setSessionStatus('active')

            const plan = event.data.plan as AgentPlan

            const content = formatPlan(plan)

            if (content) {
              yield {
                content: [
                  {
                    type: 'text',
                    text: content,
                  },
                ],
              }
            }

            // 计划只是 Preview：持久化与 Canvas 节点由「确认计划」后的后端事务负责。
            setPendingPlan({ sessionId, plan })
          } else if (event.event === 'error') {
            throw new Error(event.data.message)
          }
        }
      },
    }),
    [goal?.id],
  )

  /**
   * 关键：
   *
   * runtime 不再依赖 messages 创建。
   * Composer 的输入状态由 assistant-ui 自己管理。
   */
  const runtime = useLocalRuntime(adapter)

  /**
   * 「确认计划」：后端 confirm_plan 事务持久化后，
   * 重新拉取正式 SpaceNode 刷新 Canvas，不在前端手工拼装节点。
   */
  const handleConfirmPlan = async () => {
    if (!goal?.id || !pendingPlan || confirmingPlan) return
    setConfirmingPlan(true)
    try {
      const { data: confirmation } = await confirmPlan(goal.id, pendingPlan.sessionId)
      const { data } = await getSpaceNodes(goal.id)
      loadNodes(data)
      setPendingPlan(null)
      setSessionStage(confirmation.stage)
      setSessionStatus(confirmation.status)
    } catch (error) {
      console.error('confirm plan failed', error)
      // Re-read the authoritative state so a failed confirmation keeps the button.
      try {
        const { data } = await getAgentSession(goal.id)
        setSessionStage(data.stage)
        setSessionStatus(data.status)
        const storedPlan = data.context?.pending_plan as AgentPlan | undefined
        setPendingPlan(
          data.stage === 'awaiting_plan_confirmation' || data.stage === 'awaiting_confirmation'
            ? storedPlan ? { sessionId: data.session_id, plan: storedPlan } : pendingPlan
            : null,
        )
      } catch (refreshError) {
        console.error('refresh agent session failed', refreshError)
      }
    } finally {
      setConfirmingPlan(false)
    }
  }

  /**
   * 「调整计划」：不新增编辑页面，聚焦输入框，
   * 用户直接说出修改意见，重新进入 Planning Worker。
   */
  const handleModifyPlan = () => {
    document
      .querySelector<HTMLTextAreaElement>('.chat-panel textarea')
      ?.focus()
  }

  /**
   * 后端历史加载完成后，同步 thread。
   *
   * 这里只在 messages 发生变化时 reset，
   * 不再用 historyVersion + Provider key 强制重建整个 runtime。
   */
  const previousGoalIdRef = useRef<number | null>(null)

  useEffect(() => {
    const goalId = goal?.id ?? null
    if (previousGoalIdRef.current !== goalId) {
      previousGoalIdRef.current = goalId
      runtime.thread.reset(toThreadMessages(messages))
      return
    }
    runtime.thread.reset(toThreadMessages(messages))
  }, [messages, goal?.id, runtime])

  /**
   * 从首页创建目标后跳转过来时，自动把首条消息发给 Agent，
   * 让新目标的对话立即开始。历史加载完成后才发送，且只发送一次。
   */
  const historyLoaded =
    goal?.id != null && historyLoadedGoalId === goal.id
  const autoSentRef = useRef<string | null>(null)

  useEffect(() => {
    if (!historyLoaded || !initialMessage || !goal?.id) return

    const sendKey = `${goal.id}:${initialMessage}`
    if (autoSentRef.current === sendKey) return
    autoSentRef.current = sendKey

    navigate(location.pathname, { replace: true, state: null })
    runtime.thread.append(initialMessage)
  }, [historyLoaded, initialMessage, goal?.id, navigate, location.pathname, runtime])

  return (
    <aside className="chat-panel flex h-full min-h-0 flex-col">
      <header
        className="flex h-[66px] shrink-0 touch-none cursor-grab select-none items-center justify-between border-b border-[#ebe8e5] px-4 active:cursor-grabbing"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#eef0ff] text-[#6d62c1]">
            <Bot className="size-4" />
          </div>

          <div>
            <div className="text-sm font-semibold text-[#30384d]">
              {t('chat.assistant')}
            </div>

            <div className="flex items-center gap-1 text-[10px] text-[#a19da1]">
              <span className="size-1.5 rounded-full bg-[#72b28b]" />
              {t('chat.workspace_agent')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={isMaximized ? t('chat.restore') : t('chat.maximize')}
            title={isMaximized ? t('chat.restore') : t('chat.maximize')}
            onClick={isMaximized ? onRestore : onMaximize}
          >
            {isMaximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('chat.minimize')}
            title={t('chat.minimize')}
            onClick={onMinimize}
          >
            <Minimize2 className="size-3.5" />
          </Button>
        </div>
      </header>

      <AssistantRuntimeProvider
        runtime={runtime}
      >
        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport className="chat-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: () => (
                  <MessagePrimitive.Root className="flex justify-end">
                    <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-[#f2effb] px-3.5 py-2.5 text-[12px] leading-5 text-[#5c4d95]">
                      <MessagePrimitive.Content />
                    </div>
                  </MessagePrimitive.Root>
                ),

                AssistantMessage: () => (
                  <MessagePrimitive.Root className="flex gap-2">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[#f1efff] text-[#7867cf]">
                      <Sparkles className="size-3" />
                    </div>

                    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-[#f6f5f3] px-3.5 py-2.5 text-[12px] leading-5 text-[#5f5c62]">
                      <MessagePrimitive.Parts
                        components={{
                          Text: MarkdownText,
                          Reasoning: ({ text }) => (
                            <div className="mb-2 whitespace-pre-wrap rounded-lg border border-[#e6e1f5] bg-[#f3f0fc] px-2.5 py-2 text-[11px] leading-4 text-[#8176a8]">
                              <div className="mb-1 font-medium text-[#6f649b]">
                                思考过程
                              </div>
                              {text}
                            </div>
                          ),
                        }}
                      />
                    </div>
                  </MessagePrimitive.Root>
                ),
              }}
            />

            <ThreadPrimitive.ScrollToBottom />
          </ThreadPrimitive.Viewport>

          {pendingPlan &&
            (sessionStage === 'awaiting_plan_confirmation' || sessionStage === 'awaiting_confirmation') &&
            sessionStatus !== 'completed' && sessionStatus !== 'confirmed' && (
            <div className="shrink-0 border-t border-[#ebe8e5] bg-[#fbfaf9] px-3 py-2.5">
              <div className="mb-2 text-[11px] leading-4 text-[#8176a8]">
                {t('agent.plan_ready')}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={handleModifyPlan}
                >
                  {t('agent.modify_plan')}
                </Button>
                <Button
                  size="sm"
                  className="cursor-pointer"
                  disabled={confirmingPlan}
                  onClick={() => void handleConfirmPlan()}
                >
                  {t('agent.confirm_plan')}
                </Button>
              </div>
            </div>
          )}

          <div className="shrink-0 border-t border-[#ebe8e5] bg-[#fbfaf9] p-3">
            <ComposerPrimitive.Root className="rounded-xl border border-[#e0dcda] bg-white p-2 shadow-[0_2px_8px_rgba(34,32,42,0.03)] focus-within:border-[#a99be1]">
              <ComposerPrimitive.Input
                autoFocus
                submitMode="enter"
                placeholder={t('chat.input_placeholder')}
                className="min-h-[54px] w-full resize-none border-0 p-1 text-xs leading-5 shadow-none outline-none"
              />

              <div className="flex items-center justify-end pt-1">
                <span className="mr-2 text-[10px] text-[#9d999d]">
                  {t('chat.enter_send')}
                </span>

                <ComposerPrimitive.Send asChild>
                  <Button
                    size="icon-sm"
                    className="size-7 rounded-lg bg-[#28334f] text-white hover:bg-[#374363]"
                    aria-label={t('common.send')}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                </ComposerPrimitive.Send>
              </div>
            </ComposerPrimitive.Root>

            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#aaa5a7]">
              <Check className="size-3 text-[#72aa88]" />
              {t('chat.current_space_only')}
            </div>
          </div>
        </ThreadPrimitive.Root>
      </AssistantRuntimeProvider>
    </aside>
  )
}
