import {
  isReferenceAssetType,
  type ReferenceAssetType,
} from "@/lib/finance/purchasing-power";
import type { RateProviderConfig } from "@/lib/finance/rateProviders/types";

export const RATE_PROVIDER_ENV = {
  name: "RATE_PROVIDER_NAME",
  apiKey: "RATE_PROVIDER_API_KEY",
  baseUrl: "RATE_PROVIDER_BASE_URL",
  pollIntervalMinutes: "RATE_PROVIDER_POLL_INTERVAL_MINUTES",
  itemMap: "RATE_PROVIDER_ITEM_MAP",
  tomanScale: "RATE_PROVIDER_TOMAN_SCALE",
} as const;

export function parseItemMap(raw: string | undefined): Partial<Record<ReferenceAssetType, string>> {
  const map: Partial<Record<ReferenceAssetType, string>> = {};
  if (!raw?.trim()) {
    return map;
  }

  for (const pair of raw.split(",")) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }
    const colon = trimmed.indexOf(":");
    if (colon <= 0) {
      continue;
    }
    const asset = trimmed.slice(0, colon).trim();
    const symbol = trimmed.slice(colon + 1).trim();
    if (!isReferenceAssetType(asset)) {
      continue;
    }
    map[asset] = symbol;
  }

  return map;
}

export function parsePositiveNumber(raw: string | undefined): number | null {
  const text = raw?.trim();
  if (!text) {
    return null;
  }
  if (!/^(?:\d+)(?:\.\d+)?$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

export function parsePositiveInteger(raw: string | undefined): number | null {
  const text = raw?.trim();
  if (!text || !/^[1-9]\d{0,8}$/.test(text)) {
    return null;
  }
  return Number(text);
}

export function readRateProviderConfig(
  env: NodeJS.Dict<string> = process.env,
): RateProviderConfig | null {
  const name = env[RATE_PROVIDER_ENV.name]?.trim().toLowerCase();
  const apiKey = env[RATE_PROVIDER_ENV.apiKey]?.trim();
  const baseUrl = env[RATE_PROVIDER_ENV.baseUrl]?.trim().replace(/\/+$/, "");
  if (!name || !apiKey || !baseUrl) {
    return null;
  }

  const pollMinutes = parsePositiveInteger(env[RATE_PROVIDER_ENV.pollIntervalMinutes]);
  const tomanScale = parsePositiveNumber(env[RATE_PROVIDER_ENV.tomanScale]) ?? 1;

  return {
    name,
    apiKey,
    baseUrl,
    pollIntervalMs: pollMinutes == null ? null : pollMinutes * 60_000,
    itemMap: parseItemMap(env[RATE_PROVIDER_ENV.itemMap]),
    tomanScale,
  };
}

export function shouldRefreshRates(
  lastFetchedAt: Date | null,
  pollIntervalMs: number | null,
  now: Date,
): boolean {
  if (pollIntervalMs == null) {
    return true;
  }
  if (lastFetchedAt == null) {
    return true;
  }
  return now.getTime() - lastFetchedAt.getTime() >= pollIntervalMs;
}
