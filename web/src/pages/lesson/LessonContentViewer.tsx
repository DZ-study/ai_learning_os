import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { LessonBlock } from '@/types/lesson'

import LessonBlockRenderer from './blocks/LessonBlockRenderer'

interface LessonContentViewerProps {
  block: LessonBlock
  blockIndex: number
  totalBlocks: number
  completed: boolean
  onComplete: () => void
  onPrev: () => void
  onNext: () => void
}

export default function LessonContentViewer({
  block,
  blockIndex,
  totalBlocks,
  completed,
  onComplete,
  onPrev,
  onNext,
}: LessonContentViewerProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl flex-1 px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{block.title}</h2>
          {completed && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <CheckCircle2 className="size-4" />
              已完成
            </span>
          )}
        </div>

        <LessonBlockRenderer
          block={block}
          completed={completed}
          onComplete={onComplete}
        />

        {!completed && block.type !== 'quiz' && (
          <div className="mt-8">
            <Button variant="outline" onClick={onComplete}>
              标记为已完成
            </Button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-8 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={blockIndex <= 0}
        >
          <ChevronLeft className="size-4" />
          上一个
        </Button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {blockIndex + 1} / {totalBlocks}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={blockIndex >= totalBlocks - 1}
        >
          下一个
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}
