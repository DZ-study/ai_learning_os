import LearningSpace from '@/pages/learning-space/LearningSpace'
import { Spinner } from '@/components/ui/spinner'
import { getGoal } from '@/services/goal'
import { useGoalStore } from '@/stores/goalStore'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function GoalSpace() {
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()
  const setCurrentGoal = useGoalStore((state) => state.setCurrentGoal)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const id = Number(goalId)

    if (!Number.isInteger(id) || id <= 0) {
      navigate('/', { replace: true })
      return
    }

    let cancelled = false
    setIsLoading(true)

    void getGoal(id)
      .then(({ data }) => {
        if (!cancelled) setCurrentGoal(data)
      })
      .catch(() => {
        if (!cancelled) navigate('/', { replace: true })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [goalId, navigate, setCurrentGoal])

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return <div className="h-full min-h-0"><LearningSpace /></div>
}
