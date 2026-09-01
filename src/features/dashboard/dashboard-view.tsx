import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { PurchasingPowerHint, PurchasingPowerSentence } from "@/components/finance/purchasing-power-hint";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TransactionList } from "@/features/transactions/transaction-list";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { JALALI_MONTHS, periodChangeCopy } from "@/lib/labels";
import type { DashboardDto } from "@/server/queries/dashboard";

export function DashboardView({
  dashboard,
  name,
}: {
  dashboard: DashboardDto;
  name: string | null;
}) {
  const title = name ? `${dashboard.greeting} ${name}` : dashboard.greeting;
  const remainingLabel = dashboard.hasKnownIncomeDate
    ? `${toPersianDigits(dashboard.remainingDays)} روز تا درآمد بعدی`
    : `${toPersianDigits(dashboard.remainingDays)} روز تا پایان ماه`;
  const monthName = JALALI_MONTHS[dashboard.currentMonth - 1] ?? "";

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div data-tour="available-money">
          <FinancialMetric
            className="mt-4"
            label={dashboard.isShortfall ? "کسری" : "قابل خرج"}
            amount={dashboard.isShortfall ? -dashboard.availableMoney : dashboard.availableMoney}
            empty={!dashboard.hasAccounts}
            size="lg"
            heading
            secondary={
              dashboard.hasAccounts && dashboard.availableEquivalent ? (
                <PurchasingPowerHint hint={dashboard.availableEquivalent} />
              ) : null
            }
          />
        </div>
      </header>

      {!dashboard.hasAccounts ? (
        <EmptyState
          title="هنوز حسابی اضافه نکردی"
          description="با اضافه کردن اولین حسابت، جیب می‌تونه وضعیت پولت رو برات محاسبه کنه."
          action={
            <Button asChild>
              <Link href="/accounts">افزودن حساب</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="px-5 py-4">
            <p className="text-[15px] leading-7">
              {dashboard.overspentToday
                ? "امروز بیشتر از سهم روز خرج شده. فردا سهم از باقی‌مانده حساب می‌شود."
                : `امروز می‌تونی تا ${formatCompactToman(dashboard.remainingToday)} خرج کنی.`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{remainingLabel}</p>
            <details className="mt-4">
              <summary className="cursor-pointer list-none text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
                چرا این عدد؟
              </summary>
              <dl className="mt-3 space-y-2 text-sm text-foreground/70">
                <BreakdownRow label="موجودی نقد" value={dashboard.liquidBalance} />
                <BreakdownRow label="هدف بدون حساب" value={dashboard.reservedForGoals} prefix="− " />
                <BreakdownRow label="خرج‌های نزدیک" value={dashboard.plannedExpenses} prefix="− " />
                <BreakdownRow label="پس‌انداز این دوره" value={dashboard.requiredSavings} prefix="− " />
                <BreakdownRow
                  label={dashboard.isShortfall ? "کسری" : "قابل خرج"}
                  value={dashboard.isShortfall ? -dashboard.availableMoney : dashboard.availableMoney}
                />
                <div className="pt-2 text-xs leading-6 text-muted-foreground">
                  {remainingLabel}
                  <br />
                  سهم هر روز ≈ {formatCompactToman(dashboard.dailyShare)}
                  <br />
                  خرج امروز {formatToman(dashboard.spentToday)}
                </div>
                {!dashboard.hasKnownIncomeDate ? (
                  <p className="pt-1 text-xs text-muted-foreground">
                    روز درآمد را از{" "}
                    <Link href="/more" className="text-primary">
                      بیشتر
                    </Link>{" "}
                    تنظیم کن تا عدد دقیق‌تر شود.
                  </p>
                ) : null}
              </dl>
            </details>
          </Card>

          <Card className="px-5 py-4">
            <p className="text-xs text-muted-foreground">این ماه · {monthName}</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCompactToman(dashboard.monthlySpent)} خرج کردی
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {periodChangeCopy(dashboard.monthlyChange, "month")}
            </p>
            {dashboard.monthlySavingsHint ? (
              <div className="mt-3">
                <PurchasingPowerSentence
                  sentence={dashboard.monthlySavingsHint.sentence}
                  rateDateLabel={dashboard.monthlySavingsHint.rateDateLabel}
                />
              </div>
            ) : null}
            <Link href="/reports" className="mt-3 inline-block text-sm text-primary">
              گزارش کامل
            </Link>
          </Card>

          {dashboard.recent.length === 0 ? (
            <EmptyState
              title="اولین خرج هنوز ثبت نشده"
              description="دکمه + را بزن. مبلغ را وارد کن، دسته و حساب را انتخاب کن. همین برای شروع کافی است."
            />
          ) : (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-muted-foreground">تراکنش‌های اخیر</h2>
                <Link href="/transactions" className="text-sm text-primary">
                  مشاهده همه
                </Link>
              </div>
              <TransactionList transactions={dashboard.recent} />
            </section>
          )}
        </>
      )}
    </main>
  );
}

function BreakdownRow({
  label,
  value,
  prefix = "",
}: {
  label: string;
  value: bigint;
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="numeric-display">
        {prefix}
        {formatToman(value)}
      </dd>
    </div>
  );
}

