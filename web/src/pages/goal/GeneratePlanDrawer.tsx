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
import { confirmPlan } from '@/services/goal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import GoalAgentSession, { type TPlan } from './GoalAgentSession'
import { goalKeys } from './queryKeys'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  const queryClient = useQueryClient()
  const {
    mutateAsync
  } = useMutation({
    mutationFn: ({ goalId, sessionId }: { goalId: number, sessionId: number }) =>
      confirmPlan(goalId, sessionId),
    onSuccess: () => {
      toast.success(t("goal.plan_generated"))
      onOpenChange(false)
      queryClient.invalidateQueries({ // Update goal status
        queryKey: goalKeys.list()
      })
    },
    onError: (error) => {
      toast.error(t("goal.plan_failed"))
      console.log(error)
    }
  })

  function handleGenerate() {
    if (!goalId || !plan) {
      toast.warning(t("goal.missing_plan"))
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
                <h1 className="text-2xl font-bold tracking-tight">{t("goal.plan_title")}</h1>
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
            {t("common.cancel")}
          </DrawerClose>
          <Button onClick={handleGenerate}>{t("goal.generate_plan")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer >
  )
}
