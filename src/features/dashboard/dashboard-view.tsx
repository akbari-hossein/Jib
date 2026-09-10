import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { EmptyState } from "@/components/empty-state";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { FormulaRow, WhyThisNumber } from "@/components/finance/why-this-number";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { MonthlyRecapPrompt } from "@/features/reports/monthly-recap-prompt";
import { TransactionList } from "@/features/transactions/transaction-list";
import {
  AffordabilitySheet,
  type AffordabilitySnapshot,
} from "@/features/what-if/affordability-sheet";
import { APP_NAME } from "@/lib/config/app";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { JALALI_MONTHS, periodChangeCopy } from "@/lib/labels";
import type { MonthlyRecapDto } from "@/lib/finance/monthly-recap-data";
import type { DashboardDto } from "@/server/queries/dashboard";

export function DashboardView({
  dashboard,
  name,
  unreadCount,
  previousRecap,
  affordability,
}: {
  dashboard: DashboardDto;
  name: string | null;
  unreadCount: number;
  previousRecap?: MonthlyRecapDto | null;
  affordability: AffordabilitySnapshot;
}) {
  const title = name ? `${dashboard.greeting} ${name}` : dashboard.greeting;
  const remainingLabel = dashboard.hasKnownIncomeDate
    ? `${toPersianDigits(dashboard.remainingDays)} روز تا درآمد بعدی`
    : `${toPersianDigits(dashboard.remainingDays)} روز تا پایان ماه`;
  const monthName = JALALI_MONTHS[dashboard.currentMonth - 1] ?? "";

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LogoMark className="h-4 w-auto text-foreground" title={APP_NAME} />
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
          <div data-tour="available-money">
            <FinancialMetric
              className="mt-4"
              label={dashboard.isShortfall ? "کسری" : "قابل‌خرج"}
              amount={dashboard.isShortfall ? -dashboard.availableMoney : dashboard.availableMoney}
              empty={!dashboard.hasAccounts}
              size="lg"
              heading
            />
          </div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </header>

      {previousRecap ? <MonthlyRecapPrompt recap={previousRecap} /> : null}

      {!dashboard.hasAccounts ? (
        <EmptyState
          title="هنوز حسابی اضافه نکردی"
          description="اولین حساب را اضافه کن تا عدد قابل‌خرج ساخته شود."
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
                ? "امروز بیشتر از سهمت خرج کردی. فردا از باقی‌مانده دوباره حساب می‌شود."
                : `امروز می‌تونی تا ${formatCompactToman(dashboard.remainingToday)} خرج کنی.`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{remainingLabel}</p>
            <WhyThisNumber className="mt-4">
              <dl className="space-y-2">
                <FormulaRow label="موجودی نقد" value={formatToman(dashboard.liquidBalance)} />
                <FormulaRow label="هدف بدون حساب" value={formatToman(dashboard.reservedForGoals)} prefix="− " />
                <FormulaRow label="خرج‌های نزدیک" value={formatToman(dashboard.plannedExpenses)} prefix="− " />
                <FormulaRow label="پس‌انداز این دوره" value={formatToman(dashboard.requiredSavings)} prefix="− " />
                <FormulaRow label="بدهی باز" value={formatToman(dashboard.outstandingDebtsIOwe)} prefix="− " />
                <FormulaRow
                  label={dashboard.isShortfall ? "کسری" : "قابل‌خرج"}
                  value={formatToman(
                    dashboard.isShortfall ? -dashboard.availableMoney : dashboard.availableMoney,
                  )}
                />
              </dl>
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
            </WhyThisNumber>
            <AffordabilitySheet snapshot={affordability} />
          </Card>

          <Card className="px-5 py-4">
            <p className="text-xs text-muted-foreground">این ماه · {monthName}</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCompactToman(dashboard.monthlySpent)} خرج کردی
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {periodChangeCopy(dashboard.monthlyChange, "month")}
            </p>
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

