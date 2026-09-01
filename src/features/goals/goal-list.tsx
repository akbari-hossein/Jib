import { archiveGoal } from "@/server/actions/goals";
import { UsageBar } from "@/components/usage-bar";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/money/money-display";
import { GoalCurrentForm } from "@/features/goals/goal-current-form";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { formatJalaliDay, getTehranJalaliDate, jalaliFromUtc } from "@/lib/dates/tehran";
import type { GoalListItem } from "@/server/queries/goals";

export function GoalList({ goals }: { goals: GoalListItem[] }) {
  const today = getTehranJalaliDate();

  return (
    <ul className="flex flex-col gap-3">
      {goals.map((goal) => (
        <li key={goal.id} id={`goal-${goal.id}`} className="scroll-mt-4 rounded-3xl border border-border bg-card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{goal.name}</p>
              <p className="mt-1 text-xs text-foreground/45">
                {goal.linked ? `حساب ${goal.accountName}` : "رزرو از قابل‌خرج"}
                {goal.targetDate ? ` · ${formatJalaliDay(jalaliFromUtc(goal.targetDate), today)}` : ""}
              </p>
            </div>
            <form action={archiveGoal}>
              <input type="hidden" name="id" value={goal.id} />
              <Button type="submit" variant="ghost" size="sm">
                بایگانی
              </Button>
            </form>
          </div>
          <p className="mt-3 text-sm">
            <MoneyDisplay amount={goal.currentAmount} withUnit={false} className="font-semibold" />
            <span className="text-foreground/45"> از {formatToman(goal.targetAmount)}</span>
          </p>
          <div className="mt-2">
            <UsageBar pct={goal.progress.pct} tone={goal.progress.pct >= 100 ? "savings" : "primary"} />
          </div>
          <p className="mt-2 text-xs text-foreground/50">
            {toPersianDigits(goal.progress.pct)}٪ رسیده‌ای
            {goal.progress.monthlyNeed != null
              ? ` · هر ماه حدود ${formatCompactToman(goal.progress.monthlyNeed)}`
              : ""}
          </p>
          {goal.linked ? null : (
            <GoalCurrentForm key={`${goal.id}-${goal.currentAmount.toString()}`} id={goal.id} currentAmount={goal.currentAmount.toString()} />
          )}
        </li>
      ))}
    </ul>
  );
}
