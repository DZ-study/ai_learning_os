import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { goalFormSchema, type GoalFormValues } from '@/types/goal'
import React, { useEffect } from 'react'

/********************测试数据 Start****************************/
const AnalysisData: any = {
  "title": "三个月从零基础学习 React 并达到独立开发门户网站水平",
  "description": "用户希望用三个月时间，从零基础开始学习 React，目标是达到能够独立开发门户网站的水平。",
  "targetDate": "",
  "availableTime": "",
  "priority": "",
  "preferences": "",
  "constraints": "",
  "summary": "用户计划在三个月内从零基础学习 React，最终能够独立开发门户网站。",
  "goalType": "learning",
  "successCriteria": [
    "独立完成至少一个门户网站项目",
    "掌握 React 核心概念并能够解释项目中的组件划分、状态管理和数据交互",
    "通过项目展示自己具备独立开发门户网站的能力"
  ],
  "currentState": "React 零基础",
  "challenges": [
    "三个月时间有限，从零基础到独立开发需要合理规划学习路径",
    "门户网站开发可能涉及 HTML/CSS/JavaScript、React、路由、状态管理等多项技能",
    "用户每天可投入时间尚不明确，影响学习节奏的可行性评估"
  ],
  "suggestedQuestions": [
    "你目前是否已有 HTML、CSS、JavaScript 等前端基础？",
    "你计划每天或每周投入多少时间学习？",
    "你希望开发的门户网站大概包含哪些功能？例如：新闻展示、用户登录、后台管理、响应式适配等",
    "你偏好通过阅读文档、视频教程、项目实战还是混合方式学习？",
    "你是否有参考门户网站或设计风格？"
  ],
  "facts": [
    {
      "content": "用户计划用三个月时间完成 React 学习",
      "category": "schedule",
      "source": "user",
      "confidence": 1
    },
    {
      "content": "用户从零基础开始学习 React",
      "category": "experience",
      "source": "user",
      "confidence": 1
    },
    {
      "content": "用户希望达到独立开发门户网站的水平",
      "category": "other",
      "source": "user",
      "confidence": 1
    },
    {
      "content": "用户可能没有前端基础（HTML/CSS/JavaScript）",
      "category": "experience",
      "source": "ai_inference",
      "confidence": 0.5
    }
  ],
  "extra": {}
}
/********************测试数据 End****************************/

export type GoalFormRef = {
  submit: () => void
  reset: () => void
}

type GoalFormProps = {
  onSubmit: (values: GoalFormValues) => Promise<void> | void
  formData: GoalFormValues
}

const priorityOptions = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
] as const

const GoalCreateForm = React.forwardRef<GoalFormRef, GoalFormProps>(
  ({ onSubmit, formData }, ref) => {
    const form = useForm<GoalFormValues>({
      resolver: zodResolver(goalFormSchema),
      defaultValues: formData,
    })

    useEffect(() => {
      form.reset(formData)
    }, [formData])

    React.useImperativeHandle(ref, () => ({
      submit: () => {
        // 会先执行 Zod 校验；失败时自动显示 FieldError
        void form.handleSubmit(onSubmit)()
      },
      reset: () => form.reset(),
    }))

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl">
        <FieldGroup className="gap-6">
          {/* 短字段：两列布局 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-title">
                    目标标题 <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="goal-title"
                    placeholder="例如：独立完成一个 React 项目"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="targetDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-target-date">期望完成日期</FieldLabel>
                  <Input
                    {...field}
                    id="goal-target-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="availableTime"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-available-time">
                    可投入时间
                  </FieldLabel>
                  <Input
                    {...field}
                    id="goal-available-time"
                    placeholder="例如：工作日每天 1 小时"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="priority"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-priority">优先级</FieldLabel>
                  <select
                    id="goal-priority"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(event.target.value || undefined)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={fieldState.invalid}
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">暂不设置</option>
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}优先级
                      </option>
                    ))}
                  </select>

                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* 长字段：单列布局 */}
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="goal-description">
                  详细描述 <span className="text-destructive">*</span>
                </FieldLabel>

                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="goal-description"
                    rows={6}
                    placeholder="告诉 AI：你想达成什么、目前基础如何、为什么想做，以及你担心或希望避免什么。"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText>
                      {field.value?.length ?? 0} 个字符
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>

                <FieldDescription>
                  保留你的原始表达，AI 会据此理解并生成计划。
                </FieldDescription>

                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="preferences"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="goal-preferences">偏好</FieldLabel>

                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="goal-preferences"
                    rows={3}
                    placeholder="例如：希望项目驱动学习，不喜欢纯看视频"
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>

                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="constraints"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="goal-constraints">限制条件</FieldLabel>

                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="goal-constraints"
                    rows={3}
                    placeholder="例如：预算有限，只能在晚上学习"
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>

                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  重置
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "创建中…" : "创建目标"}
                </Button>
              </div> */}
        </FieldGroup>
      </form>
    )
  }
)

export default GoalCreateForm