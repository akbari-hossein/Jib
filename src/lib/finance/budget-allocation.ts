export function sumBudgetLimits(limits: readonly bigint[]): bigint {
  return limits.reduce((sum, limit) => sum + limit, 0n);
}

/** Remaining amount that can be assigned to the category being edited. Null means no overall cap. */
export function remainingAllocatable(
  overallLimit: bigint | null,
  otherCategoryLimits: readonly bigint[],
): bigint | null {
  if (overallLimit == null) {
    return null;
  }
  return overallLimit - sumBudgetLimits(otherCategoryLimits);
}

export function isCategoryLimitAllowed(
  overallLimit: bigint | null,
  proposedLimit: bigint,
  otherCategoryLimits: readonly bigint[],
): boolean {
  if (proposedLimit <= 0n) {
    return false;
  }
  const remaining = remainingAllocatable(overallLimit, otherCategoryLimits);
  return remaining == null || proposedLimit <= remaining;
}

export function isOverallLimitAllowed(
  overallLimit: bigint | null,
  categoryLimits: readonly bigint[],
): boolean {
  if (overallLimit == null) {
    return true;
  }
  return overallLimit >= sumBudgetLimits(categoryLimits);
}
