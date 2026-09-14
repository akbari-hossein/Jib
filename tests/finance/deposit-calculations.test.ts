import { describe, expect, it } from "vitest";
import { calculateDepositInterest } from "@/lib/finance/depositCalculations";
import { depositCalculatorInputSchema } from "@/features/calculators/types";

describe("deposit interest", () => {
  it("computes daily, monthly, and yearly interest for a known case", () => {
    const result = calculateDepositInterest({
      depositAmount: 50_000_000,
      annualRatePercent: 20,
    });

    expect(result.yearlyInterest).toBe(10_000_000);
    expect(result.dailyInterest).toBeCloseTo(10_000_000 / 365, 8);
    expect(result.dailyInterest).toBeCloseTo(27_397.260273972603, 4);
    expect(result.monthlyInterest).toBeCloseTo(result.dailyInterest * 30, 8);
  });

  it("returns zero interest when the annual rate is zero", () => {
    const result = calculateDepositInterest({
      depositAmount: 8_000_000,
      annualRatePercent: 0,
    });

    expect(result.dailyInterest).toBe(0);
    expect(result.monthlyInterest).toBe(0);
    expect(result.yearlyInterest).toBe(0);
  });
});

describe("deposit calculator schema", () => {
  it("rejects a negative deposit amount", () => {
    const parsed = depositCalculatorInputSchema.safeParse({
      depositAmount: -50_000,
      annualRatePercent: 20,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "depositAmount")).toBe(true);
    }
  });

  it("rejects a negative annual rate", () => {
    const parsed = depositCalculatorInputSchema.safeParse({
      depositAmount: 50_000_000,
      annualRatePercent: -1,
    });
    expect(parsed.success).toBe(false);
  });
});
