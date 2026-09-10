import type {
  CheckInMood,
  FinancialTaskType,
  RecurringFrequency,
  TransactionType,
} from "@prisma/client";
import { addRecurringOccurrence, firstOccurrenceOnOrAfter } from "@/lib/dates/recurring";
import {
  addJalaliDays,
  compareJalaliDate,
  getDayPeriod,
  getTehranJalaliDate,
  gregorianUtcFromJalali,
  jalaliDateOnlyUtc,
  jalaliFromInstant,
  jalaliToEpochDay,
  tehranMidnightUtc,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { assembleDashboard } from "@/lib/finance/dashboard";
import {
  calculateTotalIOwe,
  calculateTotalOwedToMe,
  type DebtSnapshot,
} from "@/lib/finance/debts";
import { calculateGoalProgress } from "@/lib/finance/goal-progress";
import type { AccountSnapshot, GoalSnapshot } from "@/lib/finance/types";

export const UPCOMING_RECURRING_HORIZON_DAYS = 7;

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface TodaySummary {
  greeting: {
    timeOfDay: TimeOfDay;
    userName: string;
  };
  money: {
    availableToday: bigint;
    totalAvailable: bigint;
    daysRemainingInPeriod: number;
  };
  dang: {
    owedToMe: bigint;
    iOwe: bigint;
  };
  hasAccounts: boolean;
  upcomingFinancialEvents: UpcomingFinancialEvent[];
  calendarEventsToday: CalendarEventSummary[];
  financialTasks: FinancialTaskSummary[];
  activeGoal: GoalProgressSummary | null;
  checkIn: { mood: CheckInMood } | null;
}

export interface UpcomingFinancialEvent {
  id: string;
  title: string;
  date: Date;
  amount: bigint;
  urgency: "today" | "tomorrow" | "this_week";
  sourceType: "RecurringTransaction";
}

export interface CalendarEventSummary {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  hasLinkedCost: boolean;
  linkedCostEstimate: bigint | null;
}

export interface FinancialTaskSummary {
  id: string;
  title: string;
  type: FinancialTaskType;
  isCompleted: boolean;
  dueDate: Date;
  isOverdue: boolean;
}

export interface GoalProgressSummary {
  id: string;
  name: string;
  currentAmount: bigint;
  targetAmount: bigint;
  percentage: number;
}

type RecurringRow = {
  id: string;
  name: string;
  type: TransactionType;
  amount: bigint;
  nextRunAt: Date;
  frequency: RecurringFrequency;
  interval: number;
  dayOfMonth: number | null;
  endDate: Date | null;
  isActive: boolean;
};

type GoalRow = GoalSnapshot & {
  id: string;
  name: string;
  createdAt: Date;
  account: { balance: bigint } | null;
};

type CalendarRow = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  linkedCostEstimate: bigint | null;
};

type TaskRow = {
  id: string;
  title: string;
  type: FinancialTaskType;
  isCompleted: boolean;
  dueDate: Date;
};

export type TodaySummaryStore = {
  user: {
    findUnique: (args: {
      where: { id: string };
      select: { name: true; incomeDayOfMonth: true };
    }) => Promise<{ name: string | null; incomeDayOfMonth: number | null } | null>;
  };
  account: {
    findMany: (args: {
      where: { userId: string };
      select: { balance: true; isActive: true; includeInAvailable: true };
    }) => Promise<AccountSnapshot[]>;
  };
  goal: {
    findMany: (args: {
      where: { userId: string };
      select: {
        id: true;
        name: true;
        currentAmount: true;
        targetAmount: true;
        targetDate: true;
        accountId: true;
        isArchived: true;
        createdAt: true;
        account: { select: { balance: true } };
      };
    }) => Promise<GoalRow[]>;
  };
  recurringTransaction: {
    findMany: (args: {
      where: { userId: string; isActive: boolean };
      select: {
        id: true;
        name: true;
        type: true;
        amount: true;
        nextRunAt: true;
        frequency: true;
        interval: true;
        dayOfMonth: true;
        endDate: true;
        isActive: true;
      };
    }) => Promise<RecurringRow[]>;
  };
  transaction: {
    aggregate: (args: {
      where: {
        userId: string;
        type: "EXPENSE";
        occurredAt: { gte: Date; lt: Date };
        account?: { includeInAvailable: true };
      };
      _sum: { amount: true };
    }) => Promise<{ _sum: { amount: bigint | null } }>;
  };
  calendarEvent: {
    findMany: (args: {
      where: {
        userId: string;
        isDismissed: false;
        startTime: { gte: Date; lt: Date };
      };
      orderBy: { startTime: "asc" };
      select: {
        id: true;
        title: true;
        startTime: true;
        endTime: true;
        linkedCostEstimate: true;
      };
    }) => Promise<CalendarRow[]>;
  };
  financialTask: {
    findMany: (args: {
      where: {
        userId: string;
        isCompleted: false;
        dueDate: { lt: Date };
      };
      orderBy: { dueDate: "asc" };
      select: {
        id: true;
        title: true;
        type: true;
        isCompleted: true;
        dueDate: true;
      };
    }) => Promise<TaskRow[]>;
  };
  dailyCheckIn: {
    findUnique: (args: {
      where: { userId_date: { userId: string; date: Date } };
      select: { mood: true };
    }) => Promise<{ mood: CheckInMood } | null>;
  };
  debtRecord: {
    findMany: (args: {
      where: {
        userId: string;
        status: { not: "SETTLED" };
      };
      select: { type: true; remainingAmount: true; status: true };
    }) => Promise<DebtSnapshot[]>;
  };
};

export function timeOfDayFromNow(now: Date): TimeOfDay {
  const period = getDayPeriod(now);
  return period === "noon" ? "afternoon" : period;
}

function urgencyForDaysUntil(daysUntil: number): UpcomingFinancialEvent["urgency"] | null {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil >= 2 && daysUntil <= UPCOMING_RECURRING_HORIZON_DAYS) return "this_week";
  return null;
}

function upcomingOccurrences(item: RecurringRow, today: JalaliDate): JalaliDate[] {
  if (!item.isActive || item.type !== "EXPENSE") {
    return [];
  }

  const dates: JalaliDate[] = [];
  let current = firstOccurrenceOnOrAfter(
    jalaliFromInstant(item.nextRunAt),
    today,
    item.frequency,
    item.interval,
    item.dayOfMonth,
  );
  const horizon = addJalaliDays(today, UPCOMING_RECURRING_HORIZON_DAYS);
  const end = item.endDate ? jalaliFromInstant(item.endDate) : null;

  for (let step = 0; step < 16 && compareJalaliDate(current, horizon) <= 0; step += 1) {
    if (end && compareJalaliDate(current, end) > 0) {
      break;
    }
    if (compareJalaliDate(current, today) >= 0) {
      dates.push(current);
    }
    current = addRecurringOccurrence(current, item.frequency, item.interval, item.dayOfMonth);
  }

  return dates;
}

function isTaskOverdue(dueDate: Date, today: JalaliDate): boolean {
  return compareJalaliDate(jalaliFromInstant(dueDate), today) < 0;
}

function pickActiveGoal(goals: GoalRow[], todayUtc: Date): GoalProgressSummary | null {
  const active = goals
    .filter((goal) => !goal.isArchived)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  if (!active) {
    return null;
  }

  const currentAmount = active.account ? active.account.balance : active.currentAmount;
  const progress = calculateGoalProgress({
    currentAmount,
    targetAmount: active.targetAmount,
    targetDate: active.targetDate,
    today: todayUtc,
  });

  return {
    id: active.id,
    name: active.name,
    currentAmount,
    targetAmount: active.targetAmount,
    percentage: progress.pct,
  };
}

export async function getTodaySummary(
  userId: string,
  now: Date = new Date(),
  store: TodaySummaryStore = prisma as unknown as TodaySummaryStore,
): Promise<TodaySummary> {
  const today = getTehranJalaliDate(now);
  const todayUtc = gregorianUtcFromJalali(today);
  const dayStart = tehranMidnightUtc(today);
  const dayEnd = tehranMidnightUtc(addJalaliDays(today, 1));
  const tomorrowDate = jalaliDateOnlyUtc(addJalaliDays(today, 1));
  const todayDate = jalaliDateOnlyUtc(today);

  const [
    user,
    accounts,
    goals,
    recurring,
    spentTodayResult,
    calendarEvents,
    financialTasks,
    checkIn,
    openDebts,
  ] =
    await Promise.all([
      store.user.findUnique({
        where: { id: userId },
        select: { name: true, incomeDayOfMonth: true },
      }),
      store.account.findMany({
        where: { userId },
        select: { balance: true, isActive: true, includeInAvailable: true },
      }),
      store.goal.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          currentAmount: true,
          targetAmount: true,
          targetDate: true,
          accountId: true,
          isArchived: true,
          createdAt: true,
          account: { select: { balance: true } },
        },
      }),
      store.recurringTransaction.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          amount: true,
          nextRunAt: true,
          frequency: true,
          interval: true,
          dayOfMonth: true,
          endDate: true,
          isActive: true,
        },
      }),
      store.transaction.aggregate({
        where: {
          userId,
          type: "EXPENSE",
          occurredAt: { gte: dayStart, lt: dayEnd },
          account: { includeInAvailable: true },
        },
        _sum: { amount: true },
      }),
      store.calendarEvent.findMany({
        where: {
          userId,
          isDismissed: false,
          startTime: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          linkedCostEstimate: true,
        },
      }),
      store.financialTask.findMany({
        where: {
          userId,
          isCompleted: false,
          dueDate: { lt: tomorrowDate },
        },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          isCompleted: true,
          dueDate: true,
        },
      }),
      store.dailyCheckIn.findUnique({
        where: { userId_date: { userId, date: todayDate } },
        select: { mood: true },
      }),
      store.debtRecord.findMany({
        where: { userId, status: { not: "SETTLED" } },
        select: { type: true, remainingAmount: true, status: true },
      }),
    ]);

  const nextRecurringIncome =
    recurring
      .filter((item) => item.type === "INCOME")
      .map((item) => jalaliFromInstant(item.nextRunAt))
      .filter((date) => compareJalaliDate(date, today) >= 0)
      .sort(compareJalaliDate)[0] ?? null;

  const iOwe = calculateTotalIOwe(openDebts);
  const owedToMe = calculateTotalOwedToMe(openDebts);

  const snapshot = assembleDashboard({
    accounts,
    goals,
    plannedExpenses: recurring
      .filter((item) => item.type === "EXPENSE")
      .map((item) => ({
        amount: item.amount,
        nextOccurrence: item.nextRunAt,
        isActive: item.isActive,
      })),
    spentToday: spentTodayResult._sum.amount ?? 0n,
    monthlySpent: 0n,
    previousMonthSpent: 0n,
    today,
    incomeDayOfMonth: user?.incomeDayOfMonth ?? null,
    nextRecurringIncome,
    outstandingDebtsIOwe: iOwe,
  });

  const upcomingFinancialEvents: UpcomingFinancialEvent[] = [];
  for (const item of recurring) {
    for (const occurrence of upcomingOccurrences(item, today)) {
      const daysUntil = jalaliToEpochDay(occurrence) - jalaliToEpochDay(today);
      const urgency = urgencyForDaysUntil(daysUntil);
      if (!urgency) continue;
      upcomingFinancialEvents.push({
        id: `${item.id}:${occurrence.year}-${occurrence.month}-${occurrence.day}`,
        title: item.name,
        date: gregorianUtcFromJalali(occurrence),
        amount: item.amount,
        urgency,
        sourceType: "RecurringTransaction",
      });
    }
  }
  upcomingFinancialEvents.sort((left, right) => left.date.getTime() - right.date.getTime());

  return {
    greeting: {
      timeOfDay: timeOfDayFromNow(now),
      userName: user?.name?.trim() ?? "",
    },
    money: {
      availableToday: snapshot.allowance.displayRemainingToday,
      totalAvailable: snapshot.availableMoney,
      daysRemainingInPeriod: snapshot.cycle.remainingDays,
    },
    dang: {
      owedToMe,
      iOwe,
    },
    hasAccounts: accounts.some((account) => account.isActive),
    upcomingFinancialEvents,
    calendarEventsToday: calendarEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      hasLinkedCost: event.linkedCostEstimate != null,
      linkedCostEstimate: event.linkedCostEstimate,
    })),
    financialTasks: financialTasks.map((task) => ({
      id: task.id,
      title: task.title,
      type: task.type,
      isCompleted: task.isCompleted,
      dueDate: task.dueDate,
      isOverdue: isTaskOverdue(task.dueDate, today),
    })),
    activeGoal: pickActiveGoal(goals, todayUtc),
    checkIn: checkIn ? { mood: checkIn.mood } : null,
  };
}
