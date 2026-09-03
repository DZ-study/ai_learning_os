import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import { generatePlan } from '@/services/goal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import GoalAgentSession, { type TPlan } from './GoalAgentSession'
import { goalKeys } from './queryKeys'

export default function GeneratePlanDrawer({
  goalId,
  open,
  onOpenChange,
}: {
  goalId: number | null
  open: boolean
  onOpenChange: (value: boolean) => void
}) {

  const [plan, setPlan] = useState<TPlan | null>(null)

  const queryClient = useQueryClient()
  const {
    mutateAsync
  } = useMutation({
    mutationFn: ({ goalId, sessionId }: { goalId: number, sessionId: number }) =>
      generatePlan(goalId, sessionId),
    onSuccess: () => {
      toast.success("计划已生成，可在详情页查看")
      onOpenChange(false)
      queryClient.invalidateQueries({ // 更新目标状态
        queryKey: goalKeys.list()
      })
    },
    onError: (error) => {
      toast.error("计划生成失败")
      console.log(error)
    }
  })

  function handleGenerate() {
    if (!goalId || !plan) {
      toast.warning("目标或计划不存在")
      return
    }
    mutateAsync({
      goalId: goalId,
      sessionId: plan.session_id
    })
  }

  function handleGetPlan(plan: TPlan) {
    setPlan(plan)
  }

  return (
    <Drawer
      disablePointerDismissal
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
    >
      <DrawerContent className="w-1/3 min-w-[600px]">
        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">目标规划 Agent</h1>
                <p className="text-sm text-muted-foreground"></p>
              </div>
            </div>
          </DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="h-full border-t border-(--border) p-4 overflow-y-scroll">
          <GoalAgentSession onGetPlan={handleGetPlan} goalId={goalId} />
        </div>
        <DrawerFooter className="flex flex-row justify-end border-t pt-2">
          <DrawerClose render={<Button variant="ghost" />}>
            取消
          </DrawerClose>
          <Button onClick={handleGenerate}>生成计划</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer >
  )
}
