import { toPersianDigits } from "@/lib/currency/format";
import { HEALTH_SCORE_COPY, scoreDeltaCopy } from "@/lib/finance/financial-health-copy";
import { cn } from "@/lib/utils";
import type { FinancialHealthDto } from "@/server/queries/financial-health";

export function ScoreHero({ current }: { current: FinancialHealthDto["current"] }) {
  const strong = current.totalScore != null && current.totalScore >= 80;

  return (
    <section className="flex flex-col">
      <p className="text-xs font-medium text-muted-foreground">{HEALTH_SCORE_COPY.title}</p>
      {current.totalScore != null ? (
        <p
          className={cn(
            "numeric-display mt-3 text-4xl font-semibold tracking-tight break-words",
            strong && "text-savings",
          )}
        >
          {toPersianDigits(current.totalScore)}
        </p>
      ) : (
        <p className="numeric-display mt-3 text-4xl font-semibold tracking-tight text-foreground/25">
          — — —
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        {scoreDeltaCopy(current.scoreDelta, current.trend)}
      </p>
      <p className="mt-4 text-[15px] leading-7">{current.explanation}</p>
    </section>
  );
}
