import Empty from "@/components/Empty"
import { Button } from "@/components/ui/button"

import type { Goal } from '@/types/goal'
import { GOAL_STATUS } from '@/utils/constants'

interface GoalCardProps {
  data: Goal[]
  onStart?: (id: number) => void
}

export default function GoalCard({ data, onStart }: GoalCardProps) {
  if (data.length === 0) {
    return <Empty />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {data.map((goal) => (
        <div
          key={goal.id}
          className="flex flex-col gap-4 rounded-(--radius-lg) border-l-4 border-l-(--primary) shadow-md p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium">{goal.title}</h3>
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {GOAL_STATUS[goal.status]}
            </span>
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">目标周期</dt>
              <dd>{goal.duration}</dd>
            </div>
          </dl>

          <div className="mt-auto flex gap-2 border-t pt-4">
            <Button variant="outline" size="sm">
              详情
            </Button>
            {goal.status === "draft" && <Button size="sm" onClick={() => onStart?.(goal.id)}>启动</Button>}
          </div>
        </div>
      ))}
    </div>
  )
}
