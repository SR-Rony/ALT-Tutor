"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";
import { buildPlatformMetricsChart, buildUserRoleChart } from "@/lib/admin-chart-data";
import type {
  AdminCourse,
  AdminDashboardStats,
  AdminPayment,
  AdminUser,
} from "@/types/admin-dashboard.types";

interface AdminDashboardChartsProps {
  stats?: AdminDashboardStats;
  users: AdminUser[];
  courses: AdminCourse[];
  payments: AdminPayment[];
}

function CustomBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const display = item.name === "Revenue" ? formatMoney(item.value) : formatNumber(item.value);

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <p className="mt-1 text-muted-foreground">{display}</p>
    </div>
  );
}

export function AdminDashboardCharts({
  stats,
  users,
  courses,
  payments,
}: AdminDashboardChartsProps) {
  const roleData = buildUserRoleChart(users);
  const metricsData = buildPlatformMetricsChart(stats, courses, payments);
  const totalUsers = roleData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base">Analytics overview</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          User distribution and platform metrics from live database data.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-8 xl:grid-cols-[minmax(260px,320px)_1fr]">
          {/* Round chart — User distribution */}
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">User distribution</h3>
            <p className="mt-1 text-xs text-muted-foreground">Students, teachers, and admins</p>

            {roleData.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
                No user data yet.
              </div>
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-5">
                <div className="relative h-[220px] w-full max-w-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={86}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {roleData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [formatNumber(value), name]}
                        contentStyle={{
                          borderRadius: 12,
                          borderColor: "#dce4f0",
                          boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Users
                    </p>
                  </div>
                </div>

                <ul className="w-full space-y-2">
                  {roleData.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {item.value}
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          ({totalUsers ? Math.round((item.value / totalUsers) * 100) : 0}%)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* One multi-column chart — all other metrics */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Platform metrics</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Each column is a different metric with its own color
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {metricsData.map((item) => (
                  <span
                    key={item.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fill: "#58688b", fontSize: 11 }}
                    height={48}
                    angle={-18}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#58688b", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "rgba(24,119,242,0.05)" }} content={<CustomBarTooltip />} />
                  <Bar dataKey="value" radius={[10, 10, 4, 4]} maxBarSize={42}>
                    {metricsData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
