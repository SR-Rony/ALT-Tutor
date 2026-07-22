"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth.service";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/validations";
import { cn } from "@/utils";
import type { ApiError } from "@/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#ef3239]">{message}</p>;
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  const phoneForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { phone: "" },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  function startResendCooldown(seconds = 45) {
    setResendSeconds(seconds);
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function requestOtp(values: ForgotPasswordFormValues) {
    setError(null);
    setInfo(null);
    setSendingOtp(true);
    try {
      const result = await authService.forgotPassword(values.phone);
      setPhone(values.phone);
      setStep("reset");
      setInfo(
        result.message ||
          "OTP sent. In development, check the backend terminal console for the code."
      );
      startResendCooldown();
      resetForm.reset({ otp: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Could not send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function onReset(values: ResetPasswordFormValues) {
    setError(null);
    try {
      const result = await authService.resetPassword({
        phone,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      setInfo(result.message);
      window.setTimeout(() => {
        router.push(ROUTES.auth.login);
      }, 900);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Could not reset password. Check the OTP and try again.");
    }
  }

  async function onResend() {
    if (!phone || resendSeconds > 0 || sendingOtp) return;
    await requestOtp({ phone });
  }

  if (step === "reset") {
    return (
      <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-5" noValidate>
        <div className="rounded-xl border border-[#1877f2]/20 bg-[#1877f2]/5 px-4 py-3 text-sm text-[#1a2b5e]">
          <p className="font-semibold">Set a new password for {phone}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Enter the OTP from the backend terminal (development) and choose a new password.
          </p>
        </div>

        {info ? (
          <div className="rounded-xl border border-[#12b76a]/25 bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
            {info}
          </div>
        ) : null}

        <div>
          <label htmlFor="reset-otp" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
            OTP code
          </label>
          <Input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            maxLength={6}
            aria-invalid={Boolean(resetForm.formState.errors.otp)}
            className={cn(
              "h-11 tracking-[0.35em]",
              resetForm.formState.errors.otp &&
                "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
            )}
            {...resetForm.register("otp")}
          />
          <FieldError message={resetForm.formState.errors.otp?.message} />
        </div>

        <div>
          <label
            htmlFor="reset-new-password"
            className="mb-2 block text-sm font-semibold text-[#1a2b5e]"
          >
            New password
          </label>
          <Input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            aria-invalid={Boolean(resetForm.formState.errors.newPassword)}
            className={cn(
              "h-11",
              resetForm.formState.errors.newPassword &&
                "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
            )}
            {...resetForm.register("newPassword")}
          />
          <FieldError message={resetForm.formState.errors.newPassword?.message} />
        </div>

        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-2 block text-sm font-semibold text-[#1a2b5e]"
          >
            Confirm new password
          </label>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter new password"
            aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)}
            className={cn(
              "h-11",
              resetForm.formState.errors.confirmPassword &&
                "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
            )}
            {...resetForm.register("confirmPassword")}
          />
          <FieldError message={resetForm.formState.errors.confirmPassword?.message} />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#ef3239]/20 bg-[#ef3239]/5 px-4 py-3 text-sm font-medium text-[#ef3239]"
          >
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="default"
          size="pill"
          className="w-full text-base"
          disabled={resetForm.formState.isSubmitting}
        >
          {resetForm.formState.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Updating password...
            </>
          ) : (
            "Set new password"
          )}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            className="font-semibold text-[#1877f2] hover:underline"
            onClick={() => {
              setStep("phone");
              setError(null);
              setInfo(null);
            }}
          >
            Change phone
          </button>
          <button
            type="button"
            disabled={resendSeconds > 0 || sendingOtp}
            className="font-semibold text-[#1a2b5e] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void onResend()}
          >
            {sendingOtp
              ? "Sending..."
              : resendSeconds > 0
                ? `Resend OTP in ${resendSeconds}s`
                : "Resend OTP"}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href={ROUTES.auth.login} className="font-semibold text-[#1877f2] hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={phoneForm.handleSubmit(requestOtp)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="forgot-phone" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Registered phone number
        </label>
        <Input
          id="forgot-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01712345678"
          aria-invalid={Boolean(phoneForm.formState.errors.phone)}
          className={cn(
            "h-11",
            phoneForm.formState.errors.phone &&
              "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...phoneForm.register("phone")}
        />
        <FieldError message={phoneForm.formState.errors.phone?.message} />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ef3239]/20 bg-[#ef3239]/5 px-4 py-3 text-sm font-medium text-[#ef3239]"
        >
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="default"
        size="pill"
        className="w-full text-base"
        disabled={sendingOtp || phoneForm.formState.isSubmitting}
      >
        {sendingOtp || phoneForm.formState.isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending OTP...
          </>
        ) : (
          "Send OTP"
        )}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Development tip: after sending, open the backend terminal — the OTP is printed there.
      </p>
    </form>
  );
}
