import { Prisma, type NotificationChannel, type NotificationPreference } from "@prisma/client";
import {
  addJalaliDays,
  compareJalaliDate,
  diffDaysInclusive,
  getTehranGregorianDate,
  getTehranJalaliDate,
  isSameJalaliDay,
  jalaliFromInstant,
  jalaliWeekStart,
  tehranMidnightUtc,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { assembleDashboard } from "@/lib/finance/dashboard";
import {
  collectNotifications,
  DEFAULT_DAILY_LOGGER_WINDOW_DAYS,
  type FinanceNotification,
} from "@/lib/finance/notificationRules";
import { prisma } from "@/lib/db/prisma";
import {
  NOTIFICATION_RULE_CATALOG,
  type NotificationRuleKey,
} from "@/lib/notifications/catalog";
import { isInQuietHours } from "@/lib/notifications/quiet-hours";
import { getBudgetMonth } from "@/server/queries/budgets";
import { persistClosedPeriodSnapshot } from "@/server/queries/financial-health";
import { deliverPushToUser } from "@/server/services/push";

const USER_BATCH = 40;

export function jalaliKey(date: JalaliDate): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

export async function ensureNotificationRules() {
  await prisma.$transaction(
    NOTIFICATION_RULE_CATALOG.map((rule) =>
      prisma.notificationRule.upsert({
        where: { key: rule.key },
        update: { title: rule.title, isActiveByDefault: rule.isActiveByDefault },
        create: {
          key: rule.key,
          title: rule.title,
          isActiveByDefault: rule.isActiveByDefault,
        },
      }),
    ),
  );
}

type LegacyPref = NonNullable<(typeof NOTIFICATION_RULE_CATALOG)[number]["legacyPref"]>;

function legacyEnabled(pref: NotificationPreference | null, field: LegacyPref | null): boolean | null {
  if (!pref || !field) {
    return null;
  }
  return pref[field];
}

export function enabledRuleKeys(
  pref: NotificationPreference | null,
  settings: { ruleKey: string; enabled: boolean }[],
): Set<NotificationRuleKey> {
  const byKey = new Map(settings.map((setting) => [setting.ruleKey, setting.enabled]));
  const enabled = new Set<NotificationRuleKey>();

  for (const rule of NOTIFICATION_RULE_CATALOG) {
    const stored = byKey.get(rule.key);
    if (stored != null) {
      if (stored) enabled.add(rule.key);
      continue;
    }
    const fromLegacy = legacyEnabled(pref, rule.legacyPref);
    if (fromLegacy != null) {
      if (fromLegacy) enabled.add(rule.key);
      continue;
    }
    if (rule.isActiveByDefault) {
      enabled.add(rule.key);
    }
  }

  return enabled;
}

export async function ensureUserNotificationSettings(userId: string) {
  await ensureNotificationRules();
  const [pref, existing] = await Promise.all([
    prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    prisma.userNotificationSetting.findMany({ where: { userId } }),
  ]);

  const have = new Set(existing.map((row) => row.ruleKey));
  const missing = NOTIFICATION_RULE_CATALOG.filter((rule) => !have.has(rule.key));
  if (missing.length === 0) {
    return { pref, settings: existing };
  }

  await prisma.userNotificationSetting.createMany({
    data: missing.map((rule) => {
      const fromLegacy = legacyEnabled(pref, rule.legacyPref);
      return {
        userId,
        ruleKey: rule.key,
        enabled: fromLegacy ?? rule.isActiveByDefault,
      };
    }),
    skipDuplicates: true,
  });

  const settings = await prisma.userNotificationSetting.findMany({ where: { userId } });
  return { pref, settings };
}

function settingFor(
  settings: { ruleKey: string; channel: NotificationChannel; quietHoursStart: number | null; quietHoursEnd: number | null }[],
  ruleKey: string,
) {
  return settings.find((row) => row.ruleKey === ruleKey) ?? null;
}

async function loadUserSnapshot(
  userId: string,
  incomeDayOfMonth: number | null,
  now: Date,
) {
  const today = getTehranJalaliDate(now);
  const currentHour = getTehranGregorianDate(now).hour;
  const historyStart = addJalaliDays(today, -14);
  const tomorrow = addJalaliDays(today, 1);
  const weekStart = jalaliWeekStart(today);
  const lastWeekStart = addJalaliDays(weekStart, -7);

  const [accounts, goals, recurring, budget, transactions, openDebts] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: { id: true, balance: true, isActive: true, includeInAvailable: true },
    }),
    prisma.goal.findMany({
      where: { userId, isArchived: false },
      include: { account: { select: { balance: true } } },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, amount: true, type: true, nextRunAt: true, isActive: true },
    }),
    getBudgetMonth(userId),
    prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: {
          gte: tehranMidnightUtc(historyStart),
          lt: tehranMidnightUtc(tomorrow),
        },
      },
      select: { type: true, amount: true, occurredAt: true },
    }),
    prisma.debtRecord.findMany({
      where: { userId, type: "I_OWE", status: { not: "SETTLED" } },
      select: { remainingAmount: true },
    }),
  ]);

  const activeDays = new Set<string>();
  let hasLoggedToday = false;
  let spentToday = 0n;
  let currentWeekSpend = 0n;
  let lastWeekSpend = 0n;
  const loggerStart = addJalaliDays(today, -DEFAULT_DAILY_LOGGER_WINDOW_DAYS);

  for (const tx of transactions) {
    const day = jalaliFromInstant(tx.occurredAt);
    if (isSameJalaliDay(day, today)) {
      hasLoggedToday = true;
      if (tx.type === "EXPENSE") {
        spentToday += tx.amount;
      }
    } else if (compareJalaliDate(day, loggerStart) >= 0 && compareJalaliDate(day, today) < 0) {
      activeDays.add(jalaliKey(day));
    }
    if (tx.type !== "EXPENSE") {
      continue;
    }
    if (compareJalaliDate(day, weekStart) >= 0 && compareJalaliDate(day, tomorrow) < 0) {
      currentWeekSpend += tx.amount;
    }
    if (compareJalaliDate(day, lastWeekStart) >= 0 && compareJalaliDate(day, weekStart) < 0) {
      lastWeekSpend += tx.amount;
    }
  }

  const nextRecurringIncome =
    recurring
      .filter((item) => item.type === "INCOME")
      .map((item) => jalaliFromInstant(item.nextRunAt))
      .filter((date) => compareJalaliDate(date, today) >= 0)
      .sort(compareJalaliDate)[0] ?? null;

  const snapshot = assembleDashboard({
    accounts,
    goals: goals.map((goal) => ({
      currentAmount: goal.account ? goal.account.balance : goal.currentAmount,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      accountId: goal.accountId,
      isArchived: goal.isArchived,
    })),
    plannedExpenses: recurring
      .filter((item) => item.type === "EXPENSE")
      .map((item) => ({
        amount: item.amount,
        nextOccurrence: item.nextRunAt,
        isActive: item.isActive,
      })),
    spentToday,
    monthlySpent: 0n,
    previousMonthSpent: 0n,
    today,
    incomeDayOfMonth,
    nextRecurringIncome,
    outstandingDebtsIOwe: openDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0n),
  });

  const period = jalaliKey({ year: today.year, month: today.month, day: 1 }).slice(0, 7);
  const budgets = [
    ...(budget.overallLimit != null
      ? [
          {
            budgetId: "overall",
            name: "کل ماه",
            spent: budget.overallSpent,
            limit: budget.overallLimit,
            period,
          },
        ]
      : []),
    ...budget.items.map((item) => ({
      budgetId: item.id,
      name: item.name,
      spent: item.spent,
      limit: item.limit,
      period,
    })),
  ];

  return {
    today,
    currentHour,
    dateKey: jalaliKey(today),
    hasLoggedToday,
    activeDaysInWindow: activeDays.size,
    budgets,
    recurring: recurring.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      nextRunAt: jalaliFromInstant(item.nextRunAt),
      today,
    })),
    weeklyStats: {
      currentWeekSpendToDate: currentWeekSpend,
      lastWeekTotal: lastWeekSpend,
      daysElapsed: diffDaysInclusive(weekStart, today),
      weekKey: jalaliKey(weekStart),
    },
    remainingToday: snapshot.allowance.displayRemainingToday,
    goals: goals
      .filter((goal) => goal.type !== "EMERGENCY_FUND")
      .map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.account ? goal.account.balance : goal.currentAmount,
        targetAmount: goal.targetAmount,
      })),
  };
}

function notificationPayload(notification: FinanceNotification): Prisma.InputJsonObject {
  return {
    title: notification.title,
    body: notification.body,
    href: notification.href,
    explanation: notification.explanation,
    ...notification.payload,
  };
}

export async function processUserNotifications(
  userId: string,
  incomeDayOfMonth: number | null,
  now = new Date(),
): Promise<{ considered: number; delivered: number }> {
  const today = getTehranJalaliDate(now);
  if (today.day <= 7) {
    await persistClosedPeriodSnapshot(userId, now).catch(() => undefined);
  }

  const [pref, settings] = await Promise.all([
    prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    prisma.userNotificationSetting.findMany({ where: { userId } }),
  ]);

  if (pref.muteAll) {
    return { considered: 0, delivered: 0 };
  }

  const enabledKeys = enabledRuleKeys(pref, settings);
  if (enabledKeys.size === 0) {
    return { considered: 0, delivered: 0 };
  }

  const snapshot = await loadUserSnapshot(userId, incomeDayOfMonth, now);
  const candidates = collectNotifications({
    enabledKeys,
    noTransaction: {
      hasLoggedToday: snapshot.hasLoggedToday,
      activeDaysInWindow: snapshot.activeDaysInWindow,
      currentHour: snapshot.currentHour,
      eveningHour: pref.eveningHour,
      dateKey: snapshot.dateKey,
    },
    budgets: snapshot.budgets,
    recurring: snapshot.recurring,
    weeklyStats: {
      ...snapshot.weeklyStats,
      thresholdPct: pref.paceThresholdPct,
    },
    dailyAllowance: {
      remainingToday: snapshot.remainingToday,
      currentHour: snapshot.currentHour,
      sendHour: pref.dailyAllowanceHour,
      dateKey: snapshot.dateKey,
    },
    goals: snapshot.goals,
  });

  let delivered = 0;

  for (const candidate of candidates) {
    const setting = settingFor(settings, candidate.ruleKey);
    const channel: NotificationChannel = setting?.channel ?? "PUSH";
    const quiet = isInQuietHours(
      snapshot.currentHour,
      setting?.quietHoursStart ?? pref.quietHoursStart,
      setting?.quietHoursEnd ?? pref.quietHoursEnd,
    );

    try {
      await prisma.notificationLog.create({
        data: {
          userId,
          ruleKey: candidate.ruleKey,
          dedupeKey: candidate.dedupeKey,
          payload: notificationPayload(candidate),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }

    delivered += 1;

    if (channel === "PUSH" && !quiet) {
      await deliverPushToUser(userId, {
        title: candidate.title,
        body: candidate.body,
        url: candidate.href,
      });
    }
  }

  return { considered: candidates.length, delivered };
}

export async function runNotificationJob(now = new Date()) {
  await ensureNotificationRules();

  let skip = 0;
  let users = 0;
  let delivered = 0;
  let considered = 0;

  for (;;) {
    const batch = await prisma.user.findMany({
      select: { id: true, incomeDayOfMonth: true },
      orderBy: { id: "asc" },
      skip,
      take: USER_BATCH,
    });
    if (batch.length === 0) {
      break;
    }

    for (const user of batch) {
      const result = await processUserNotifications(user.id, user.incomeDayOfMonth, now);
      users += 1;
      delivered += result.delivered;
      considered += result.considered;
    }

    skip += batch.length;
    if (batch.length < USER_BATCH) {
      break;
    }
  }

  return { users, considered, delivered };
}
