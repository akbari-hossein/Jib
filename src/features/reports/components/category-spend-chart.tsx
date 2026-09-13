"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/features/reports/components/chart-card";
import {
  CHART_AXIS_TICK,
  CHART_COLOR,
  formatChartToman,
} from "@/features/reports/components/chart-theme";
import { ChartTooltip } from "@/features/reports/components/chart-tooltip";
import type { ReportChartsDto } from "@/lib/finance/report-charts";

export function CategorySpendChart({
  categories,
}: {
  categories: NonNullable<ReportChartsDto["categories"]>;
}) {
  const height = Math.max(168, categories.items.length * 36);

  return (
    <ChartCard title="خرج به تفکیک دسته" summary={categories.summary}>
      <div
        className="mt-4 w-full"
        style={{ height }}
        dir="ltr"
        role="img"
        aria-label={categories.summary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={categories.items}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide tickFormatter={formatChartToman} />
            <YAxis
              type="category"
              dataKey="name"
              width={84}
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }}
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as
                  | { name: string; amount: number }
                  | undefined;
                return (
                  <ChartTooltip
                    active={active}
                    label={item?.name}
                    rows={
                      item
                        ? [{ name: "هزینه", value: item.amount, color: CHART_COLOR.expense }]
                        : []
                    }
                  />
                );
              }}
            />
            <Bar
              dataKey="amount"
              fill={CHART_COLOR.expense}
              radius={[0, 6, 6, 0]}
              barSize={14}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
