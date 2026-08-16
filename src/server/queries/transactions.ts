import { prisma } from "@/lib/db/prisma";

export async function listRecentTransactions(userId: string, take = 50) {
  return prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
      account: true,
      toAccount: true,
    },
    orderBy: { occurredAt: "desc" },
    take,
  });
}

export async function getLastUsedIds(userId: string) {
  const [expense, income] = await Promise.all([
    prisma.transaction.findFirst({
      where: { userId, type: "EXPENSE" },
      orderBy: { occurredAt: "desc" },
      select: { accountId: true, categoryId: true },
    }),
    prisma.transaction.findFirst({
      where: { userId, type: "INCOME" },
      orderBy: { occurredAt: "desc" },
      select: { accountId: true, categoryId: true },
    }),
  ]);

  return {
    expenseAccountId: expense?.accountId ?? null,
    expenseCategoryId: expense?.categoryId ?? null,
    incomeAccountId: income?.accountId ?? null,
    incomeCategoryId: income?.categoryId ?? null,
  };
}
