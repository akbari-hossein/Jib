import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { PurchasingPowerSentence } from "@/components/finance/purchasing-power-hint";
import { MoneyDisplay } from "@/components/money/money-display";
import { UsageBar } from "@/components/usage-bar";
import { MonthlyRecapPrompt } from "@/features/reports/monthly-recap-prompt";
import { MonthlyRecapShare } from "@/features/reports/monthly-recap-share";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { budgetUsageCopy, periodChangeCopy } from "@/lib/labels";
import type { RankedCategory } from "@/lib/finance/reports";
import type { BudgetStatus } from "@/lib/finance/types";
import type { ReportsDto } from "@/server/queries/reports";

function toneFor(status: BudgetStatus) {
  if (status === "over") return "expense" as const;
  if (status === "near") return "warning" as const;
  return "primary" as const;
}

export function ReportsView({ reports }: { reports: ReportsDto }) {
  if (!reports.hasActivity) {
    return (
      <main className="flex flex-col gap-6 px-5 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">گزارش‌ها</h1>
        {reports.previousRecap ? <MonthlyRecapPrompt recap={reports.previousRecap} /> : null}
        <EmptyState
          title="هنوز چیزی برای مرور نیست"
          description="چند خرج یا درآمد ثبت کن تا گزارش هفته و ماه اینجا جمع شود. بدون داده، جیب چیزی اختراع نمی‌کند."
        />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">گزارش‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          مرور آرام هفته و ماه — بدون جدول حسابداری.
        </p>
      </header>

      {reports.previousRecap ? <MonthlyRecapPrompt recap={reports.previousRecap} /> : null}

      <WeeklyCard week={reports.week} />
      <MonthlyCard month={reports.month} recap={reports.recap} />

      {reports.month.categories.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card px-5 py-4">
          <h2 className="text-base font-semibold">خرج به تفکیک دسته</h2>
          <CategoryList categories={reports.month.categories} />
        </section>
      ) : null}

      {reports.budget.items.length > 0 || reports.budget.overallUsage ? (
        <section className="rounded-3xl border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">عملکرد بودجه</h2>
            <Link href="/budgets" className="text-sm text-primary">
              بودجه
            </Link>
          </div>
          {reports.budget.overallUsage ? (
            <p className="mt-3 text-sm text-foreground/60">
              {budgetUsageCopy("ماه", reports.budget.overallUsage.pct, reports.budget.overallUsage.status)}
            </p>
          ) : null}
          <ul className="mt-3 flex flex-col gap-3">
            {reports.budget.items.map((item) => (
              <li key={item.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <span className="numeric-display text-foreground/55">
                    {formatToman(item.spent, { withUnit: false })} از {formatToman(item.limit, { withUnit: false })}
                  </span>
                </div>
                <div className="mt-2">
                  <UsageBar pct={item.usage.pct} tone={toneFor(item.usage.status)} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reports.goals.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">پیشرفت اهداف</h2>
            <Link href="/goals" className="text-sm text-primary">
              اهداف
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {reports.goals.map((goal) => (
              <li key={goal.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{goal.name}</span>
                  <span className="text-foreground/55">{toPersianDigits(goal.progress.pct)}٪</span>
                </div>
                <div className="mt-2">
                  <UsageBar
                    pct={goal.progress.pct}
                    tone={goal.progress.pct >= 100 ? "savings" : "primary"}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function WeeklyCard({ week }: { week: ReportsDto["week"] }) {
  return (
    <section id="week" className="scroll-mt-4 rounded-3xl border border-border bg-card px-5 py-4">
      <p className="text-xs text-foreground/45">{week.rangeLabel}</p>
      <h2 className="mt-1 text-base font-semibold">{week.title}</h2>
      {week.expenses === 0n && week.income === 0n ? (
        <p className="mt-3 text-sm leading-7 text-foreground/60">این هفته هنوز چیزی ثبت نشده.</p>
      ) : (
        <>
          <p className="mt-3 text-lg font-semibold">
            {formatCompactToman(week.expenses)} خرج کردی
          </p>
          <p className="mt-1 text-sm text-foreground/55">
            {periodChangeCopy(week.expenseChange, "week")}
          </p>
          {week.topCategory ? (
            <p className="mt-3 text-sm text-foreground/70">
              بیشترین هزینه: {week.topCategory.name} — {formatCompactToman(week.topCategory.amount)}
            </p>
          ) : null}
          {week.lowestCategory ? (
            <p className="mt-1 text-sm text-foreground/70">
              کمترین هزینه: {week.lowestCategory.name} — {formatCompactToman(week.lowestCategory.amount)}
            </p>
          ) : null}
          {week.savingsHint ? (
            <div className="mt-3">
              <PurchasingPowerSentence
                sentence={week.savingsHint.sentence}
                rateDateLabel={week.savingsHint.rateDateLabel}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function MonthlyCard({
  month,
  recap,
}: {
  month: ReportsDto["month"];
  recap: ReportsDto["recap"];
}) {
  return (
    <section className="rounded-3xl border border-border bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold">{month.title}</h2>
        {recap ? <MonthlyRecapShare recap={recap} /> : null}
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="درآمد" value={month.income} />
        <Row label="هزینه" value={month.expenses} />
        <Row
          label={month.net >= 0n ? "پس‌انداز" : "خرج بیشتر از درآمد"}
          value={month.net >= 0n ? month.net : -month.net}
        />
      </dl>
      {month.savingsRate != null ? (
        <p className="mt-4 text-sm text-foreground/60">
          نرخ پس‌انداز {toPersianDigits(month.savingsRate)}٪
        </p>
      ) : (
        <p className="mt-4 text-sm text-foreground/45">برای نرخ پس‌انداز، درآمد این ماه را ثبت کن.</p>
      )}
      {month.savingsHint ? (
        <div className="mt-3">
          <PurchasingPowerSentence
            sentence={month.savingsHint.sentence}
            rateDateLabel={month.savingsHint.rateDateLabel}
          />
        </div>
      ) : null}
      <p className="mt-2 text-sm text-foreground/55">
        {periodChangeCopy(month.expenseChange, "month")}
      </p>
      {month.topCategory ? (
        <p className="mt-3 text-sm text-foreground/70">
          بزرگ‌ترین دسته: {month.topCategory.name} — {formatCompactToman(month.topCategory.amount)}
        </p>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: bigint }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-foreground/55">{label}</dt>
      <dd>
        <MoneyDisplay amount={value} />
      </dd>
    </div>
  );
}

function CategoryList({ categories }: { categories: RankedCategory[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {categories.map((category) => (
        <li key={category.categoryId ?? "none"} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-surface-muted">
                <CategoryIcon name={category.icon} />
              </span>
              <span className="truncate text-sm">{category.name}</span>
            </div>
            <span className="numeric-display text-sm text-foreground/60">
              {formatCompactToman(category.amount)}
            </span>
          </div>
          <UsageBar pct={category.pct} tone="expense" />
        </li>
      ))}
    </ul>
  );
}
