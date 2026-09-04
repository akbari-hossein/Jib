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
  assetGroupLabel,
  calculateNetWorth,
  sumAssetHoldingValue,
} from "@/lib/finance/assetHoldings";
import {
  describePurchasingPower,
  describeSavingsInReferenceAsset,
  REFERENCE_ASSET_OPTION_LABEL,
  type ReferenceAssetType,
} from "@/lib/finance/purchasing-power";
import { describeRateAge, readStaleAfterMs } from "@/lib/finance/rate-freshness";
import { getLatestRate, getLatestRates } from "@/lib/finance/referenceRates";
import { hydrateAccountSnapshots, listAccountItems, listAccounts } from "@/server/queries/accounts";
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

async function sumAssetAdds(userId: string, from: Date, to: Date) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type: "ASSET_ADD", occurredAt: { gte: from, lt: to } },
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
  const monthFrom = tehranMidnightUtc(monthStart);
  const monthTo = tehranMidnightUtc(nextMonthStart);

  const [
    accountRows,
    accountItems,
    goals,
    recurring,
    spentToday,
    monthlySpent,
    previousMonthSpent,
    monthlyIncome,
    monthlyAssetAdds,
    recent,
    rates,
    referenceRate,
  ] = await Promise.all([
    listAccounts(userId),
    listAccountItems(userId),
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
    sumExpenses(userId, monthFrom, monthTo, false),
    sumExpenses(userId, tehranMidnightUtc(previousMonthStart), monthFrom, false),
    sumIncome(userId, monthFrom, monthTo),
    sumAssetAdds(userId, monthFrom, monthTo),
    listRecentTransactions(userId, 5),
    getLatestRates(),
    referenceAssetPreference ? getLatestRate(referenceAssetPreference) : Promise.resolve(null),
  ]);

  const accounts = await hydrateAccountSnapshots(accountRows);
  const holdings = accountItems.filter((account) => account.type === "ASSET_HOLDING" && account.isActive);
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
  const monthlySavings = monthlyIncome - monthlySpent + monthlyAssetAdds;
  const displayedAvailable =
    snapshot.availableMoney < 0n ? -snapshot.availableMoney : snapshot.availableMoney;
  const staleAfterMs = readStaleAfterMs();
  const availableEquivalent = describePurchasingPower(displayedAvailable, referenceRate);
  const referenceAge = referenceRate ? describeRateAge(referenceRate.effectiveAt, now, staleAfterMs) : null;
  if (availableEquivalent && referenceAge?.stale) {
    availableEquivalent.rateDateLabel = referenceAge.label;
  }
  const monthlySavingsHint =
    monthlyIncome > 0n
      ? describeSavingsInReferenceAsset(monthlySavings, referenceRate, "month")
      : null;
  if (monthlySavingsHint && referenceAge?.stale) {
    monthlySavingsHint.rateDateLabel = referenceAge.label;
  }
  const assetTotal = sumAssetHoldingValue(accounts);
  const netWorth = calculateNetWorth(accounts);
  const rateRows = [...rates.values()].map((rate) => {
    const age = describeRateAge(rate.effectiveAt, now, staleAfterMs);
    return {
      assetType: rate.assetType,
      label: REFERENCE_ASSET_OPTION_LABEL[rate.assetType],
      rateToToman: rate.rateToToman.toString(),
      rateId: rate.id,
      rateDateLabel: age.label,
      stale: age.stale,
    };
  });

  return {
    greeting,
    hasAccounts: accountRows.some((account) => account.isActive),
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
    netWorth,
    assetTotal,
    assetGroup: assetGroupLabel(
      holdings
        .map((item) => item.assetType)
        .filter((type): type is ReferenceAssetType => type != null),
    ),
    holdings,
    rates: rateRows,
  };
}

export type DashboardDto = Awaited<ReturnType<typeof getDashboard>>;
