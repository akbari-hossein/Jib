import { prisma } from "@/lib/db/prisma";

export async function listAccounts(userId: string, options?: { activeOnly?: boolean }) {
  return prisma.account.findMany({
    where: {
      userId,
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getLiquidBalance(userId: string): Promise<bigint> {
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true, includeInAvailable: true },
    select: { balance: true },
  });
  return accounts.reduce((sum, account) => sum + account.balance, 0n);
}
