import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { EmptyState } from "@/components/empty-state";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { GoalProgress } from "@/components/finance/goal-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TodayDateHeader } from "@/features/calendar/today-date-header";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { CalendarToday } from "@/features/today/calendar-today";
import { DailyCheckIn } from "@/features/today/daily-check-in";
import { FinancialTaskList } from "@/features/today/financial-task-list";
import { UpcomingFinancialEventCard } from "@/features/today/upcoming-context-row";
import { ScoreDashboardWidget } from "@/features/health-score/score-dashboard-widget";
import { DangCard } from "@/features/debts/dang-card";
import { APP_NAME } from "@/lib/config/app";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { formatTehranClockInput } from "@/lib/dates/jalali-form";
import { getTehranGregorianDate, getTehranJalaliDate, greetingForPeriod } from "@/lib/dates/tehran";
import type { TimeOfDay, TodaySummary } from "@/lib/finance/today-summary";
import type { HealthScoreWidgetDto } from "@/server/queries/financial-health";

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
            : `${toPersianDigits(daysRemainingInPeriod)} روز مانده · ${formatToman(totalAvailable)} قابل‌خرج`
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
    <Card className="px-5 py-5">
      <GoalProgress
        name={goal.name}
        currentAmount={goal.currentAmount}
        targetAmount={goal.targetAmount}
        pct={goal.percentage}
      />
      <Link href="/goals" className="mt-4 inline-flex min-h-11 items-center text-sm text-primary">
        هدف‌ها
      </Link>
    </Card>
  );
}

export function TodayView({
  summary,
  unreadCount,
  health,
}: {
  summary: TodaySummary;
  unreadCount: number;
  health: HealthScoreWidgetDto;
}) {
  const today = getTehranJalaliDate();
  const clock = getTehranGregorianDate();
  const defaultTime = formatTehranClockInput(clock.hour, clock.minute);
  const nearest = summary.upcomingFinancialEvents[0] ?? null;

  return (
    <main className="flex flex-col gap-8 px-5 pt-[calc(2rem+env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LogoMark className="h-4 w-auto text-foreground" title={APP_NAME} />
            <TodayGreeting
              timeOfDay={summary.greeting.timeOfDay}
              userName={summary.greeting.userName}
            />
          </div>
          <div className="mt-3">
            <TodayDateHeader today={today} />
          </div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </header>

      <AvailableTodayCard
        availableToday={summary.money.availableToday}
        totalAvailable={summary.money.totalAvailable}
        daysRemainingInPeriod={summary.money.daysRemainingInPeriod}
        empty={!summary.hasAccounts}
      />

      <DailyCheckIn mood={summary.checkIn?.mood ?? null} />

      {!summary.hasAccounts ? (
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
          <div className={nearest ? "flex flex-col gap-4" : undefined}>
            {nearest ? <UpcomingFinancialEventCard event={nearest} /> : null}
            <CalendarToday
              defaultDate={today}
              defaultTime={defaultTime}
              events={summary.calendarEventsToday.map((event) => ({
                id: event.id,
                title: event.title,
                startTime: event.startTime.toISOString(),
                hasLinkedCost: event.hasLinkedCost,
                linkedCostEstimate: event.linkedCostEstimate?.toString() ?? null,
              }))}
            />
          </div>
          <FinancialTaskList
            defaultDueDate={today}
            tasks={summary.financialTasks.map((task) => ({
              id: task.id,
              title: task.title,
              isOverdue: task.isOverdue,
            }))}
          />
          {summary.activeGoal ? <ActiveGoalProgress goal={summary.activeGoal} /> : null}
        </>
      )}
      <ScoreDashboardWidget health={health} />
      <DangCard owedToMe={summary.dang.owedToMe} iOwe={summary.dang.iOwe} />
    </main>
  );
}
