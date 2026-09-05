import type { AssetType, RawRate } from "@/lib/finance/rateProviders/types";

export type PersistableRate = {
  assetType: AssetType;
  rateToToman: bigint;
  source: string;
  effectiveAt: Date;
};

const MAX_TOMAN_DIGITS = 18;

/**
 * Turn a provider quote into whole-toman `recordRate` input.
 * Returns null for missing, non-finite, non-positive, or unsafe values — never throws.
 */
export function rawRateToRecordInput(rate: RawRate, source: string): PersistableRate | null {
  if (!Number.isFinite(rate.priceInToman) || rate.priceInToman <= 0) {
    return null;
  }

  const rounded = Math.round(rate.priceInToman);
  if (!Number.isSafeInteger(rounded) || rounded <= 0) {
    return null;
  }

  const digits = String(rounded);
  if (digits.length > MAX_TOMAN_DIGITS) {
    return null;
  }

  const fetchedAt = rate.fetchedAt;
  if (!(fetchedAt instanceof Date) || Number.isNaN(fetchedAt.getTime())) {
    return null;
  }

  return {
    assetType: rate.assetType,
    rateToToman: BigInt(rounded),
    source: source.trim() || "provider",
    effectiveAt: fetchedAt,
  };
}

export function persistableRates(rates: RawRate[], source: string): PersistableRate[] {
  const recorded: PersistableRate[] = [];
  for (const rate of rates) {
    const input = rawRateToRecordInput(rate, source);
    if (input) {
      recorded.push(input);
    }
  }
  return recorded;
}
