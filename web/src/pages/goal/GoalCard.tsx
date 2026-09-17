
import { useGoalStore } from '@/stores/goalStore'
import type { Goal, GoalCardProps } from '@/types/goal'
import { GOAL_STATUS } from '@/utils/constants'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function GoalCard({ data, onStart }: GoalCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setCurrentGoal } = useGoalStore()

  const handleClick = (goal: Goal) => {
    setCurrentGoal(goal)
    navigate("/space")
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {data.map((goal) => (
        <div
          key={goal.id}
          onClick={() => handleClick(goal)}
          className="flex flex-col gap-4 cursor-pointer rounded-(--radius-lg) border-l-4 border-l-(--primary) shadow-sm hover:shadow-md p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium">{goal.title}</h3>
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {t(GOAL_STATUS[goal.status])}
            </span>
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">{t("goal.table.duration")}</dt>
              <dd>{goal.duration} {t("common.day")}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  )
}
