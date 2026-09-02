import type { Prisma, TransactionType } from "@prisma/client";
import { ADMIN_PAGE_SIZE, type SortDir } from "@/lib/admin/params";
import { prisma } from "@/lib/db/prisma";

export async function listAdminTransactions(input: {
  query: string;
  userId?: string;
  accountId?: string;
  categoryName?: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
  minAmount?: bigint;
  maxAmount?: bigint;
  dir: SortDir;
  page: number;
}) {
  const occurredAt: Prisma.DateTimeFilter = {};
  if (input.from) {
    occurredAt.gte = input.from;
  }
  if (input.to) {
    occurredAt.lt = input.to;
  }

  const amount: Prisma.BigIntFilter = {};
  if (input.minAmount != null) {
    amount.gte = input.minAmount;
  }
  if (input.maxAmount != null) {
    amount.lte = input.maxAmount;
  }

  const clauses: Prisma.TransactionWhereInput[] = [];
  if (input.userId) {
    clauses.push({ userId: input.userId });
  }
  if (input.accountId) {
    clauses.push({ accountId: input.accountId });
  }
  if (input.categoryName) {
    clauses.push({
      category: { name: { contains: input.categoryName, mode: "insensitive" } },
    });
  }
  if (input.type) {
    clauses.push({ type: input.type });
  }
  if (Object.keys(occurredAt).length > 0) {
    clauses.push({ occurredAt });
  }
  if (Object.keys(amount).length > 0) {
    clauses.push({ amount });
  }
  if (input.query) {
    clauses.push({
      OR: [
        { merchant: { contains: input.query, mode: "insensitive" } },
        { account: { name: { contains: input.query, mode: "insensitive" } } },
        { user: { email: { contains: input.query, mode: "insensitive" } } },
        { user: { name: { contains: input.query, mode: "insensitive" } } },
        { userId: { equals: input.query } },
      ],
    });
  }

  const where: Prisma.TransactionWhereInput = clauses.length ? { AND: clauses } : {};
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      select: {
        id: true,
        type: true,
        amount: true,
        occurredAt: true,
        createdAt: true,
        merchant: true,
        user: { select: { id: true, name: true, email: true } },
        account: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ occurredAt: input.dir }, { id: "asc" }],
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  return {
    transactions,
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export type AdminTransactionListItem = Awaited<
  ReturnType<typeof listAdminTransactions>
>["transactions"][number];
