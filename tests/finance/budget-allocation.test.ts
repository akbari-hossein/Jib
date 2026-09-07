import { describe, expect, it } from "vitest";
import {
  isCategoryLimitAllowed,
  isOverallLimitAllowed,
  remainingAllocatable,
  sumBudgetLimits,
} from "@/lib/finance/budget-allocation";
import {
  categoryBudgetOverCopy,
  overallBelowAllocatedCopy,
} from "@/lib/finance/budget-allocation-copy";

describe("budget allocation", () => {
  it("excludes the category being edited from remaining", () => {
    expect(remainingAllocatable(10_000_000n, [2_000_000n, 1_500_000n])).toBe(6_500_000n);
    expect(isCategoryLimitAllowed(10_000_000n, 5_000_000n, [2_000_000n, 1_500_000n])).toBe(true);
    expect(isCategoryLimitAllowed(10_000_000n, 8_000_000n, [2_000_000n, 1_500_000n])).toBe(false);
  });

  it("does not cap category budgets when overall is unset", () => {
    expect(remainingAllocatable(null, [3_000_000n])).toBeNull();
    expect(isCategoryLimitAllowed(null, 80_000_000n, [3_000_000n])).toBe(true);
  });

  it("prevents an overall limit below allocated category budgets", () => {
    const allocated = sumBudgetLimits([4_000_000n, 3_000_000n, 2_000_000n]);
    expect(allocated).toBe(9_000_000n);
    expect(isOverallLimitAllowed(7_000_000n, [4_000_000n, 3_000_000n, 2_000_000n])).toBe(false);
    expect(isOverallLimitAllowed(10_000_000n, [4_000_000n, 3_000_000n, 2_000_000n])).toBe(true);
    expect(isOverallLimitAllowed(null, [4_000_000n, 3_000_000n, 2_000_000n])).toBe(true);
  });

  it("uses integer toman values without floating point", () => {
    const remaining = remainingAllocatable(10_000_000n, [3_000_000n, 2_000_000n, 1_500_000n]);
    expect(remaining).toBe(3_500_000n);
    expect(categoryBudgetOverCopy(remaining!)).toContain("۳٬۵۰۰٬۰۰۰");
    expect(overallBelowAllocatedCopy(9_000_000n, 7_000_000n)).toContain("۹٬۰۰۰٬۰۰۰");
    expect(overallBelowAllocatedCopy(9_000_000n, 7_000_000n)).toContain("۷٬۰۰۰٬۰۰۰");
  });
});
