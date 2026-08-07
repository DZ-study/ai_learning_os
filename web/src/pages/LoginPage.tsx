import Logo from "@/assets/svg/logo.svg?react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useLogin";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  const {
    step,
    loading,
    error,
    countdown,
    register,
    errors,
    getValues,
    handleSendCode,
    handleBack,
    handleSubmit
  } = useLogin();

  const emailReg = register("email");
  const codeReg = register("code");

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  // 聚焦输入框
  useEffect(() => {
    if (step === "email") emailInputRef.current?.focus();
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 pt-[12vh]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Logo className="size-14" />
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">
          {step === "email" ? t("auth.title_email") : t("auth.title_code")}
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {step === "email"
            ? t("auth.subtitle_email")
            : t("auth.subtitle_code", { email: getValues("email") })}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱输入 */}
          {step === "email" && (
            <div className="space-y-1.5">
              <Label htmlFor="email">
                {t("auth.label_email")}
              </Label>
              <Input
                id="email"
                type="email"
                name={emailReg.name}
                onBlur={emailReg.onBlur}
                onChange={emailReg.onChange}
                ref={(node) => {
                  emailReg.ref(node);
                  emailInputRef.current = node;
                }}
                placeholder={t("auth.placeholder_email")}
                autoComplete="email"
                className="h-10 px-3 py-2.5"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {t(errors.email.message!)}
                </p>
              )}
            </div>
          )}

          {/* 验证码输入 */}
          {step === "code" && (
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleBack}
                className="mb-2 h-auto p-0"
              >
                <ArrowLeft className="size-3.5" />
                {t("auth.back")}
              </Button>

              <Label htmlFor="code">
                {t("auth.label_code")}
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                name={codeReg.name}
                onBlur={codeReg.onBlur}
                ref={(node) => {
                  codeReg.ref(node);
                  codeInputRef.current = node;
                }}
                onChange={(e) => {
                  const filtered = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
                  e.target.value = filtered;
                  codeReg.onChange(e);
                }}
                placeholder={t("auth.placeholder_code")}
                autoComplete="one-time-code"
                className="h-10 px-3 py-2.5 tracking-[0.25em] placeholder:tracking-normal"
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {t(errors.code.message!)}
                </p>
              )}

              {/* 重新发送 */}
              <div className="mt-3 text-center">
                {countdown > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {t("auth.countdown", { seconds: countdown })}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="h-auto p-0"
                  >
                    {t("auth.resend")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* API 错误提示 */}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* 提交按钮 */}
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 animate-spin" />}
            {step === "email" ? t("auth.continue") : t("auth.login")}
          </Button>
        </form>
      </div>
    </div>
  );
}
