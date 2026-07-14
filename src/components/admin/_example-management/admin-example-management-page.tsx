"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { AdminExampleManagementTable } from "./admin-example-management-table";
import type { AdminExampleManagementData } from "@/types/admin-example-management.types";

export function AdminExampleManagementPage({ data }: { data: AdminExampleManagementData }) {
  const [search, setSearch] = useState("");

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.items.slice(0, data.pageSize);
    return data.items.filter((item) => item.title.toLowerCase().includes(query)).slice(0, data.pageSize);
  }, [data.items, data.pageSize, search]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <PageHeader
          title="Example Management"
          description="Reference admin CRUD module — copy this pattern for Support, Reports, Activity Log, etc."
          className="mb-4"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search records..."
          className="max-w-md"
        />
      </div>
      <AdminExampleManagementTable items={visibleItems} />
    </div>
  );
}
