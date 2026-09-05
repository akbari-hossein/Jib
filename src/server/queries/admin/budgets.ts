import type { Prisma } from "@prisma/client";
import { ADMIN_PAGE_SIZE, type SortDir, userSearchWhere } from "@/lib/admin/params";
import { addJalaliMonths, tehranMidnightUtc } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";

export async function listAdminBudgets(input: {
  query: string;
  dir: SortDir;
  page: number;
}) {
  const clauses: Prisma.BudgetWhereInput[] = [];
  if (input.query) {
    const userMatch = userSearchWhere(input.query);
    if (userMatch) {
      clauses.push({ user: userMatch });
    }
  }

  const where: Prisma.BudgetWhereInput = clauses.length ? { AND: clauses } : {};
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, budgets] = await Promise.all([
    prisma.budget.count({ where }),
    prisma.budget.findMany({
      where,
      select: {
        id: true,
        jalaliYear: true,
        jalaliMonth: true,
        overallLimit: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        categories: {
          select: {
            limit: true,
            categoryId: true,
          },
        },
      },
      orderBy: [{ jalaliYear: input.dir }, { jalaliMonth: input.dir }, { id: "asc" }],
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  const usageByBudget = await budgetUsageById(budgets);

  return {
    budgets: budgets.map((budget) => {
      const categoryLimit = budget.categories.reduce((sum, item) => sum + item.limit, 0n);
      const limit = budget.overallLimit ?? (categoryLimit > 0n ? categoryLimit : null);
      const spent = usageByBudget.get(budget.id) ?? 0n;
      return {
        ...budget,
        limit,
        spent,
        categoryCount: budget.categories.length,
      };
    }),
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

async function budgetUsageById(
  budgets: Array<{
    id: string;
    user: { id: string };
    jalaliYear: number;
    jalaliMonth: number;
    categories: Array<{ categoryId: string; limit: bigint }>;
  }>,
) {
  const usage = new Map<string, bigint>();
  if (budgets.length === 0) {
    return usage;
  }

  const ranges = budgets.map((budget) => {
    const start = { year: budget.jalaliYear, month: budget.jalaliMonth, day: 1 };
    return {
      id: budget.id,
      userId: budget.user.id,
      from: tehranMidnightUtc(start),
      to: tehranMidnightUtc(addJalaliMonths(start, 1)),
    };
  });

  const from = new Date(Math.min(...ranges.map((item) => item.from.getTime())));
  const to = new Date(Math.max(...ranges.map((item) => item.to.getTime())));
  const userIds = [...new Set(ranges.map((item) => item.userId))];

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: { in: userIds },
      type: "EXPENSE",
      occurredAt: { gte: from, lt: to },
    },
    select: {
      userId: true,
      amount: true,
      occurredAt: true,
    },
  });

  for (const range of ranges) {
    let spent = 0n;
    for (const transaction of transactions) {
      if (transaction.userId !== range.userId) {
        continue;
      }
      if (transaction.occurredAt < range.from || transaction.occurredAt >= range.to) {
        continue;
      }
      spent += transaction.amount;
    }
    usage.set(range.id, spent);
  }

  return usage;
}
