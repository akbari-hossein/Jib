import { toPersianDigits } from "@/lib/currency/format";
import { UsageBar } from "@/components/usage-bar";
import { HEALTH_SCORE_COPY } from "@/lib/finance/financial-health-copy";
import type { FinancialHealthDto } from "@/server/queries/financial-health";

export function ScoreBreakdown({
  subScores,
}: {
  subScores: FinancialHealthDto["current"]["subScores"];
}) {
  if (subScores.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border bg-card px-5 py-4">
      <h2 className="text-base font-semibold">{HEALTH_SCORE_COPY.breakdown}</h2>
      <ul className="mt-4 flex flex-col gap-5">
        {subScores.map((part) => (
          <li key={part.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{part.label}</p>
              {part.dataAvailable ? (
                <p className="numeric-display text-sm text-foreground/60">
                  {toPersianDigits(part.score)}
                </p>
              ) : null}
            </div>
            {part.dataAvailable ? (
              <div className="mt-2">
                <UsageBar pct={part.score} tone={part.score >= 80 ? "savings" : "primary"} />
              </div>
            ) : null}
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {part.dataAvailable ? part.explanation : HEALTH_SCORE_COPY.missingData}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
