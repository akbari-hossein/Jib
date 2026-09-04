import type { AssetType, ReferenceAssetType } from "@/lib/finance/purchasing-power";

export type { AssetType } from "@/lib/finance/purchasing-power";

export type RawRate = {
  assetType: AssetType;
  priceInToman: number;
  fetchedAt: Date;
};

export interface RateProvider {
  readonly name: string;
  fetchRates(): Promise<RawRate[]>;
}

export type RateProviderConfig = {
  name: string;
  apiKey: string;
  baseUrl: string;
  pollIntervalMs: number | null;
  /** Overlay on the provider's documented symbol map. Empty value unmaps an asset. */
  itemMap: Partial<Record<ReferenceAssetType, string>>;
  /**
   * Divide the provider's numeric quote by this to get toman.
   * `1` when the API already quotes toman; `10` when it quotes rial.
   */
  tomanScale: number;
};
