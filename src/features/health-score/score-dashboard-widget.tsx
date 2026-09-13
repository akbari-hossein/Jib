import Link from "next/link";
import { toPersianDigits } from "@/lib/currency/format";
import { HEALTH_SCORE_COPY, scoreDeltaCopy } from "@/lib/finance/financial-health-copy";
import type { HealthScoreWidgetDto } from "@/server/queries/financial-health";

export function ScoreDashboardWidget({ health }: { health: HealthScoreWidgetDto }) {
  return (
    <Link
      href="/health-score"
      className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card px-5 py-4 transition-colors hover:bg-surface-muted"
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{HEALTH_SCORE_COPY.title}</p>
        {health.ready && health.totalScore != null ? (
          <>
            <p className="numeric-display mt-1 text-2xl font-semibold tracking-tight">
              {toPersianDigits(health.totalScore)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {scoreDeltaCopy(health.scoreDelta, health.trend)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm leading-7 text-muted-foreground">{HEALTH_SCORE_COPY.widgetPending}</p>
        )}
      </div>
      <span className="text-sm text-primary">{HEALTH_SCORE_COPY.openScore}</span>
    </Link>
  );
}
