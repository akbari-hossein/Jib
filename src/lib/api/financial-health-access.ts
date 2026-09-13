import { z } from "zod";

export const FINANCIAL_HEALTH_HISTORY_MONTHS = 12;

export const financialHealthQuerySchema = z.object({
  months: z.coerce.number().int().min(6).max(FINANCIAL_HEALTH_HISTORY_MONTHS).optional(),
});

/** Session user always wins. Query-string userId is ignored on purpose. */
export function financialHealthOwnerId(
  session: { id: string } | null,
  _searchParams?: URLSearchParams,
): string | null {
  return session?.id ?? null;
}

export function healthHistoryWhere(userId: string, take: number) {
  return {
    where: { userId },
    orderBy: { periodStart: "asc" as const },
    take,
  };
}

export function selectSnapshotsForUser<T extends { userId: string }>(
  rows: T[],
  userId: string,
): T[] {
  return rows.filter((row) => row.userId === userId);
}
