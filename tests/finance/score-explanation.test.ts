import { describe, expect, it } from "vitest";
import {
  GUILT_PHRASES,
  budgetAdherenceExplanation,
  debtBurdenExplanation,
  emergencyFundExplanation,
  formatScoreExplanation,
  missingScoreExplanation,
  savingsRateExplanation,
  scoreDeltaCopy,
  spendingConsistencyExplanation,
} from "@/lib/finance/financial-health-copy";
import { calculateFinancialHealthScore } from "@/lib/finance/financial-health-score";

const samples = [
  formatScoreExplanation({ kind: "empty" }),
  formatScoreExplanation({
    kind: "hero",
    totalScore: 78,
    previousTotalScore: 66,
    trend: "up",
    scoreDelta: 12,
    driver: {
      key: "savingsRate",
      rawValue: 26,
      previousValue: 18,
      score: 100,
      previousScore: 90,
    },
  }),
  formatScoreExplanation({
    kind: "hero",
    totalScore: 54,
    previousTotalScore: 60,
    trend: "down",
    scoreDelta: -6,
    driver: { key: "budgetAdherence", score: 40, previousScore: 80 },
  }),
  formatScoreExplanation({
    kind: "hero",
    totalScore: 40,
    previousTotalScore: null,
    trend: "new",
    scoreDelta: null,
    driver: { key: "debtBurden", score: 20, rawValue: 32 },
  }),
  savingsRateExplanation(0),
  savingsRateExplanation(10, 18),
  budgetAdherenceExplanation(40),
  spendingConsistencyExplanation(20),
  emergencyFundExplanation(0),
  debtBurdenExplanation(80),
  missingScoreExplanation("savingsRate"),
  missingScoreExplanation("budgetAdherence"),
  missingScoreExplanation("spendingConsistency"),
  missingScoreExplanation("emergencyFundCoverage"),
  missingScoreExplanation("debtBurden"),
  scoreDeltaCopy(4, "up"),
  scoreDeltaCopy(-4, "down"),
  scoreDeltaCopy(0, "flat"),
];

describe("formatScoreExplanation", () => {
  it("matches the calm templates", () => {
    expect(samples).toMatchSnapshot();
  });

  it("never uses guilt or streak language", () => {
    const result = calculateFinancialHealthScore({
      income: 8_000_000n,
      expenses: 9_000_000n,
      budgets: [{ spent: 5_000_000n, limit: 2_000_000n }],
      monthlySpendingHistory: [2_000_000n, 9_000_000n, 1_000_000n],
      reservedMoney: 0n,
      monthlyEssentialExpenses: 6_000_000n,
      monthlyDebtPayments: 6_000_000n,
      monthlyIncome: 8_000_000n,
      hasCompletedMonth: true,
      previousTotalScore: 80,
      previousSubScores: {
        savingsRate: 90,
        budgetAdherence: 90,
        spendingConsistency: 90,
        emergencyFundCoverage: 90,
        debtBurden: 90,
      },
    });

    const corpus = [
      ...samples,
      result.explanation,
      ...result.subScores.map((part) => part.explanation),
    ].join("\n");

    for (const phrase of GUILT_PHRASES) {
      expect(corpus).not.toContain(phrase);
    }
  });

  it("names a savings-rate improvement without judging the previous number", () => {
    expect(
      formatScoreExplanation({
        kind: "hero",
        totalScore: 78,
        previousTotalScore: 66,
        trend: "up",
        scoreDelta: 12,
        driver: {
          key: "savingsRate",
          rawValue: 26,
          previousValue: 18,
          score: 100,
          previousScore: 90,
        },
      }),
    ).toBe("امتیازت به خاطر افزایش نرخ پس‌انداز از ۱۸٪ به ۲۶٪ بالا رفت.");
  });
});
