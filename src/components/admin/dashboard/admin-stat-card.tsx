"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/utils";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "green" | "neutral";
  loading?: boolean;
  format?: "number" | "money";
  formatter?: (value: number | string) => string;
}

const toneStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  green: "bg-[#ecfdf3] text-accent-green",
  neutral: "bg-muted text-muted-foreground",
} as const;

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  loading = false,
  formatter,
}: AdminStatCardProps) {
  const display = formatter ? formatter(value) : formatNumber(value);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">{display}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
