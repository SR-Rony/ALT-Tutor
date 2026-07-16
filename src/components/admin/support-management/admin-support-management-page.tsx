"use client";

import type { SupportManagementData } from "@/types/admin-support-management.types";

export function AdminSupportManagementPage({ data }: { data: SupportManagementData }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h1 className="text-2xl font-bold">SupportManagement</h1>
      <p className="mt-2 text-sm text-muted-foreground">{data.items.length} records loaded.</p>
    </div>
  );
}
