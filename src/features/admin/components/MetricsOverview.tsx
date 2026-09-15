"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCount } from "@/lib/admin/format";
import { formatToman } from "@/lib/currency/format";
import {
  CHART_AXIS_TICK,
  CHART_COLOR,
  formatChartToman,
} from "@/features/reports/components/chart-theme";
import { ChartTooltip } from "@/features/reports/components/chart-tooltip";
import { ADMIN_METRICS_LABEL, formatJalaliMonthKey } from "@/lib/subscription/admin-copy";
import type { AdminMetrics } from "@/lib/subscription/metrics";

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="numeric-display mt-2 text-3xl font-semibold tracking-tight">{formatCount(value)}</p>
    </article>
  );
}

function MoneyCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="numeric-display mt-2 text-2xl font-semibold tracking-tight">
        {formatToman(BigInt(value))}
      </p>
    </article>
  );
}

export function MetricsOverview({ metrics }: { metrics: AdminMetrics }) {
  const chartData = metrics.revenueByMonth.map((row) => ({
    ...row,
    label: formatJalaliMonthKey(row.jalaliMonth),
  }));

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <CountCard label={ADMIN_METRICS_LABEL.activeSubscribers} value={metrics.activeSubscribers} />
        <CountCard label={ADMIN_METRICS_LABEL.trialingUsers} value={metrics.trialingUsers} />
        <CountCard label={ADMIN_METRICS_LABEL.pendingReview} value={metrics.pendingReview} />
        <CountCard label={ADMIN_METRICS_LABEL.expiredOrRejected} value={metrics.expiredOrRejected} />
        <MoneyCard label={ADMIN_METRICS_LABEL.revenueThisMonthToman} value={metrics.revenueThisMonthToman} />
        <MoneyCard label={ADMIN_METRICS_LABEL.totalRevenueToman} value={metrics.totalRevenueToman} />
        <MoneyCard label={ADMIN_METRICS_LABEL.mrr} value={metrics.mrr} />
        <CountCard
          label={ADMIN_METRICS_LABEL.newSubscribersThisMonth}
          value={metrics.newSubscribersThisMonth}
        />
      </section>

      <figure className="rounded-3xl border border-border bg-card p-5 shadow-xs">
        <figcaption className="text-sm font-medium">درآمد شش ماه اخیر</figcaption>
        <div className="mt-4 h-52 w-full" dir="ltr" role="img" aria-label="درآمد شش ماه اخیر">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis
                tick={CHART_AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={formatChartToman}
                tickCount={3}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  const item = payload?.[0]?.payload as
                    | { label: string; totalToman: number }
                    | undefined;
                  return (
                    <ChartTooltip
                      active={active}
                      label={item?.label}
                      rows={
                        item
                          ? [{ name: "درآمد", value: item.totalToman, color: CHART_COLOR.savings }]
                          : []
                      }
                    />
                  );
                }}
              />
              <Bar
                dataKey="totalToman"
                fill={CHART_COLOR.savings}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}
