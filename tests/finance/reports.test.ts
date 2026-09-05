import { describe, expect, it } from "vitest";
import { assemblePeriodReview, rankCategorySpend } from "@/lib/finance";

describe("rankCategorySpend", () => {
  it("sorts by amount and uses integer share", () => {
    const ranked = rankCategorySpend(
      [
        { categoryId: "food", name: "غذا", icon: "utensils", amount: 620_000n },
        { categoryId: "fun", name: "سرگرمی", icon: "sparkles", amount: 90_000n },
        { categoryId: "empty", name: "سفر", icon: "plane", amount: 0n },
      ],
      1_000_000n,
    );

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.name).toBe("غذا");
    expect(ranked[0]?.pct).toBe(62);
    expect(ranked[1]?.name).toBe("سرگرمی");
    expect(ranked[1]?.pct).toBe(9);
  });
});

describe("assemblePeriodReview", () => {
  it("builds net, savings rate, change, and extremes", () => {
    const review = assemblePeriodReview({
      income: 30_000_000n,
      expenses: 21_000_000n,
      previousExpenses: 18_000_000n,
      categories: [
        { categoryId: "food", name: "غذا", icon: "utensils", amount: 8_000_000n },
        { categoryId: "rent", name: "اجاره", icon: "home", amount: 12_000_000n },
        { categoryId: "fun", name: "سرگرمی", icon: "sparkles", amount: 1_000_000n },
      ],
    });

    expect(review.net).toBe(9_000_000n);
    expect(review.savingsRate).toBe(30);
    expect(review.expenseChange).toEqual({ pct: 16, direction: "up" });
    expect(review.topCategory?.name).toBe("اجاره");
    expect(review.lowestCategory?.name).toBe("سرگرمی");
    expect(review.extraSavings).toBe(0n);
  });

  it("counts asset-add snapshot toman as extra savings", () => {
    const review = assemblePeriodReview({
      income: 30_000_000n,
      expenses: 21_000_000n,
      previousExpenses: 21_000_000n,
      extraSavings: 3_000_000n,
      categories: [],
    });
    expect(review.net).toBe(12_000_000n);
    expect(review.extraSavings).toBe(3_000_000n);
    expect(review.savingsRate).toBe(40);
  });

  it("hides lowest when only one category spent", () => {
    const review = assemblePeriodReview({
      income: 0n,
      expenses: 100_000n,
      previousExpenses: 0n,
      categories: [{ categoryId: "food", name: "غذا", icon: "utensils", amount: 100_000n }],
    });

    expect(review.topCategory?.name).toBe("غذا");
    expect(review.lowestCategory).toBeNull();
    expect(review.savingsRate).toBeNull();
    expect(review.expenseChange.direction).toBe("new");
  });
});
