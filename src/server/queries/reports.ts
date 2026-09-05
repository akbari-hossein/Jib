import { prisma } from "@/lib/db/prisma";
import {
  addJalaliDays,
  addJalaliMonths,
  formatJalaliRange,
  getTehranJalaliDate,
  jalaliMonthLength,
  jalaliWeekStart,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import {
  assembleMonthlyRecap,
  budgetDiscipline,
  NEW_MONTH_RECAP_PROMPT_DAYS,
  pickMovedGoal,
  serializeMonthlyRecap,
  summarizeLoggedDays,
  type MonthlyRecapDto,
} from "@/lib/finance/monthly-recap-data";
import {
  describeSavingsInReferenceAsset,
  type ReferenceAssetType,
} from "@/lib/finance/purchasing-power";
import { getLatestRate } from "@/lib/finance/referenceRates";
import { assemblePeriodReview, type CategorySpend, type PeriodReview } from "@/lib/finance/reports";
import { JALALI_MONTHS } from "@/lib/labels";
import { getBudgetMonth, type BudgetMonthDto } from "@/server/queries/budgets";
import { listGoals, type GoalListItem } from "@/server/queries/goals";

async function sumByType(
  userId: string,
  type: "EXPENSE" | "INCOME",
  from: Date,
  to: Date,
) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, occurredAt: { gte: from, lt: to } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0n;
}

async function categorySpend(userId: string, from: Date, to: Date): Promise<CategorySpend[]> {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      occurredAt: { gte: from, lt: to },
    },
    _sum: { amount: true },
  });

  const ids = grouped
    .map((row) => row.categoryId)
    .filter((id): id is string => id != null);
  const categories = ids.length
    ? await prisma.category.findMany({
        where: { userId, id: { in: ids } },
        select: { id: true, name: true, icon: true },
      })
    : [];
  const byId = new Map(categories.map((category) => [category.id, category]));

  return grouped.map((row) => {
    const category = row.categoryId ? byId.get(row.categoryId) : undefined;
    return {
      categoryId: row.categoryId,
      name: category?.name ?? "بدون دسته",
      icon: category?.icon ?? "repeat",
      amount: row._sum.amount ?? 0n,
    };
  });
}

async function periodTotals(userId: string, from: Date, to: Date, previousFrom: Date, previousTo: Date) {
  const [income, expenses, previousExpenses, categories, extraSavings] = await Promise.all([
    sumByType(userId, "INCOME", from, to),
    sumByType(userId, "EXPENSE", from, to),
    sumByType(userId, "EXPENSE", previousFrom, previousTo),
    categorySpend(userId, from, to),
    prisma.transaction.aggregate({
      where: { userId, type: "ASSET_ADD", occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    }).then((result) => result._sum.amount ?? 0n),
  ]);

  return assemblePeriodReview({
    income,
    expenses,
    previousExpenses,
    categories,
    extraSavings,
  });
}

async function recapExtras(userId: string, from: Date, to: Date) {
  const [occurredAtRows, inflows] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, occurredAt: { gte: from, lt: to } },
      select: { occurredAt: true },
    }),
    prisma.transaction.groupBy({
      by: ["toAccountId"],
      where: {
        userId,
        type: "TRANSFER",
        toAccountId: { not: null },
        occurredAt: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
  ]);

  const inflowsByAccountId = new Map<string, bigint>();
  for (const row of inflows) {
    if (!row.toAccountId) {
      continue;
    }
    inflowsByAccountId.set(row.toAccountId, row._sum.amount ?? 0n);
  }

  return {
    occurredAt: occurredAtRows.map((row) => row.occurredAt),
    inflowsByAccountId,
  };
}

function composeRecap(input: {
  year: number;
  month: number;
  review: PeriodReview;
  extras: Awaited<ReturnType<typeof recapExtras>>;
  budget: BudgetMonthDto;
  goals: GoalListItem[];
  includeGoalPct: boolean;
}): MonthlyRecapDto | null {
  if (input.review.income === 0n && input.review.expenses === 0n) {
    return null;
  }

  const today = getTehranJalaliDate();
  const isCurrentMonth = today.year === input.year && today.month === input.month;
  const daysInPeriod = isCurrentMonth ? today.day : jalaliMonthLength(input.year, input.month);
  const logged = summarizeLoggedDays(input.extras.occurredAt);

  const recap = assembleMonthlyRecap({
    year: input.year,
    month: input.month,
    review: input.review,
    daysLogged: logged.daysLogged,
    daysInPeriod,
    goal: pickMovedGoal({
      goals: input.goals.map((goal) => ({
        name: goal.name,
        accountId: goal.accountId,
        progressPct: goal.progress.pct,
      })),
      inflowsByAccountId: input.extras.inflowsByAccountId,
      includePct: input.includeGoalPct,
    }),
    budgetsUnder: budgetDiscipline({
      items: input.budget.items.map((item) => ({ status: item.usage.status })),
      overallStatus: input.budget.overallUsage?.status ?? null,
    }),
  });

  return serializeMonthlyRecap(recap);
}

export async function getMonthlyRecap(
  userId: string,
  year: number,
  month: number,
): Promise<MonthlyRecapDto | null> {
  const monthStart = { year, month, day: 1 };
  const nextMonth = addJalaliMonths(monthStart, 1);
  const previousMonthStart = addJalaliMonths(monthStart, -1);
  const from = tehranMidnightUtc(monthStart);
  const to = tehranMidnightUtc(nextMonth);
  const today = getTehranJalaliDate();
  const includeGoalPct = today.year === year && today.month === month;

  const [review, extras, budget, goals] = await Promise.all([
    periodTotals(userId, from, to, tehranMidnightUtc(previousMonthStart), from),
    recapExtras(userId, from, to),
    getBudgetMonth(userId, { year, month }),
    listGoals(userId),
  ]);

  return composeRecap({
    year,
    month,
    review,
    extras,
    budget,
    goals,
    includeGoalPct,
  });
}

export async function getPreviousMonthRecapPrompt(userId: string): Promise<MonthlyRecapDto | null> {
  const today = getTehranJalaliDate();
  if (today.day > NEW_MONTH_RECAP_PROMPT_DAYS) {
    return null;
  }
  const previous = addJalaliMonths({ year: today.year, month: today.month, day: 1 }, -1);
  return getMonthlyRecap(userId, previous.year, previous.month);
}

export async function getReports(
  userId: string,
  referenceAssetPreference: ReferenceAssetType | null = null,
) {
  const today = getTehranJalaliDate();
  const weekStart = jalaliWeekStart(today);
  const weekEnd = addJalaliDays(weekStart, 6);
  const nextWeek = addJalaliDays(weekStart, 7);
  const previousWeekStart = addJalaliDays(weekStart, -7);
  const monthStart = { year: today.year, month: today.month, day: 1 };
  const nextMonth = addJalaliMonths(monthStart, 1);
  const previousMonthStart = addJalaliMonths(monthStart, -1);
  const monthFrom = tehranMidnightUtc(monthStart);
  const monthTo = tehranMidnightUtc(nextMonth);
  const includePreviousPrompt = today.day <= NEW_MONTH_RECAP_PROMPT_DAYS;

  const [week, month, budget, goals, extras, previousRecap, referenceRate] = await Promise.all([
    periodTotals(
      userId,
      tehranMidnightUtc(weekStart),
      tehranMidnightUtc(nextWeek),
      tehranMidnightUtc(previousWeekStart),
      tehranMidnightUtc(weekStart),
    ),
    periodTotals(
      userId,
      monthFrom,
      monthTo,
      tehranMidnightUtc(previousMonthStart),
      monthFrom,
    ),
    getBudgetMonth(userId),
    listGoals(userId),
    recapExtras(userId, monthFrom, monthTo),
    includePreviousPrompt
      ? getMonthlyRecap(userId, previousMonthStart.year, previousMonthStart.month)
      : Promise.resolve(null),
    referenceAssetPreference ? getLatestRate(referenceAssetPreference) : Promise.resolve(null),
  ]);

  const hasActivity = week.expenses > 0n || week.income > 0n || month.expenses > 0n || month.income > 0n;
  const weekSavingsHint =
    week.income > 0n ? describeSavingsInReferenceAsset(week.net, referenceRate, "week") : null;
  const monthSavingsHint =
    month.income > 0n ? describeSavingsInReferenceAsset(month.net, referenceRate, "month") : null;
  const recap = composeRecap({
    year: today.year,
    month: today.month,
    review: month,
    extras,
    budget,
    goals,
    includeGoalPct: true,
  });

  return {
    hasActivity,
    week: {
      title: "گزارش این هفته",
      rangeLabel: formatJalaliRange(weekStart, weekEnd),
      savingsHint: weekSavingsHint,
      ...week,
    },
    month: {
      title: `گزارش ${JALALI_MONTHS[today.month - 1] ?? ""}`,
      rangeLabel: `${JALALI_MONTHS[today.month - 1] ?? ""} ${today.year}`,
      year: today.year,
      month: today.month,
      savingsHint: monthSavingsHint,
      ...month,
    },
    recap,
    previousRecap,
    budget,
    goals,
  };
}

export type ReportsDto = Awaited<ReturnType<typeof getReports>>;
