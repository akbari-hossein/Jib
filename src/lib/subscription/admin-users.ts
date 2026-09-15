import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { calculateSubscriptionStatus } from "@/lib/subscription/calculateSubscriptionStatus";
import { calculateTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";

export const ADMIN_USER_STATUS_FILTERS = [
  "ALL",
  "TRIALING",
  "ACTIVE",
  "PENDING_REVIEW",
  "EXPIRED",
  "REJECTED",
] as const;

export type AdminUserStatusFilter = (typeof ADMIN_USER_STATUS_FILTERS)[number];

export const DEFAULT_ADMIN_USERS_PAGE_SIZE = 25;
export const MAX_ADMIN_USERS_PAGE_SIZE = 100;

export type AdminSubscriberDto = {
  userId: string;
  phone: string;
  name?: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  totalPaidToman: number;
  lastPaymentAt: string | null;
  createdAt: string;
};

export type AdminSubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  subscription: {
    status: SubscriptionStatus;
    trialEndsAt: Date;
    currentPeriodEnd: Date | null;
  } | null;
  totalPaidToman: number;
  lastPaymentAt: Date | null;
};

export function parseAdminUsersQuery(input: {
  status?: string | null;
  search?: string | null;
  page?: string | null;
  pageSize?: string | null;
}): {
  status: AdminUserStatusFilter;
  search: string;
  page: number;
  pageSize: number;
} {
  const status = ADMIN_USER_STATUS_FILTERS.includes(input.status as AdminUserStatusFilter)
    ? (input.status as AdminUserStatusFilter)
    : "ALL";
  const search = (input.search ?? "").trim().slice(0, 120);
  const pageParsed = Number.parseInt(input.page ?? "1", 10);
  const page = Number.isInteger(pageParsed) && pageParsed > 0 ? Math.min(pageParsed, 10_000) : 1;
  const sizeParsed = Number.parseInt(input.pageSize ?? String(DEFAULT_ADMIN_USERS_PAGE_SIZE), 10);
  const pageSize =
    Number.isInteger(sizeParsed) && sizeParsed > 0
      ? Math.min(sizeParsed, MAX_ADMIN_USERS_PAGE_SIZE)
      : DEFAULT_ADMIN_USERS_PAGE_SIZE;
  return { status, search, page, pageSize };
}

export function adminUsersWhere(input: {
  status: AdminUserStatusFilter;
  search: string;
}): Prisma.UserWhereInput {
  const clauses: Prisma.UserWhereInput[] = [];
  if (input.status !== "ALL") {
    clauses.push({ subscription: { is: { status: input.status } } });
  }
  if (input.search) {
    clauses.push({
      OR: [
        { email: { contains: input.search, mode: "insensitive" } },
        { name: { contains: input.search, mode: "insensitive" } },
      ],
    });
  }
  if (clauses.length === 0) {
    return {};
  }
  return { AND: clauses };
}

export function serializeAdminSubscriber(row: AdminSubscriberRow, now = new Date()): AdminSubscriberDto {
  const trialEndsAt = row.subscription?.trialEndsAt ?? calculateTrialEndsAt(row.createdAt);
  const subscriptionStatus =
    row.subscription?.status ??
    calculateSubscriptionStatus({
      now,
      trialEndsAt,
      currentPeriodEnd: null,
      latestReceiptStatus: null,
    });

  return {
    userId: row.id,
    phone: row.email,
    ...(row.name ? { name: row.name } : {}),
    subscriptionStatus,
    trialEndsAt: trialEndsAt.toISOString(),
    currentPeriodEnd: row.subscription?.currentPeriodEnd?.toISOString() ?? null,
    totalPaidToman: row.totalPaidToman,
    lastPaymentAt: row.lastPaymentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function adminSubscriberExposesReceiptSecrets(dto: Record<string, unknown>): boolean {
  return "imageUrl" in dto || "rawText" in dto || "claimedAmount" in dto;
}
