"use client";

import { useEffect, useState } from "react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentProfile, useUpdateStudentProfile } from "@/hooks";
import { setUser, useAppDispatch, useAppSelector } from "@/store";
import type { ApiError } from "@/types";

export function TeacherSettingsPage() {
  const { data, isLoading, error, refetch } = useStudentProfile();
  const updateProfile = useUpdateStudentProfile();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setName(data.name ?? "");
    setEmail(data.email ?? "");
    setPhone(data.phone ?? "");
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your teacher profile." className="mb-0" />
        <PageLoader label="Loading profile..." />
      </div>
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    try {
      const updated = await updateProfile.mutateAsync({
        name: name.trim(),
        email: email.trim() || undefined,
      });
      if (user) {
        dispatch(
          setUser({
            ...user,
            name: updated.name,
            email: updated.email ?? undefined,
            avatar: updated.avatar ?? undefined,
          })
        );
      }
      setMessage("Profile updated successfully.");
    } catch (err) {
      setFormError((err as ApiError)?.message || "Failed to update profile");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <PageHeader
          title="Teacher profile"
          description="Update your display name and email. Phone number is your login ID and cannot be changed here."
          className="mb-0"
        />
        {error ? (
          <p className="mt-3 text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load"}
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Retry
            </button>
          </p>
        ) : null}
      </div>

      <form
        onSubmit={onSave}
        className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"
      >
        <div>
          <label htmlFor="teacher-name" className="mb-1.5 block text-sm font-semibold text-foreground">
            Full name
          </label>
          <Input
            id="teacher-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label htmlFor="teacher-email" className="mb-1.5 block text-sm font-semibold text-foreground">
            Email
          </label>
          <Input
            id="teacher-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="teacher-phone" className="mb-1.5 block text-sm font-semibold text-foreground">
            Phone
          </label>
          <Input id="teacher-phone" value={phone} disabled className="bg-muted/60" />
          <p className="mt-1.5 text-xs text-muted-foreground">Used for login — contact admin to change.</p>
        </div>

        {message ? (
          <p className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            {message}
          </p>
        ) : null}
        {formError ? (
          <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
