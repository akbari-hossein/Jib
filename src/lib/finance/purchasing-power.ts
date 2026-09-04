import { formatCompactToman, groupThousands, toPersianDigits } from "@/lib/currency/format";
import { formatJalaliAbsolute, jalaliFromInstant } from "@/lib/dates/tehran";

export const REFERENCE_ASSET_TYPES = [
  "USD",
  "EUR",
  "GOLD_COIN",
  "GOLD_COIN_BAHAR",
  "GOLD_GRAM",
  "SILVER",
] as const;

export type ReferenceAssetType = (typeof REFERENCE_ASSET_TYPES)[number];
/** Alias used by live rate providers; same set as `ReferenceAssetType`. */
export type AssetType = ReferenceAssetType;

/** Hundredths of one reference-asset unit (0.98 سکه → 98). */
export const REFERENCE_EQUIVALENT_SCALE = 100n;

export type ReferenceRateSnapshot = {
  id: string;
  assetType: ReferenceAssetType;
  rateToToman: bigint;
  source: string;
  effectiveAt: Date;
  createdAt: Date;
};

export const REFERENCE_ASSET_UNIT_LABEL: Record<ReferenceAssetType, string> = {
  USD: "دلار",
  EUR: "یورو",
  GOLD_COIN: "سکه",
  GOLD_COIN_BAHAR: "سکه بهار",
  GOLD_GRAM: "گرم طلا",
  SILVER: "گرم نقره",
};

export const REFERENCE_ASSET_OPTION_LABEL: Record<ReferenceAssetType, string> = {
  USD: "دلار آمریکا",
  EUR: "یورو",
  GOLD_COIN: "سکه امامی",
  GOLD_COIN_BAHAR: "سکه بهار آزادی",
  GOLD_GRAM: "گرم طلای ۱۸ عیار",
  SILVER: "نقره",
};

export type PurchasingPowerHint = {
  rateId: string;
  text: string;
  rateDateLabel: string;
};

function isUsableRate(rate: ReferenceRateSnapshot | null | undefined): rate is ReferenceRateSnapshot {
  return rate != null && rate.rateToToman > 0n;
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n !== denominator < 0n;
  const absNumerator = numerator < 0n ? -numerator : numerator;
  const absDenominator = denominator < 0n ? -denominator : denominator;
  const rounded = (absNumerator + absDenominator / 2n) / absDenominator;
  return negative ? -rounded : rounded;
}

/**
 * Convert a toman amount into hundredths of the reference asset.
 * Returns null when the rate is missing or not a positive integer — never throws.
 */
export function calculatePurchasingPowerEquivalent(
  tomanAmount: bigint,
  rate: ReferenceRateSnapshot | null,
): bigint | null {
  if (!isUsableRate(rate)) {
    return null;
  }

  return divideRounded(tomanAmount * REFERENCE_EQUIVALENT_SCALE, rate.rateToToman);
}

/** Same integer conversion, named for monthly/weekly savings copy. */
export function calculateSavingsInReferenceAsset(
  monthlySavings: bigint,
  rate: ReferenceRateSnapshot | null,
): bigint | null {
  return calculatePurchasingPowerEquivalent(monthlySavings, rate);
}

export function formatEquivalentAmount(hundredths: bigint): string {
  const sign = hundredths < 0n ? "−" : "";
  const absolute = hundredths < 0n ? -hundredths : hundredths;
  const whole = absolute / REFERENCE_EQUIVALENT_SCALE;
  const fraction = absolute % REFERENCE_EQUIVALENT_SCALE;
  const wholeText = toPersianDigits(groupThousands(whole));

  if (fraction === 0n) {
    return `${sign}${wholeText}`;
  }

  const fractionDigits = fraction.toString().padStart(2, "0").replace(/0+$/, "");
  return `${sign}${wholeText}٫${toPersianDigits(fractionDigits)}`;
}

export function describePurchasingPower(
  tomanAmount: bigint,
  rate: ReferenceRateSnapshot | null,
): PurchasingPowerHint | null {
  const equivalent = calculatePurchasingPowerEquivalent(tomanAmount, rate);
  if (equivalent == null || !isUsableRate(rate)) {
    return null;
  }

  const unit = REFERENCE_ASSET_UNIT_LABEL[rate.assetType];
  return {
    rateId: rate.id,
    text: `معادل ${formatEquivalentAmount(equivalent)} ${unit}`,
    rateDateLabel: formatJalaliAbsolute(jalaliFromInstant(rate.effectiveAt)),
  };
}

export function describeSavingsInReferenceAsset(
  monthlySavings: bigint,
  rate: ReferenceRateSnapshot | null,
  period: "week" | "month",
): (PurchasingPowerHint & { sentence: string }) | null {
  const hint = describePurchasingPower(monthlySavings, rate);
  if (hint == null || monthlySavings < 0n) {
    return null;
  }

  const periodLabel = period === "week" ? "این هفته" : "این ماه";
  const equivalent = calculateSavingsInReferenceAsset(monthlySavings, rate);
  if (equivalent == null || !isUsableRate(rate)) {
    return null;
  }

  const unit = REFERENCE_ASSET_UNIT_LABEL[rate.assetType];
  return {
    ...hint,
    sentence: `پس‌انداز ${periodLabel}: ${formatCompactToman(monthlySavings)} (معادل ${formatEquivalentAmount(equivalent)} ${unit})`,
  };
}

export function isReferenceAssetType(value: string): value is ReferenceAssetType {
  return (REFERENCE_ASSET_TYPES as readonly string[]).includes(value);
}

export const isAssetType = isReferenceAssetType;
