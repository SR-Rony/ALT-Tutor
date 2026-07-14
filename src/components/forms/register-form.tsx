"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService, roleHomeRoutes } from "@/services/auth.service";
import { useAuthStore } from "@/store";
import { registerSchema, type RegisterFormValues } from "@/validations";
import { cn } from "@/utils";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#ef3239]">{message}</p>;
}

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      setError(null);
      const user = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setUser(user);
      router.push(roleHomeRoutes[user.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Full name
        </label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          className={cn("h-11", errors.name && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15")}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Email address
        </label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn("h-11", errors.email && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15")}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Password
        </label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          className={cn("h-11", errors.password && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15")}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div>
        <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-semibold text-[#1a2b5e]">
          Confirm password
        </label>
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          className={cn(
            "h-11",
            errors.confirmPassword && "border-[#ef3239]/50 focus:border-[#ef3239] focus:ring-[#ef3239]/15"
          )}
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#ef3239]/20 bg-[#ef3239]/5 px-4 py-3 text-sm font-medium text-[#ef3239]">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="default" size="pill" className="w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account, you agree to our terms of service and privacy policy.
      </p>
    </form>
  );
}
