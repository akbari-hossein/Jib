import { describe, expect, it } from "vitest";
import { gregorianUtcFromJalali } from "@/lib/dates/tehran";
import {
  assembleMonthlyRecap,
  assemblePeriodReview,
  availableRecapFields,
  budgetDiscipline,
  pickMovedGoal,
  serializeMonthlyRecap,
  summarizeLoggedDays,
} from "@/lib/finance";

const review = assemblePeriodReview({
  income: 30_000_000n,
  expenses: 21_000_000n,
  previousExpenses: 18_000_000n,
  categories: [
    { categoryId: "rent", name: "اجاره", icon: "home", amount: 12_000_000n },
    { categoryId: "food", name: "غذا", icon: "utensils", amount: 9_000_000n },
  ],
});

describe("assembleMonthlyRecap", () => {
  it("composes review totals without inventing a new savings formula", () => {
    const recap = assembleMonthlyRecap({
      year: 1404,
      month: 5,
      review,
      daysLogged: 12,
      daysInPeriod: 31,
      goal: { name: "سفر", pct: 40, contributed: 2_000_000n },
      budgetsUnder: { under: 3, total: 4 },
    });

    expect(recap.monthLabel).toBe("مرداد ۱۴۰۴");
    expect(recap.income).toBe(30_000_000n);
    expect(recap.saved).toBe(9_000_000n);
    expect(recap.savingsRate).toBe(30);
    expect(recap.expenseShareOfIncome).toBe(70);
    expect(recap.topCategory?.name).toBe("اجاره");
    expect(recap.expenseChange).toEqual({ pct: 16, direction: "up" });
    expect(recap.daysLogged).toBe(12);
    expect(recap.goal?.name).toBe("سفر");
  });

  it("omits empty optional stats", () => {
    const empty = assemblePeriodReview({
      income: 0n,
      expenses: 100_000n,
      previousExpenses: 0n,
      categories: [{ categoryId: "food", name: "غذا", icon: "utensils", amount: 100_000n }],
    });
    const recap = assembleMonthlyRecap({
      year: 1404,
      month: 1,
      review: empty,
      daysLogged: 0,
      daysInPeriod: 31,
      goal: null,
      budgetsUnder: null,
    });

    expect(availableRecapFields(recap)).toEqual(["expenses", "saved", "topCategory"]);
    expect(recap.daysLogged).toBeNull();
    expect(recap.savingsRate).toBeNull();
  });

  it("serializes amounts as strings for the client", () => {
    const recap = assembleMonthlyRecap({
      year: 1404,
      month: 5,
      review,
      daysLogged: 4,
      daysInPeriod: 20,
      goal: null,
      budgetsUnder: { under: 0, total: 2 },
    });
    const dto = serializeMonthlyRecap(recap);

    expect(dto.income).toBe("30000000");
    expect(dto.topCategory?.amount).toBe("12000000");
    expect(availableRecapFields(dto)).not.toContain("budgetsUnder");
    expect(availableRecapFields(dto)).toContain("daysLogged");
  });
});

describe("summarizeLoggedDays", () => {
  it("counts distinct Tehran days and the longest consecutive run", () => {
    const days = summarizeLoggedDays([
      gregorianUtcFromJalali({ year: 1404, month: 5, day: 1 }),
      gregorianUtcFromJalali({ year: 1404, month: 5, day: 1 }),
      gregorianUtcFromJalali({ year: 1404, month: 5, day: 2 }),
      gregorianUtcFromJalali({ year: 1404, month: 5, day: 3 }),
      gregorianUtcFromJalali({ year: 1404, month: 5, day: 7 }),
    ]);

    expect(days.daysLogged).toBe(4);
    expect(days.longestStreak).toBe(3);
  });
});

describe("pickMovedGoal", () => {
  it("keeps only a linked goal that received an inflow", () => {
    const goal = pickMovedGoal({
      goals: [
        { name: "سفر", accountId: "acc_1", progressPct: 40 },
        { name: "اضطراری", accountId: "acc_2", progressPct: 10 },
        { name: "بدون حساب", accountId: null, progressPct: 80 },
      ],
      inflowsByAccountId: new Map([
        ["acc_1", 500_000n],
        ["acc_2", 2_000_000n],
      ]),
      includePct: true,
    });

    expect(goal).toEqual({ name: "اضطراری", pct: 10, contributed: 2_000_000n });
  });

  it("returns null when nothing moved", () => {
    expect(
      pickMovedGoal({
        goals: [{ name: "سفر", accountId: "acc_1", progressPct: 40 }],
        inflowsByAccountId: new Map(),
        includePct: true,
      }),
    ).toBeNull();
  });
});

describe("budgetDiscipline", () => {
  it("counts category budgets that stayed under", () => {
    expect(
      budgetDiscipline({
        items: [{ status: "healthy" }, { status: "near" }, { status: "over" }],
        overallStatus: "near",
      }),
    ).toEqual({ under: 2, total: 3 });
  });

  it("falls back to the overall limit when there are no category items", () => {
    expect(
      budgetDiscipline({
        items: [],
        overallStatus: "healthy",
      }),
    ).toEqual({ under: 1, total: 1 });
  });
});
