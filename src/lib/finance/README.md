# Finance helpers

Pure, integer-safe money math. Pages load snapshots; they do not invent formulas.

Toman amounts are `bigint`. Physical quantities (grams, coins, FX units) use
`Decimal(18, 6)` on the account row and `QUANTITY_SCALE` in `quantity.ts`.
An `ASSET_HOLDING` account never stores a cached toman balance — value is
`quantity × getLatestRate(assetType)` via `calculateAssetHoldingValue()`.

## Purchasing power rates

`ReferenceRate` rows are the only source of USD / euro / gold equivalents.
Conversion (`calculatePurchasingPowerEquivalent`) is a pure function of a toman
amount and one stored row — it never fetches the network.

`getLatestRate(assetType)` always resolves to a snapshot or `null` (never throws).
`getRateHistory(assetType, from, to)` returns the append-only rows for charts.

### Live ingest (preferred)

A documented REST provider writes rows through `ingestLiveRates()` → `recordRate()`.
Calculation code does not change when the vendor changes.

See `src/lib/finance/rateProviders/README.md` for how to swap adapters.

Configure in `.env` (never `NEXT_PUBLIC_…`, never commit keys):

```env
RATE_PROVIDER_NAME="navasan"
RATE_PROVIDER_API_KEY=""
RATE_PROVIDER_BASE_URL="https://api.navasan.tech"
RATE_PROVIDER_POLL_INTERVAL_MINUTES="30"
RATE_STALE_AFTER_HOURS="6"
RATE_ALERT_AFTER_HOURS="24"
```

Cron (Bearer `CRON_SECRET` or `REFERENCE_RATE_INGEST_SECRET`):

```bash
curl -X GET http://localhost:3000/api/cron/reference-rates \
  -H "Authorization: Bearer $CRON_SECRET"
```

On Vercel, schedule that path in Cron Jobs. The **platform** cadence (e.g. every
15 minutes on Pro, daily on Hobby) is separate from `RATE_PROVIDER_POLL_INTERVAL_MINUTES`,
which throttles actual provider calls. Do not hardcode market hours in code.

If the provider is down, the last stored positive rate stays in place. The UI
marks it stale after `RATE_STALE_AFTER_HOURS`. Structured logs
(`rate_ingest_failed`, `rate_ingest_stale_alert`) are enough to alert if nothing
succeeds for `RATE_ALERT_AFTER_HOURS`.

The first wired adapter is Navasan (`GET /latest/?api_key=`). Silver is not a
published Navasan symbol and is not stored.

### Manual ingest (fallback)

```bash
curl -X POST http://localhost:3000/api/internal/reference-rates \
  -H "Authorization: Bearer $REFERENCE_RATE_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"GOLD_COIN","rateToToman":85000000,"source":"manual"}'
```

`assetType` is `USD` | `EUR` | `GOLD_COIN` | `GOLD_COIN_BAHAR` | `GOLD_GRAM`.
`rateToToman` is whole toman per one unit of that asset.

You can also call `recordRate()` from a script.

### Provider contract

`src/lib/finance/rateProviders/` — `fetchRates()` returns `RawRate[]`
(`assetType`, `priceInToman` number, `fetchedAt`). Ingest rounds to a positive
integer toman and **appends** a `ReferenceRate` row. HTML scraping and LLMs are
disallowed.

## Asset holdings

`src/lib/finance/assetHoldings.ts` derives toman value and net worth. Available
money still uses `sumLiquidBalance` / `calculateAvailableMoney` — holdings are
opted out via `includeInAvailable` (default false). Savings rate accepts
`extraSavings` for `ASSET_ADD` snapshot toman. Goal progress uses live derived
value when a goal is funded by holding accounts.
