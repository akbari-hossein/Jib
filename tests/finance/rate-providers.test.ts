import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRateProvider,
  NAVASAN_DEFAULT_ITEM_MAP,
  NavasanProvider,
  persistableRates,
  rawRateToRecordInput,
  readRateProviderConfig,
  shouldRefreshRates,
  withRetry,
  isImplausibleJump,
  type RateProviderConfig,
  type RawRate,
} from "@/lib/finance/rateProviders";

afterEach(() => {
  vi.unstubAllEnvs();
});

function providerConfig(partial: Partial<RateProviderConfig> = {}): RateProviderConfig {
  return {
    name: "navasan",
    apiKey: "test-key",
    baseUrl: "https://api.navasan.tech",
    pollIntervalMs: 120 * 60_000,
    itemMap: {},
    tomanScale: 1,
    ...partial,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const NAVASAN_PAYLOAD = {
  usd_sell: { value: "112700", change: 10, timestamp: 1_700_000_000 },
  eur: { value: "122000", timestamp: 1_700_000_000 },
  sekkeh: { value: "85000000", timestamp: 1_700_000_010 },
  bahar: { value: "79000000", timestamp: 1_700_000_010 },
  "18ayar": { value: "6500000", timestamp: 1_700_000_010 },
  nim: { value: "40000000", timestamp: 1_700_000_010 },
};

describe("readRateProviderConfig", () => {
  it("returns null until name, key, and base URL are all set", () => {
    vi.stubEnv("RATE_PROVIDER_NAME", "navasan");
    vi.stubEnv("RATE_PROVIDER_API_KEY", "");
    vi.stubEnv("RATE_PROVIDER_BASE_URL", "https://api.navasan.tech");
    expect(readRateProviderConfig()).toBeNull();
  });

  it("reads poll interval, scale, and item-map overlay from env", () => {
    vi.stubEnv("RATE_PROVIDER_NAME", "Navasan");
    vi.stubEnv("RATE_PROVIDER_API_KEY", "secret-key");
    vi.stubEnv("RATE_PROVIDER_BASE_URL", "https://api.navasan.tech/");
    vi.stubEnv("RATE_PROVIDER_POLL_INTERVAL_MINUTES", "90");
    vi.stubEnv("RATE_PROVIDER_TOMAN_SCALE", "10");
    vi.stubEnv("RATE_PROVIDER_ITEM_MAP", "USD:usd,GOLD_GRAM:,NOT_AN_ASSET:x");

    expect(readRateProviderConfig()).toEqual({
      name: "navasan",
      apiKey: "secret-key",
      baseUrl: "https://api.navasan.tech",
      pollIntervalMs: 90 * 60_000,
      tomanScale: 10,
      itemMap: { USD: "usd", GOLD_GRAM: "" },
    });
  });
});

describe("shouldRefreshRates", () => {
  const now = new Date("2026-09-04T12:00:00.000Z");

  it("always refreshes when no interval is configured", () => {
    expect(shouldRefreshRates(now, null, now)).toBe(true);
  });

  it("refreshes when nothing has been stored yet", () => {
    expect(shouldRefreshRates(null, 60_000, now)).toBe(true);
  });

  it("skips inside the configured window and refreshes after it", () => {
    const recent = new Date("2026-09-04T11:59:00.000Z");
    const stale = new Date("2026-09-04T10:00:00.000Z");
    expect(shouldRefreshRates(recent, 5 * 60_000, now)).toBe(false);
    expect(shouldRefreshRates(stale, 5 * 60_000, now)).toBe(true);
  });
});

describe("NavasanProvider", () => {
  it("maps documented symbols to asset types and toman quotes", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.origin + url.pathname).toBe("https://api.navasan.tech/latest/");
      expect(url.searchParams.get("api_key")).toBe("test-key");
      return jsonResponse(NAVASAN_PAYLOAD);
    });

    const rates = await new NavasanProvider(providerConfig(), fetchImpl).fetchRates();
    const byAsset = Object.fromEntries(rates.map((rate) => [rate.assetType, rate]));

    expect(byAsset.USD?.priceInToman).toBe(112_700);
    expect(byAsset.EUR?.priceInToman).toBe(122_000);
    expect(byAsset.GOLD_COIN?.priceInToman).toBe(85_000_000);
    expect(byAsset.GOLD_COIN_BAHAR?.priceInToman).toBe(79_000_000);
    expect(byAsset.GOLD_GRAM?.priceInToman).toBe(6_500_000);
    expect(byAsset.USD?.fetchedAt.toISOString()).toBe("2023-11-14T22:13:20.000Z");
    expect(rates.some((rate) => rate.assetType === "GOLD_COIN" && rate.priceInToman === 40_000_000)).toBe(
      false,
    );
  });

  it("skips missing, zero, and non-numeric quotes without throwing", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        usd_sell: { value: "0", timestamp: 1_700_000_000 },
        eur: { value: "-12", timestamp: 1_700_000_000 },
        sekkeh: { value: "not-a-price", timestamp: 1_700_000_000 },
        bahar: { timestamp: 1_700_000_000 },
        "18ayar": { value: "4100000", timestamp: 1_700_000_000 },
      }),
    );

    await expect(new NavasanProvider(providerConfig(), fetchImpl).fetchRates()).resolves.toEqual([
      expect.objectContaining({ assetType: "GOLD_GRAM", priceInToman: 4_100_000 }),
    ]);
  });

  it("divides rial quotes when tomanScale is 10", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ usd_sell: { value: "1127000", timestamp: 1_700_000_000 } }),
    );
    const rates = await new NavasanProvider(
      providerConfig({ tomanScale: 10 }),
      fetchImpl,
    ).fetchRates();
    expect(rates).toEqual([
      expect.objectContaining({ assetType: "USD", priceInToman: 112_700 }),
    ]);
  });

  it("lets env item-map overlay replace a default symbol", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        usd: { value: "111000", timestamp: 1_700_000_000 },
        usd_sell: { value: "112700", timestamp: 1_700_000_000 },
      }),
    );
    const rates = await new NavasanProvider(
      providerConfig({ itemMap: { USD: "usd" } }),
      fetchImpl,
    ).fetchRates();
    expect(rates).toEqual([expect.objectContaining({ assetType: "USD", priceInToman: 111_000 })]);
  });

  it("throws when the payload has no usable mapped quotes", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ nim: { value: "1", timestamp: 1_700_000_000 } }));
    await expect(new NavasanProvider(providerConfig(), fetchImpl).fetchRates()).rejects.toThrow(
      /no usable quotes/,
    );
  });

  it("throws on HTTP 500 so ingest can retry then keep the last stored row", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(new NavasanProvider(providerConfig(), fetchImpl).fetchRates()).rejects.toThrow(/HTTP 500/);
  });

  it("throws on abort/timeout", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "TimeoutError");
    });
    await expect(new NavasanProvider(providerConfig(), fetchImpl).fetchRates()).rejects.toThrow(/aborted/i);
  });
});

describe("persistableRates", () => {
  const fetchedAt = new Date("2026-09-04T08:00:00.000Z");

  function rate(partial: Partial<RawRate> = {}): RawRate {
    return {
      assetType: "GOLD_COIN",
      priceInToman: 85_000_000,
      fetchedAt,
      ...partial,
    };
  }

  it("rounds a provider number to a whole-toman bigint without touching a vendor", () => {
    expect(persistableRates([rate({ priceInToman: 85_000_000.4 })], "navasan")).toEqual([
      {
        assetType: "GOLD_COIN",
        rateToToman: 85_000_000n,
        source: "navasan",
        effectiveAt: fetchedAt,
      },
    ]);
  });

  it("drops non-positive or non-finite quotes", () => {
    expect(rawRateToRecordInput(rate({ priceInToman: 0 }), "navasan")).toBeNull();
    expect(rawRateToRecordInput(rate({ priceInToman: -1 }), "navasan")).toBeNull();
    expect(rawRateToRecordInput(rate({ priceInToman: Number.NaN }), "navasan")).toBeNull();
    expect(persistableRates([rate({ priceInToman: 0 }), rate()], "manual")).toHaveLength(1);
  });
});

describe("createRateProvider", () => {
  it("returns Navasan without the caller switching on the vendor name", () => {
    expect(createRateProvider(providerConfig())).toBeInstanceOf(NavasanProvider);
  });

  it("rejects an unknown vendor so ingest cannot silently no-op", () => {
    expect(() => createRateProvider(providerConfig({ name: "unknown-vendor" }))).toThrow(
      /Unsupported RATE_PROVIDER_NAME/,
    );
  });

  it("keeps Navasan's documented defaults for every supported asset", () => {
    expect(NAVASAN_DEFAULT_ITEM_MAP).toMatchObject({
      USD: "usd_sell",
      EUR: "eur",
      GOLD_COIN: "sekkeh",
      GOLD_COIN_BAHAR: "bahar",
      GOLD_GRAM: "18ayar",
    });
  });
});

describe("withRetry", () => {
  it("retries transient failures then succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("timeout");
        }
        return "ok";
      },
      { attempts: 3, baseDelayMs: 1, sleep: async () => undefined },
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("gives up after the configured attempts without leaking a raw throw from the helper's caller contract", async () => {
    await expect(
      withRetry(
        async () => {
          throw new Error("HTTP 500");
        },
        { attempts: 3, baseDelayMs: 1, sleep: async () => undefined },
      ),
    ).rejects.toThrow(/HTTP 500/);
  });
});

describe("isImplausibleJump", () => {
  it("rejects a 10x rial-as-toman spike against the last stored rate", () => {
    expect(isImplausibleJump(112_700n, 1_127_000n, 0.3)).toBe(true);
    expect(isImplausibleJump(3_000_000n, 30_000_000n, 0.3)).toBe(true);
  });

  it("allows a modest market move", () => {
    expect(isImplausibleJump(3_000_000n, 3_200_000n, 0.3)).toBe(false);
  });
});
