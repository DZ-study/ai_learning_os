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
import type { LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import GoalForm, { type GoalFormRef } from "./GoalForm"
import { goalKeys } from './queryKeys'

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
// const AnalysisData: any = {
//   "title": "三个月从零基础学习 React 并达到独立开发门户网站水平",
//   "description": "用户希望用三个月时间，从零基础开始学习 React，目标是达到能够独立开发门户网站的水平。",
//   "targetDate": "",
//   "availableTime": "",
//   "priority": "",
//   "preferences": "",
//   "constraints": "",
//   "summary": "用户计划在三个月内从零基础学习 React，最终能够独立开发门户网站。",
//   "goalType": "learning",
//   "successCriteria": [
//     "独立完成至少一个门户网站项目",
//     "掌握 React 核心概念并能够解释项目中的组件划分、状态管理和数据交互",
//     "通过项目展示自己具备独立开发门户网站的能力"
//   ],
//   "currentState": "React 零基础",
//   "challenges": [
//     "三个月时间有限，从零基础到独立开发需要合理规划学习路径",
//     "门户网站开发可能涉及 HTML/CSS/JavaScript、React、路由、状态管理等多项技能",
//     "用户每天可投入时间尚不明确，影响学习节奏的可行性评估"
//   ],
//   "suggestedQuestions": [
//     "你目前是否已有 HTML、CSS、JavaScript 等前端基础？",
//     "你计划每天或每周投入多少时间学习？",
//     "你希望开发的门户网站大概包含哪些功能？例如：新闻展示、用户登录、后台管理、响应式适配等",
//     "你偏好通过阅读文档、视频教程、项目实战还是混合方式学习？",
//     "你是否有参考门户网站或设计风格？"
//   ],
//   "facts": [
//     {
//       "content": "用户计划用三个月时间完成 React 学习",
//       "category": "schedule",
//       "source": "user",
//       "confidence": 1
//     },
//     {
//       "content": "用户从零基础开始学习 React",
//       "category": "experience",
//       "source": "user",
//       "confidence": 1
//     },
//     {
//       "content": "用户希望达到独立开发门户网站的水平",
//       "category": "other",
//       "source": "user",
//       "confidence": 1
//     },
//     {
//       "content": "用户可能没有前端基础（HTML/CSS/JavaScript）",
//       "category": "experience",
//       "source": "ai_inference",
//       "confidence": 0.5
//     }
//   ],
//   "extra": {}
// }
// /********************测试数据 End****************************/

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
          {/* <Step Icon={PencilLine} iconColor="text-(--primary)" title="1. 描述您的学习目标" /> */}
          {/* <GoalAIAnalysis onGenerated={handleGenerated} /> */}
          {/* <Step Icon={CheckCheck} title="2. 确认并编辑详情" iconColor="text-(--secondary)" /> */}
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
