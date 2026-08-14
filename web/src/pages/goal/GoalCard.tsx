import Empty from "@/components/Empty"
import Tag from "@/components/Tag"
import { Button } from "@/components/ui/button"

interface GoalCardItem {
  id: string
  /** 目标名称 */
  title: string
  /** 学习方向 */
  direction: string
  /** 当前阶段 */
  level: string
  levelColor: string
  /** 目标周期 */
  period: string
  /** 状态 */
  status: string
}

const goals: GoalCardItem[] = []

export default function GoalCard() {
  if (goals.length === 0) {
    return <Empty />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="flex flex-col gap-4 rounded-(--radius-lg) border-l-4 border-l-(--primary) shadow-md p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium">{goal.title}</h3>
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {goal.status}
            </span>
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">学习方向</dt>
              <dd>{goal.direction}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">当前阶段</dt>
              <dd>
                <Tag label={goal.level} color={goal.levelColor} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">目标周期</dt>
              <dd>{goal.period}</dd>
            </div>
          </dl>

          <div className="mt-auto flex gap-2 border-t pt-4">
            <Button variant="outline" size="sm">
              详情
            </Button>
            <Button size="sm">AI生成学习计划</Button>
          </div>
        </div>
      ))}
    </div>
  )
}
