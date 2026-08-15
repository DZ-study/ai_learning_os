import z from 'zod';

export const goalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "目标标题至少需要 2 个字符")
    .max(255, "目标标题不能超过 255 个字符"),

  description: z
    .string()
    .trim()
    .min(10, "请至少描述 10 个字符，帮助 AI 理解你的目标"),

  targetDate: z.string().optional(),
  availableTime: z.string().trim().max(255, "不能超过 255 个字符").optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  preferences: z.string().trim().optional(),
  constraints: z.string().trim().optional(),
  level: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalFormSchema>