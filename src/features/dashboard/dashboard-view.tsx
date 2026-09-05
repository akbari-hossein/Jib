import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { EmptyState } from "@/components/empty-state";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { HoldingExplain } from "@/components/finance/holding-explain";
import { PurchasingPowerHint, PurchasingPowerSentence } from "@/components/finance/purchasing-power-hint";
import { FormulaRow, WhyThisNumber } from "@/components/finance/why-this-number";
import { MoneyDisplay } from "@/components/money/money-display";
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
              label={dashboard.isShortfall ? "کسری" : "قابل خرج"}
              amount={dashboard.isShortfall ? -dashboard.availableMoney : dashboard.availableMoney}
              empty={!dashboard.hasAccounts}
              size="lg"
              heading
              secondary={
                dashboard.hasAccounts ? (
                  <div className="flex flex-col gap-1">
                    {dashboard.availableEquivalent ? (
                      <PurchasingPowerHint hint={dashboard.availableEquivalent} />
                    ) : null}
                    {dashboard.assetTotal > 0n ? (
                      <AssetBreakdownLine total={dashboard.assetTotal} group={dashboard.assetGroup} />
                    ) : null}
                    {dashboard.figurePartial ? (
                      <p className="text-xs text-muted-foreground">{dashboard.partialNote}</p>
                    ) : null}
                  </div>
                ) : null
              }
            />
          </div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </header>

      {previousRecap ? <MonthlyRecapPrompt recap={previousRecap} /> : null}

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
            <WhyThisNumber className="mt-4">
              <dl className="space-y-2">
                <FormulaRow label="موجودی نقد" value={formatToman(dashboard.liquidBalance)} />
                <FormulaRow label="هدف بدون حساب" value={formatToman(dashboard.reservedForGoals)} prefix="− " />
                <FormulaRow label="خرج‌های نزدیک" value={formatToman(dashboard.plannedExpenses)} prefix="− " />
                <FormulaRow label="پس‌انداز این دوره" value={formatToman(dashboard.requiredSavings)} prefix="− " />
                <FormulaRow
                  label={dashboard.isShortfall ? "کسری" : "قابل خرج"}
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

          {dashboard.holdings.length > 0 ? (
            <Card className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm text-muted-foreground">دارایی‌ها</h2>
                <Link href="/accounts" className="text-sm text-primary">
                  حساب‌ها
                </Link>
              </div>
              <p className="mt-2 text-lg font-semibold">{formatCompactToman(dashboard.assetTotal)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ارزش کل حدود {formatCompactToman(dashboard.netWorth)} — دارایی‌ها پس‌انداز هستند، نه سفته‌بازی.
              </p>
              {dashboard.assetValuationChange != null && dashboard.assetValuationChange !== 0n ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  تغییر ارزش نسبت به نرخ زمان خرید:{" "}
                  {dashboard.assetValuationChange > 0n ? "+" : "−"}
                  {formatCompactToman(
                    dashboard.assetValuationChange < 0n
                      ? -dashboard.assetValuationChange
                      : dashboard.assetValuationChange,
                  )}
                  . این عدد وارد پس‌انداز ماه نمی‌شود.
                </p>
              ) : null}
              {dashboard.figurePartial ? (
                <p className="mt-2 text-xs text-muted-foreground">{dashboard.partialNote}</p>
              ) : null}
              <ul className="mt-4 flex flex-col gap-3">
                {dashboard.holdings.map((holding) => (
                  <li key={holding.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{holding.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {holding.holdingText ?? holding.name}
                        {holding.staleLabel ? ` · ${holding.staleLabel}` : ""}
                      </p>
                      {holding.dayMove && holding.dayMove.direction !== "flat" && holding.dayMove.pct > 0 ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          نسبت به دیروز {holding.dayMove.direction === "up" ? "بالاتر" : "پایین‌تر"} ·{" "}
                          {toPersianDigits(holding.dayMove.pct)}٪
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      {holding.valueUnavailable ? (
                        <span className="text-xs text-muted-foreground">{dashboard.rateUnavailableCopy}</span>
                      ) : (
                        <MoneyDisplay amount={holding.balance} className="text-sm font-semibold" />
                      )}
                      {holding.holdingDetail ? <HoldingExplain detail={holding.holdingDetail} /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {dashboard.rates.length > 0 ? (
            <Card className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm text-muted-foreground">نرخ‌ها</h2>
                <Link href="/rates" className="text-sm text-primary">
                  همه نرخ‌ها
                </Link>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {dashboard.rates.map((rate) => (
                  <li key={rate.rateId} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p>{rate.label}</p>
                      {rate.stale ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">{rate.rateDateLabel}</p>
                      ) : null}
                    </div>
                    <span className="numeric-display text-foreground/70">
                      {formatToman(BigInt(rate.rateToToman), { withUnit: false })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="px-5 py-4">
            <p className="text-xs text-muted-foreground">این ماه · {monthName}</p>
            <FinancialMetric
              className="mt-2"
              label="پس‌انداز"
              amount={dashboard.monthlySavings}
              tone="savings"
              size="sm"
              secondary={
                dashboard.monthlyExtraSavings > 0n ? (
                  <p className="text-xs text-muted-foreground">
                    شامل {formatCompactToman(dashboard.monthlyExtraSavings)} خرید دارایی این ماه — نه تغییر نرخ
                  </p>
                ) : dashboard.figurePartial ? (
                  <p className="text-xs text-muted-foreground">{dashboard.partialNote}</p>
                ) : null
              }
            />
            <p className="mt-4 text-lg font-semibold">
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

function AssetBreakdownLine({ total, group }: { total: bigint; group: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      شامل {formatCompactToman(total)} دارایی ({group})
    </p>
  );
}
