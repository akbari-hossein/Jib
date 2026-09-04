import type { AccountType } from "@prisma/client";
import type { AssetType, ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
import {
  REFERENCE_ASSET_UNIT_LABEL,
  REFERENCE_EQUIVALENT_SCALE,
} from "@/lib/finance/purchasing-power";
import { formatJalaliAbsolute, jalaliFromInstant } from "@/lib/dates/tehran";
import { formatQuantity, QUANTITY_SCALE } from "@/lib/finance/quantity";
import { formatToman } from "@/lib/currency/format";
import type { AccountSnapshot } from "@/lib/finance/types";

/**
 * Derived toman value of a physical holding.
 * Returns null for a missing/unusable rate or a negative quantity — never throws.
 * Zero quantity is 0 toman. Result is whole toman (bigint), not a float.
 */
export function calculateAssetHoldingValue(
  quantityScaled: bigint,
  rate: ReferenceRateSnapshot | null,
): bigint | null {
  if (quantityScaled < 0n) {
    return null;
  }
  if (quantityScaled === 0n) {
    return 0n;
  }
  if (rate == null || rate.rateToToman <= 0n) {
    return null;
  }
  return (quantityScaled * rate.rateToToman + QUANTITY_SCALE / 2n) / QUANTITY_SCALE;
}

export function calculateNetWorth(accounts: AccountSnapshot[]): bigint {
  return accounts
    .filter((account) => account.isActive)
    .reduce((sum, account) => sum + account.balance, 0n);
}

export function sumAssetHoldingValue(accounts: AccountSnapshot[]): bigint {
  return accounts
    .filter((account) => account.isActive && account.holding)
    .reduce((sum, account) => sum + (account.holding?.value ?? 0n), 0n);
}

export function toAccountSnapshot(
  account: {
    balance: bigint;
    isActive: boolean;
    includeInAvailable: boolean;
    type: AccountType;
    assetType: AssetType | null;
    quantityScaled: bigint;
  },
  rate: ReferenceRateSnapshot | null,
): AccountSnapshot {
  if (account.type !== "ASSET_HOLDING" || account.assetType == null) {
    return {
      balance: account.balance,
      isActive: account.isActive,
      includeInAvailable: account.includeInAvailable,
    };
  }

  const value = calculateAssetHoldingValue(account.quantityScaled, rate);
  return {
    balance: value ?? 0n,
    isActive: account.isActive,
    includeInAvailable: account.includeInAvailable,
    holding: {
      assetType: account.assetType,
      quantityScaled: account.quantityScaled,
      value,
      rate,
    },
  };
}

export function describeHoldingValue(
  quantityScaled: bigint,
  rate: ReferenceRateSnapshot | null,
): { text: string; detail: string } | null {
  const value = calculateAssetHoldingValue(quantityScaled, rate);
  if (value == null || rate == null) {
    return null;
  }
  const unit = REFERENCE_ASSET_UNIT_LABEL[rate.assetType];
  const quantityText = formatQuantity(quantityScaled);
  const rateDate = formatJalaliAbsolute(jalaliFromInstant(rate.effectiveAt));
  return {
    text: `${quantityText} ${unit}`,
    detail: `${quantityText} ${unit} × ${formatToman(rate.rateToToman)} (نرخ ${rateDate}) = ${formatToman(value)}`,
  };
}

export function assetGroupLabel(assetTypes: AssetType[]): string {
  const unique = [...new Set(assetTypes)];
  const hasGold = unique.some((type) => type.startsWith("GOLD"));
  const hasFx = unique.some((type) => type === "USD" || type === "EUR");
  if (hasGold && hasFx) {
    return "طلا و ارز";
  }
  if (hasGold) {
    return "طلا";
  }
  if (hasFx) {
    return "ارز";
  }
  return "دارایی";
}

export function formatHoldingLine(quantityScaled: bigint, assetType: AssetType): string {
  return `${formatQuantity(quantityScaled)} ${REFERENCE_ASSET_UNIT_LABEL[assetType]}`;
}

/** Hundredths of a unit as used by purchasing-power copy — quantity is already scaled. */
export function quantityAsEquivalentHundredths(quantityScaled: bigint): bigint {
  return (quantityScaled * REFERENCE_EQUIVALENT_SCALE + QUANTITY_SCALE / 2n) / QUANTITY_SCALE;
}
