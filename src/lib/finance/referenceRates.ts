import type { ReferenceAssetType as PrismaReferenceAssetType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ReferenceAssetType, ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";

export type { ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
export {
  calculatePurchasingPowerEquivalent,
  calculateSavingsInReferenceAsset,
  describePurchasingPower,
  describeSavingsInReferenceAsset,
} from "@/lib/finance/purchasing-power";

function toSnapshot(row: {
  id: string;
  assetType: PrismaReferenceAssetType;
  rateToToman: bigint;
  source: string;
  effectiveAt: Date;
  createdAt: Date;
}): ReferenceRateSnapshot {
  return {
    id: row.id,
    assetType: row.assetType,
    rateToToman: row.rateToToman,
    source: row.source,
    effectiveAt: row.effectiveAt,
    createdAt: row.createdAt,
  };
}

export async function getLatestRate(
  assetType: ReferenceAssetType,
  asOf: Date = new Date(),
): Promise<ReferenceRateSnapshot | null> {
  const row = await prisma.referenceRate.findFirst({
    where: {
      assetType,
      rateToToman: { gt: 0n },
      effectiveAt: { lte: asOf },
    },
    orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
  });

  return row ? toSnapshot(row) : null;
}

export type RecordRateInput = {
  assetType: ReferenceAssetType;
  rateToToman: bigint;
  source?: string;
  effectiveAt?: Date;
};

/**
 * Persist a daily (or intra-day) rate. Manual entry, a cron job, and a future
 * REST provider should all call this — calculation never talks to a provider.
 */
export async function recordRate(input: RecordRateInput): Promise<ReferenceRateSnapshot> {
  if (input.rateToToman <= 0n) {
    throw new Error("rateToToman must be a positive integer (toman per unit).");
  }

  const row = await prisma.referenceRate.create({
    data: {
      assetType: input.assetType,
      rateToToman: input.rateToToman,
      source: input.source?.trim() || "manual",
      effectiveAt: input.effectiveAt ?? new Date(),
    },
  });

  return toSnapshot(row);
}

/**
 * EXTENSION POINT — plug in a documented REST rate provider here.
 *
 * A future cron should:
 *   1. call `fetchProviderRate(assetType)`
 *   2. if a payload is returned, call `recordRate({ ...payload, assetType })`
 *
 * Do not scrape HTML. Do not call an LLM. Calculation (`calculatePurchasingPowerEquivalent`)
 * must stay a pure function of a stored `ReferenceRate` row.
 */
export async function fetchProviderRate(
  assetType: ReferenceAssetType,
): Promise<Omit<RecordRateInput, "assetType"> | null> {
  // TODO: GET a documented FX / gold REST API for `assetType` and map the JSON
  // payload to whole-toman integers. Return null until a provider is wired.
  void assetType;
  return null;
}
