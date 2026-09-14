import { describe, expect, it } from "vitest";
import {
  assembleEmergencyFund,
  averageMonthlySavingsFromFlows,
  buildEssentialMonthlyBuckets,
  calculateEmergencyFundProgress,
  calculateEmergencyFundTarget,
  calculateEssentialMonthlyAverage,
  calculateMonthsToTarget,
  emergencyFundMonthKey,
  resolveEssentialMonthlyAverage,
} from "@/lib/finance/emergencyFund";

describe("calculateEssentialMonthlyAverage", () => {
  it("averages essential spend over N months", () => {
    const result = calculateEssentialMonthlyAverage([
      { month: "1404-01", totalEssentialSpend: 3_000_000 },
      { month: "1404-02", totalEssentialSpend: 5_000_000 },
      { month: "1404-03", totalEssentialSpend: 4_000_000 },
    ]);
    expect(result.average).toBe(4_000_000);
    expect(result.monthsUsed).toBe(3);
    expect(result.sufficientData).toBe(true);
  });

  it("marks sufficientData false when monthsUsed is below 3", () => {
    const result = calculateEssentialMonthlyAverage([
      { month: "1404-01", totalEssentialSpend: 2_000_000 },
      { month: "1404-02", totalEssentialSpend: 2_000_000 },
    ]);
    expect(result.average).toBe(2_000_000);
    expect(result.monthsUsed).toBe(2);
    expect(result.sufficientData).toBe(false);
  });

  it("returns 0 and false for empty input", () => {
    expect(calculateEssentialMonthlyAverage([])).toEqual({
      average: 0,
      monthsUsed: 0,
      sufficientData: false,
    });
  });
});

describe("calculateEmergencyFundTarget", () => {
  it("multiplies monthly average by target months and rounds", () => {
    expect(calculateEmergencyFundTarget(4_000_000, 6)).toBe(24_000_000);
    expect(calculateEmergencyFundTarget(1_000_000.4, 3)).toBe(3_000_001);
    expect(calculateEmergencyFundTarget(0, 6)).toBe(0);
  });
});

describe("calculateEmergencyFundProgress", () => {
  it("clamps progressPercent at 100 when current exceeds target", () => {
    const result = calculateEmergencyFundProgress(30_000_000, 24_000_000);
    expect(result.progressPercent).toBe(100);
    expect(result.remainingAmount).toBe(0);
    expect(result.currentAmount).toBe(30_000_000);
    expect(result.targetAmount).toBe(24_000_000);
  });

  it("never returns a negative remainingAmount", () => {
    expect(calculateEmergencyFundProgress(0, 10).remainingAmount).toBe(10);
    expect(calculateEmergencyFundProgress(10, 10).remainingAmount).toBe(0);
    expect(calculateEmergencyFundProgress(12, 10).remainingAmount).toBe(0);
  });

  it("returns 0 percent when the target is 0", () => {
    expect(calculateEmergencyFundProgress(5_000_000, 0)).toEqual({
      currentAmount: 5_000_000,
      targetAmount: 0,
      remainingAmount: 0,
      progressPercent: 0,
    });
  });

  it("rounds the midpoint percent", () => {
    expect(calculateEmergencyFundProgress(12_000_000, 24_000_000).progressPercent).toBe(50);
  });
});

describe("calculateMonthsToTarget", () => {
  it("returns no-savings-data for null or undefined savings", () => {
    expect(calculateMonthsToTarget(12_000_000, null)).toEqual({
      months: null,
      reason: "no-savings-data",
    });
    expect(calculateMonthsToTarget(12_000_000, undefined)).toEqual({
      months: null,
      reason: "no-savings-data",
    });
  });

  it("returns not-saving for zero or negative savings", () => {
    expect(calculateMonthsToTarget(12_000_000, 0)).toEqual({
      months: null,
      reason: "not-saving",
    });
    expect(calculateMonthsToTarget(12_000_000, -500_000)).toEqual({
      months: null,
      reason: "not-saving",
    });
  });

  it("uses ceiling division on the happy path", () => {
    expect(calculateMonthsToTarget(12_000_000, 3_000_000)).toEqual({ months: 4 });
    expect(calculateMonthsToTarget(10_000_000, 3_000_000)).toEqual({ months: 4 });
    expect(calculateMonthsToTarget(0, 3_000_000)).toEqual({ months: 0 });
  });
});

describe("resolveEssentialMonthlyAverage", () => {
  it("uses the estimate only when history is thin, without blending", () => {
    const thin = resolveEssentialMonthlyAverage({
      buckets: [
        { month: "1404-01", totalEssentialSpend: 1_000_000 },
        { month: "1404-02", totalEssentialSpend: 1_000_000 },
      ],
      estimatedMonthlyEssential: 4_000_000,
    });
    expect(thin.usingEstimate).toBe(true);
    expect(thin.average).toBe(4_000_000);
    expect(thin.sufficientData).toBe(false);

    const enough = resolveEssentialMonthlyAverage({
      buckets: [
        { month: "1404-01", totalEssentialSpend: 3_000_000 },
        { month: "1404-02", totalEssentialSpend: 3_000_000 },
        { month: "1404-03", totalEssentialSpend: 3_000_000 },
      ],
      estimatedMonthlyEssential: 9_000_000,
    });
    expect(enough.usingEstimate).toBe(false);
    expect(enough.average).toBe(3_000_000);
  });
});

describe("averageMonthlySavingsFromFlows", () => {
  it("returns null when there is no income for calculateSavingsRate", () => {
    expect(
      averageMonthlySavingsFromFlows([
        { income: 0, expenses: 1_000_000 },
        { income: 0, expenses: 500_000 },
      ]),
    ).toBeNull();
  });

  it("returns the average of income minus expenses", () => {
    expect(
      averageMonthlySavingsFromFlows([
        { income: 10_000_000, expenses: 6_000_000 },
        { income: 10_000_000, expenses: 8_000_000 },
      ]),
    ).toBe(3_000_000);
  });
});

describe("buildEssentialMonthlyBuckets (server-layer rules)", () => {
  const window = [
    emergencyFundMonthKey(1403, 10),
    emergencyFundMonthKey(1403, 11),
    emergencyFundMonthKey(1403, 12),
    emergencyFundMonthKey(1404, 1),
    emergencyFundMonthKey(1404, 2),
    emergencyFundMonthKey(1404, 3),
  ];

  it("includes only expenses in essentialCategoryIds", () => {
    const buckets = buildEssentialMonthlyBuckets(
      [
        { type: "EXPENSE", categoryId: "rent", amount: 8_000_000, month: "1404-03" },
        { type: "EXPENSE", categoryId: "fun", amount: 2_000_000, month: "1404-03" },
        { type: "INCOME", categoryId: "salary", amount: 30_000_000, month: "1404-03" },
        { type: "EXPENSE", categoryId: "bills", amount: 1_000_000, month: "1404-02" },
      ],
      ["rent", "bills"],
      window,
    );

    expect(buckets).toEqual([
      { month: "1404-02", totalEssentialSpend: 1_000_000 },
      { month: "1404-03", totalEssentialSpend: 8_000_000 },
    ]);
  });

  it("excludes transactions outside the last 6 months", () => {
    const buckets = buildEssentialMonthlyBuckets(
      [
        { type: "EXPENSE", categoryId: "rent", amount: 8_000_000, month: "1403-09" },
        { type: "EXPENSE", categoryId: "rent", amount: 8_000_000, month: "1404-03" },
        { type: "EXPENSE", categoryId: "rent", amount: 7_000_000, month: "1404-04" },
      ],
      ["rent"],
      window,
    );

    expect(buckets).toEqual([{ month: "1404-03", totalEssentialSpend: 8_000_000 }]);
  });

  it("keeps a history month even when essential spend that month is zero", () => {
    const buckets = buildEssentialMonthlyBuckets(
      [
        { type: "EXPENSE", categoryId: "fun", amount: 500_000, month: "1404-01" },
        { type: "EXPENSE", categoryId: "rent", amount: 8_000_000, month: "1404-02" },
      ],
      ["rent"],
      window,
    );

    expect(buckets).toEqual([
      { month: "1404-01", totalEssentialSpend: 0 },
      { month: "1404-02", totalEssentialSpend: 8_000_000 },
    ]);
  });
});

describe("assembleEmergencyFund", () => {
  it("computes target, progress, and forecast from essential buckets and savings flows", () => {
    const result = assembleEmergencyFund({
      currentAmount: 12_000_000,
      targetMonths: 6,
      essentialCategoryIds: ["rent"],
      estimatedMonthlyEssential: null,
      windowMonths: ["1404-01", "1404-02", "1404-03", "1404-04"],
      categoryMonthTotals: [
        { categoryId: "rent", month: "1404-01", amount: 4_000_000 },
        { categoryId: "rent", month: "1404-02", amount: 4_000_000 },
        { categoryId: "rent", month: "1404-03", amount: 4_000_000 },
        { categoryId: "fun", month: "1404-03", amount: 9_000_000 },
        { categoryId: "rent", month: "1403-12", amount: 99_000_000 },
      ],
      monthlyFlows: [
        { income: 10_000_000, expenses: 7_000_000 },
        { income: 10_000_000, expenses: 7_000_000 },
        { income: 10_000_000, expenses: 7_000_000 },
      ],
    });

    expect(result.average).toBe(4_000_000);
    expect(result.monthsUsed).toBe(3);
    expect(result.sufficientData).toBe(true);
    expect(result.usingEstimate).toBe(false);
    expect(result.targetAmount).toBe(24_000_000);
    expect(result.progress.progressPercent).toBe(50);
    expect(result.forecast).toEqual({ months: 4 });
  });
});
