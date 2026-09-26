import type { Prisma, SubscriptionStatus } from "@prisma/client";
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
import { prisma } from "@/lib/db/prisma";
import { calculateSubscriptionStatus } from "@/lib/subscription/calculateSubscriptionStatus";
import { calculateTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";

const subscriptionSelect = {
  status: true,
  trialEndsAt: true,
  currentPeriodEnd: true,
} satisfies Prisma.SubscriptionSelect;

const userListSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  lastActiveAt: true,
  onboardingCompletedAt: true,
  subscription: { select: subscriptionSelect },
} satisfies Prisma.UserSelect;

function resolveSubscriptionStatus(
  user: {
    createdAt: Date;
    subscription: {
      status: SubscriptionStatus;
      trialEndsAt: Date;
      currentPeriodEnd: Date | null;
    } | null;
  },
  now = new Date(),
): SubscriptionStatus {
  const trialEndsAt = user.subscription?.trialEndsAt ?? calculateTrialEndsAt(user.createdAt);
  return (
    user.subscription?.status ??
    calculateSubscriptionStatus({
      now,
      trialEndsAt,
      currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
      latestReceiptStatus: null,
    })
  );
}

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

  const [total, rows] = await Promise.all([
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
    users: rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
      subscriptionStatus: resolveSubscriptionStatus(user, input.now),
    })),
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export type AdminUserListItem = Awaited<ReturnType<typeof listAdminUsers>>["users"][number];

export async function getAdminUserDetail(id: string, now = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      locale: true,
      createdAt: true,
      lastActiveAt: true,
      onboardingCompletedAt: true,
      googleId: true,
      passwordHash: true,
      subscription: { select: subscriptionSelect },
    },
  });

  if (!user) {
    notFound();
  }

  const sessionCount = await prisma.session.count({
    where: { userId: id, expiresAt: { gt: now } },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    locale: user.locale,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    signedInWithGoogle: Boolean(user.googleId),
    hasPassword: Boolean(user.passwordHash),
    subscriptionStatus: resolveSubscriptionStatus(user, now),
    currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
    activeSessions: sessionCount,
  };
}

export type AdminUserDetail = Awaited<ReturnType<typeof getAdminUserDetail>>;
