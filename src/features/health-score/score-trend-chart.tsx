"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/features/reports/components/chart-card";
import {
  CHART_AXIS_TICK,
  CHART_COLOR,
  formatChartScore,
} from "@/features/reports/components/chart-theme";
import { ChartTooltip } from "@/features/reports/components/chart-tooltip";
import { HEALTH_SCORE_COPY } from "@/lib/finance/financial-health-copy";
import type { FinancialHealthDto } from "@/server/queries/financial-health";

export function ScoreTrendChart({ history }: { history: FinancialHealthDto["history"] }) {
  if (history.length < 2) {
    return null;
  }

  const first = history[0]!;
  const last = history[history.length - 1]!;
  const summary =
    last.totalScore === first.totalScore
      ? `امتیاز ${last.monthLabel} مثل ${first.monthLabel} است.`
      : last.totalScore > first.totalScore
        ? `امتیاز ${last.monthLabel} نسبت به ${first.monthLabel} بالاتر آمده.`
        : `امتیاز ${last.monthLabel} نسبت به ${first.monthLabel} کمتر شده.`;

  return (
    <ChartCard title={HEALTH_SCORE_COPY.trendTitle} summary={summary}>
      <div className="mt-4 h-48 w-full" dir="ltr" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
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
              width={28}
              domain={[0, 100]}
              tickFormatter={formatChartScore}
              tickCount={5}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={({ active, label, payload }) => {
                const value = payload?.[0]?.value;
                return (
                  <ChartTooltip
                    active={active}
                    label={typeof label === "string" ? label : undefined}
                    kind="score"
                    rows={
                      typeof value === "number"
                        ? [{ name: HEALTH_SCORE_COPY.title, value, color: CHART_COLOR.savings }]
                        : []
                    }
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="totalScore"
              stroke={CHART_COLOR.savings}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLOR.savings, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: CHART_COLOR.savings, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
