import { describe, expect, it } from "vitest";
import {
  calculateAssetHoldingValue,
  calculateNetWorth,
  describeHoldingValue,
  sumAssetHoldingValue,
  toAccountSnapshot,
} from "@/lib/finance/assetHoldings";
import { calculateGoalProgress } from "@/lib/finance/goal-progress";
import { calculateAvailableMoney, sumLiquidBalance } from "@/lib/finance/available-money";
import { calculateSavingsRate } from "@/lib/finance/savings-rate";
import { QUANTITY_SCALE, parseQuantityToScaled } from "@/lib/finance/quantity";
import type { ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
import type { AccountSnapshot } from "@/lib/finance/types";

function rate(partial: Partial<ReferenceRateSnapshot> = {}): ReferenceRateSnapshot {
  return {
    id: partial.id ?? "rate_1",
    assetType: partial.assetType ?? "GOLD_COIN",
    rateToToman: partial.rateToToman ?? 80_000_000n,
    source: partial.source ?? "navasan",
    effectiveAt: partial.effectiveAt ?? new Date("2026-09-04T08:00:00.000Z"),
    createdAt: partial.createdAt ?? new Date("2026-09-04T08:00:00.000Z"),
  };
}

describe("calculateAssetHoldingValue", () => {
  it("multiplies quantity by the stored toman rate without floats", () => {
    const halfCoin = QUANTITY_SCALE / 2n;
    expect(calculateAssetHoldingValue(halfCoin, rate())).toBe(40_000_000n);
  });

  it("returns 0 toman for zero quantity even with a live rate", () => {
    expect(calculateAssetHoldingValue(0n, rate())).toBe(0n);
  });

  it("returns null for a negative quantity instead of inventing a value", () => {
    expect(calculateAssetHoldingValue(-QUANTITY_SCALE, rate())).toBeNull();
  });

  it("returns null when the rate is missing, zero, or unusable — the dashboard fallback", () => {
    expect(calculateAssetHoldingValue(QUANTITY_SCALE, null)).toBeNull();
    expect(calculateAssetHoldingValue(QUANTITY_SCALE, rate({ rateToToman: 0n }))).toBeNull();
    expect(calculateAssetHoldingValue(QUANTITY_SCALE, rate({ rateToToman: -1n }))).toBeNull();
  });

  it("never throws when a live fetch would have failed and left no stored rate", () => {
    expect(() => calculateAssetHoldingValue(QUANTITY_SCALE, null)).not.toThrow();
    const snapshot = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_GRAM",
        quantityScaled: QUANTITY_SCALE,
      },
      null,
    );
    expect(snapshot.balance).toBe(0n);
    expect(snapshot.holding?.value).toBeNull();
  });
});

describe("toAccountSnapshot", () => {
  it("derives toman at read time and does not use the stored account.balance", () => {
    const snapshot = toAccountSnapshot(
      {
        balance: 999n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_COIN",
        quantityScaled: QUANTITY_SCALE,
      },
      rate(),
    );
    expect(snapshot.balance).toBe(80_000_000n);
    expect(snapshot.holding?.value).toBe(80_000_000n);
  });

  it("hydrates balance to 0 when the rate is missing so available-money math never throws", () => {
    const snapshot = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "USD",
        quantityScaled: 2n * QUANTITY_SCALE,
      },
      null,
    );
    expect(snapshot.balance).toBe(0n);
    expect(snapshot.holding?.value).toBeNull();
  });
});

describe("available money with asset holdings", () => {
  it("keeps asset holdings out of spendable money by default", () => {
    const cash: AccountSnapshot = {
      balance: 12_000_000n,
      isActive: true,
      includeInAvailable: true,
    };
    const gold = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_COIN",
        quantityScaled: QUANTITY_SCALE,
      },
      rate(),
    );
    expect(sumLiquidBalance([cash, gold])).toBe(12_000_000n);
    expect(
      calculateAvailableMoney({
        liquidBalance: sumLiquidBalance([cash, gold]),
        reservedForGoals: 0n,
        plannedExpenses: 0n,
        requiredSavings: 0n,
      }),
    ).toBe(12_000_000n);
  });

  it("lets an opted-in holding count as liquid at the live rate", () => {
    const gold = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: true,
        type: "ASSET_HOLDING",
        assetType: "GOLD_COIN",
        quantityScaled: QUANTITY_SCALE,
      },
      rate(),
    );
    expect(sumLiquidBalance([gold])).toBe(80_000_000n);
  });
});

describe("calculateNetWorth", () => {
  it("sums cash plus derived holding values", () => {
    const cash: AccountSnapshot = {
      balance: 5_000_000n,
      isActive: true,
      includeInAvailable: true,
    };
    const gold = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_COIN",
        quantityScaled: QUANTITY_SCALE,
      },
      rate(),
    );
    expect(calculateNetWorth([cash, gold])).toBe(85_000_000n);
    expect(sumAssetHoldingValue([cash, gold])).toBe(80_000_000n);
  });

  it("counts a missing-rate holding as 0 rather than crashing net worth", () => {
    const gold = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_GRAM",
        quantityScaled: 10n * QUANTITY_SCALE,
      },
      null,
    );
    expect(calculateNetWorth([gold])).toBe(0n);
  });
});

describe("goal progress from live holdings", () => {
  it("uses today's derived toman so progress can move with the rate", () => {
    const holding = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_COIN",
        quantityScaled: QUANTITY_SCALE,
      },
      rate({ rateToToman: 75_000_000n }),
    );
    const progress = calculateGoalProgress({
      currentAmount: holding.holding?.value ?? 0n,
      targetAmount: 150_000_000n,
      targetDate: null,
      today: new Date("2026-09-04T08:00:00.000Z"),
    });
    expect(progress.pct).toBe(50);
  });
});

describe("savings rate with asset adds", () => {
  it("counts snapshot toman inflows as extra savings", () => {
    expect(calculateSavingsRate(30_000_000n, 21_000_000n, 3_000_000n)).toBe(40);
  });

  it("does not count opening inventory in the savings rate", () => {
    expect(calculateSavingsRate(30_000_000n, 21_000_000n, 0n)).toBe(30);
  });
});

describe("quantity parsing", () => {
  it("stores fractional coins at six decimal places", () => {
    expect(parseQuantityToScaled("2.5")).toBe(2_500_000n);
    expect(parseQuantityToScaled("۰٫۵")).toBe(500_000n);
    expect(parseQuantityToScaled("-1")).toBeNull();
  });
});

describe("describeHoldingValue", () => {
  it("returns a quantity × rate trace for explainability", () => {
    const described = describeHoldingValue(QUANTITY_SCALE, rate());
    expect(described?.text).toContain("سکه");
    expect(described?.detail).toContain("×");
    expect(described?.detail).toContain("=");
  });

  it("returns null when there is no rate to explain", () => {
    expect(describeHoldingValue(QUANTITY_SCALE, null)).toBeNull();
  });
});
