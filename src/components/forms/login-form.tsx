"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/config";
import { authService, roleHomeRoutes } from "@/services/auth.service";
import { setUser, useAppDispatch } from "@/store";
import { loginSchema, type LoginFormValues } from "@/validations";
import { cn } from "@/utils";
import type { ApiError } from "@/types";

const DEMO_PASSWORD = "Password123!";

const demoAccounts = [
  {
    role: "Admin",
    phone: "01700000001",
    password: DEMO_PASSWORD,
    hint: "Full platform control",
  },
  {
    role: "Teacher",
    phone: "01700000002",
    password: DEMO_PASSWORD,
    hint: "Courses & students",
  },
  {
    role: "Student",
    phone: "01700000003",
    password: DEMO_PASSWORD,
    hint: "Learning dashboard",
  },
] as const;

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: env.useMockApi
      ? { phone: "01700000003", password: "password" }
      : { phone: "01700000001", password: DEMO_PASSWORD },
  });

  const activePhone = watch("phone");
  const busy = isSubmitting || redirecting;

  async function onSubmit(values: LoginFormValues) {
    try {
      setError(null);
      const user = await authService.login(values);
      dispatch(setUser(user));
      setRedirecting(true);
      router.push(roleHomeRoutes[user.role]);
      router.refresh();
    } catch (err) {
      setRedirecting(false);
      const apiError = err as ApiError;
      setError(apiError?.message || "Login failed. Please check your phone and password.");
    }
  }

  function fillDemo(phone: string, password: string) {
    setValue("phone", phone, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {!env.useMockApi ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick demo login
          </p>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((account) => {
              const selected = activePhone === account.phone;
              return (
                <button
                  key={account.role}
                  type="button"
                  disabled={busy}
                  onClick={() => fillDemo(account.phone, account.password)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <span className="block text-xs font-bold">{account.role}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight opacity-80">{account.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="login-phone" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Phone number
        </label>
        <Input
          id="login-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01700000001"
          disabled={busy}
          className={cn("h-11", errors.phone && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15")}
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={busy}
          className={cn(
            "h-11",
            errors.password && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#ef3239]/20 bg-[#ef3239]/5 px-4 py-3 text-sm font-medium text-[#ef3239]">
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

      {!env.useMockApi ? (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Demo password for all roles:{" "}
          <span className="font-medium text-[#1a2b5e]">{DEMO_PASSWORD}</span>
        </p>
      ) : null}
    </form>
  );
}
