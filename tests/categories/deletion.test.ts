import { describe, expect, it } from "vitest";
import { canDeleteCategory, categoryDeletionCopy } from "@/lib/categories/deletion";

const unused = {
  transactionCount: 0,
  budgetCount: 0,
  recurringCount: 0,
  ruleCount: 0,
};

describe("category deletion policy", () => {
  it("allows deleting unused custom categories", () => {
    expect(canDeleteCategory(false, unused)).toBe(true);
    expect(categoryDeletionCopy(false, unused).canDelete).toBe(true);
  });

  it("blocks system categories even when unused", () => {
    expect(canDeleteCategory(true, unused)).toBe(false);
    const copy = categoryDeletionCopy(true, unused);
    expect(copy.canDelete).toBe(false);
    expect(copy.title).toContain("پیش‌فرض");
  });

  it("blocks custom categories that are still referenced", () => {
    expect(
      canDeleteCategory(false, {
        transactionCount: 3,
        budgetCount: 1,
        recurringCount: 0,
        ruleCount: 0,
      }),
    ).toBe(false);
    const copy = categoryDeletionCopy(false, {
      transactionCount: 3,
      budgetCount: 1,
      recurringCount: 0,
      ruleCount: 0,
    });
    expect(copy.canDelete).toBe(false);
    expect(copy.description).toContain("۳");
    expect(copy.description).toContain("تراکنش");
    expect(copy.description).toContain("بودجه");
  });
});
