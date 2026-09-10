import { describe, expect, it } from "vitest";
import { addJalaliDays, gregorianUtcFromJalali, tehranMidnightUtc } from "@/lib/dates/tehran";
import {
  getTodaySummary,
  timeOfDayFromNow,
  type TodaySummaryStore,
} from "@/lib/finance/today-summary";

const USER_ID = "user_1";
const OTHER_USER_ID = "user_2";
const TODAY = { year: 1404, month: 6, day: 10 } as const;
const NOW = new Date(tehranMidnightUtc(TODAY).getTime() + 8 * 60 * 60 * 1000);

type Seed = {
  userName?: string | null;
  incomeDayOfMonth?: number | null;
  accounts?: Array<{
    userId: string;
    balance: bigint;
    isActive: boolean;
    includeInAvailable: boolean;
  }>;
  goals?: Array<{
    userId: string;
    id: string;
    name: string;
    currentAmount: bigint;
    targetAmount: bigint;
    targetDate: Date | null;
    accountId: string | null;
    isArchived: boolean;
    createdAt: Date;
    account: { balance: bigint } | null;
  }>;
  recurring?: Array<{
    userId: string;
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME" | "TRANSFER";
    amount: bigint;
    nextRunAt: Date;
    frequency: "WEEKLY" | "MONTHLY" | "YEARLY";
    interval: number;
    dayOfMonth: number | null;
    endDate: Date | null;
    isActive: boolean;
  }>;
  calendarEvents?: Array<{
    userId: string;
    id: string;
    title: string;
    startTime: Date;
    endTime: Date | null;
    linkedCostEstimate: bigint | null;
    isDismissed: boolean;
  }>;
  financialTasks?: Array<{
    userId: string;
    id: string;
    title: string;
    type: "BILL_DUE" | "BUDGET_CHECK" | "RECURRING_REMINDER" | "CUSTOM";
    isCompleted: boolean;
    dueDate: Date;
  }>;
  checkInMood?: "GOOD" | "NEUTRAL" | "STRESSED";
  spentToday?: bigint;
  openDebts?: Array<{
    userId: string;
    type: "I_OWE" | "OWED_TO_ME";
    remainingAmount: bigint;
    status: "OPEN" | "PARTIALLY_SETTLED" | "SETTLED";
  }>;
};

function unexpectedWrite(method: string) {
  return async () => {
    throw new Error(`getTodaySummary must not call ${method}`);
  };
}

function createStore(seed: Seed = {}): TodaySummaryStore & { writes: string[] } {
  const writes: string[] = [];
  const track = (method: string) => async () => {
    writes.push(method);
    return unexpectedWrite(method)();
  };

  const store = {
    writes,
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id !== USER_ID) return null;
        return {
          name: seed.userName ?? "سارا",
          incomeDayOfMonth: seed.incomeDayOfMonth ?? null,
        };
      },
      create: track("user.create"),
      update: track("user.update"),
      delete: track("user.delete"),
    },
    account: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        (seed.accounts ?? [])
          .filter((account) => account.userId === where.userId)
          .map(({ balance, isActive, includeInAvailable }) => ({
            balance,
            isActive,
            includeInAvailable,
          })),
      create: track("account.create"),
      update: track("account.update"),
      delete: track("account.delete"),
    },
    goal: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        (seed.goals ?? []).filter((goal) => goal.userId === where.userId),
      create: track("goal.create"),
      update: track("goal.update"),
      delete: track("goal.delete"),
    },
    recurringTransaction: {
      findMany: async ({
        where,
      }: {
        where: { userId: string; isActive: boolean };
      }) =>
        (seed.recurring ?? []).filter(
          (item) => item.userId === where.userId && item.isActive === where.isActive,
        ),
      create: track("recurringTransaction.create"),
      update: track("recurringTransaction.update"),
      delete: track("recurringTransaction.delete"),
    },
    transaction: {
      aggregate: async () => ({ _sum: { amount: seed.spentToday ?? 0n } }),
      create: track("transaction.create"),
      update: track("transaction.update"),
      delete: track("transaction.delete"),
    },
    calendarEvent: {
      findMany: async ({
        where,
      }: {
        where: {
          userId: string;
          isDismissed: false;
          startTime: { gte: Date; lt: Date };
        };
      }) =>
        (seed.calendarEvents ?? [])
          .filter(
            (event) =>
              event.userId === where.userId &&
              event.isDismissed === false &&
              event.startTime >= where.startTime.gte &&
              event.startTime < where.startTime.lt,
          )
          .sort((left, right) => left.startTime.getTime() - right.startTime.getTime())
          .map(({ id, title, startTime, endTime, linkedCostEstimate }) => ({
            id,
            title,
            startTime,
            endTime,
            linkedCostEstimate,
          })),
      create: track("calendarEvent.create"),
      update: track("calendarEvent.update"),
      delete: track("calendarEvent.delete"),
      upsert: track("calendarEvent.upsert"),
    },
    financialTask: {
      findMany: async ({
        where,
      }: {
        where: {
          userId: string;
          isCompleted: false;
          dueDate: { lt: Date };
        };
      }) =>
        (seed.financialTasks ?? [])
          .filter(
            (task) =>
              task.userId === where.userId &&
              task.isCompleted === false &&
              task.dueDate.getTime() < where.dueDate.lt.getTime(),
          )
          .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())
          .map(({ id, title, type, isCompleted, dueDate }) => ({
            id,
            title,
            type,
            isCompleted,
            dueDate,
          })),
      create: track("financialTask.create"),
      update: track("financialTask.update"),
      delete: track("financialTask.delete"),
      upsert: track("financialTask.upsert"),
    },
    dailyCheckIn: {
      findUnique: async ({
        where,
      }: {
        where: { userId_date: { userId: string; date: Date } };
      }) => {
        if (where.userId_date.userId !== USER_ID || !seed.checkInMood) {
          return null;
        }
        return { mood: seed.checkInMood };
      },
      create: track("dailyCheckIn.create"),
      update: track("dailyCheckIn.update"),
      upsert: track("dailyCheckIn.upsert"),
    },
    debtRecord: {
      findMany: async ({
        where,
      }: {
        where: { userId: string; status: { not: "SETTLED" } };
      }) =>
        (seed.openDebts ?? []).filter(
          (row) => row.userId === where.userId && row.status !== "SETTLED",
        ),
      create: track("debtRecord.create"),
      update: track("debtRecord.update"),
      delete: track("debtRecord.delete"),
    },
  };

  return store as unknown as TodaySummaryStore & { writes: string[] };
}

describe("timeOfDayFromNow", () => {
  it("uses the existing Tehran hour boundaries", () => {
    expect(timeOfDayFromNow(new Date(tehranMidnightUtc(TODAY).getTime() + 8 * 60 * 60 * 1000))).toBe(
      "morning",
    );
    expect(timeOfDayFromNow(new Date(tehranMidnightUtc(TODAY).getTime() + 13 * 60 * 60 * 1000))).toBe(
      "afternoon",
    );
    expect(timeOfDayFromNow(new Date(tehranMidnightUtc(TODAY).getTime() + 18 * 60 * 60 * 1000))).toBe(
      "evening",
    );
    expect(timeOfDayFromNow(new Date(tehranMidnightUtc(TODAY).getTime() + 22 * 60 * 60 * 1000))).toBe(
      "night",
    );
  });
});

describe("getTodaySummary", () => {
  it("returns an empty snapshot without throwing", async () => {
    const store = createStore();
    const summary = await getTodaySummary(USER_ID, NOW, store);

    expect(summary.greeting).toEqual({ timeOfDay: "morning", userName: "سارا" });
    expect(summary.upcomingFinancialEvents).toEqual([]);
    expect(summary.calendarEventsToday).toEqual([]);
    expect(summary.financialTasks).toEqual([]);
    expect(summary.activeGoal).toBeNull();
    expect(summary.hasAccounts).toBe(false);
    expect(summary.checkIn).toBeNull();
    expect(summary.dang).toEqual({ owedToMe: 0n, iOwe: 0n });
    expect(summary.money.daysRemainingInPeriod).toBeGreaterThan(0);
    expect(store.writes).toEqual([]);
  });

  it("still surfaces an overdue incomplete task from yesterday", async () => {
    const yesterday = gregorianUtcFromJalali(addJalaliDays(TODAY, -1));
    const store = createStore({
      financialTasks: [
        {
          userId: USER_ID,
          id: "task_overdue",
          title: "قبض اینترنت",
          type: "BILL_DUE",
          isCompleted: false,
          dueDate: yesterday,
        },
        {
          userId: USER_ID,
          id: "task_done",
          title: "کار تمام‌شده",
          type: "CUSTOM",
          isCompleted: true,
          dueDate: yesterday,
        },
        {
          userId: OTHER_USER_ID,
          id: "task_other",
          title: "کار کاربر دیگر",
          type: "CUSTOM",
          isCompleted: false,
          dueDate: yesterday,
        },
      ],
    });

    const summary = await getTodaySummary(USER_ID, NOW, store);

    expect(summary.financialTasks).toEqual([
      {
        id: "task_overdue",
        title: "قبض اینترنت",
        type: "BILL_DUE",
        isCompleted: false,
        dueDate: yesterday,
        isOverdue: true,
      },
    ]);
    expect(store.writes).toEqual([]);
  });

  it("buckets recurring expenses due tomorrow and in five days", async () => {
    const store = createStore({
      recurring: [
        {
          userId: USER_ID,
          id: "rent",
          name: "اجاره",
          type: "EXPENSE",
          amount: 10_000_000n,
          nextRunAt: gregorianUtcFromJalali(addJalaliDays(TODAY, 1)),
          frequency: "MONTHLY",
          interval: 1,
          dayOfMonth: 11,
          endDate: null,
          isActive: true,
        },
        {
          userId: USER_ID,
          id: "internet",
          name: "اینترنت",
          type: "EXPENSE",
          amount: 800_000n,
          nextRunAt: gregorianUtcFromJalali(addJalaliDays(TODAY, 5)),
          frequency: "MONTHLY",
          interval: 1,
          dayOfMonth: 15,
          endDate: null,
          isActive: true,
        },
        {
          userId: USER_ID,
          id: "salary",
          name: "حقوق",
          type: "INCOME",
          amount: 40_000_000n,
          nextRunAt: gregorianUtcFromJalali(addJalaliDays(TODAY, 1)),
          frequency: "MONTHLY",
          interval: 1,
          dayOfMonth: 11,
          endDate: null,
          isActive: true,
        },
      ],
    });

    const summary = await getTodaySummary(USER_ID, NOW, store);

    expect(summary.upcomingFinancialEvents.map((event) => [event.title, event.urgency, event.amount])).toEqual([
      ["اجاره", "tomorrow", 10_000_000n],
      ["اینترنت", "this_week", 800_000n],
    ]);
    expect(summary.upcomingFinancialEvents.every((event) => event.sourceType === "RecurringTransaction")).toBe(
      true,
    );
    expect(store.writes).toEqual([]);
  });

  it("does not invent a linked calendar cost when the field is empty", async () => {
    const store = createStore({
      calendarEvents: [
        {
          userId: USER_ID,
          id: "event_1",
          title: "دندانپزشکی",
          startTime: new Date(tehranMidnightUtc(TODAY).getTime() + 10 * 60 * 60 * 1000),
          endTime: null,
          linkedCostEstimate: null,
          isDismissed: false,
        },
      ],
    });

    const summary = await getTodaySummary(USER_ID, NOW, store);

    expect(summary.calendarEventsToday).toEqual([
      {
        id: "event_1",
        title: "دندانپزشکی",
        startTime: expect.any(Date),
        endTime: null,
        hasLinkedCost: false,
        linkedCostEstimate: null,
      },
    ]);
  });

  it("returns today's check-in without writing", async () => {
    const store = createStore({ checkInMood: "STRESSED" });
    const summary = await getTodaySummary(USER_ID, NOW, store);

    expect(summary.checkIn).toEqual({ mood: "STRESSED" });
    expect(store.writes).toEqual([]);
  });

  it("subtracts debts the user owes from available money and keeps owed-to-me separate", async () => {
    const store = createStore({
      accounts: [
        {
          userId: USER_ID,
          balance: 12_000_000n,
          isActive: true,
          includeInAvailable: true,
        },
      ],
      openDebts: [
        {
          userId: USER_ID,
          type: "I_OWE",
          remainingAmount: 1_200_000n,
          status: "OPEN",
        },
        {
          userId: USER_ID,
          type: "OWED_TO_ME",
          remainingAmount: 3_400_000n,
          status: "OPEN",
        },
      ],
    });

    const summary = await getTodaySummary(USER_ID, NOW, store);

    expect(summary.dang).toEqual({ owedToMe: 3_400_000n, iOwe: 1_200_000n });
    expect(summary.money.totalAvailable).toBe(10_800_000n);
    expect(store.writes).toEqual([]);
  });

  it("is read-only even when write methods exist on the store", async () => {
    const store = createStore({
      financialTasks: [
        {
          userId: USER_ID,
          id: "task_today",
          title: "بررسی بودجه",
          type: "BUDGET_CHECK",
          isCompleted: false,
          dueDate: gregorianUtcFromJalali(TODAY),
        },
      ],
    });

    await getTodaySummary(USER_ID, NOW, store);
    expect(store.writes).toEqual([]);
  });
});
