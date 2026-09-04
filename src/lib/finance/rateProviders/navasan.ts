import type { ReferenceAssetType } from "@/lib/finance/purchasing-power";
import type { RateProvider, RateProviderConfig, RawRate } from "@/lib/finance/rateProviders/types";

/** Documented Navasan symbols (https://www.navasan.tech/webserviceguide/). */
export const NAVASAN_DEFAULT_ITEM_MAP: Record<ReferenceAssetType, string> = {
  USD: "usd_sell",
  EUR: "eur",
  GOLD_COIN: "sekkeh",
  GOLD_COIN_BAHAR: "bahar",
  GOLD_GRAM: "18ayar",
  SILVER: "silver",
};

type FetchLike = typeof fetch;

type NavasanQuote = {
  value: unknown;
  timestamp?: unknown;
};

function resolveItemMap(overlay: RateProviderConfig["itemMap"]): Map<string, ReferenceAssetType> {
  const merged: Record<ReferenceAssetType, string> = { ...NAVASAN_DEFAULT_ITEM_MAP };
  for (const [asset, symbol] of Object.entries(overlay) as Array<[ReferenceAssetType, string]>) {
    merged[asset] = symbol;
  }

  const bySymbol = new Map<string, ReferenceAssetType>();
  for (const [asset, symbol] of Object.entries(merged) as Array<[ReferenceAssetType, string]>) {
    if (!symbol) {
      continue;
    }
    bySymbol.set(symbol, asset);
  }
  return bySymbol;
}

function parsePositiveDecimal(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function quoteFetchedAt(timestamp: unknown, fallback: Date): Date {
  if (typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0) {
    const millis = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  if (typeof timestamp === "string" && /^\d+$/.test(timestamp.trim())) {
    return quoteFetchedAt(Number(timestamp.trim()), fallback);
  }
  return fallback;
}

function asQuote(value: unknown): NavasanQuote | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as NavasanQuote;
}

function scaleToToman(price: number, tomanScale: number): number | null {
  if (!Number.isFinite(tomanScale) || tomanScale <= 0) {
    return null;
  }
  const toman = price / tomanScale;
  return Number.isFinite(toman) && toman > 0 ? toman : null;
}

/**
 * Navasan latest-price adapter.
 * GET `{baseUrl}/latest/?api_key=…` — see https://www.navasan.tech/webserviceguide/
 */
export class NavasanProvider implements RateProvider {
  readonly name = "navasan";

  constructor(
    private readonly config: RateProviderConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async fetchRates(): Promise<RawRate[]> {
    const url = new URL("latest/", `${this.config.baseUrl}/`);
    url.searchParams.set("api_key", this.config.apiKey);

    const response = await this.fetchImpl(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Navasan responded with HTTP ${response.status}.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Navasan returned invalid JSON.");
    }

    if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Navasan returned an unexpected payload.");
    }

    const now = new Date();
    const bySymbol = resolveItemMap(this.config.itemMap);
    const rates: RawRate[] = [];
    const seen = new Set<ReferenceAssetType>();

    for (const [symbol, rawQuote] of Object.entries(payload as Record<string, unknown>)) {
      const assetType = bySymbol.get(symbol);
      if (!assetType || seen.has(assetType)) {
        continue;
      }
      const quote = asQuote(rawQuote);
      if (!quote) {
        continue;
      }
      const providerPrice = parsePositiveDecimal(quote.value);
      if (providerPrice == null) {
        continue;
      }
      const priceInToman = scaleToToman(providerPrice, this.config.tomanScale);
      if (priceInToman == null) {
        continue;
      }
      seen.add(assetType);
      rates.push({
        assetType,
        priceInToman,
        fetchedAt: quoteFetchedAt(quote.timestamp, now),
      });
    }

    return rates;
  }
}
