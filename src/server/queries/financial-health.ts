import { Prisma } from "@prisma/client";
import { JALALI_MONTHS } from "@/lib/labels";
import { toPersianDigits } from "@/lib/currency/format";
import {
  addJalaliMonths,
  getTehranJalaliDate,
  jalaliFromInstant,
  tehranMidnightUtc,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { HEALTH_SCORE_COPY } from "@/lib/finance/financial-health-copy";
import {
  computeHealthFromSource,
  hasPriorMonthActivity,
  periodHasActivity,
  snapshotScoresFromResult,
  type HealthPeriodFlow,
  type HealthSourceData,
} from "@/lib/finance/financial-health-input";
import {
  monthlyEquivalentAmount,
  type FinancialHealthResult,
  type ScoreComponentKey,
} from "@/lib/finance/financial-health-score";
import { sumReservedForGoals } from "@/lib/finance/available-money";
import { listChartMonthWindow } from "@/lib/finance/report-charts";
import { FINANCIAL_HEALTH_HISTORY_MONTHS, healthHistoryWhere } from "@/lib/api/financial-health-access";
import { getBudgetMonth } from "@/server/queries/budgets";

export const HEALTH_SCORE_HISTORY_MONTHS = FINANCIAL_HEALTH_HISTORY_MONTHS;

type FlowTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: bigint;
  year: number;
  month: number;
  essential: boolean;
};

export type FinancialHealthDto = {
  ready: boolean;
  current: {
    totalScore: number | null;
    explanation: string;
    primaryDriver: ScoreComponentKey | null;
    trend: FinancialHealthResult["trend"];
    scoreDelta: number | null;
    subScores: Array<{
      key: ScoreComponentKey;
      label: string;
      score: number;
      explanation: string;
      dataAvailable: boolean;
      rawValue?: number;
      previousValue?: number;
      trend?: FinancialHealthResult["trend"];
    }>;
  };
  history: Array<{
    year: number;
    month: number;
    monthLabel: string;
    totalScore: number;
    live: boolean;
  }>;
};

function monthLabel(year: number, month: number): string {
  const name = JALALI_MONTHS[month - 1] ?? "";
  return `${name} ${toPersianDigits(year)}`.trim();
}

function serializeResult(result: FinancialHealthResult): FinancialHealthDto["current"] {
  return {
    totalScore: result.totalScore,
    explanation: result.explanation,
    primaryDriver: result.primaryDriver,
    trend: result.trend,
    scoreDelta: result.scoreDelta,
    subScores: result.subScores.map((part) => ({
      key: part.key,
      label: part.label,
      score: part.score,
      explanation: part.explanation,
      dataAvailable: part.dataAvailable,
      rawValue: part.rawValue,
      previousValue: part.previousValue,
      trend: part.trend,
    })),
  };
}

function aggregateFlows(months: { year: number; month: number }[], rows: FlowTransaction[]): HealthPeriodFlow[] {
  const totals = new Map<string, HealthPeriodFlow>(
    months.map((month) => [
      `${month.year}-${month.month}`,
      {
        year: month.year,
        month: month.month,
        income: 0n,
        expenses: 0n,
        essentialExpenses: 0n,
      },
    ]),
  );

  for (const row of rows) {
    const bucket = totals.get(`${row.year}-${row.month}`);
    if (!bucket) {
      continue;
    }
    if (row.type === "INCOME") {
      bucket.income += row.amount;
    } else {
      bucket.expenses += row.amount;
      if (row.essential) {
        bucket.essentialExpenses += row.amount;
      }
    }
  }

  return months.map((month) => totals.get(`${month.year}-${month.month}`)!);
}

async function loadPeriodSource(
  userId: string,
  period: Pick<JalaliDate, "year" | "month">,
  now: Date,
): Promise<HealthSourceData> {
  const today = getTehranJalaliDate(now);
  const months = listChartMonthWindow(period, HEALTH_SCORE_HISTORY_MONTHS);
  const from = tehranMidnightUtc({ ...months[0]!, day: 1 });
  const next = addJalaliMonths({ year: period.year, month: period.month, day: 1 }, 1);
  const to = tehranMidnightUtc(next);
  const previousMonth = addJalaliMonths({ year: period.year, month: period.month, day: 1 }, -1);
  const previousPeriodStart = tehranMidnightUtc({ ...previousMonth, day: 1 });

  const [transactions, budget, previousBudget, goals, accounts, recurring, previousSnapshot] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        occurredAt: { gte: from, lt: to },
      },
      select: {
        type: true,
        amount: true,
        occurredAt: true,
        category: { select: { group: true } },
      },
    }),
    getBudgetMonth(userId, period),
    getBudgetMonth(userId, { year: previousMonth.year, month: previousMonth.month }),
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
    prisma.account.findMany({
      where: { userId, isActive: true },
      select: { balance: true, includeInAvailable: true },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId, isActive: true, type: "EXPENSE" },
      select: {
        amount: true,
        frequency: true,
        interval: true,
        category: { select: { group: true } },
      },
    }),
    prisma.financialHealthSnapshot.findUnique({
      where: { userId_periodStart: { userId, periodStart: previousPeriodStart } },
      select: {
        totalScore: true,
        savingsRateScore: true,
        budgetAdherenceScore: true,
        spendingConsistencyScore: true,
        emergencyFundScore: true,
        debtBurdenScore: true,
      },
    }),
  ]);

  const flowRows: FlowTransaction[] = transactions.flatMap((row) => {
    if (row.type !== "INCOME" && row.type !== "EXPENSE") {
      return [];
    }
    const jalali = jalaliFromInstant(row.occurredAt);
    return [
      {
        type: row.type,
        amount: row.amount,
        year: jalali.year,
        month: jalali.month,
        essential: row.type === "EXPENSE" && row.category?.group === "ESSENTIAL",
      },
    ];
  });

  const flows = aggregateFlows(months, flowRows);
  const current = flows[flows.length - 1] ?? {
    year: period.year,
    month: period.month,
    income: 0n,
    expenses: 0n,
    essentialExpenses: 0n,
  };
  const previous = flows.length > 1 ? (flows[flows.length - 2] ?? null) : null;
  const isCurrentMonth = today.year === period.year && today.month === period.month;
  const hasCompletedMonth = isCurrentMonth
    ? hasPriorMonthActivity(flows, period.year, period.month)
    : periodHasActivity(current);

  const savingsBalances = accounts
    .filter((account) => !account.includeInAvailable)
    .reduce((sum, account) => sum + account.balance, 0n);

  const monthlyDebtPayments = recurring
    .filter((item) => item.category.group === "FINANCIAL")
    .reduce(
      (sum, item) => sum + monthlyEquivalentAmount(item.amount, item.frequency, item.interval),
      0n,
    );

  const budgetItems =
    isCurrentMonth && budget.items.length === 0 ? previousBudget.items : budget.items;

  return {
    year: period.year,
    month: period.month,
    current,
    previous,
    budgets: budgetItems.map((item) => ({ spent: item.spent, limit: item.limit })),
    flows,
    reservedMoney: sumReservedForGoals(goals) + savingsBalances,
    monthlyDebtPayments,
    previousSnapshot,
    hasCompletedMonth,
    isLiveCurrentPeriod: isCurrentMonth,
  };
}

function toHistoryPoint(input: {
  year: number;
  month: number;
  totalScore: number;
  live: boolean;
}): FinancialHealthDto["history"][number] {
  return {
    year: input.year,
    month: input.month,
    monthLabel: monthLabel(input.year, input.month),
    totalScore: input.totalScore,
    live: input.live,
  };
}

export async function persistClosedPeriodSnapshot(userId: string, now = new Date()) {
  const today = getTehranJalaliDate(now);
  const previous = addJalaliMonths({ year: today.year, month: today.month, day: 1 }, -1);
  const periodStart = tehranMidnightUtc({ year: previous.year, month: previous.month, day: 1 });
  const periodEnd = tehranMidnightUtc({ year: today.year, month: today.month, day: 1 });

  const existing = await prisma.financialHealthSnapshot.findUnique({
    where: { userId_periodStart: { userId, periodStart } },
  });
  if (existing) {
    return existing;
  }

  const source = await loadPeriodSource(userId, previous, now);
  const result = computeHealthFromSource(source);
  const scores = snapshotScoresFromResult(result);
  if (!result.ready || scores == null) {
    return null;
  }

  try {
    return await prisma.financialHealthSnapshot.create({
      data: {
        userId,
        totalScore: scores.totalScore,
        savingsRateScore: scores.savingsRateScore,
        budgetAdherenceScore: scores.budgetAdherenceScore,
        spendingConsistencyScore: scores.spendingConsistencyScore,
        emergencyFundScore: scores.emergencyFundScore,
        debtBurdenScore: scores.debtBurdenScore,
        primaryDriver: result.primaryDriver,
        explanation: result.explanation,
        periodStart,
        periodEnd,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.financialHealthSnapshot.findUnique({
        where: { userId_periodStart: { userId, periodStart } },
      });
    }
    throw error;
  }
}

export async function persistClosedSnapshotsForActiveUsers(now = new Date()) {
  const today = getTehranJalaliDate(now);
  if (today.day > 7) {
    return { persisted: 0 };
  }

  let skip = 0;
  let persisted = 0;
  for (;;) {
    const batch = await prisma.user.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
      skip,
      take: 40,
    });
    if (batch.length === 0) {
      break;
    }
    for (const user of batch) {
      const row = await persistClosedPeriodSnapshot(user.id, now);
      if (row) {
        persisted += 1;
      }
    }
    skip += batch.length;
    if (batch.length < 40) {
      break;
    }
  }
  return { persisted };
}

export async function getFinancialHealth(
  userId: string,
  now = new Date(),
): Promise<FinancialHealthDto> {
  const today = getTehranJalaliDate(now);
  await persistClosedPeriodSnapshot(userId, now).catch(() => undefined);

  const [source, snapshots] = await Promise.all([
    loadPeriodSource(userId, { year: today.year, month: today.month }, now),
    prisma.financialHealthSnapshot.findMany({
      ...healthHistoryWhere(userId, HEALTH_SCORE_HISTORY_MONTHS),
      select: {
        userId: true,
        totalScore: true,
        periodStart: true,
      },
    }),
  ]);

  const result = computeHealthFromSource(source);
  const history = snapshots
    .filter((row) => row.userId === userId)
    .map((row) => {
      const jalali = jalaliFromInstant(row.periodStart);
      return toHistoryPoint({
        year: jalali.year,
        month: jalali.month,
        totalScore: row.totalScore,
        live: false,
      });
    });

  if (result.ready && result.totalScore != null) {
    const already = history.some((point) => point.year === today.year && point.month === today.month);
    if (!already) {
      history.push(
        toHistoryPoint({
          year: today.year,
          month: today.month,
          totalScore: result.totalScore,
          live: true,
        }),
      );
    }
  }

  return {
    ready: result.ready,
    current: result.ready
      ? serializeResult(result)
      : {
          ...serializeResult(result),
          explanation: result.explanation || HEALTH_SCORE_COPY.emptyDescription,
        },
    history,
  };
}

export function widgetFromHealth(health: FinancialHealthDto) {
  return {
    ready: health.ready,
    totalScore: health.current.totalScore,
    scoreDelta: health.current.scoreDelta,
    trend: health.current.trend,
  };
}

export type HealthScoreWidgetDto = ReturnType<typeof widgetFromHealth>;
