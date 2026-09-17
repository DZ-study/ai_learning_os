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
import { useTranslation } from 'react-i18next'

export type GoalFormRef = {
  submit: () => void
  reset: () => void
}

type GoalFormProps = {
  onSubmit: (values: GoalFormValues) => Promise<void> | void
}

const priorityOptions = [
  { value: "low", label: "goal.priority.low" },
  { value: "medium", label: "goal.priority.medium" },
  { value: "high", label: "goal.priority.high" },
] as const

const GoalCreateForm = React.forwardRef<GoalFormRef, GoalFormProps>(
  ({ onSubmit }, ref) => {
    const { t } = useTranslation()
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
        // Zod validation runs before submit and FieldError renders failures.
        void form.handleSubmit(onSubmit)()
      },
      reset: () => form.reset(),
    }))

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl">
        <FieldGroup className="gap-6">
          {/* Short fields: two-column layout */}
          <div className="grid gap-6 md:grid-cols-2">
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-title">
                    {t("goal.form.title")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="goal-title"
                    placeholder={t("goal.form.title_placeholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
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
                    {t("goal.form.duration")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="goal-duration"
                    type="number"
                    min={1}
                    placeholder={t("goal.form.duration_placeholder")}
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />

                  {fieldState.error && (
                    <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
                  )}
                  <FieldDescription>
                    {t("goal.duration_unit")}
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
                    {t("goal.form.available_time")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="goal-available-time"
                    placeholder={t("goal.form.available_time_placeholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="priority"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-priority">{t("goal.form.priority")}</FieldLabel>
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
                    <option value="">{t("goal.form.priority_unset")}</option>
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.label)}
                      </option>
                    ))}
                  </select>

                  {fieldState.error && (
                    <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* Long fields: single-column layout */}
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="goal-description">
                  {t("goal.form.description")} <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="goal-description"
                    rows={6}
                    placeholder={t("goal.form.description_placeholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText>
                      {t("common.character_count", { count: field.value?.length ?? 0 })}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  {t("goal.form.description_hint")}
                </FieldDescription>
                {fieldState.error && (
                  <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="preferences"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-preferences">{t("goal.form.preferences")}</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="goal-preferences"
                    rows={3}
                    placeholder={t("goal.form.preferences_placeholder")}
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>
                {fieldState.error && (
                  <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="constraints"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-constraints">{t("goal.form.constraints")}</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="goal-constraints"
                    rows={3}
                    placeholder={t("goal.form.constraints_placeholder")}
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>
                {fieldState.error && (
                  <FieldError errors={fieldState.error ? [{ message: t(fieldState.error.message ?? "") }] : []} />
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
