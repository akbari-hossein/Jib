import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { EmptyState } from "@/components/empty-state";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { GoalProgress } from "@/components/finance/goal-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { FinancialTaskList } from "@/features/today/financial-task-list";
import { UpcomingContextRow } from "@/features/today/upcoming-context-row";
import { APP_NAME } from "@/lib/config/app";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { greetingForPeriod } from "@/lib/dates/tehran";
import type { TimeOfDay, TodaySummary } from "@/lib/finance/today-summary";

function greetingCopy(timeOfDay: TimeOfDay, userName: string): string {
  const period = timeOfDay === "afternoon" ? "noon" : timeOfDay;
  const hello = greetingForPeriod(period);
  return userName ? `${hello} ${userName}` : hello;
}

function TodayGreeting({ timeOfDay, userName }: { timeOfDay: TimeOfDay; userName: string }) {
  return <p className="text-sm text-muted-foreground">{greetingCopy(timeOfDay, userName)}</p>;
}

function AvailableTodayCard({
  availableToday,
  totalAvailable,
  daysRemainingInPeriod,
  empty,
}: {
  availableToday: bigint;
  totalAvailable: bigint;
  daysRemainingInPeriod: number;
  empty?: boolean;
}) {
  return (
    <div data-tour="available-money">
      <FinancialMetric
        label="سهم امروز"
        amount={availableToday}
        empty={empty}
        size="lg"
        heading
        hint={
          empty
            ? undefined
            : `${toPersianDigits(daysRemainingInPeriod)} روز مانده · ${formatToman(totalAvailable)} قابل خرج`
        }
      />
    </div>
  );
}

function ActiveGoalProgress({
  goal,
}: {
  goal: NonNullable<TodaySummary["activeGoal"]>;
}) {
  return (
    <Card className="px-5 py-4">
      <GoalProgress
        name={goal.name}
        currentAmount={goal.currentAmount}
        targetAmount={goal.targetAmount}
        pct={goal.percentage}
      />
      <Link href="/goals" className="mt-3 inline-block text-sm text-primary">
        هدف‌ها
      </Link>
    </Card>
  );
}

export function TodayView({
  summary,
  unreadCount,
}: {
  summary: TodaySummary;
  unreadCount: number;
}) {
  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LogoMark className="h-4 w-auto text-foreground" title={APP_NAME} />
            <TodayGreeting
              timeOfDay={summary.greeting.timeOfDay}
              userName={summary.greeting.userName}
            />
          </div>
          <AvailableTodayCard
            availableToday={summary.money.availableToday}
            totalAvailable={summary.money.totalAvailable}
            daysRemainingInPeriod={summary.money.daysRemainingInPeriod}
            empty={!summary.hasAccounts}
          />
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </header>

      {!summary.hasAccounts ? (
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
          <UpcomingContextRow
            events={summary.upcomingFinancialEvents}
            calendarEvents={summary.calendarEventsToday}
          />
          <FinancialTaskList
            tasks={summary.financialTasks.map((task) => ({
              id: task.id,
              title: task.title,
              isOverdue: task.isOverdue,
            }))}
          />
          {summary.activeGoal ? <ActiveGoalProgress goal={summary.activeGoal} /> : null}
        </>
      )}
    </main>
  );
}
