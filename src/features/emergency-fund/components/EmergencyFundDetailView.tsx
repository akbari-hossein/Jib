"use client";

import { useState } from "react";
import { UsageBar } from "@/components/usage-bar";
import { WhyThisNumber } from "@/components/finance/why-this-number";
import { MoneyDisplay } from "@/components/money/money-display";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";
import { GoalCurrentForm } from "@/features/goals/goal-current-form";
import { EmergencyFundSetupForm } from "@/features/emergency-fund/components/EmergencyFundSetupForm";
import {
  EMERGENCY_FUND_COPY,
  averageBasisCopy,
  forecastCopy,
  recentAverageCopy,
  targetCoverageCopy,
} from "@/features/emergency-fund/copy";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { archiveGoal } from "@/server/actions/goals";
import type { EmergencyFundData } from "@/server/emergencyFund/getEmergencyFundData";

function toToman(amount: number): bigint {
  return BigInt(Math.max(0, Math.round(amount)));
}

export function EmergencyFundDetailView({ data }: { data: EmergencyFundData }) {
  const [editing, setEditing] = useState(false);
  const goal = data.goal;
  if (!goal) {
    return <EmergencyFundSetupForm data={data} />;
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <Button type="button" variant="ghost" className="self-start" onClick={() => setEditing(false)}>
          بازگشت
        </Button>
        <EmergencyFundSetupForm data={data} mode="edit" onSaved={() => setEditing(false)} />
      </div>
    );
  }

  const averageLabel = formatToman(toToman(data.average));
  const forecastLine =
    data.progress.remainingAmount <= 0
      ? EMERGENCY_FUND_COPY.reached
      : data.forecast.months == null
        ? EMERGENCY_FUND_COPY.notSaving
        : forecastCopy(data.forecast.months);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card px-5 py-5">
        <p className="text-sm">
          <MoneyDisplay amount={toToman(data.progress.currentAmount)} withUnit={false} className="text-lg font-semibold" />
          <span className="text-muted-foreground"> از {formatToman(toToman(data.progress.targetAmount))}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {toPersianDigits(data.progress.progressPercent)}
          {EMERGENCY_FUND_COPY.progressLabel}
        </p>
        <div className="mt-3">
          <UsageBar
            pct={data.progress.progressPercent}
            tone={data.progress.progressPercent >= 100 ? "savings" : "primary"}
          />
        </div>

        <div className="mt-5 space-y-2 text-sm leading-7 text-muted-foreground">
          <p>{targetCoverageCopy(goal.targetMonths)}</p>
          <p>
            {averageBasisCopy(averageLabel, data.monthsUsed, data.usingEstimate)}
            {data.usingEstimate ? null : (
              <>
                <br />
                {recentAverageCopy(data.monthsUsed)}
              </>
            )}
          </p>
          {data.usingEstimate ? <p>{EMERGENCY_FUND_COPY.estimateUsed}</p> : null}
          <p>{forecastLine}</p>
          {data.sufficientData ? null : <p>{EMERGENCY_FUND_COPY.insufficientData}</p>}
        </div>

        <WhyThisNumber className="mt-5" label={EMERGENCY_FUND_COPY.categoryDisclosure}>
          {data.selectedCategories.length === 0 ? (
            <p>هنوز دسته‌ای انتخاب نشده.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.selectedCategories.map((category) => (
                <li key={category.id} className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-surface-muted">
                    <CategoryIcon name={category.icon} />
                  </span>
                  <span>{category.name}</span>
                </li>
              ))}
            </ul>
          )}
        </WhyThisNumber>
      </section>

      <section className="rounded-3xl border border-border bg-card px-5 py-5">
        <p className="mb-3 text-sm font-medium">{EMERGENCY_FUND_COPY.currentAmountLabel}</p>
        <GoalCurrentForm id={goal.id} currentAmount={String(Math.round(goal.currentAmount))} />
      </section>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
          {EMERGENCY_FUND_COPY.editSettings}
        </Button>
        <form action={archiveGoal}>
          <input type="hidden" name="id" value={goal.id} />
          <Button type="submit" variant="ghost" className="w-full">
            {EMERGENCY_FUND_COPY.archive}
          </Button>
        </form>
      </div>
    </div>
  );
}
