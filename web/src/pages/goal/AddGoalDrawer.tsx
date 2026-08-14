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
import { PencilLine } from 'lucide-react'
import { useForm } from 'react-hook-form'
import GoalAIAnalysis from './GoalAIAnalysis'
import GoalForm from "./GoalForm"

export default function AddGoalDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {

  const form = useForm()

  const handleGenerated = (data: any) => {
    form.reset(data)
  }

  return (
    <Drawer
      disablePointerDismissal
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
    >
      <DrawerContent className="w-1/3 min-w-[400px]">
        <DrawerHeader>
          <DrawerTitle className="text-2xl">创建新目标</DrawerTitle>
          <DrawerDescription>描述您的学习意图，AI学习助手将为您构建结构化路径。</DrawerDescription>
        </DrawerHeader>
        <div className="border-t border-(--border) p-4 mt-4 overflow-y-scroll">
          <div className="flex pb-2 items-center">
            <PencilLine size={18} className="text-(--color-primary)" /><span className='text-lg ml-2'> 1. 描述您的学习目标</span>
          </div>
          <GoalAIAnalysis onGenerated={handleGenerated} />
          <GoalForm formData={form} />
        </div>
        <DrawerFooter className="flex flex-row justify-end border-t pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <DrawerClose render={<Button variant="outline" />}>
            创建目标
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
