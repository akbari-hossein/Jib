import { describe, expect, it } from "vitest";
import { assembleFinancialHealthInput, hasPriorMonthActivity } from "@/lib/finance/financial-health-input";

describe("assembleFinancialHealthInput", () => {
  it("uses previous-month essentials and savings rate when the current month is thin", () => {
    const input = assembleFinancialHealthInput({
      year: 1404,
      month: 7,
      current: { year: 1404, month: 7, income: 0n, expenses: 2_000_000n, essentialExpenses: 0n },
      previous: {
        year: 1404,
        month: 6,
        income: 30_000_000n,
        expenses: 21_000_000n,
        essentialExpenses: 12_000_000n,
      },
      budgets: [{ spent: 1_000_000n, limit: 2_000_000n }],
      flows: [
        { year: 1404, month: 5, income: 30_000_000n, expenses: 20_000_000n, essentialExpenses: 11_000_000n },
        { year: 1404, month: 6, income: 30_000_000n, expenses: 21_000_000n, essentialExpenses: 12_000_000n },
        { year: 1404, month: 7, income: 0n, expenses: 2_000_000n, essentialExpenses: 0n },
      ],
      reservedMoney: 15_000_000n,
      monthlyDebtPayments: 1_000_000n,
      previousSnapshot: {
        totalScore: 70,
        savingsRateScore: 80,
        budgetAdherenceScore: 90,
        spendingConsistencyScore: 70,
        emergencyFundScore: 40,
        debtBurdenScore: 90,
      },
      hasCompletedMonth: true,
      isLiveCurrentPeriod: true,
    });

    expect(input.income).toBe(30_000_000n);
    expect(input.expenses).toBe(21_000_000n);
    expect(input.monthlyEssentialExpenses).toBe(12_000_000n);
    expect(input.monthlyIncome).toBe(30_000_000n);
    expect(input.previousPeriodSavingsRate).toBe(33);
    expect(input.monthlySpendingHistory).toEqual([20_000_000n, 21_000_000n]);
    expect(input.previousTotalScore).toBe(70);
    expect(input.previousSubScores?.savingsRate).toBe(80);
  });
});

describe("hasPriorMonthActivity", () => {
  it("requires a closed month with activity before scoring", () => {
    expect(
      hasPriorMonthActivity(
        [{ year: 1404, month: 7, income: 1n, expenses: 1n, essentialExpenses: 0n }],
        1404,
        7,
      ),
    ).toBe(false);
    expect(
      hasPriorMonthActivity(
        [
          { year: 1404, month: 6, income: 10n, expenses: 0n, essentialExpenses: 0n },
          { year: 1404, month: 7, income: 0n, expenses: 4n, essentialExpenses: 0n },
        ],
        1404,
        7,
      ),
    ).toBe(true);
  });
});
