"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService, roleHomeRoutes } from "@/services/auth.service";
import { useAuthStore } from "@/store";
import { loginSchema, type LoginFormValues } from "@/validations";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "student@example.com", password: "password" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setError(null);
      const user = await authService.login(values.email, values.password);
      setUser(user);
      router.push(roleHomeRoutes[user.role]);
    } catch {
      setError("Login failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@example.com" {...register("email")} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>
        <Input type="password" placeholder="••••••••" {...register("password")} />
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
