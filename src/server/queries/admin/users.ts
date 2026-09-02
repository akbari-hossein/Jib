import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  ADMIN_PAGE_SIZE,
  type SortDir,
  type UserFilter,
  type UserSort,
  userFilterWhere,
  userOrderBy,
  userSearchWhere,
} from "@/lib/admin/params";
import {
  addJalaliMonths,
  getTehranJalaliDate,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";

const userListSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  plan: true,
  createdAt: true,
  lastActiveAt: true,
  onboardingCompletedAt: true,
  _count: {
    select: {
      accounts: true,
      transactions: true,
    },
  },
} satisfies Prisma.UserSelect;

export async function listAdminUsers(input: {
  query: string;
  filter: UserFilter;
  sort: UserSort;
  dir: SortDir;
  page: number;
  now?: Date;
}) {
  const clauses: Prisma.UserWhereInput[] = [userFilterWhere(input.filter, input.now)];
  const search = userSearchWhere(input.query);
  if (search) {
    clauses.push(search);
  }
  const where: Prisma.UserWhereInput = { AND: clauses };
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: [userOrderBy(input.sort, input.dir), { id: "asc" }],
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  return {
    users,
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export type AdminUserListItem = Awaited<ReturnType<typeof listAdminUsers>>["users"][number];

export async function getAdminUserDetail(id: string) {
  const today = getTehranJalaliDate();
  const monthStart = tehranMidnightUtc({ year: today.year, month: today.month, day: 1 });
  const nextMonthStart = tehranMidnightUtc(
    addJalaliMonths({ year: today.year, month: today.month, day: 1 }, 1),
  );

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      plan: true,
      locale: true,
      createdAt: true,
      lastActiveAt: true,
      onboardingCompletedAt: true,
      incomeDayOfMonth: true,
      googleId: true,
      passwordHash: true,
      _count: {
        select: {
          accounts: true,
          transactions: true,
          budgets: true,
          goals: true,
          sessions: true,
          recurring: true,
        },
      },
      accounts: {
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          isActive: true,
          createdAt: true,
        },
      },
      goals: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          isArchived: true,
          createdAt: true,
        },
      },
      transactions: {
        orderBy: { occurredAt: "desc" },
        take: 8,
        select: {
          id: true,
          type: true,
          amount: true,
          occurredAt: true,
          merchant: true,
          category: { select: { name: true } },
          account: { select: { name: true } },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const [monthlyIncome, monthlyExpense, sessionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: id,
        type: "INCOME",
        occurredAt: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: id,
        type: "EXPENSE",
        occurredAt: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { amount: true },
    }),
    prisma.session.count({
      where: { userId: id, expiresAt: { gt: new Date() } },
    }),
  ]);

  const totalBalance = user.accounts.reduce((sum, account) => sum + account.balance, 0n);
  const monthlyIncomeAmount = monthlyIncome._sum.amount ?? 0n;
  const monthlyExpenseAmount = monthlyExpense._sum.amount ?? 0n;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    plan: user.plan,
    locale: user.locale,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    incomeDayOfMonth: user.incomeDayOfMonth,
    signedInWithGoogle: Boolean(user.googleId),
    hasPassword: Boolean(user.passwordHash),
    counts: {
      ...user._count,
      activeSessions: sessionCount,
    },
    totalBalance,
    monthlyIncome: monthlyIncomeAmount,
    monthlyExpense: monthlyExpenseAmount,
    monthlySaved: monthlyIncomeAmount - monthlyExpenseAmount,
    accounts: user.accounts,
    goals: user.goals,
    recentTransactions: user.transactions,
  };
}

export type AdminUserDetail = Awaited<ReturnType<typeof getAdminUserDetail>>;
