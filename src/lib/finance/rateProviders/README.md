# Rate providers

Jib stores market rates in `ReferenceRate` (append-only whole-toman rows).
Calculation code never calls a vendor. Ingest is the only network hop.

## Swap or add a provider

1. Create a class that implements `RateProvider` (`fetchRates(): Promise<RawRate[]>`).
   Return only assets the vendor actually quotes. Do **not** invent a rate for an
   unmapped asset.
2. Validate the HTTP payload (Zod). Throw on HTTP errors, invalid JSON, or zero
   usable quotes so the last stored row stays in place.
3. Add a `case` in `createRateProvider()` in `index.ts`.
4. Set env (server-only — never `NEXT_PUBLIC_`):

```env
RATE_PROVIDER_NAME="your-vendor"
RATE_PROVIDER_API_KEY="…"
RATE_PROVIDER_BASE_URL="https://…"
RATE_PROVIDER_POLL_INTERVAL_MINUTES="30"
```

Optional overlay if the vendor's symbols differ:

```env
RATE_PROVIDER_ITEM_MAP="USD:usd_sell,GOLD_COIN:sekkeh"
RATE_PROVIDER_TOMAN_SCALE="10"
```

Empty symbol in the map skips that asset. `TOMAN_SCALE=10` if the API quotes rial.

## What is wired today

`NavasanProvider` (`GET {baseUrl}/latest/?api_key=`). Documented symbols only:

| AssetType | Navasan item | Unit |
| --- | --- | --- |
| `USD` | `usd_sell` | 1 dollar |
| `EUR` | `eur` | 1 euro |
| `GOLD_COIN` | `sekkeh` | 1 سکه امامی |
| `GOLD_COIN_BAHAR` | `bahar` | 1 سکه بهار آزادی |
| `GOLD_GRAM` | `18ayar` | 1 gram of 18k gold |

Silver and crypto are out of scope — they are not fetched or faked.

## Cron

`GET`/`POST` `/api/cron/reference-rates` with `Authorization: Bearer $CRON_SECRET`
(or `REFERENCE_RATE_INGEST_SECRET`). The route always tries ingest; `RATE_PROVIDER_POLL_INTERVAL_MINUTES`
is the throttle so a tighter platform schedule still no-ops inside the window.

On Vercel, add a Cron Job for that path. Hobby plans only allow a daily schedule;
Pro can use `*/15 * * * *`. Market-hours-only filtering belongs in env/platform
config, not hardcoded in the provider.

Failed fetches log `rate_ingest_failed` (no keys). `rate_ingest_stale_alert` fires
when nothing succeeded for `RATE_ALERT_AFTER_HOURS` (default 24). The dashboard
reads `getLatestRate()`, which never throws and falls back to the last stored row.
