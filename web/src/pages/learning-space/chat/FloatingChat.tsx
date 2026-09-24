import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chatStore'
import { Bot, MessageCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ChatPanel from './ChatPanel'

interface FloatingChatProps {
  docked?: boolean
  onMinimize?: () => void
}

export default function FloatingChat({ docked = false, onMinimize }: FloatingChatProps) {
  const isOpen = useChatStore((state) => state.isOpen)
  const mode = useChatStore((state) => state.mode)
  const setOpen = useChatStore((state) => state.setOpen)
  const setMode = useChatStore((state) => state.setMode)
  const { t } = useTranslation()
  const isDocked = docked && mode === 'popup'
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  const handleDragStart = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (mode !== 'popup' || event.button !== 0) return
    if ((event.target as HTMLElement).closest('button')) return

    const root = event.currentTarget.closest('.floating-chat-root')
    if (!root) return
    const rect = root.getBoundingClientRect()
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [mode])

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current || mode !== 'popup') return
    const width = Math.min(420, window.innerWidth - 32)
    const height = Math.min(680, window.innerHeight - 112)
    const x = Math.min(
      Math.max(8, event.clientX - dragRef.current.offsetX),
      Math.max(8, window.innerWidth - width - 8),
    )
    const y = Math.min(
      Math.max(8, event.clientY - dragRef.current.offsetY),
      Math.max(8, window.innerHeight - height - 8),
    )
    setPosition({ x, y })
  }, [mode])

  const handleDragEnd = useCallback(() => {
    dragRef.current = null
  }, [])

  useEffect(() => {
    if (mode === 'drawer') setPosition(null)
  }, [mode])

  return (
    <div
      className="floating-chat-root"
      data-open={isOpen}
      data-mode={mode}
      style={position && mode === 'popup'
        ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
        : undefined}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      {!isDocked && <div
        className="floating-chat-window"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <ChatPanel />
      </div>}

      <Button
        type="button"
        variant="default"
        size="icon-lg"
        className="floating-chat-trigger rounded-full bg-[#28334f] text-white shadow-[0_12px_30px_rgba(40,51,79,0.28)] hover:bg-[#374363]"
        aria-label={t('chat.open')}
        title={t('chat.open')}
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="size-5" />
        <span className="sr-only">{t('chat.open')}</span>
      </Button>

      <span className="floating-chat-badge" aria-hidden="true">
        <Bot className="size-3" />
      </span>
    </div>
  )
}
