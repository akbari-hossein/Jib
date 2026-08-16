import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/money/money-display";
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
        <p className="text-sm text-foreground/50">{title}</p>
        <h1 className="mt-4 text-xs font-medium text-foreground/45">
          {dashboard.isShortfall ? "کسری" : "قابل خرج"}
        </h1>
        {dashboard.hasAccounts ? (
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            <MoneyDisplay
              amount={dashboard.isShortfall ? -dashboard.availableMoney : dashboard.availableMoney}
            />
          </p>
        ) : (
          <p className="numeric-display mt-2 text-4xl font-semibold tracking-tight text-foreground/25">
            — — —
          </p>
        )}
      </header>

      {!dashboard.hasAccounts ? (
        <EmptyState
          title="هنوز موجودی ثبت نشده"
          description="اولین حسابت را اضافه کن تا ببینی امروز چقدر می‌توانی خرج کنی."
          action={
            <Button asChild>
              <Link href="/accounts">افزودن حساب</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="rounded-3xl border border-border bg-surface px-5 py-4">
            <p className="text-[15px] leading-7">
              {dashboard.overspentToday
                ? "امروز بیشتر از سهم روز خرج شده. فردا سهم از باقی‌مانده حساب می‌شود."
                : `امروز می‌تونی تا ${formatCompactToman(dashboard.remainingToday)} خرج کنی.`}
            </p>
            <p className="mt-2 text-xs text-foreground/45">{remainingLabel}</p>
            <details className="mt-4">
              <summary className="cursor-pointer list-none text-sm text-foreground/55 [&::-webkit-details-marker]:hidden">
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
                <div className="pt-2 text-xs leading-6 text-foreground/50">
                  {remainingLabel}
                  <br />
                  سهم هر روز ≈ {formatCompactToman(dashboard.dailyShare)}
                  <br />
                  خرج امروز {formatToman(dashboard.spentToday)}
                </div>
                {!dashboard.hasKnownIncomeDate ? (
                  <p className="pt-1 text-xs text-foreground/45">
                    روز درآمد را از{" "}
                    <Link href="/more" className="text-primary">
                      بیشتر
                    </Link>{" "}
                    تنظیم کن تا عدد دقیق‌تر شود.
                  </p>
                ) : null}
              </dl>
            </details>
          </section>

          <section className="rounded-3xl border border-border bg-surface px-5 py-4">
            <p className="text-xs text-foreground/45">این ماه · {monthName}</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCompactToman(dashboard.monthlySpent)} خرج کردی
            </p>
            <p className="mt-1 text-sm text-foreground/55">
              {periodChangeCopy(dashboard.monthlyChange, "month")}
            </p>
            <Link href="/reports" className="mt-3 inline-block text-sm text-primary">
              گزارش کامل
            </Link>
          </section>

          {dashboard.recent.length === 0 ? (
            <EmptyState
              title="آماده ثبت اولین خرج هستی"
              description="دکمه + را بزن، مبلغ را وارد کن، دسته و حساب را انتخاب کن."
            />
          ) : (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-foreground/55">تراکنش‌های اخیر</h2>
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

