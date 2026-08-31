"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/config";
import { ROUTES } from "@/constants";
import { getSafeNextParam } from "@/lib/next-param";
import { authService, roleHomeRoutes } from "@/services/auth.service";
import { setUser, useAppDispatch } from "@/store";
import { loginSchema, type LoginFormValues } from "@/validations";
import { cn } from "@/utils";
import type { ApiError } from "@/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#ef3239]">{message}</p>;
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: env.useMockApi
      ? { phone: "01700000003", password: "password" }
      : { phone: "", password: "" },
  });

  const busy = isSubmitting || redirecting;

  async function onSubmit(values: LoginFormValues) {
    try {
      setError(null);
      const user = await authService.login(values);
      dispatch(setUser(user));
      setRedirecting(true);
      const next = getSafeNextParam(window.location.search);
      router.push(next ?? roleHomeRoutes[user.role]);
      router.refresh();
    } catch (err) {
      setRedirecting(false);
      const apiError = err as ApiError;
      setError(apiError?.message || "Login failed. Please check your phone and password.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="login-phone" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Phone number
        </label>
        <Input
          id="login-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01712345678"
          disabled={busy}
          aria-invalid={Boolean(errors.phone)}
          className={cn(
            "h-11",
            (errors.phone || (isSubmitted && error)) &&
              "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="block text-sm font-semibold text-[#1a2b5e]">
            Password
          </label>
          <Link
            href={ROUTES.auth.forgotPassword}
            className="text-xs font-semibold text-[#1877f2] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={busy}
          aria-invalid={Boolean(errors.password)}
          className={cn(
            "h-11",
            errors.password && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ef3239]/20 bg-[#ef3239]/5 px-4 py-3 text-sm font-medium text-[#ef3239]"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="default" size="pill" className="w-full text-base" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {redirecting ? "Loading dashboard..." : "Signing in..."}
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
