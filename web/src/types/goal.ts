import z from 'zod';

export const goalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { error: "目标标题至少需要 2 个字符" })
    .max(255, { error: "目标标题不能超过 255 个字符" }),

  description: z
    .string()
    .trim()
    .min(10, "请至少描述 10 个字符，帮助 AI 理解你的目标"),

  duration: z.number({ error: "目标时长不能为空" }).min(1, "目标时长至少为 1 天"),
  availableTime: z.string().trim().max(255, "不能超过 255 个字符").optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  preferences: z.string().trim().optional(),
  constraints: z.string().trim().optional(),
  level: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalFormSchema>


export type Goal = GoalFormValues & {
  id: number,
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived',
  priority: 'low' | 'medium' | 'high',
  progress?: number
  plan?: object
}

export type Agent = {
  session_id: number,
  stage: string,
  message?: string,
  question?: string
}

export interface GoalListShow {
  data: Goal[],
  onStart: (id: number) => void
  onGenerate: (id: number | null) => void
}

export type GoalTableProps = GoalListShow


export type GoalCardProps = GoalTableProps
