import { Badge } from "@/components/ui/badge";
import { BudgetProgress } from "@/components/finance/budget-progress";
import { GoalProgress } from "@/components/finance/goal-progress";
import { MoneyDisplay } from "@/components/money/money-display";
import { DEMO, DEMO_LABEL } from "@/features/marketing/mocks/demo-data";
import { formatCompactToman, toPersianDigits } from "@/lib/currency/format";
import { cn } from "@/lib/utils";

export function HeroDashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-[22rem]">
      <div className="absolute -top-3 left-4 z-10">
        <Badge>{DEMO_LABEL}</Badge>
      </div>
      <div className="overflow-hidden rounded-[2.2rem] border border-border bg-card p-5 shadow-md">
        <p className="text-sm text-muted-foreground">{DEMO.greeting}</p>
        <p className="mt-6 text-xs text-muted-foreground">قابل‌خرج</p>
        <p className="numeric-display mt-1 text-[2.2rem] font-semibold leading-none tracking-tight">
          <MoneyDisplay amount={DEMO.available} withUnit={false} />
          <span className="ms-1 text-base font-medium text-muted-foreground">تومان</span>
        </p>
        <div className="mt-6 rounded-2xl bg-surface-muted px-4 py-4">
          <p className="text-[15px] leading-7">
            امروز می‌تونی حدود{" "}
            <span className="font-semibold">{formatCompactToman(DEMO.today)}</span> خرج کنی.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {toPersianDigits(DEMO.remainingDays)} روز تا درآمد بعدی
          </p>
        </div>
        <div className="mt-5">
          <BudgetProgress
            name="غذا"
            spent={DEMO.foodSpent}
            limit={DEMO.foodLimit}
            pct={DEMO.foodPct}
            status="healthy"
          />
        </div>
      </div>
    </div>
  );
}

export function FullDashboardMock() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-md md:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{DEMO.greeting}</p>
          <p className="mt-1 text-xs text-muted-foreground">خانه · اردیبهشت</p>
        </div>
        <Badge>{DEMO_LABEL}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-surface-muted px-5 py-5">
          <p className="text-xs text-muted-foreground">قابل‌خرج</p>
          <p className="numeric-display mt-2 text-4xl font-semibold tracking-tight">
            <MoneyDisplay amount={DEMO.available} withUnit={false} />
          </p>
          <p className="mt-3 text-sm leading-7">
            امروز حدود <span className="font-semibold">{formatCompactToman(DEMO.today)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {toPersianDigits(DEMO.remainingDays)} روز تا درآمد بعدی
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="خرج این ماه" value={DEMO.monthlySpent} />
          <MiniStat label="درآمد" value={DEMO.monthlyIncome} tone="income" />
          <MiniStat label="کنار گذاشته" value={DEMO.monthlySaved} tone="savings" />
          <MiniStat label="سهم امروز" value={DEMO.today} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border px-4 py-4">
          <p className="mb-3 text-sm font-medium">بودجه</p>
          <BudgetProgress
            name="غذا"
            spent={DEMO.foodSpent}
            limit={DEMO.foodLimit}
            pct={DEMO.foodPct}
            status="healthy"
          />
          <div className="mt-4">
            <BudgetProgress
              name="حمل‌ونقل"
              spent={DEMO.transportSpent}
              limit={DEMO.transportLimit}
              pct={DEMO.transportPct}
              status="healthy"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-border px-4 py-4">
          <p className="mb-3 text-sm font-medium">هدف</p>
          <GoalProgress
            name={DEMO.goalName}
            currentAmount={DEMO.goalCurrent}
            targetAmount={DEMO.goalTarget}
            pct={DEMO.goalPct}
            monthlyNeed={DEMO.goalMonthly}
            caption={`با ماهی ${formatCompactToman(DEMO.goalMonthly)} حدود ${toPersianDigits(DEMO.goalMonthsLeft)} ماه تا هدف`}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-medium">تراکنش‌های اخیر</p>
        <ul className="flex flex-col gap-2">
          {DEMO.transactions.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.merchant}</p>
              </div>
              <MoneyDisplay
                amount={item.amount}
                withUnit={false}
                className={cn(
                  "text-sm font-semibold",
                  item.type === "INCOME" ? "text-income" : "text-expense",
                )}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: bigint;
  tone?: "income" | "savings";
}) {
  return (
    <div className="rounded-3xl border border-border px-4 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-sm font-semibold",
          tone === "income" && "text-income",
          tone === "savings" && "text-savings",
        )}
      >
        <MoneyDisplay amount={value} withUnit={false} />
      </p>
    </div>
  );
}
