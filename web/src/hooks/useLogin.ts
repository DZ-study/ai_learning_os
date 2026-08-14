import { useCountDown } from "@/hooks/useCountDown"
import { authService } from "@/services/auth"
import { useAuthStore } from "@/stores/authStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

// 静态 schema：错误 message 存 i18n key，展示时通过 t() 翻译
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "validation.email_required")
    .email("validation.email_invalid"),
  code: z
    .string()
    .min(1, "validation.code_required")
    .length(6, "validation.code_length")
    .regex(/^\d{6}$/, "validation.code_format"),
})

type LoginFormData = z.infer<typeof loginSchema>
type Step = "email" | "code"

export function useLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authLogin = useAuthStore((s) => s.login)

  const [step, setStep] = useState<Step>("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { countdown, start: startCountdown } = useCountDown()

  const {
    register,
    trigger,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", code: "" },
  })

  // 发送验证码
  async function handleSendCode() {
    setError(null)
    setLoading(true)
    try {
      const result = await authService.sendCode(getValues("email").trim())
      if (result.success) {
        setStep("code")
        startCountdown(60)
      } else {
        setError(result.message || t("error.send_failed"))
      }
    } catch {
      setError(t("error.network"))
    } finally {
      setLoading(false)
    }
  }

  // 验证码登录
  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      const result = await authService.login(
        getValues("email").trim(),
        getValues("code").trim(),
      )
      if (result.success && result.data) {
        await authLogin(result.data)
        navigate("/", { replace: true })
      } else {
        setError(result.message || t("error.login_failed"))
      }
    } catch {
      setError(t("error.network"))
    } finally {
      setLoading(false)
    }
  }

  // 回到邮箱输入
  function handleBack() {
    setStep("email")
    setValue("code", "")
    setError(null)
    clearErrors()
  }

  // 表单提交（仅校验当前步骤字段）
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const field = step === "email" ? "email" : "code"
    const valid = await trigger(field)
    if (!valid) return

    if (step === "email") {
      await handleSendCode()
    } else {
      await handleLogin()
    }
  }

  return {
    step,
    loading,
    error,
    countdown,
    register,
    errors,
    getValues,
    handleSendCode,
    handleLogin,
    handleBack,
    handleSubmit,
  }
}
