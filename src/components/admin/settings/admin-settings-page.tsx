"use client";

import { useEffect, useState } from "react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks";
import { serializeRichText } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type { PlatformSettings } from "@/types/settings.types";
import { cn } from "@/utils";

type FormState = {
  siteName: string;
  tagline: string;
  description: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
};

function toForm(data: PlatformSettings): FormState {
  return {
    siteName: data.siteName ?? "",
    tagline: data.tagline ?? "",
    description: data.description ?? "",
    companyName: data.companyName ?? "",
    supportEmail: data.supportEmail ?? "",
    supportPhone: data.supportPhone ?? "",
    websiteUrl: data.websiteUrl ?? "",
    facebookUrl: data.facebookUrl ?? "",
    twitterUrl: data.twitterUrl ?? "",
    youtubeUrl: data.youtubeUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    maintenanceMode: data.maintenanceMode,
    allowRegistration: data.allowRegistration,
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function AdminSettingsPage() {
  const { data, isLoading, error, refetch } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm(toForm(data));
  }, [data]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMessage(null);
    setFormError(null);

    const siteName = form.siteName.trim();
    if (!siteName) {
      setFormError("Site name is required.");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        siteName,
        tagline: form.tagline.trim(),
        description: serializeRichText(form.description),
        companyName: form.companyName.trim(),
        supportEmail: emptyToNull(form.supportEmail),
        supportPhone: emptyToNull(form.supportPhone),
        websiteUrl: emptyToNull(form.websiteUrl),
        facebookUrl: emptyToNull(form.facebookUrl),
        twitterUrl: emptyToNull(form.twitterUrl),
        youtubeUrl: emptyToNull(form.youtubeUrl),
        instagramUrl: emptyToNull(form.instagramUrl),
        linkedinUrl: emptyToNull(form.linkedinUrl),
        maintenanceMode: form.maintenanceMode,
        allowRegistration: form.allowRegistration,
      });
      setMessage("Settings saved successfully.");
    } catch (err) {
      setFormError((err as ApiError)?.message || "Failed to save settings");
    }
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform settings"
          description="Configure branding, contact details, and platform options."
          className="mb-0"
        />
        <PageLoader label="Loading settings..." />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <PageHeader title="Platform settings" description="Configure branding and platform options." className="mb-0" />
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Failed to load settings."}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <PageHeader
          title="Platform settings"
          description="Manage site branding, support contacts, social links, and access options."
          className="mb-0"
        />
      </div>

      <form onSubmit={(e) => void onSave(e)} className="space-y-6">
        <Section title="General" description="Public branding shown across the platform.">
          <Field label="Site name" htmlFor="site-name" required>
            <Input
              id="site-name"
              value={form.siteName}
              onChange={(e) => setField("siteName", e.target.value)}
              required
            />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <RichTextEditor
              id="description"
              value={form.description}
              onChange={(description) => setField("description", description)}
              placeholder="Short site description for SEO and footer"
              minHeight="120px"
            />
          </Field>
          <Field label="Company name" htmlFor="company">
            <Input
              id="company"
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Contact" description="Support channels students and educators can use.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email" htmlFor="support-email">
              <Input
                id="support-email"
                type="email"
                value={form.supportEmail}
                onChange={(e) => setField("supportEmail", e.target.value)}
                placeholder="support@example.com"
              />
            </Field>
            <Field label="Support phone" htmlFor="support-phone">
              <Input
                id="support-phone"
                value={form.supportPhone}
                onChange={(e) => setField("supportPhone", e.target.value)}
                placeholder="16780"
              />
            </Field>
          </div>
          <Field label="Website URL" htmlFor="website">
            <Input
              id="website"
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setField("websiteUrl", e.target.value)}
              placeholder="https://"
            />
          </Field>
        </Section>

        <Section title="Social links" description="Optional profiles linked from the public site.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["facebookUrl", "Facebook"],
                ["twitterUrl", "Twitter / X"],
                ["youtubeUrl", "YouTube"],
                ["instagramUrl", "Instagram"],
                ["linkedinUrl", "LinkedIn"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label} htmlFor={key}>
                <Input
                  id={key}
                  type="url"
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder="https://"
                />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Access" description="Control registration and maintenance mode.">
          <ToggleRow
            label="Allow registration"
            description="When off, new students cannot create accounts."
            checked={form.allowRegistration}
            onChange={(v) => setField("allowRegistration", v)}
          />
          <ToggleRow
            label="Maintenance mode"
            description="Show a maintenance notice while you work on the platform."
            checked={form.maintenanceMode}
            onChange={(v) => setField("maintenanceMode", v)}
            danger
          />
        </Section>

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

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save settings"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={updateSettings.isPending || !data}
            onClick={() => {
              if (data) setForm(toForm(data));
              setMessage(null);
              setFormError(null);
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border px-4 py-3 transition hover:bg-muted/40">
      <span>
        <span className={cn("block text-sm font-semibold", danger && checked && "text-accent")}>
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
