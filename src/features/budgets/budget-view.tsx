import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { UsageBar } from "@/components/usage-bar";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/money/money-display";
import { BudgetCategoryForm, OverallLimitForm } from "@/features/budgets/budget-form";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { budgetUsageCopy } from "@/lib/labels";
import { deleteBudgetCategory } from "@/server/actions/budgets";
import type { BudgetMonthDto } from "@/server/queries/budgets";
import type { BudgetStatus } from "@/lib/finance/types";

function toneFor(status: BudgetStatus) {
  if (status === "over") return "expense" as const;
  if (status === "near") return "warning" as const;
  return "primary" as const;
}

export function BudgetView({ budget }: { budget: BudgetMonthDto }) {
  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">بودجه</h1>
        <p className="mt-1 text-sm text-foreground/50">
          {budget.monthName} {toPersianDigits(budget.year)}
        </p>
      </header>

      {budget.overallUsage ? (
        <section className="rounded-3xl border border-border bg-surface px-5 py-4">
          <p className="text-xs text-foreground/45">سقف کل ماه</p>
          <p className="mt-1 text-lg font-semibold">
            <MoneyDisplay amount={budget.overallSpent} withUnit={false} />
            <span className="text-sm font-normal text-foreground/45">
              {" "}
              از {formatToman(budget.overallLimit ?? 0n)}
            </span>
          </p>
          <p className="mt-2 text-sm text-foreground/60">
            {budgetUsageCopy("ماه", budget.overallUsage.pct, budget.overallUsage.status)}
          </p>
          <div className="mt-3">
            <UsageBar pct={budget.overallUsage.pct} tone={toneFor(budget.overallUsage.status)} />
          </div>
        </section>
      ) : null}

      {budget.items.length === 0 ? (
        <EmptyState
          title="هنوز بودجه‌ای نداری"
          description="برای دسته‌های مهم مثل غذا سقف بگذار تا وسط ماه غافلگیر نشوی."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {budget.items.map((item) => (
            <li key={item.id} className="rounded-3xl border border-border bg-surface px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted">
                    <CategoryIcon name={item.icon} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {budgetUsageCopy(item.name, item.usage.pct, item.usage.status)}
                    </p>
                  </div>
                </div>
                <form action={deleteBudgetCategory}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    حذف
                  </Button>
                </form>
              </div>
              <p className="mt-3 text-sm">
                <MoneyDisplay amount={item.spent} withUnit={false} className="font-semibold" />
                <span className="text-foreground/45"> از {formatToman(item.limit)}</span>
              </p>
              <div className="mt-2">
                <UsageBar pct={item.usage.pct} tone={toneFor(item.usage.status)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold">سقف دسته</h2>
        <BudgetCategoryForm categories={budget.categories} />
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold">سقف کل</h2>
        <OverallLimitForm
          overallLimit={budget.overallLimit == null ? "" : budget.overallLimit.toString()}
        />
      </section>
    </main>
  );
}
