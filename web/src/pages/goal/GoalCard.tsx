import { useGoalStore } from '@/stores/goalStore'
import type { Goal, GoalCardProps } from '@/types/goal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteGoal } from '@/services/goal'
import { GOAL_ICONS } from '@/utils/constants'
import { goalKeys } from '@/query/keys'


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
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: (_, deletedGoalId) => {
      if (useGoalStore.getState().currentGoal?.id === deletedGoalId) {
        useGoalStore.setState({ currentGoal: null })
      }
      setGoalToDelete(null)
      void queryClient.invalidateQueries({ queryKey: goalKeys.list() })
    },
  })

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
            className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_12px_32px_rgba(99,102,241,0.14)]"
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${iconClassName}`}>
                {icon}
              </div>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                <h3 className="text-base font-medium leading-6 text-gray-800">{goal.title}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  {/* <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[goal.status]}`}>
                    {t(GOAL_STATUS[goal.status])}
                  </span> */}
                  <button
                    type="button"
                    className="
                      invisible cursor-pointer rounded-md p-1 text-gray-400 opacity-0 transition-all
                      group-hover:visible group-hover:opacity-100
                      hover:bg-red-50 hover:text-red-500 focus-visible:visible focus-visible:opacity-100
                      disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`删除目标 ${goal.title}`}
                    disabled={deleteMutation.isPending}
                    onClick={(event) => {
                      event.stopPropagation()
                      setGoalToDelete(goal)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
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

      <AlertDialog
        open={goalToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setGoalToDelete(null)
        }}
      >
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除这个学习目标吗？</AlertDialogTitle>
            <AlertDialogDescription>
              删除「{goalToDelete?.title ?? ''}」后，与该目标相关的学习计划和学习数据也将被删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.stopPropagation()
                setGoalToDelete(null)
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending || !goalToDelete}
              onClick={(event) => {
                event.stopPropagation()
                if (goalToDelete) deleteMutation.mutate(goalToDelete.id)
              }}
            >
              {deleteMutation.isPending ? '删除中...' : '确认删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
