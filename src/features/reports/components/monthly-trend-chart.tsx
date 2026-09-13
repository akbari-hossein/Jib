"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartLegendDot } from "@/features/reports/components/chart-card";
import {
  CHART_AXIS_TICK,
  CHART_COLOR,
  formatChartToman,
} from "@/features/reports/components/chart-theme";
import { ChartTooltip } from "@/features/reports/components/chart-tooltip";
import type { ReportChartsDto } from "@/lib/finance/report-charts";

export function MonthlyTrendChart({
  trend,
}: {
  trend: NonNullable<ReportChartsDto["trend"]>;
}) {
  return (
    <ChartCard
      title="روند درآمد و هزینه"
      summary={trend.summary}
      legend={
        <span className="flex items-center gap-3">
          <ChartLegendDot color={CHART_COLOR.income} label="درآمد" />
          <ChartLegendDot color={CHART_COLOR.expense} label="هزینه" />
        </span>
      }
    >
      <div className="mt-4 h-48 w-full" dir="ltr" role="img" aria-label={trend.summary}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.points} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="monthLabel"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={formatChartToman}
              tickCount={3}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={typeof label === "string" ? label : undefined}
                  rows={(payload ?? []).flatMap((item) => {
                    if (typeof item.value !== "number") {
                      return [];
                    }
                    return [
                      {
                        name: item.dataKey === "income" ? "درآمد" : "هزینه",
                        value: item.value,
                        color: item.dataKey === "income" ? CHART_COLOR.income : CHART_COLOR.expense,
                      },
                    ];
                  })}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke={CHART_COLOR.income}
              fill={CHART_COLOR.income}
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={CHART_COLOR.expense}
              fill={CHART_COLOR.expense}
              fillOpacity={0.1}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
