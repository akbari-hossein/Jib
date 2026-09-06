import type { Account, AccountType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AccountListItem = {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  includeInAvailable: boolean;
};

export function toAccountListItem(account: Account): AccountListItem {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance.toString(),
    color: account.color,
    icon: account.icon,
    isActive: account.isActive,
    includeInAvailable: account.includeInAvailable,
  };
}

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
