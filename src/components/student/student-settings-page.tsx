"use client";

import { useEffect, useState } from "react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentProfile, useUpdateStudentProfile } from "@/hooks";
import { useAuthStore } from "@/store";
import type { ApiError } from "@/types";

export function StudentSettingsPage() {
  const { data, isLoading, error, refetch } = useStudentProfile();
  const updateProfile = useUpdateStudentProfile();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

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
        <PageHeader title="Settings" description="Manage your profile." className="mb-0" />
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
        setUser({
          ...user,
          name: updated.name,
          email: updated.email ?? undefined,
          avatar: updated.avatar ?? undefined,
        });
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
          title="Profile settings"
          description="Update your name and email. Phone number is fixed as your login ID."
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
        onSubmit={(e) => void onSave(e)}
        className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
      >
        <div>
          <label htmlFor="student-name" className="mb-2 block text-sm font-semibold text-foreground">
            Full name
          </label>
          <Input id="student-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="student-email" className="mb-2 block text-sm font-semibold text-foreground">
            Email
          </label>
          <Input
            id="student-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="student-phone" className="mb-2 block text-sm font-semibold text-foreground">
            Phone number
          </label>
          <Input
            id="student-phone"
            value={phone}
            disabled
            readOnly
            className="cursor-not-allowed bg-muted text-muted-foreground"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Phone cannot be changed — it is used for login.
          </p>
        </div>

        {formError ? (
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
            {formError}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-accent-green/20 bg-[#ecfdf3] px-4 py-3 text-sm text-accent-green">
            {message}
          </div>
        ) : null}

        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
