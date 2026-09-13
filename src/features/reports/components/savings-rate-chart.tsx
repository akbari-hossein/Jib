"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/features/reports/components/chart-card";
import {
  CHART_AXIS_TICK,
  CHART_COLOR,
  formatChartPercent,
} from "@/features/reports/components/chart-theme";
import { ChartTooltip } from "@/features/reports/components/chart-tooltip";
import type { ReportChartsDto } from "@/lib/finance/report-charts";

export function SavingsRateChart({
  series,
}: {
  series: NonNullable<ReportChartsDto["savingsRate"]>;
}) {
  return (
    <ChartCard title="نرخ پس‌انداز" summary={series.summary}>
      <div className="mt-4 h-48 w-full" dir="ltr" role="img" aria-label={series.summary}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.points} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
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
              width={36}
              tickFormatter={formatChartPercent}
              tickCount={4}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={({ active, label, payload }) => {
                const value = payload?.[0]?.value;
                return (
                  <ChartTooltip
                    active={active}
                    label={typeof label === "string" ? label : undefined}
                    kind="percent"
                    rows={
                      typeof value === "number"
                        ? [{ name: "نرخ پس‌انداز", value, color: CHART_COLOR.savings }]
                        : []
                    }
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={CHART_COLOR.savings}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLOR.savings, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: CHART_COLOR.savings, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
