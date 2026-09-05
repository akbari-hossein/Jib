import { prisma } from "@/lib/db/prisma";
import {
  addJalaliMonths,
  getTehranJalaliDate,
  tehranMidnightUtc,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { calculateBudgetUsage } from "@/lib/finance/budget-usage";
import { JALALI_MONTHS } from "@/lib/labels";

export async function getBudgetMonth(
  userId: string,
  jalali?: Pick<JalaliDate, "year" | "month">,
) {
  const today = getTehranJalaliDate();
  const year = jalali?.year ?? today.year;
  const month = jalali?.month ?? today.month;
  const monthStart = { year, month, day: 1 };
  const nextMonth = addJalaliMonths(monthStart, 1);
  const from = tehranMidnightUtc(monthStart);
  const to = tehranMidnightUtc(nextMonth);

  const [budget, spentByCategory, overallSpent, categories] = await Promise.all([
    prisma.budget.findUnique({
      where: {
        userId_jalaliYear_jalaliMonth: {
          userId,
          jalaliYear: year,
          jalaliMonth: month,
        },
      },
      include: {
        categories: {
          include: { category: true },
          orderBy: { category: { name: "asc" } },
        },
      },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "EXPENSE",
        occurredAt: { gte: from, lt: to },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        occurredAt: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
    prisma.category.findMany({
      where: { userId, kind: { in: ["EXPENSE", "BOTH"] } },
      orderBy: [{ group: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const spentMap = new Map(
    spentByCategory.map((row) => [row.categoryId, row._sum.amount ?? 0n]),
  );
  const totalSpent = overallSpent._sum.amount ?? 0n;

  return {
    year,
    month,
    monthName: JALALI_MONTHS[month - 1] ?? "",
    overallLimit: budget?.overallLimit ?? null,
    overallSpent: totalSpent,
    overallUsage: budget?.overallLimit
      ? calculateBudgetUsage(totalSpent, budget.overallLimit)
      : null,
    items:
      budget?.categories.map((item) => {
        const spent = spentMap.get(item.categoryId) ?? 0n;
        return {
          id: item.id,
          categoryId: item.categoryId,
          name: item.category.name,
          icon: item.category.icon,
          limit: item.limit,
          spent,
          usage: calculateBudgetUsage(spent, item.limit),
        };
      }) ?? [],
    categories: categories.map((category) => ({ id: category.id, name: category.name })),
  };
}

export type BudgetMonthDto = Awaited<ReturnType<typeof getBudgetMonth>>;
