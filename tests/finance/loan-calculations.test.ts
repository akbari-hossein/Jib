import { describe, expect, it } from "vitest";
import {
  calculateLoan,
  calculateQarzAlHasanehLoan,
  calculateStandardLoan,
} from "@/lib/finance/loanCalculations";
import { loanCalculatorInputSchema } from "@/features/calculators/types";

const STANDARD_REFERENCE = {
  principal: 100_000_000,
  annualRatePercent: 18,
  installmentCount: 12,
  installmentIntervalMonths: 1,
};

describe("standard loan (equal installments)", () => {
  it("matches the closed-form installment for a known case", () => {
    const result = calculateStandardLoan(STANDARD_REFERENCE);
    const i = 0.015;
    const growth = (1 + i) ** 12;
    const expected = (100_000_000 * i * growth) / (growth - 1);

    expect(result.installmentAmount).toBeCloseTo(expected, 6);
    expect(result.installmentAmount).toBeCloseTo(9_167_999.290622946, 4);
    expect(result.totalRepayment).toBeCloseTo(result.installmentAmount * 12, 6);
    expect(result.totalInterestOrFee).toBeCloseTo(result.totalRepayment - 100_000_000, 6);
  });

  it("keeps principal portions summing to principal and ends at zero remaining", () => {
    const result = calculateStandardLoan(STANDARD_REFERENCE);
    const principalSum = result.schedule.reduce((sum, row) => sum + row.principalPortion, 0);
    const last = result.schedule.at(-1);

    expect(result.schedule).toHaveLength(12);
    expect(principalSum).toBeCloseTo(STANDARD_REFERENCE.principal, 0);
    expect(Math.abs(principalSum - STANDARD_REFERENCE.principal)).toBeLessThanOrEqual(1);
    expect(last?.remainingBalance).toBe(0);
  });

  it("splits principal evenly when the annual rate is zero", () => {
    const result = calculateStandardLoan({
      principal: 1_200_000,
      annualRatePercent: 0,
      installmentCount: 12,
      installmentIntervalMonths: 1,
    });

    expect(result.installmentAmount).toBe(100_000);
    expect(result.totalInterestOrFee).toBe(0);
    expect(result.schedule.every((row) => row.interestPortion === 0)).toBe(true);
    expect(result.schedule.at(-1)?.remainingBalance).toBe(0);
  });

  it("scales the periodic rate with the installment interval", () => {
    const monthly = calculateStandardLoan({
      principal: 50_000_000,
      annualRatePercent: 24,
      installmentCount: 4,
      installmentIntervalMonths: 1,
    });
    const quarterly = calculateStandardLoan({
      principal: 50_000_000,
      annualRatePercent: 24,
      installmentCount: 4,
      installmentIntervalMonths: 3,
    });

    expect(quarterly.installmentAmount).toBeGreaterThan(monthly.installmentAmount);
  });
});

describe("qarz al-hasaneh", () => {
  it("applies a prorated one-time fee and equal installments", () => {
    const result = calculateQarzAlHasanehLoan({
      principal: 50_000_000,
      feeRatePercent: 4,
      installmentCount: 24,
      loanTermMonths: 24,
    });

    expect(result.totalInterestOrFee).toBe(4_000_000);
    expect(result.totalRepayment).toBe(54_000_000);
    expect(result.installmentAmount).toBe(2_250_000);
    expect(result.schedule.every((row) => row.interestPortion === 0)).toBe(true);
    expect(result.schedule.at(-1)?.remainingBalance).toBe(0);
  });

  it("prorates the fee by loan term in years", () => {
    const oneYear = calculateQarzAlHasanehLoan({
      principal: 100_000_000,
      feeRatePercent: 4,
      installmentCount: 12,
      loanTermMonths: 12,
    });
    const twoYears = calculateQarzAlHasanehLoan({
      principal: 100_000_000,
      feeRatePercent: 4,
      installmentCount: 12,
      loanTermMonths: 24,
    });

    expect(oneYear.totalInterestOrFee).toBe(4_000_000);
    expect(twoYears.totalInterestOrFee).toBe(8_000_000);
    expect(oneYear.installmentAmount).toBeCloseTo(104_000_000 / 12, 8);
  });

  it("dispatches from calculateLoan", () => {
    const result = calculateLoan({
      mode: "qarzAlHasaneh",
      principal: 10_000_000,
      feeRatePercent: 4,
      installmentCount: 10,
      installmentIntervalMonths: 1,
      loanTermMonths: 12,
    });

    expect(result.totalInterestOrFee).toBe(400_000);
    expect(result.installmentAmount).toBe(1_040_000);
  });
});

describe("loan calculator schema", () => {
  const validStandard = {
    mode: "standard" as const,
    principal: 10_000_000,
    annualRatePercent: 18,
    installmentCount: 12,
    installmentIntervalMonths: 1,
  };

  it("rejects a negative principal", () => {
    const parsed = loanCalculatorInputSchema.safeParse({
      ...validStandard,
      principal: -1,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "principal")).toBe(true);
    }
  });

  it("rejects a zero installment count", () => {
    const parsed = loanCalculatorInputSchema.safeParse({
      ...validStandard,
      installmentCount: 0,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "installmentCount")).toBe(true);
    }
  });

  it("rejects a non-integer installment count", () => {
    const parsed = loanCalculatorInputSchema.safeParse({
      ...validStandard,
      installmentCount: 12.5,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "installmentCount")).toBe(true);
    }
  });

  it("accepts a rate above 60 without failing validation", () => {
    const parsed = loanCalculatorInputSchema.safeParse({
      ...validStandard,
      annualRatePercent: 72,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a rate above 100", () => {
    const parsed = loanCalculatorInputSchema.safeParse({
      ...validStandard,
      annualRatePercent: 120,
    });
    expect(parsed.success).toBe(false);
  });
});
