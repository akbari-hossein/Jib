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
import { isImplausibleJump, readImplausibleJumpRatio } from "@/lib/finance/rateProviders/guard";
import { logRateEvent } from "@/lib/finance/rateProviders/log";
import { readFetchAttempts, withRetry } from "@/lib/finance/rateProviders/retry";
import { describeRateAge, readAlertAfterMs, readStaleAfterMs } from "@/lib/finance/rate-freshness";

export type { ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";
export {
  calculatePurchasingPowerEquivalent,
  calculateSavingsInReferenceAsset,
  describePurchasingPower,
  describeSavingsInReferenceAsset,
} from "@/lib/finance/purchasing-power";

export type LatestRate = {
  rate: ReferenceRateSnapshot;
  isStale: boolean;
};

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

function withFreshness(rate: ReferenceRateSnapshot, now: Date, staleAfterMs: number): LatestRate {
  return {
    rate,
    isStale: describeRateAge(rate.effectiveAt, now, staleAfterMs).stale,
  };
}

export function snapshotOf(latest: LatestRate | null | undefined): ReferenceRateSnapshot | null {
  return latest?.rate ?? null;
}

/**
 * Latest stored positive rate as of `asOf`.
 * Never throws. Returns null only when this asset has never had a successful rate.
 */
export async function getLatestRate(
  assetType: ReferenceAssetType,
  asOf: Date = new Date(),
  now: Date = new Date(),
): Promise<LatestRate | null> {
  try {
    const row = await prisma.referenceRate.findFirst({
      where: {
        assetType,
        rateToToman: { gt: 0n },
        effectiveAt: { lte: asOf },
      },
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
    });
    const snapshot = row ? toSnapshot(row) : null;
    if (!snapshot) {
      return null;
    }
    return withFreshness(snapshot, now, readStaleAfterMs());
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
  now: Date = new Date(),
): Promise<Map<ReferenceAssetType, LatestRate>> {
  const result = new Map<ReferenceAssetType, LatestRate>();
  try {
    const rows = await prisma.referenceRate.findMany({
      where: {
        rateToToman: { gt: 0n },
        effectiveAt: { lte: asOf },
      },
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
    });
    const staleAfterMs = readStaleAfterMs();
    for (const row of rows) {
      const snapshot = toSnapshot(row);
      if (snapshot && !result.has(snapshot.assetType)) {
        result.set(snapshot.assetType, withFreshness(snapshot, now, staleAfterMs));
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

async function writeIngestEvent(input: {
  source: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  recorded?: number;
  assetType?: ReferenceAssetType | null;
}) {
  try {
    await prisma.rateIngestEvent.create({
      data: {
        source: input.source,
        ok: input.ok,
        skipped: input.skipped ?? false,
        error: input.error ?? null,
        recorded: input.recorded ?? 0,
        assetType: input.assetType ?? null,
      },
    });
  } catch (error) {
    logRateEvent("rate_ingest_event_failed", {
      reason: error instanceof Error ? error.message : "event_write_failed",
    });
  }
}

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
 * Never throws. On provider failure the last stored rates stay in place.
 */
export async function ingestLiveRates(now: Date = new Date()): Promise<IngestLiveRatesResult> {
  try {
    return await ingestLiveRatesUnsafe(now);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed.";
    logRateEvent("rate_ingest_failed", { reason: message });
    return { ok: false, skipped: false, recorded: [], ignored: 0, error: message };
  }
}

async function ingestLiveRatesUnsafe(now: Date): Promise<IngestLiveRatesResult> {
  let configured: ReturnType<typeof getConfiguredRateProvider>;
  try {
    configured = getConfiguredRateProvider();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider is not available.";
    logRateEvent("rate_ingest_failed", { reason: message });
    await writeIngestEvent({ source: "unconfigured", ok: false, error: message });
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
    await writeIngestEvent({ source: config.name, ok: true, skipped: true });
    return { ok: true, skipped: true, recorded: [], ignored: 0 };
  }

  let rates;
  try {
    rates = await withRetry(() => provider.fetchRates(), {
      attempts: readFetchAttempts(),
      baseDelayMs: 400,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider fetch failed.";
    logRateEvent("rate_ingest_failed", { provider: config.name, reason: message });
    await writeIngestEvent({ source: config.name, ok: false, error: message });
    await maybeAlertStaleIngest(config.name, now);
    return { ok: false, skipped: false, recorded: [], ignored: 0, error: message };
  }

  const jumpRatio = readImplausibleJumpRatio();
  const previous = await getLatestRates(now, now);
  const inputs = persistableRates(rates, config.name);
  const accepted = [];
  let ignored = rates.length - inputs.length;
  for (const input of inputs) {
    const last = previous.get(input.assetType)?.rate.rateToToman ?? null;
    if (last != null && isImplausibleJump(last, input.rateToToman, jumpRatio)) {
      logRateEvent("rate_ingest_jump_skipped", {
        provider: config.name,
        assetType: input.assetType,
        previous: last.toString(),
        next: input.rateToToman.toString(),
      });
      ignored += 1;
      continue;
    }
    accepted.push(input);
  }

  const recorded: IngestLiveRatesResult["recorded"] = [];
  try {
    for (const input of accepted) {
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
    await writeIngestEvent({
      source: config.name,
      ok: false,
      error: message,
      recorded: recorded.length,
    });
    await maybeAlertStaleIngest(config.name, now);
    return { ok: false, skipped: false, recorded, ignored, error: message };
  }

  logRateEvent("rate_ingest_ok", {
    provider: config.name,
    recorded: recorded.length,
    ignored,
  });
  await writeIngestEvent({
    source: config.name,
    ok: true,
    recorded: recorded.length,
  });

  return {
    ok: true,
    skipped: false,
    recorded,
    ignored,
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
    const rates = await withRetry(() => configured.provider.fetchRates(), {
      attempts: readFetchAttempts(),
      baseDelayMs: 400,
    });
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

export type RateHealthRow = {
  assetType: ReferenceAssetType | null;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastError: string | null;
  lastRateToToman: string | null;
  lastRateAt: Date | null;
  stale: boolean;
};

export async function getRateHealth(now: Date = new Date()): Promise<{
  provider: string | null;
  rows: RateHealthRow[];
}> {
  const configured = (() => {
    try {
      return getConfiguredRateProvider();
    } catch {
      return null;
    }
  })();
  const staleAfterMs = readStaleAfterMs();
  const rates = await getLatestRates(now, now);
  const events = await prisma.rateIngestEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  }).catch(() => []);

  const byAsset = new Map<ReferenceAssetType | "all", RateHealthRow>();
  const ensure = (assetType: ReferenceAssetType | null): RateHealthRow => {
    const key = assetType ?? "all";
    const existing = byAsset.get(key);
    if (existing) {
      return existing;
    }
    const latest = assetType ? rates.get(assetType) : null;
    const row: RateHealthRow = {
      assetType,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastError: null,
      lastRateToToman: latest?.rate.rateToToman.toString() ?? null,
      lastRateAt: latest?.rate.effectiveAt ?? null,
      stale: latest?.isStale ?? (latest == null ? true : describeRateAge(latest.rate.effectiveAt, now, staleAfterMs).stale),
    };
    byAsset.set(key, row);
    return row;
  };

  for (const [assetType, latest] of rates) {
    ensure(assetType);
    const row = ensure(assetType);
    row.lastRateToToman = latest.rate.rateToToman.toString();
    row.lastRateAt = latest.rate.effectiveAt;
    row.stale = latest.isStale;
  }

  for (const event of events) {
    const row = ensure(event.assetType && isReferenceAssetType(event.assetType) ? event.assetType : null);
    if (event.ok && !event.skipped && row.lastSuccessAt == null) {
      row.lastSuccessAt = event.createdAt;
    }
    if (!event.ok && row.lastErrorAt == null) {
      row.lastErrorAt = event.createdAt;
      row.lastError = event.error;
    }
  }

  return {
    provider: configured?.config.name ?? null,
    rows: [...byAsset.values()],
  };
}
