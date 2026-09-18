import { useGoalStore } from '@/stores/goalStore'
import type { Goal, GoalCardProps } from '@/types/goal'
import { GOAL_STATUS } from '@/utils/constants'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const STATUS_STYLES: Record<Goal['status'], string> = {
  draft: 'bg-gray-100 text-gray-500',
  active: 'bg-blue-50 text-blue-600',
  paused: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
  archived: 'bg-gray-100 text-gray-400',
}

const GOAL_ICONS: Array<{ keywords: string[]; icon: string; className: string }> = [
  { keywords: ['react'], icon: '⚛️', className: 'bg-sky-50' },
  { keywords: ['python'], icon: '🐍', className: 'bg-emerald-50' },
  { keywords: ['sql', '数据库', '数据'], icon: '🗄️', className: 'bg-indigo-50' },
  { keywords: ['摄影', '拍照', 'photo'], icon: '📷', className: 'bg-rose-50' },
  { keywords: ['英语', 'english', '外语'], icon: '🗣️', className: 'bg-amber-50' },
  { keywords: ['设计', 'design'], icon: '🎨', className: 'bg-violet-50' },
  { keywords: ['健身', '运动', '跑步'], icon: '🏃', className: 'bg-lime-50' },
]

const getGoalIcon = (title: string) => {
  const lower = title.toLowerCase()
  const matched = GOAL_ICONS.find(({ keywords }) =>
    keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
  )
  return matched ?? { icon: '🎯', className: 'bg-violet-50' }
}

export default function GoalCard({ data }: GoalCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setCurrentGoal } = useGoalStore()

  const handleClick = (goal: Goal) => {
    setCurrentGoal(goal)
    navigate(`/space/${goal.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((goal) => {
        const progress = Math.min(100, Math.max(0, goal.progress ?? 0))
        const { icon, className: iconClassName } = getGoalIcon(goal.title)

        return (
          <div
            key={goal.id}
            onClick={() => handleClick(goal)}
            className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_12px_32px_rgba(99,102,241,0.14)]"
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${iconClassName}`}>
                {icon}
              </div>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                <h3 className="text-base font-medium leading-6 text-gray-800">{goal.title}</h3>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[goal.status]}`}>
                  {t(GOAL_STATUS[goal.status])}
                </span>
              </div>
            </div>

            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">{t("goal.table.duration")}</dt>
                <dd>{goal.duration} {t("common.day")}</dd>
              </div>
            </dl>

            <div className="mt-auto flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-gray-400">{progress}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
