import type { ReferenceAssetType as PrismaReferenceAssetType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ReferenceAssetType, ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
import { isReferenceAssetType } from "@/lib/finance/purchasing-power";
import {
  getConfiguredRateProvider,
  persistableRates,
  rawRateToRecordInput,
  shouldRefreshRates,
} from "@/lib/finance/rateProviders";
import { logRateEvent } from "@/lib/finance/rateProviders/log";
import { readAlertAfterMs } from "@/lib/finance/rate-freshness";

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
}): ReferenceRateSnapshot | null {
  if (!isReferenceAssetType(row.assetType)) {
    return null;
  }
  return {
    id: row.id,
    assetType: row.assetType,
    rateToToman: row.rateToToman,
    source: row.source,
    effectiveAt: row.effectiveAt,
    createdAt: row.createdAt,
  };
}

/**
 * Latest stored positive rate as of `asOf`. Never throws — returns null on miss or DB error.
 */
export async function getLatestRate(
  assetType: ReferenceAssetType,
  asOf: Date = new Date(),
): Promise<ReferenceRateSnapshot | null> {
  try {
    const row = await prisma.referenceRate.findFirst({
      where: {
        assetType,
        rateToToman: { gt: 0n },
        effectiveAt: { lte: asOf },
      },
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
    });
    return row ? toSnapshot(row) : null;
  } catch (error) {
    logRateEvent("rate_read_failed", {
      assetType,
      reason: error instanceof Error ? error.message : "read_failed",
    });
    return null;
  }
}

export async function getLatestRates(
  asOf: Date = new Date(),
): Promise<Map<ReferenceAssetType, ReferenceRateSnapshot>> {
  const result = new Map<ReferenceAssetType, ReferenceRateSnapshot>();
  try {
    const rows = await prisma.referenceRate.findMany({
      where: {
        rateToToman: { gt: 0n },
        effectiveAt: { lte: asOf },
      },
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
    });
    for (const row of rows) {
      const snapshot = toSnapshot(row);
      if (snapshot && !result.has(snapshot.assetType)) {
        result.set(snapshot.assetType, snapshot);
      }
    }
  } catch (error) {
    logRateEvent("rate_read_failed", {
      reason: error instanceof Error ? error.message : "read_failed",
    });
  }
  return result;
}

export async function getRateHistory(
  assetType: ReferenceAssetType,
  fromDate: Date,
  toDate: Date,
): Promise<ReferenceRateSnapshot[]> {
  try {
    const rows = await prisma.referenceRate.findMany({
      where: {
        assetType,
        rateToToman: { gt: 0n },
        effectiveAt: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ effectiveAt: "asc" }, { createdAt: "asc" }],
    });
    return rows
      .map(toSnapshot)
      .filter((row): row is ReferenceRateSnapshot => row != null);
  } catch (error) {
    logRateEvent("rate_read_failed", {
      assetType,
      reason: error instanceof Error ? error.message : "history_failed",
    });
    return [];
  }
}

export type RecordRateInput = {
  assetType: ReferenceAssetType;
  rateToToman: bigint;
  source?: string;
  effectiveAt?: Date;
};

/**
 * Persist a daily (or intra-day) rate. Append-only — never updates an existing row.
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

  const snapshot = toSnapshot(row);
  if (!snapshot) {
    throw new Error("recordRate stored an unsupported asset type.");
  }
  return snapshot;
}

export async function getLatestProviderIngestAt(source: string): Promise<Date | null> {
  try {
    const row = await prisma.referenceRate.findFirst({
      where: { source },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return row?.createdAt ?? null;
  } catch {
    return null;
  }
}

export type IngestLiveRatesResult = {
  ok: boolean;
  skipped: boolean;
  recorded: Array<{ id: string; assetType: ReferenceAssetType; rateToToman: string }>;
  ignored: number;
  error?: string;
};

async function maybeAlertStaleIngest(source: string, now: Date) {
  const last = await getLatestProviderIngestAt(source);
  const alertAfterMs = readAlertAfterMs();
  if (last == null || now.getTime() - last.getTime() > alertAfterMs) {
    logRateEvent("rate_ingest_stale_alert", {
      provider: source,
      lastSuccessAt: last?.toISOString() ?? null,
      hoursSinceSuccess: last ? Math.round((now.getTime() - last.getTime()) / 3_600_000) : null,
    });
  }
}

/**
 * Fetch every mapped asset from the configured provider and append whole-toman rows.
 * On provider failure the last stored rates stay in place. Calculation never fetches.
 */
export async function ingestLiveRates(now: Date = new Date()): Promise<IngestLiveRatesResult> {
  let configured: ReturnType<typeof getConfiguredRateProvider>;
  try {
    configured = getConfiguredRateProvider();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider is not available.";
    logRateEvent("rate_ingest_failed", { reason: message });
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
    logRateEvent("rate_ingest_skipped", { provider: config.name });
    return { ok: true, skipped: true, recorded: [], ignored: 0 };
  }

  let rates;
  try {
    rates = await provider.fetchRates();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider fetch failed.";
    logRateEvent("rate_ingest_failed", { provider: config.name, reason: message });
    await maybeAlertStaleIngest(config.name, now);
    return { ok: false, skipped: false, recorded: [], ignored: 0, error: message };
  }

  const inputs = persistableRates(rates, config.name);
  const recorded: IngestLiveRatesResult["recorded"] = [];
  try {
    for (const input of inputs) {
      const row = await recordRate(input);
      recorded.push({
        id: row.id,
        assetType: row.assetType,
        rateToToman: row.rateToToman.toString(),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Persist failed.";
    logRateEvent("rate_ingest_failed", { provider: config.name, reason: message });
    await maybeAlertStaleIngest(config.name, now);
    return { ok: false, skipped: false, recorded, ignored: 0, error: message };
  }

  logRateEvent("rate_ingest_ok", {
    provider: config.name,
    recorded: recorded.length,
    ignored: rates.length - inputs.length,
  });

  return {
    ok: true,
    skipped: false,
    recorded,
    ignored: rates.length - inputs.length,
  };
}

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

  try {
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
  } catch (error) {
    logRateEvent("rate_ingest_failed", {
      provider: configured.config.name,
      assetType,
      reason: error instanceof Error ? error.message : "fetch_failed",
    });
    return null;
  }
}
