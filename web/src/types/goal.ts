import z from 'zod';

export const goalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { error: "goal.validation.title_min" })
    .max(255, { error: "goal.validation.title_max" }),

  description: z
    .string()
    .trim()
    .min(10, "goal.validation.description_min"),

  duration: z.number({ error: "goal.validation.duration_required" }).min(1, "goal.validation.duration_min"),
  availableTime: z.string().trim().max(255, "goal.validation.available_time_max").optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  preferences: z.string().trim().optional(),
  constraints: z.string().trim().optional(),
  level: z.string().optional()
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
  onStart?: (id: number) => void
  onGenerate?: (id: number | null) => void
}

export type GoalTableProps = GoalListShow


export type GoalCardProps = GoalTableProps
