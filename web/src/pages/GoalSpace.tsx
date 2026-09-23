import LearningSpace from '@/pages/learning-space/LearningSpace'
import { Spinner } from '@/components/ui/spinner'
import { getGoal } from '@/services/goal'
import { useGoalStore } from '@/stores/goalStore'
import { goalKeys } from '@/query/keys'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

export default function GoalSpace() {
  const { goalId } = useParams<{ goalId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const setCurrentGoal = useGoalStore((state) => state.setCurrentGoal)
  const id = Number(goalId)
  const validGoalId = Number.isInteger(id) && id > 0
  const { data: goal, isLoading, error } = useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: async () => (await getGoal(id)).data,
    enabled: validGoalId,
  })

  useEffect(() => {
    if (!validGoalId) {
      navigate('/', { replace: true })
    }
  }, [navigate, validGoalId])

  useEffect(() => {
    if (goal) setCurrentGoal(goal)
  }, [goal, setCurrentGoal])

  useEffect(() => {
    if (error) navigate('/', { replace: true })
  }, [error, navigate])

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  const isDetailRoute = location.pathname.endsWith('/detail')

  return (
    <div className="h-full min-h-0">
      <LearningSpace initialView={isDetailRoute ? 'course_detail' : 'workspace'} />
    </div>
  )
}
