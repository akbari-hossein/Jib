import { describe, expect, it } from "vitest";
import {
  applySettlement,
  calculateContactBalance,
  calculateDebtImpactOnAvailableMoney,
  calculateTotalIOwe,
  calculateTotalOwedToMe,
  planSettlementAllocation,
  SettlementError,
  splitAmountEvenly,
  SplitError,
  type DebtSnapshot,
} from "@/lib/finance/debts";

function record(
  type: DebtSnapshot["type"],
  remainingAmount: bigint,
  status: DebtSnapshot["status"] = "OPEN",
): DebtSnapshot {
  return { type, remainingAmount, status };
}

describe("splitAmountEvenly", () => {
  it("distributes remainder 0 equally", () => {
    expect(splitAmountEvenly(9n, 3)).toEqual([3n, 3n, 3n]);
  });

  it("gives +1 to the first N participants when remainder is count-1", () => {
    expect(splitAmountEvenly(5n, 3)).toEqual([2n, 2n, 1n]);
  });

  it("splits 1,000,000 among 3 people without leftover", () => {
    const shares = splitAmountEvenly(1_000_000n, 3);
    expect(shares).toEqual([333_334n, 333_333n, 333_333n]);
    expect(shares.reduce((sum, share) => sum + share, 0n)).toBe(1_000_000n);
  });

  it("returns the full amount for a single participant", () => {
    expect(splitAmountEvenly(750_000n, 1)).toEqual([750_000n]);
  });

  it("rejects a non-positive participant count", () => {
    expect(() => splitAmountEvenly(10n, 0)).toThrow(SplitError);
  });
});

describe("contact and totals", () => {
  const records = [
    record("OWED_TO_ME", 800_000n),
    record("I_OWE", 500_000n),
    record("OWED_TO_ME", 200_000n, "SETTLED"),
  ];

  it("nets open amounts per contact", () => {
    expect(calculateContactBalance(records)).toEqual({
      netAmount: 300_000n,
      signedAmount: 300_000n,
      direction: "OWED_TO_ME",
    });
  });

  it("sums owed-to-me without settled rows", () => {
    expect(calculateTotalOwedToMe(records)).toBe(800_000n);
  });

  it("sums i-owe without settled rows", () => {
    expect(calculateTotalIOwe(records)).toBe(500_000n);
  });

  it("impacts available money with i-owe only, as a negative number", () => {
    expect(calculateDebtImpactOnAvailableMoney(records)).toBe(-500_000n);
    expect(calculateDebtImpactOnAvailableMoney([record("OWED_TO_ME", 3_400_000n)])).toBe(0n);
  });
});

describe("applySettlement", () => {
  it("marks partial then full settlement", () => {
    const partial = applySettlement(1_000_000n, 400_000n);
    expect(partial).toEqual({ remainingAmount: 600_000n, status: "PARTIALLY_SETTLED" });
    expect(applySettlement(partial.remainingAmount, 600_000n)).toEqual({
      remainingAmount: 0n,
      status: "SETTLED",
    });
  });

  it("rejects over-payment", () => {
    expect(() => applySettlement(100n, 101n)).toThrow(SettlementError);
  });

  it("rejects zero or negative amounts", () => {
    expect(() => applySettlement(100n, 0n)).toThrow(SettlementError);
  });
});

describe("planSettlementAllocation", () => {
  it("fills oldest open debts first", () => {
    expect(
      planSettlementAllocation(
        [
          { id: "a", remainingAmount: 300n },
          { id: "b", remainingAmount: 500n },
        ],
        400n,
      ),
    ).toEqual([
      { id: "a", amount: 300n },
      { id: "b", amount: 100n },
    ]);
  });
});
