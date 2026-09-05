import type { ReactNode } from "react";
import { formatCount, trendCopy, type CountTrend } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  trend,
  period,
  hint,
}: {
  label: string;
  value: number;
  trend?: CountTrend;
  period?: "day" | "week" | "month";
  hint?: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="numeric-display mt-2 text-3xl font-semibold tracking-tight">{formatCount(value)}</p>
      {trend && period ? (
        <p
          className={cn(
            "mt-2 text-xs leading-6",
            trend.direction === "up" && "text-income",
            trend.direction === "down" && "text-expense",
            (trend.direction === "flat" || trend.direction === "new") && "text-muted-foreground",
          )}
        >
          {trendCopy(trend, period)}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{hint}</p>
      ) : null}
    </article>
  );
}
