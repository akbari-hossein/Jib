import { prisma } from "@/lib/db/prisma";
import {
  addJalaliDays,
  addJalaliMonths,
  formatJalaliRange,
  getTehranJalaliDate,
  jalaliWeekStart,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import { assemblePeriodReview, type CategorySpend } from "@/lib/finance/reports";
import { JALALI_MONTHS } from "@/lib/labels";
import { getBudgetMonth } from "@/server/queries/budgets";
import { listGoals } from "@/server/queries/goals";

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
  const [income, expenses, previousExpenses, categories] = await Promise.all([
    sumByType(userId, "INCOME", from, to),
    sumByType(userId, "EXPENSE", from, to),
    sumByType(userId, "EXPENSE", previousFrom, previousTo),
    categorySpend(userId, from, to),
  ]);

  return assemblePeriodReview({
    income,
    expenses,
    previousExpenses,
    categories,
  });
}

export async function getReports(userId: string) {
  const today = getTehranJalaliDate();
  const weekStart = jalaliWeekStart(today);
  const weekEnd = addJalaliDays(weekStart, 6);
  const nextWeek = addJalaliDays(weekStart, 7);
  const previousWeekStart = addJalaliDays(weekStart, -7);
  const monthStart = { year: today.year, month: today.month, day: 1 };
  const nextMonth = addJalaliMonths(monthStart, 1);
  const previousMonthStart = addJalaliMonths(monthStart, -1);

  const [week, month, budget, goals] = await Promise.all([
    periodTotals(
      userId,
      tehranMidnightUtc(weekStart),
      tehranMidnightUtc(nextWeek),
      tehranMidnightUtc(previousWeekStart),
      tehranMidnightUtc(weekStart),
    ),
    periodTotals(
      userId,
      tehranMidnightUtc(monthStart),
      tehranMidnightUtc(nextMonth),
      tehranMidnightUtc(previousMonthStart),
      tehranMidnightUtc(monthStart),
    ),
    getBudgetMonth(userId),
    listGoals(userId),
  ]);

  const hasActivity = week.expenses > 0n || week.income > 0n || month.expenses > 0n || month.income > 0n;

  return {
    hasActivity,
    week: {
      title: "گزارش این هفته",
      rangeLabel: formatJalaliRange(weekStart, weekEnd),
      ...week,
    },
    month: {
      title: `گزارش ${JALALI_MONTHS[today.month - 1] ?? ""}`,
      rangeLabel: `${JALALI_MONTHS[today.month - 1] ?? ""} ${today.year}`,
      year: today.year,
      month: today.month,
      ...month,
    },
    budget,
    goals,
  };
}

export type ReportsDto = Awaited<ReturnType<typeof getReports>>;
