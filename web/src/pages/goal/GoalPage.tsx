
import { Button } from '@/components/ui/button'

import AddGoalDrawer from "@/pages/goal/AddGoalDrawer"
import { getGoals } from '@/services/goal'
import { useQuery } from '@tanstack/react-query'
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import GeneratePlanDrawer from './GeneratePlanDrawer'
import GoalCard from './GoalCard'
import GoalTable from './GoalTable'
import { goalKeys } from './queryKeys'
import type { ViewMode } from './ViewSwitcher'
import { ViewSwitcher } from './ViewSwitcher'

export default function GoalPage() {
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showGeneratePlan, setShowGeneratePlan] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [goalId, setGoalId] = useState<number | null>(null)
  const navigate = useNavigate()

  const { data: goals } = useQuery({
    queryKey: goalKeys.list(),
    queryFn: getGoals
  })

  const handleOpen = () => {
    setShowAddGoal(true)
  }

  // 开始学习
  const handleStart = (goalId: number) => {
    // TODO: 后台目标状态校验和修改
    navigate(`/goals/${goalId}/agent`)
  }

  // 生成学习计划
  const handleGenerate = (id: number | null) => {
    setGoalId(id)
    setShowGeneratePlan(true)
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
      {viewMode === "list" && <GoalTable data={goals ?? []} onStart={handleStart} onGenerate={handleGenerate} />}
      {viewMode === "card" && <GoalCard data={goals ?? []} onStart={handleStart} onGenerate={handleGenerate} />}
      <AddGoalDrawer open={showAddGoal} onOpenChange={setShowAddGoal} />
      <GeneratePlanDrawer goalId={goalId} open={showGeneratePlan} onOpenChange={setShowGeneratePlan} />
    </div>
  )
}
