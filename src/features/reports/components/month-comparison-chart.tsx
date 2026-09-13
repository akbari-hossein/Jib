"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/features/reports/components/chart-card";
import {
  CHART_AXIS_TICK,
  CHART_COLOR,
  formatChartToman,
} from "@/features/reports/components/chart-theme";
import { ChartTooltip } from "@/features/reports/components/chart-tooltip";
import type { ReportChartsDto } from "@/lib/finance/report-charts";

export function MonthComparisonChart({
  comparison,
}: {
  comparison: NonNullable<ReportChartsDto["comparison"]>;
}) {
  return (
    <ChartCard title="مقایسه با ماه قبل" summary={comparison.summary}>
      <div className="mt-4 h-44 w-full" dir="ltr" role="img" aria-label={comparison.summary}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparison.bars} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={formatChartToman}
              tickCount={3}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as
                  | { label: string; amount: number }
                  | undefined;
                return (
                  <ChartTooltip
                    active={active}
                    label={item?.label}
                    rows={
                      item
                        ? [{ name: "هزینه", value: item.amount, color: CHART_COLOR.expense }]
                        : []
                    }
                  />
                );
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={56} isAnimationActive={false}>
              {comparison.bars.map((bar) => (
                <Cell
                  key={bar.label}
                  fill={bar.isCurrent ? CHART_COLOR.expense : CHART_COLOR.muted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
