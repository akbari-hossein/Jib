import { NavasanProvider } from "@/lib/finance/rateProviders/navasan";
import { readRateProviderConfig } from "@/lib/finance/rateProviders/config";
import type { RateProvider, RateProviderConfig } from "@/lib/finance/rateProviders/types";

export type { AssetType, RateProvider, RateProviderConfig, RawRate } from "@/lib/finance/rateProviders/types";
export { persistableRates, rawRateToRecordInput } from "@/lib/finance/rateProviders/mapRawRate";
export type { PersistableRate } from "@/lib/finance/rateProviders/mapRawRate";
export {
  readRateProviderConfig,
  shouldRefreshRates,
  RATE_PROVIDER_ENV,
} from "@/lib/finance/rateProviders/config";
export { NavasanProvider, NAVASAN_DEFAULT_ITEM_MAP } from "@/lib/finance/rateProviders/navasan";
export { logRateEvent } from "@/lib/finance/rateProviders/log";
export { withRetry, readFetchAttempts } from "@/lib/finance/rateProviders/retry";
export { isImplausibleJump, readImplausibleJumpRatio } from "@/lib/finance/rateProviders/guard";

/**
 * Build a provider from config. Adding a new vendor is a new class plus one
 * `case` here — ingest / calculation code does not change.
 */
export function createRateProvider(
  config: RateProviderConfig,
  fetchImpl: typeof fetch = fetch,
): RateProvider {
  switch (config.name) {
    case "navasan":
      return new NavasanProvider(config, fetchImpl);
    default:
      throw new Error(`Unsupported RATE_PROVIDER_NAME: ${config.name}`);
  }
}

export function getConfiguredRateProvider(
  env: NodeJS.Dict<string> = process.env,
  fetchImpl: typeof fetch = fetch,
): { provider: RateProvider; config: RateProviderConfig } | null {
  const config = readRateProviderConfig(env);
  if (!config) {
    return null;
  }
  return { provider: createRateProvider(config, fetchImpl), config };
}
