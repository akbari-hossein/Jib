import { describe, expect, it } from "vitest";
import {
  calculateAssetHoldingValue,
  calculateNetWorth,
  extraSavingsFromMovements,
  explainPeriodSavings,
  costBasisFromMovements,
  valuationChange,
  isLikelyOpeningBalance,
  calculateSavingsRate,
} from "@/lib/finance";
import { QUANTITY_SCALE } from "@/lib/finance/quantity";
import type { ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
import { toAccountSnapshot } from "@/lib/finance/assetHoldings";

function rate(partial: Partial<ReferenceRateSnapshot> = {}): ReferenceRateSnapshot {
  return {
    id: partial.id ?? "rate_1",
    assetType: partial.assetType ?? "GOLD_GRAM",
    rateToToman: partial.rateToToman ?? 3_000_000n,
    source: partial.source ?? "navasan",
    effectiveAt: partial.effectiveAt ?? new Date("2026-09-04T08:00:00.000Z"),
    createdAt: partial.createdAt ?? new Date("2026-09-04T08:00:00.000Z"),
  };
}

describe("extraSavingsFromMovements", () => {
  it("counts a purchase exactly once at the snapshot toman", () => {
    expect(
      extraSavingsFromMovements([
        { type: "ASSET_ADD", amount: 3_000_000n, movementReason: "PURCHASE" },
      ]),
    ).toBe(3_000_000n);
  });

  it("does not count opening inventory as period savings — the 3,000,000 bug", () => {
    const explained = explainPeriodSavings({
      income: 0n,
      expenses: 0n,
      movements: [{ id: "tx_open", type: "ASSET_ADD", amount: 3_000_000n, movementReason: "OPENING" }],
    });
    expect(explained.extraSavings).toBe(0n);
    expect(explained.monthlySavings).toBe(0n);
    expect(explained.lines[0]?.included).toBe(false);
  });

  it("does not treat a later rate change as new savings", () => {
    expect(extraSavingsFromMovements([])).toBe(0n);
    expect(valuationChange(4_200_000n, 3_000_000n)).toBe(1_200_000n);
    expect(calculateSavingsRate(30_000_000n, 21_000_000n, 0n)).toBe(30);
  });

  it("reduces savings when the purchase is deleted or sold", () => {
    expect(
      extraSavingsFromMovements([
        { type: "ASSET_ADD", amount: 3_000_000n, movementReason: "PURCHASE" },
        { type: "ASSET_REMOVE", amount: 3_000_000n, movementReason: "SALE" },
      ]),
    ).toBe(0n);
  });

  it("ignores quantity corrections", () => {
    expect(
      extraSavingsFromMovements([
        { type: "ASSET_ADD", amount: 3_000_000n, movementReason: "CORRECTION" },
        { type: "ASSET_REMOVE", amount: 500_000n, movementReason: "CORRECTION" },
      ]),
    ).toBe(0n);
  });
});

describe("rial/toman consistency on holdings", () => {
  it("values 1 gram at the stored toman rate, not a 10x rial figure", () => {
    expect(calculateAssetHoldingValue(QUANTITY_SCALE, rate({ rateToToman: 3_000_000n }))).toBe(3_000_000n);
    expect(calculateAssetHoldingValue(QUANTITY_SCALE, rate({ rateToToman: 30_000_000n }))).toBe(30_000_000n);
  });
});

describe("net worth vs savings", () => {
  it("includes current holding value in net worth but not in extra savings", () => {
    const gold = toAccountSnapshot(
      {
        balance: 0n,
        isActive: true,
        includeInAvailable: false,
        type: "ASSET_HOLDING",
        assetType: "GOLD_GRAM",
        quantityScaled: QUANTITY_SCALE,
      },
      rate({ rateToToman: 3_200_000n }),
    );
    expect(calculateNetWorth([gold])).toBe(3_200_000n);
    expect(costBasisFromMovements([{ type: "ASSET_ADD", amount: 3_000_000n, movementReason: "OPENING" }])).toBe(
      3_000_000n,
    );
    expect(valuationChange(gold.holding?.value ?? 0n, 3_000_000n)).toBe(200_000n);
  });
});

describe("isLikelyOpeningBalance", () => {
  const createdAt = new Date("2026-09-05T10:00:00.000Z");

  it("flags the first add within two minutes of account creation", () => {
    expect(
      isLikelyOpeningBalance({
        type: "ASSET_ADD",
        occurredAt: new Date("2026-09-05T10:00:08.000Z"),
        accountCreatedAt: createdAt,
        isFirstAssetMovement: true,
        movementReason: "PURCHASE",
      }),
    ).toBe(true);
  });

  it("does not flag a later buy", () => {
    expect(
      isLikelyOpeningBalance({
        type: "ASSET_ADD",
        occurredAt: new Date("2026-09-05T18:00:00.000Z"),
        accountCreatedAt: createdAt,
        isFirstAssetMovement: false,
        movementReason: "PURCHASE",
      }),
    ).toBe(false);
  });
});
