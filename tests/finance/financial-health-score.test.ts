import { describe, expect, it } from "vitest";
import {
  calculateBudgetAdherenceScore,
  calculateDebtBurdenScore,
  calculateEmergencyFundScore,
  calculateFinancialHealthScore,
  calculateSavingsRateScore,
  calculateSpendingConsistencyScore,
  clampScore,
  combineWeightedScores,
  monthlyEquivalentAmount,
  pickPrimaryDriver,
  SCORE_COMPONENT_KEYS,
  SCORE_WEIGHTS,
  type FinancialHealthInput,
  type SubScoreResult,
} from "@/lib/finance/financial-health-score";

const healthyInput = {
  income: 30_000_000n,
  expenses: 21_000_000n,
  previousPeriodSavingsRate: 18,
  budgets: [
    { spent: 2_800_000n, limit: 4_000_000n },
    { spent: 1_000_000n, limit: 1_000_000n },
  ],
  monthlySpendingHistory: [18_000_000n, 19_000_000n, 20_000_000n, 21_000_000n],
  reservedMoney: 18_000_000n,
  monthlyEssentialExpenses: 12_000_000n,
  monthlyDebtPayments: 3_000_000n,
  monthlyIncome: 30_000_000n,
  hasCompletedMonth: true,
} satisfies FinancialHealthInput;

function available(result: SubScoreResult) {
  return result.dataAvailable;
}

describe("SCORE_WEIGHTS", () => {
  it("sums to 1 so redistribution stays on a 0–100 scale", () => {
    const sum = SCORE_COMPONENT_KEYS.reduce((total, key) => total + SCORE_WEIGHTS[key], 0);
    expect(sum).toBeCloseTo(1);
  });
});

describe("clampScore", () => {
  it("keeps values inside 0–100", () => {
    expect(clampScore(-4)).toBe(0);
    expect(clampScore(140)).toBe(100);
    expect(clampScore(78.4)).toBe(78);
  });
});

describe("calculateSavingsRateScore", () => {
  it("scores a normal 30% savings rate at 100", () => {
    const result = calculateSavingsRateScore(30_000_000n, 21_000_000n, 18);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBe(100);
    expect(result.rawValue).toBe(30);
    expect(result.trend).toBe("up");
  });

  it("does not score zero income as a failing 0", () => {
    const result = calculateSavingsRateScore(0n, 1_000_000n);
    expect(result.dataAvailable).toBe(false);
    expect(result.explanation).not.toMatch(/۰/);
  });

  it("maps a 10% rate to 50", () => {
    expect(calculateSavingsRateScore(10_000_000n, 9_000_000n).score).toBe(50);
  });
});

describe("calculateBudgetAdherenceScore", () => {
  it("weights by budget size, not a simple average of percents", () => {
    const simpleWouldBe50 = [
      { spent: 0n, limit: 1_000_000n },
      { spent: 4_000_000n, limit: 2_000_000n },
    ];
    const result = calculateBudgetAdherenceScore(simpleWouldBe50);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBe(33);
  });

  it("treats missing budgets as unavailable, not zero", () => {
    const result = calculateBudgetAdherenceScore([]);
    expect(result.dataAvailable).toBe(false);
    expect(result.score).toBe(0);
  });

  it("ignores zero limits", () => {
    const result = calculateBudgetAdherenceScore([{ spent: 1_000n, limit: 0n }]);
    expect(result.dataAvailable).toBe(false);
  });
});

describe("calculateSpendingConsistencyScore", () => {
  it("scores stable spending near 100", () => {
    const result = calculateSpendingConsistencyScore([
      10_000_000n,
      10_200_000n,
      9_800_000n,
      10_100_000n,
    ]);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBeGreaterThan(90);
  });

  it("does not score the first month of use", () => {
    const result = calculateSpendingConsistencyScore([4_000_000n]);
    expect(result.dataAvailable).toBe(false);
  });

  it("does not score two months either", () => {
    expect(available(calculateSpendingConsistencyScore([4_000_000n, 5_000_000n]))).toBe(false);
  });

  it("ignores empty months before the first activity", () => {
    const result = calculateSpendingConsistencyScore([
      0n,
      0n,
      0n,
      10_000_000n,
      10_200_000n,
      9_800_000n,
      10_100_000n,
    ]);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBeGreaterThan(90);
  });

  it("returns a low score when month-to-month spend is erratic", () => {
    const result = calculateSpendingConsistencyScore([
      2_000_000n,
      18_000_000n,
      1_000_000n,
      20_000_000n,
    ]);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBeLessThan(40);
  });
});

describe("calculateEmergencyFundScore", () => {
  it("scores 3+ months of essentials at 100", () => {
    const result = calculateEmergencyFundScore(36_000_000n, 12_000_000n);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBe(100);
    expect(result.rawValue).toBe(3);
  });

  it("scores 0 months at 0 without calling it a failure", () => {
    const result = calculateEmergencyFundScore(0n, 12_000_000n);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBe(0);
  });

  it("does not score without an essential-expense baseline", () => {
    expect(calculateEmergencyFundScore(10_000_000n, 0n).dataAvailable).toBe(false);
  });
});

describe("calculateDebtBurdenScore", () => {
  it("scores zero payments as 100 when income exists", () => {
    const result = calculateDebtBurdenScore(0n, 20_000_000n);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBe(100);
    expect(result.rawValue).toBe(0);
  });

  it("does not score zero income", () => {
    expect(calculateDebtBurdenScore(1_000_000n, 0n).dataAvailable).toBe(false);
  });

  it("returns 0 for extremely high debt-to-income", () => {
    const result = calculateDebtBurdenScore(20_000_000n, 10_000_000n);
    expect(result.dataAvailable).toBe(true);
    expect(result.score).toBe(0);
    expect(result.rawValue).toBe(200);
  });

  it("maps 20% of income to 50", () => {
    expect(calculateDebtBurdenScore(4_000_000n, 20_000_000n).score).toBe(50);
  });
});

describe("combineWeightedScores", () => {
  it("redistributes weight when a component is missing", () => {
    const parts = [
      { key: "savingsRate" as const, score: 100, dataAvailable: true },
      { key: "budgetAdherence" as const, score: 0, dataAvailable: false },
      { key: "spendingConsistency" as const, score: 100, dataAvailable: true },
      { key: "emergencyFundCoverage" as const, score: 100, dataAvailable: true },
      { key: "debtBurden" as const, score: 100, dataAvailable: true },
    ];
    const combined = combineWeightedScores(parts);
    expect(combined.totalScore).toBe(100);
    expect(combined.usedKeys).not.toContain("budgetAdherence");
    const usedWeight = combined.usedKeys.reduce((sum, key) => sum + SCORE_WEIGHTS[key], 0);
    expect(usedWeight).toBeCloseTo(0.75);
  });
});

describe("calculateFinancialHealthScore", () => {
  it("returns a ready 0–100 score for a normal month", () => {
    const result = calculateFinancialHealthScore(healthyInput);
    expect(result.ready).toBe(true);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.subScores).toHaveLength(5);
    expect(result.primaryDriver).toBeTruthy();
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("stays empty on the first month of use", () => {
    const result = calculateFinancialHealthScore({
      ...healthyInput,
      monthlySpendingHistory: [21_000_000n],
      hasCompletedMonth: false,
    });
    expect(result.ready).toBe(false);
    expect(result.totalScore).toBeNull();
    expect(result.trend).toBe("new");
  });

  it("excludes missing budgets instead of pulling the total to 0", () => {
    const withBudgets = calculateFinancialHealthScore(healthyInput);
    const withoutBudgets = calculateFinancialHealthScore({
      ...healthyInput,
      budgets: [],
    });
    expect(withoutBudgets.ready).toBe(true);
    expect(withoutBudgets.subScores.find((part) => part.key === "budgetAdherence")?.dataAvailable).toBe(
      false,
    );
    expect(withoutBudgets.totalScore).not.toBe(0);
    expect(withBudgets.totalScore).not.toBeNull();
  });

  it("picks the sub-score that moved the most as the primary driver", () => {
    expect(
      pickPrimaryDriver(
        [
          { key: "savingsRate", score: 80, dataAvailable: true },
          { key: "budgetAdherence", score: 70, dataAvailable: true },
          { key: "spendingConsistency", score: 60, dataAvailable: true },
          { key: "emergencyFundCoverage", score: 50, dataAvailable: true },
          { key: "debtBurden", score: 90, dataAvailable: true },
        ],
        { savingsRate: 40, budgetAdherence: 68, spendingConsistency: 61, emergencyFundCoverage: 50, debtBurden: 90 },
      ),
    ).toBe("savingsRate");
  });
});

describe("monthlyEquivalentAmount", () => {
  it("converts weekly and yearly recurrences into monthly toman", () => {
    expect(monthlyEquivalentAmount(700_000n, "WEEKLY")).toBe(3_000_000n);
    expect(monthlyEquivalentAmount(12_000_000n, "YEARLY")).toBe(1_000_000n);
    expect(monthlyEquivalentAmount(2_000_000n, "MONTHLY", 2)).toBe(1_000_000n);
  });
});
