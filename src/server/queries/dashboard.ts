import { prisma } from "@/lib/db/prisma";
import {
  addJalaliDays,
  addJalaliMonths,
  compareJalaliDate,
  getDayPeriod,
  getTehranJalaliDate,
  greetingForPeriod,
  jalaliFromInstant,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import { assembleDashboard } from "@/lib/finance/dashboard";
import {
  describePurchasingPower,
  describeSavingsInReferenceAsset,
  type ReferenceAssetType,
} from "@/lib/finance/purchasing-power";
import { getLatestRate } from "@/lib/finance/referenceRates";
import { listRecentTransactions } from "@/server/queries/transactions";

async function sumExpenses(userId: string, from: Date, to: Date, liquidOnly: boolean) {
  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      occurredAt: { gte: from, lt: to },
      ...(liquidOnly ? { account: { includeInAvailable: true } } : {}),
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0n;
}

async function sumIncome(userId: string, from: Date, to: Date) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type: "INCOME", occurredAt: { gte: from, lt: to } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0n;
}

export async function getDashboard(
  userId: string,
  incomeDayOfMonth: number | null,
  referenceAssetPreference: ReferenceAssetType | null = null,
) {
  const now = new Date();
  const today = getTehranJalaliDate(now);
  const monthStart = { year: today.year, month: today.month, day: 1 };
  const nextMonthStart = addJalaliMonths(monthStart, 1);
  const previousMonthStart = addJalaliMonths(monthStart, -1);
  const dayStart = tehranMidnightUtc(today);
  const dayEnd = tehranMidnightUtc(addJalaliDays(today, 1));

  const [accounts, goals, recurring, spentToday, monthlySpent, previousMonthSpent, monthlyIncome, recent, accountCount, referenceRate] =
    await Promise.all([
      prisma.account.findMany({
        where: { userId },
        select: { balance: true, isActive: true, includeInAvailable: true },
      }),
      prisma.goal.findMany({
        where: { userId },
        select: {
          currentAmount: true,
          targetAmount: true,
          targetDate: true,
          accountId: true,
          isArchived: true,
        },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId, isActive: true },
        select: { amount: true, nextRunAt: true, isActive: true, type: true },
      }),
      sumExpenses(userId, dayStart, dayEnd, true),
      sumExpenses(userId, tehranMidnightUtc(monthStart), tehranMidnightUtc(nextMonthStart), false),
      sumExpenses(
        userId,
        tehranMidnightUtc(previousMonthStart),
        tehranMidnightUtc(monthStart),
        false,
      ),
      sumIncome(userId, tehranMidnightUtc(monthStart), tehranMidnightUtc(nextMonthStart)),
      listRecentTransactions(userId, 5),
      prisma.account.count({ where: { userId, isActive: true } }),
      referenceAssetPreference ? getLatestRate(referenceAssetPreference) : Promise.resolve(null),
    ]);

  const nextRecurringIncome =
    recurring
      .filter((item) => item.type === "INCOME")
      .map((item) => jalaliFromInstant(item.nextRunAt))
      .filter((date) => compareJalaliDate(date, today) >= 0)
      .sort(compareJalaliDate)[0] ?? null;

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
    spentToday,
    monthlySpent,
    previousMonthSpent,
    today,
    incomeDayOfMonth,
    nextRecurringIncome,
  });

  const greeting = greetingForPeriod(getDayPeriod(now));
  const monthlySavings = monthlyIncome - monthlySpent;
  const displayedAvailable =
    snapshot.availableMoney < 0n ? -snapshot.availableMoney : snapshot.availableMoney;
  const availableEquivalent = describePurchasingPower(displayedAvailable, referenceRate);
  const monthlySavingsHint =
    monthlyIncome > 0n
      ? describeSavingsInReferenceAsset(monthlySavings, referenceRate, "month")
      : null;

  return {
    greeting,
    hasAccounts: accountCount > 0,
    incomeDayOfMonth,
    remainingDays: snapshot.cycle.remainingDays,
    nextIncome: snapshot.cycle.nextIncomeDate,
    hasKnownIncomeDate: incomeDayOfMonth != null || nextRecurringIncome != null,
    availableMoney: snapshot.availableMoney,
    isShortfall: snapshot.availableMoney < 0n,
    availableEquivalent,
    liquidBalance: snapshot.liquidBalance,
    reservedForGoals: snapshot.reservedForGoals,
    plannedExpenses: snapshot.plannedExpenses,
    requiredSavings: snapshot.requiredSavings,
    spentToday,
    dailyShare: snapshot.allowance.dailyShare,
    remainingToday: snapshot.allowance.displayRemainingToday,
    overspentToday:
      snapshot.allowance.displayRemainingToday === 0n && spentToday > snapshot.allowance.dailyShare,
    monthlySpent,
    previousMonthSpent,
    monthlyIncome,
    monthlySavings,
    monthlySavingsHint,
    monthlyChange: snapshot.monthlyChange,
    currentMonth: today.month,
    currentYear: today.year,
    recent,
  };
}

export type DashboardDto = Awaited<ReturnType<typeof getDashboard>>;
