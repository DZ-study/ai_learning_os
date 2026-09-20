import { CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LearningHeaderProps {
  courseName: string
  chapterName: string
  lessonTitle: string
  completedBlocks: number
  totalBlocks: number
}

export default function LearningHeader({
  courseName,
  chapterName,
  lessonTitle,
  completedBlocks,
  totalBlocks,
}: LearningHeaderProps) {
  const percent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0
  const finished = totalBlocks > 0 && completedBlocks === totalBlocks

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b bg-background px-6">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate font-medium">{courseName}</span>
        <span className="text-muted-foreground">/</span>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {chapterName}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="truncate text-muted-foreground">{lessonTitle}</span>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                finished ? 'bg-green-500' : 'bg-primary',
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {completedBlocks}/{totalBlocks}
          </span>
        </div>
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            finished ? 'text-green-600' : 'text-muted-foreground',
          )}
        >
          {finished && <CheckCircle2 className="size-3.5" />}
          {finished ? '已完成' : `进行中 ${percent}%`}
        </span>
      </div>
    </header>
  )
}
