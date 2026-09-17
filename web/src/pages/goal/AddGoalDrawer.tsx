import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { createGoal } from '@/services/goal'
import type { GoalFormValues } from '@/types/goal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'
import GoalForm, { type GoalFormRef } from "./GoalForm"
import { goalKeys } from './queryKeys'
import { useTranslation } from 'react-i18next'

export default function AddGoalDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {

  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const goalFormRef = useRef<GoalFormRef>(null)
  const {
    mutateAsync
  } = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      toast.success(t("goal.created"))
      onOpenChange(false)
      queryClient.invalidateQueries({
        queryKey: goalKeys.list()
      })
    },
    onError: (error) => {
      toast.error(t("goal.create_failed"))
      console.log(error)
    }
  })

  function handleCreateGoal(values: GoalFormValues) {
    mutateAsync(values)
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
          <DrawerTitle className="text-2xl">{t("goal.form_title")}</DrawerTitle>
          <DrawerDescription>{t("goal.form_description")}</DrawerDescription>
        </DrawerHeader>
        <div className="border-t border-(--border) p-4 overflow-y-scroll">
          <GoalForm ref={goalFormRef} onSubmit={handleCreateGoal} />
        </div>
        <DrawerFooter className="flex flex-row justify-end border-t pt-2">
          <DrawerClose render={<Button variant="ghost" />}>
            {t("common.cancel")}
          </DrawerClose>
          <Button onClick={
            () => goalFormRef.current?.submit()
          }>{t("goal.create_button")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
