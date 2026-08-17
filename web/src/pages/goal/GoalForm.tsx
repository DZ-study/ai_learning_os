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
import React from 'react'

export type GoalFormRef = {
  submit: () => void
  reset: () => void
}

type GoalFormProps = {
  onSubmit: (values: GoalFormValues) => Promise<void> | void
}

const priorityOptions = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
] as const

const GoalCreateForm = React.forwardRef<GoalFormRef, GoalFormProps>(
  ({ onSubmit }, ref) => {
    const form = useForm<GoalFormValues>({
      resolver: zodResolver(goalFormSchema),
      defaultValues: {
        title: "",
        duration: 90,
        availableTime: "",
        priority: "low",
        description: "",
        preferences: "",
        constraints: "",
      },
    })

    React.useImperativeHandle(ref, () => ({
      submit: () => {
        console.log("submit", form.getValues())
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
              name="duration"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-duration">
                    期望完成时长
                  </FieldLabel>
                  <Input
                    {...field}
                    id="goal-duration"
                    type="number"
                    min={1}
                    placeholder="例如：3"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />

                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  <FieldDescription>
                    以天为单位
                  </FieldDescription>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="availableTime"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-available-time">
                    每日可投入时间(h)
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
                        {option.label}
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
        </FieldGroup>
      </form>
    )
  }
)

export default GoalCreateForm