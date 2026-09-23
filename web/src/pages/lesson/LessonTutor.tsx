import { ArrowUp, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { streamSSE } from '@/utils/sse-client'

interface TutorMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface LessonTutorProps {
  lessonId: number
  currentBlockId?: string
}

const MAX_HISTORY_MESSAGES = 20

export default function LessonTutor({ lessonId, currentBlockId }: LessonTutorProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    abortRef.current?.abort()
    setMessages([])
    setMessage('')
    setError(null)
    setIsStreaming(false)
  }, [lessonId])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = message.trim()
    if (!content || isStreaming) return

    const userMessage: TutorMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
    }
    const assistantId = `${Date.now()}-assistant`
    const nextMessages = [...messages, userMessage]
    const history = nextMessages.slice(-MAX_HISTORY_MESSAGES).map(({ role, content: text }) => ({
      role,
      content: text,
    }))

    setMessages([
      ...nextMessages,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setMessage('')
    setError(null)
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      for await (const event of streamSSE({
        url: `/api/lessons/${lessonId}/tutor/stream`,
        body: {
          current_block_id: currentBlockId ?? null,
          messages: history,
        },
        signal: controller.signal,
      })) {
        if (event.event === 'delta') {
          setMessages((current) => current.map((item) => (
            item.id === assistantId
              ? { ...item, content: item.content + event.data.content }
              : item
          )))
        }
        if (event.event === 'error') {
          throw new Error(event.data.message)
        }
      }
    } catch (streamError) {
      if (!controller.signal.aborted) {
        setError(
          streamError instanceof Error
            ? streamError.message
            : 'Tutor 回答失败，请稍后重试',
        )
        setMessages((current) => current.filter((item) => item.id !== assistantId))
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setIsStreaming(false)
    }
  }, [currentBlockId, isStreaming, lessonId, message, messages])

  return (
    <div className="mx-auto flex h-[280px] min-h-0 w-full max-w-3xl shrink-0 flex-col border-t bg-background px-8 py-4">
      {messages.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                {item.role === 'user' ? '你' : 'AI Tutor'}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {item.content || (isStreaming ? '正在思考…' : '')}
              </p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-auto flex shrink-0 items-end gap-2 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur"
      >
        <Sparkles className="mb-2 ml-2 size-4 shrink-0 text-amber-500" />
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={messages.length > 0 ? '继续问当前内容...' : '对当前内容有疑问？可以问我'}
          className="min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
          rows={1}
          disabled={isStreaming}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!message.trim() || isStreaming}
          aria-label="发送问题"
          className="mb-0.5 size-8 shrink-0 rounded-full"
        >
          <ArrowUp className="size-4" />
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
