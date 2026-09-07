import { prisma } from "@/lib/db/prisma";
import {
  addJalaliMonths,
  getTehranJalaliDate,
  jalaliDateOnlyUtc,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import { proposeGeneratedTasks } from "@/lib/finance/financial-tasks";

export async function syncGeneratedFinancialTasks(userId: string, now: Date = new Date()) {
  const today = getTehranJalaliDate(now);
  const monthStart = { year: today.year, month: today.month, day: 1 };
  const monthFrom = tehranMidnightUtc(monthStart);
  const monthTo = tehranMidnightUtc(addJalaliMonths(monthStart, 1));

  const [recurring, budget, spentByCategory, overallSpent] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where: { userId, isActive: true, type: "EXPENSE" },
      select: { id: true, name: true, type: true, nextRunAt: true, isActive: true },
    }),
    prisma.budget.findUnique({
      where: {
        userId_jalaliYear_jalaliMonth: {
          userId,
          jalaliYear: today.year,
          jalaliMonth: today.month,
        },
      },
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "EXPENSE",
        occurredAt: { gte: monthFrom, lt: monthTo },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        occurredAt: { gte: monthFrom, lt: monthTo },
      },
      _sum: { amount: true },
    }),
  ]);

  const spentMap = new Map(
    spentByCategory.map((row) => [row.categoryId, row._sum.amount ?? 0n]),
  );
  const budgets = [];

  if (budget?.overallLimit != null) {
    budgets.push({
      id: budget.id,
      name: "کل ماه",
      spent: overallSpent._sum.amount ?? 0n,
      limit: budget.overallLimit,
    });
  }

  for (const item of budget?.categories ?? []) {
    budgets.push({
      id: item.id,
      name: item.category.name,
      spent: spentMap.get(item.categoryId) ?? 0n,
      limit: item.limit,
    });
  }

  const candidates = proposeGeneratedTasks({ today, recurring, budgets });
  if (candidates.length === 0) {
    return;
  }

  await prisma.financialTask.createMany({
    data: candidates.map((task) => ({
      userId,
      title: task.title,
      type: task.type,
      dueDate: jalaliDateOnlyUtc(task.dueDate),
      sourceType: task.sourceType,
      sourceId: task.sourceId,
    })),
    skipDuplicates: true,
  });
}
