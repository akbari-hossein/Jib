import type { ReferenceAssetType as PrismaReferenceAssetType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ReferenceAssetType, ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
import {
  getConfiguredRateProvider,
  persistableRates,
  rawRateToRecordInput,
  shouldRefreshRates,
} from "@/lib/finance/rateProviders";

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
 * Persist a daily (or intra-day) rate. Manual entry, a cron job, and a live
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

export async function getLatestProviderIngestAt(source: string): Promise<Date | null> {
  const row = await prisma.referenceRate.findFirst({
    where: { source },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}

export type IngestLiveRatesResult = {
  ok: boolean;
  skipped: boolean;
  recorded: Array<{ id: string; assetType: ReferenceAssetType; rateToToman: string }>;
  ignored: number;
  error?: string;
};

/**
 * Fetch every mapped asset from the configured provider and persist whole-toman
 * rows. On provider failure the last stored rates stay in place.
 *
 * Do not scrape HTML. Do not call an LLM. Calculation stays a pure function of
 * a stored `ReferenceRate` row.
 */
export async function ingestLiveRates(now: Date = new Date()): Promise<IngestLiveRatesResult> {
  let configured: ReturnType<typeof getConfiguredRateProvider>;
  try {
    configured = getConfiguredRateProvider();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider is not available.";
    return { ok: false, skipped: false, recorded: [], ignored: 0, error: message };
  }
  if (!configured) {
    return {
      ok: false,
      skipped: false,
      recorded: [],
      ignored: 0,
      error: "Live rate provider is not configured.",
    };
  }

  const { provider, config } = configured;
  const lastFetchedAt = await getLatestProviderIngestAt(config.name);
  if (!shouldRefreshRates(lastFetchedAt, config.pollIntervalMs, now)) {
    return { ok: true, skipped: true, recorded: [], ignored: 0 };
  }

  let rates;
  try {
    rates = await provider.fetchRates();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider fetch failed.";
    return { ok: false, skipped: false, recorded: [], ignored: 0, error: message };
  }

  const inputs = persistableRates(rates, config.name);
  const recorded: IngestLiveRatesResult["recorded"] = [];
  for (const input of inputs) {
    const row = await recordRate(input);
    recorded.push({
      id: row.id,
      assetType: row.assetType,
      rateToToman: row.rateToToman.toString(),
    });
  }

  return {
    ok: true,
    skipped: false,
    recorded,
    ignored: rates.length - inputs.length,
  };
}

/**
 * Fetch the live quote for one asset. Prefer `ingestLiveRates()` in cron so
 * one HTTP call covers every mapped symbol.
 */
export async function fetchProviderRate(
  assetType: ReferenceAssetType,
): Promise<Omit<RecordRateInput, "assetType"> | null> {
  let configured: ReturnType<typeof getConfiguredRateProvider>;
  try {
    configured = getConfiguredRateProvider();
  } catch {
    return null;
  }
  if (!configured) {
    return null;
  }

  const rates = await configured.provider.fetchRates();
  const match = rates.find((rate) => rate.assetType === assetType);
  if (!match) {
    return null;
  }

  const input = rawRateToRecordInput(match, configured.config.name);
  if (!input) {
    return null;
  }

  return {
    rateToToman: input.rateToToman,
    source: input.source,
    effectiveAt: input.effectiveAt,
  };
}
