import type { Prisma, TransactionType } from "@prisma/client";

export const ADMIN_PAGE_SIZE = 20;

export const USER_FILTERS = [
  "all",
  "active",
  "disabled",
  "new",
  "recently_active",
  "onboarding_complete",
  "onboarding_incomplete",
  "with_accounts",
  "with_transactions",
] as const;

export type UserFilter = (typeof USER_FILTERS)[number];

export const USER_SORTS = [
  "createdAt",
  "lastActiveAt",
  "email",
  "accounts",
  "transactions",
] as const;

export type UserSort = (typeof USER_SORTS)[number];

export const SORT_DIRS = ["asc", "desc"] as const;
export type SortDir = (typeof SORT_DIRS)[number];

const TRANSACTION_TYPES = ["EXPENSE", "INCOME", "TRANSFER", "ASSET_ADD", "ASSET_REMOVE"] as const;

export function firstSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function parsePage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(firstSearchParam(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, 10_000);
}

export function parseEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = firstSearchParam(value);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function parseOptionalEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const raw = firstSearchParam(value);
  if (!raw) {
    return undefined;
  }
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

export function parseSearchQuery(value: string | string[] | undefined): string {
  return firstSearchParam(value).trim().slice(0, 120);
}

export function parseDateInput(value: string | string[] | undefined): Date | undefined {
  const raw = firstSearchParam(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return undefined;
  }
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

export function parseAmountInput(value: string | string[] | undefined): bigint | undefined {
  const raw = firstSearchParam(value).trim().replace(/[٬,]/g, "");
  if (!raw || !/^\d+$/.test(raw)) {
    return undefined;
  }
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
}

export function userSearchWhere(query: string): Prisma.UserWhereInput | undefined {
  if (!query) {
    return undefined;
  }
  return {
    OR: [
      { id: { equals: query } },
      { email: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
    ],
  };
}

export function userFilterWhere(
  filter: UserFilter,
  now = new Date(),
): Prisma.UserWhereInput {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  switch (filter) {
    case "active":
      return { status: "ACTIVE" };
    case "disabled":
      return { status: "DISABLED" };
    case "new":
      return { createdAt: { gte: sevenDaysAgo } };
    case "recently_active":
      return { lastActiveAt: { gte: sevenDaysAgo } };
    case "onboarding_complete":
      return { onboardingCompletedAt: { not: null } };
    case "onboarding_incomplete":
      return { onboardingCompletedAt: null };
    case "with_accounts":
      return { accounts: { some: {} } };
    case "with_transactions":
      return { transactions: { some: {} } };
    default:
      return {};
  }
}

export function userOrderBy(
  sort: UserSort,
  dir: SortDir,
): Prisma.UserOrderByWithRelationInput {
  if (sort === "accounts") {
    return { accounts: { _count: dir } };
  }
  if (sort === "transactions") {
    return { transactions: { _count: dir } };
  }
  if (sort === "email") {
    return { email: dir };
  }
  if (sort === "lastActiveAt") {
    return { lastActiveAt: dir };
  }
  return { createdAt: dir };
}

export function parseTransactionType(
  value: string | string[] | undefined,
): TransactionType | undefined {
  return parseOptionalEnum(value, TRANSACTION_TYPES);
}

export function buildPageHref(
  pathname: string,
  current: URLSearchParams,
  next: Record<string, string | number | undefined | null>,
): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(next)) {
    if (value == null || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }
  if (params.get("page") === "1") {
    params.delete("page");
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function toSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = firstSearchParam(value);
    if (first) {
      params.set(key, first);
    }
  }
  return params;
}
