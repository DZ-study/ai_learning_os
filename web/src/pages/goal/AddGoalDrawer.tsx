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
import type { goalFormSchema, GoalFormValues } from '@/types/goal'
import type { LucideIcon } from 'lucide-react'
import { CheckCheck, PencilLine } from 'lucide-react'
import { useRef, useState } from 'react'
import type zod from 'zod'
import GoalAIAnalysis from './GoalAIAnalysis'
import GoalForm, { type GoalFormRef } from "./GoalForm"

interface StepProps {
  Icon: LucideIcon;
  iconColor: string;
  title: string;
}

function Step({
  Icon,
  iconColor,
  title
}: StepProps) {
  return (
    <div className="flex pb-2 items-center mt-4">
      <Icon size={18} className={iconColor} />
      <span className='text-lg ml-2'>{title}</span>
    </div>
  )
}

export default function AddGoalDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {

  const goalFormRef = useRef<GoalFormRef>(null)
  const [formData, setFormData] = useState({} as GoalFormValues)

  function transformAIResult(
    result: any
  ): GoalFormValues {

    return {
      title: result.title,

      description: `
        ${result.description}

        成功标准：
        ${result.successCriteria
          .map((item: any) => `- ${item}`)
          .join("\n")}

        可能挑战：
        ${result.challenges
          .map((item: any) => `- ${item}`)
          .join("\n")}
            `.trim(),

      ...result
    }
  }

  async function handleCreateGoal(values: GoalFormValues) {
    createGoal(values).then(res => {
      console.log("创建目标：", res)
    })
  }

  const handleGenerated = (data: zod.infer<typeof goalFormSchema>) => {
    console.log("AI的解析结果： ", data)
    // form.reset(data)
    setFormData(transformAIResult(data))
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
        <div className="border-t border-(--border) p-4 pt-1 overflow-y-scroll">
          <Step Icon={PencilLine} iconColor="text-(--primary)" title="1. 描述您的学习目标" />
          <GoalAIAnalysis onGenerated={handleGenerated} />
          <Step Icon={CheckCheck} title="2. 确认并编辑详情" iconColor="text-(--secondary)" />
          <GoalForm ref={goalFormRef} formData={formData} onSubmit={handleCreateGoal} />
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
