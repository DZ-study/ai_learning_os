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

export default function AddGoalDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {

  const queryClient = useQueryClient()
  const goalFormRef = useRef<GoalFormRef>(null)
  const {
    mutateAsync
  } = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      toast.success("目标创建成功")
      onOpenChange(false)
      queryClient.invalidateQueries({
        queryKey: goalKeys.list()
      })
    },
    onError: (error) => {
      toast.error("目标创建失败")
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
          <DrawerTitle className="text-2xl">创建新目标</DrawerTitle>
          <DrawerDescription>描述您的学习意图，AI学习助手将为您构建结构化路径。</DrawerDescription>
        </DrawerHeader>
        <div className="border-t border-(--border) p-4 overflow-y-scroll">
          <GoalForm ref={goalFormRef} onSubmit={handleCreateGoal} />
        </div>
        <DrawerFooter className="flex flex-row justify-end border-t pt-2">
          <DrawerClose render={<Button variant="ghost" />}>
            取消
          </DrawerClose>
          <Button onClick={
            () => goalFormRef.current?.submit()
          }>创建目标</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
