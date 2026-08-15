import type { BudgetStatus } from "@/lib/finance/types";

export function calculateBudgetUsage(
  spent: bigint,
  limit: bigint,
): {
  pct: number;
  status: BudgetStatus;
} {
  if (limit <= 0n) {
    return { pct: 0, status: "healthy" };
  }

  const pct = Number((spent * 100n) / limit);

  if (pct < 80) {
    return { pct, status: "healthy" };
  }
  if (pct <= 100) {
    return { pct, status: "near" };
  }
  return { pct, status: "over" };
}
