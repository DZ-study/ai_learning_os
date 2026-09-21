import { CheckCircle2, Circle, Code2, FileText, HelpCircle, MessageCircle, ListChecks } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { LessonBlock, LessonBlockType } from '@/types/lesson'

const BLOCK_TYPE_META: Record<LessonBlockType, { label: string; icon: typeof FileText }> = {
  explanation: { label: '讲解', icon: FileText },
  example: { label: '示例', icon: FileText },
  code: { label: '代码', icon: Code2 },
  question: { label: '思考', icon: MessageCircle },
  quiz: { label: '测验', icon: HelpCircle },
  summary: { label: '总结', icon: ListChecks },
}

interface LessonBlockSidebarProps {
  blocks: LessonBlock[]
  currentBlockId: string | null
  completedBlockIds: string[]
  onSelectBlock: (blockId: string) => void
}

export default function LessonBlockSidebar({
  blocks,
  currentBlockId,
  completedBlockIds,
  onSelectBlock,
}: LessonBlockSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r bg-muted/30">
      <div className="px-4 pb-2 pt-4 text-xs font-medium text-muted-foreground">
        学习内容
      </div>
      <nav className="flex flex-col gap-1 px-2 pb-4">
        {blocks.map((block, index) => {
          const meta = BLOCK_TYPE_META[block.type]
          const TypeIcon = meta.icon
          const completed = completedBlockIds.includes(block.id)
          const active = block.id === currentBlockId

          return (
            <button
              key={block.id}
              type="button"
              onClick={() => onSelectBlock(block.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                active
                  ? 'bg-background shadow-sm ring-1 ring-border'
                  : 'hover:bg-background/60',
              )}
            >
              <span className="mt-0.5 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{block.title}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <TypeIcon className="size-3" />
                  {meta.label}
                </span>
              </span>
              {completed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
