"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSafeNextParam } from "@/lib/next-param";
import { authService, roleHomeRoutes } from "@/services/auth.service";
import { setUser, useAppDispatch } from "@/store";
import {
  registerDetailsSchema,
  registerOtpSchema,
  type RegisterFormValues,
  type RegisterOtpFormValues,
} from "@/validations";
import { cn } from "@/utils";
import type { ApiError } from "@/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#ef3239]">{message}</p>;
}

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [pending, setPending] = useState<RegisterFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const detailsForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerDetailsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", phone: "", password: "", confirmPassword: "" },
  });

  const otpForm = useForm<RegisterOtpFormValues>({
    resolver: zodResolver(registerOtpSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { otp: "" },
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

  async function requestOtp(values: RegisterFormValues) {
    setError(null);
    setInfo(null);
    setSendingOtp(true);
    try {
      const result = await authService.sendOtp({
        phone: values.phone,
        purpose: "REGISTER",
      });
      setPending(values);
      setStep("otp");
      setInfo(
        result.message ||
          "OTP sent. In development, check the backend terminal console for the code."
      );
      startResendCooldown();
      otpForm.reset({ otp: "" });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Could not send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function onVerifyAndRegister(values: RegisterOtpFormValues) {
    if (!pending) {
      setError("Please fill your registration details first.");
      setStep("details");
      return;
    }

    setError(null);
    try {
      const user = await authService.register({
        name: pending.name,
        phone: pending.phone,
        password: pending.password,
        otp: values.otp,
      });
      dispatch(setUser(user));
      const next = getSafeNextParam(window.location.search);
      router.push(next ?? roleHomeRoutes[user.role]);
      router.refresh();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Registration failed. Please check the OTP and try again.");
    }
  }

  async function onResend() {
    if (!pending || resendSeconds > 0 || sendingOtp) return;
    await requestOtp(pending);
  }

  if (step === "otp" && pending) {
    return (
      <form
        onSubmit={otpForm.handleSubmit(onVerifyAndRegister)}
        className="space-y-5"
        noValidate
      >
        <div className="rounded-xl border border-[#1877f2]/20 bg-[#1877f2]/5 px-4 py-3 text-sm text-[#1a2b5e]">
          <p className="font-semibold">Verify {pending.phone}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Enter the 6-digit OTP. In development mode the code is printed in the{" "}
            <span className="font-semibold text-[#1a2b5e]">backend terminal</span>.
          </p>
        </div>

        {info ? (
          <div className="rounded-xl border border-[#12b76a]/25 bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
            {info}
          </div>
        ) : null}

        <div>
          <label htmlFor="register-otp" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
            OTP code
          </label>
          <Input
            id="register-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            maxLength={6}
            aria-invalid={Boolean(otpForm.formState.errors.otp)}
            className={cn(
              "h-11 tracking-[0.35em]",
              otpForm.formState.errors.otp &&
                "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
            )}
            {...otpForm.register("otp")}
          />
          <FieldError message={otpForm.formState.errors.otp?.message} />
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
          disabled={otpForm.formState.isSubmitting}
        >
          {otpForm.formState.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Creating account...
            </>
          ) : (
            "Verify OTP & create account"
          )}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            className="font-semibold text-[#1877f2] hover:underline"
            onClick={() => {
              setStep("details");
              setError(null);
              setInfo(null);
            }}
          >
            Edit details
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
      </form>
    );
  }

  return (
    <form
      onSubmit={detailsForm.handleSubmit(requestOtp)}
      className="space-y-5"
      noValidate
    >
      <div>
        <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Full name
        </label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          aria-invalid={Boolean(detailsForm.formState.errors.name)}
          className={cn(
            "h-11",
            detailsForm.formState.errors.name &&
              "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...detailsForm.register("name")}
        />
        <FieldError message={detailsForm.formState.errors.name?.message} />
      </div>

      <div>
        <label htmlFor="register-phone" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Phone number
        </label>
        <Input
          id="register-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01712345678"
          aria-invalid={Boolean(detailsForm.formState.errors.phone)}
          className={cn(
            "h-11",
            detailsForm.formState.errors.phone &&
              "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...detailsForm.register("phone")}
        />
        <FieldError message={detailsForm.formState.errors.phone?.message} />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Password
        </label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          aria-invalid={Boolean(detailsForm.formState.errors.password)}
          className={cn(
            "h-11",
            detailsForm.formState.errors.password &&
              "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...detailsForm.register("password")}
        />
        <FieldError message={detailsForm.formState.errors.password?.message} />
      </div>

      <div>
        <label
          htmlFor="register-confirm-password"
          className="mb-2 block text-sm font-semibold text-[#1a2b5e]"
        >
          Confirm password
        </label>
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          aria-invalid={Boolean(detailsForm.formState.errors.confirmPassword)}
          className={cn(
            "h-11",
            detailsForm.formState.errors.confirmPassword &&
              "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...detailsForm.register("confirmPassword")}
        />
        <FieldError message={detailsForm.formState.errors.confirmPassword?.message} />
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
        disabled={sendingOtp || detailsForm.formState.isSubmitting}
      >
        {sendingOtp || detailsForm.formState.isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending OTP...
          </>
        ) : (
          "Continue with OTP"
        )}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        We verify your phone with OTP before creating the account. In development, the OTP appears
        in the backend terminal.
      </p>
    </form>
  );
}
