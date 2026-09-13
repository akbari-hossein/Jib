import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ScoreBreakdown } from "@/features/health-score/score-breakdown";
import { ScoreHero } from "@/features/health-score/score-hero";
import { ScoreShareButton } from "@/features/health-score/score-share-sheet";
import { ScoreTrendChart } from "@/features/health-score/score-trend-chart";
import { HEALTH_SCORE_COPY } from "@/lib/finance/financial-health-copy";
import type { FinancialHealthDto } from "@/server/queries/financial-health";

export function HealthScoreView({ health }: { health: FinancialHealthDto }) {
  if (!health.ready || health.current.totalScore == null) {
    return (
      <main className="flex flex-col gap-6 px-5 pt-8">
        <PageHeader title={HEALTH_SCORE_COPY.title} />
        <EmptyState
          title={HEALTH_SCORE_COPY.emptyTitle}
          description={HEALTH_SCORE_COPY.emptyDescription}
        />
      </main>
    );
  }

  const driver = health.current.subScores.find((part) => part.key === health.current.primaryDriver);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <PageHeader
        title={HEALTH_SCORE_COPY.title}
        action={
          <ScoreShareButton
            model={{
              totalScore: health.current.totalScore,
              trend: health.current.trend,
              scoreDelta: health.current.scoreDelta,
              driverKey: health.current.primaryDriver,
              driverRawValue: driver?.rawValue,
              driverPreviousValue: driver?.previousValue,
            }}
          />
        }
      />
      <ScoreHero current={health.current} />
      <ScoreBreakdown subScores={health.current.subScores} />
      <ScoreTrendChart history={health.history} />
    </main>
  );
}
