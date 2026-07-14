"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/config";
import { authService, roleHomeRoutes } from "@/services/auth.service";
import { useAuthStore } from "@/store";
import { loginSchema, type LoginFormValues } from "@/validations";
import { cn } from "@/utils";
import type { ApiError } from "@/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#ef3239]">{message}</p>;
}

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: env.useMockApi
      ? { phone: "01700000003", password: "password" }
      : { phone: "01700000003", password: "Password123!" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setError(null);
      const user = await authService.login(values);
      setUser(user);
      router.push(roleHomeRoutes[user.role]);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Login failed. Please check your phone and password.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="login-phone" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Phone number
        </label>
        <Input
          id="login-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01700000003"
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
          className={cn("h-11", errors.password && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15")}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#ef3239]/20 bg-[#ef3239]/5 px-4 py-3 text-sm font-medium text-[#ef3239]">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="default" size="pill" className="w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      {!env.useMockApi ? (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Demo: <span className="font-medium text-[#1a2b5e]">01700000003</span> /{" "}
          <span className="font-medium text-[#1a2b5e]">Password123!</span>
        </p>
      ) : null}
    </form>
  );
}
