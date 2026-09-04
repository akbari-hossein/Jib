import { describe, expect, it } from "vitest";
import {
  calculatePurchasingPowerEquivalent,
  calculateSavingsInReferenceAsset,
  describePurchasingPower,
  describeSavingsInReferenceAsset,
  formatEquivalentAmount,
  isReferenceAssetType,
  type ReferenceRateSnapshot,
} from "@/lib/finance/purchasing-power";

function rate(partial: Partial<ReferenceRateSnapshot> = {}): ReferenceRateSnapshot {
  return {
    id: partial.id ?? "rate_coin",
    assetType: partial.assetType ?? "GOLD_COIN",
    rateToToman: partial.rateToToman ?? 8_591_836n,
    source: partial.source ?? "manual",
    effectiveAt: partial.effectiveAt ?? new Date("2026-09-01T08:00:00.000Z"),
    createdAt: partial.createdAt ?? new Date("2026-09-01T08:00:00.000Z"),
  };
}

describe("calculatePurchasingPowerEquivalent", () => {
  it("converts toman to hundredths of a coin without floats", () => {
    expect(calculatePurchasingPowerEquivalent(8_420_000n, rate())).toBe(98n);
  });

  it("returns null when the rate is missing", () => {
    expect(calculatePurchasingPowerEquivalent(8_420_000n, null)).toBeNull();
  });

  it("never throws for a missing or zero rate", () => {
    expect(() => calculatePurchasingPowerEquivalent(8_420_000n, null)).not.toThrow();
    expect(() =>
      calculatePurchasingPowerEquivalent(8_420_000n, rate({ rateToToman: 0n })),
    ).not.toThrow();
  });

  it("returns null when the rate is zero", () => {
    expect(calculatePurchasingPowerEquivalent(8_420_000n, rate({ rateToToman: 0n }))).toBeNull();
  });

  it("returns null when the rate is negative", () => {
    expect(calculatePurchasingPowerEquivalent(8_420_000n, rate({ rateToToman: -1n }))).toBeNull();
  });

  it("keeps the sign of expenses", () => {
    expect(calculatePurchasingPowerEquivalent(-8_420_000n, rate())).toBe(-98n);
  });

  it("returns zero for a zero amount", () => {
    expect(calculatePurchasingPowerEquivalent(0n, rate())).toBe(0n);
  });
});

describe("calculateSavingsInReferenceAsset", () => {
  it("uses the same integer conversion as purchasing power", () => {
    const snapshot = rate({ rateToToman: 7_500_000n });
    expect(calculateSavingsInReferenceAsset(9_000_000n, snapshot)).toBe(120n);
    expect(calculateSavingsInReferenceAsset(9_000_000n, snapshot)).toBe(
      calculatePurchasingPowerEquivalent(9_000_000n, snapshot),
    );
  });

  it("returns null without a usable rate", () => {
    expect(calculateSavingsInReferenceAsset(9_000_000n, null)).toBeNull();
    expect(calculateSavingsInReferenceAsset(9_000_000n, rate({ rateToToman: 0n }))).toBeNull();
  });

  it("accepts a negative savings gap", () => {
    expect(calculateSavingsInReferenceAsset(-7_500_000n, rate({ rateToToman: 7_500_000n }))).toBe(
      -100n,
    );
  });
});

describe("formatEquivalentAmount", () => {
  it("formats hundredths with a Persian decimal", () => {
    expect(formatEquivalentAmount(98n)).toBe("۰٫۹۸");
    expect(formatEquivalentAmount(120n)).toBe("۱٫۲");
    expect(formatEquivalentAmount(8400n)).toBe("۸۴");
    expect(formatEquivalentAmount(-50n)).toBe("−۰٫۵");
  });
});

describe("describePurchasingPower", () => {
  it("ties the label to a specific rate date", () => {
    const described = describePurchasingPower(
      8_420_000n,
      rate({ effectiveAt: new Date("2026-08-23T08:00:00.000Z") }),
    );
    expect(described?.rateId).toBe("rate_coin");
    expect(described?.text).toBe("معادل ۰٫۹۸ سکه");
    expect(described?.rateDateLabel).toMatch(/۱۴۰۵/);
  });

  it("returns null when no rate can explain the number", () => {
    expect(describePurchasingPower(8_420_000n, null)).toBeNull();
  });
});

describe("describeSavingsInReferenceAsset", () => {
  it("builds monthly copy from compact toman and the equivalent", () => {
    const described = describeSavingsInReferenceAsset(
      9_000_000n,
      rate({ rateToToman: 7_500_000n }),
      "month",
    );
    expect(described?.sentence).toBe("پس‌انداز این ماه: ۹ میلیون تومان (معادل ۱٫۲ سکه)");
  });

  it("hides copy when savings are negative", () => {
    expect(
      describeSavingsInReferenceAsset(-1_000_000n, rate({ rateToToman: 7_500_000n }), "week"),
    ).toBeNull();
  });
});

describe("isReferenceAssetType", () => {
  it("accepts the live-rate asset set", () => {
    expect(isReferenceAssetType("USD")).toBe(true);
    expect(isReferenceAssetType("EUR")).toBe(true);
    expect(isReferenceAssetType("GOLD_COIN_BAHAR")).toBe(true);
    expect(isReferenceAssetType("SILVER")).toBe(true);
    expect(isReferenceAssetType("BTC")).toBe(false);
  });
});
