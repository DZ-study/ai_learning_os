
import { Button } from '@/components/ui/button'

import AddGoalDrawer from "@/pages/goal/AddGoalDrawer"
import { getGoals } from '@/services/goal'
import { useQuery } from '@tanstack/react-query'
import { useState } from "react"
import GoalCard from './GoalCard'
import GoalTable from './GoalTable'
import { goalKeys } from './queryKeys'
import type { ViewMode } from './ViewSwitcher'
import { ViewSwitcher } from './ViewSwitcher'

export default function GoalPage() {
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const { data: goals } = useQuery({
    queryKey: goalKeys.list(),
    queryFn: getGoals
  })

  const handleOpen = () => {
    setShowAddGoal(true)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">学习目标</h1>
      <p className="text-muted-foreground mb-4">
        管理您的学习目标，跟踪目标学习进度。
      </p>
      <div className="flex justify-between mb-4">
        <ViewSwitcher
          value={viewMode}
          onChange={setViewMode}
        />
        <Button onClick={handleOpen}>添加学习目标</Button>
      </div>
      {viewMode === "list" && <GoalTable data={goals ?? []} />}
      {viewMode === "card" && <GoalCard data={goals ?? []} />}
      <AddGoalDrawer open={showAddGoal} onOpenChange={setShowAddGoal} />
    </div>
  )
}
