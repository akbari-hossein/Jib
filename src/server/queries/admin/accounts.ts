import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { ADMIN_PAGE_SIZE, type SortDir, userSearchWhere } from "@/lib/admin/params";
import { prisma } from "@/lib/db/prisma";

export async function listAdminAccounts(input: {
  query: string;
  status: "all" | "active" | "archived";
  dir: SortDir;
  page: number;
}) {
  const clauses: Prisma.AccountWhereInput[] = [];
  if (input.status === "active") {
    clauses.push({ isActive: true });
  }
  if (input.status === "archived") {
    clauses.push({ isActive: false });
  }
  if (input.query) {
    const userMatch = userSearchWhere(input.query);
    clauses.push({
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        ...(userMatch ? [{ user: userMatch }] : []),
      ],
    });
  }

  const where: Prisma.AccountWhereInput = clauses.length ? { AND: clauses } : {};
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, accounts] = await Promise.all([
    prisma.account.count({ where }),
    prisma.account.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        isActive: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            outgoingTransactions: true,
          },
        },
      },
      orderBy: [{ createdAt: input.dir }, { id: "asc" }],
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  return {
    accounts,
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminAccountDetail(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
      currency: true,
      isActive: true,
      includeInAvailable: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          outgoingTransactions: true,
          incomingTransfers: true,
          goals: true,
          recurring: true,
        },
      },
      outgoingTransactions: {
        orderBy: { occurredAt: "desc" },
        take: 8,
        select: {
          id: true,
          type: true,
          amount: true,
          occurredAt: true,
          merchant: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  if (!account) {
    notFound();
  }

  return account;
}

export type AdminAccountDetail = Awaited<ReturnType<typeof getAdminAccountDetail>>;
