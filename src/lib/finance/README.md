# Finance helpers

Pure, integer-safe money math. Pages load snapshots; they do not invent formulas.

## Purchasing power rates

`ReferenceRate` rows are the only source of USD / euro / gold / silver equivalents.
Conversion (`calculatePurchasingPowerEquivalent`) is a pure function of a toman
amount and one stored row — it never fetches the network.

### Live ingest (preferred)

A documented REST provider writes rows through `ingestLiveRates()` → `recordRate()`.
Calculation code does not change when the vendor changes.

Configure in `.env` (never `NEXT_PUBLIC_…`, never commit keys):

```env
RATE_PROVIDER_NAME="navasan"
RATE_PROVIDER_API_KEY=""
RATE_PROVIDER_BASE_URL="https://api.navasan.tech"
RATE_PROVIDER_POLL_INTERVAL_MINUTES="120"
# Optional. Overlay Navasan symbols. Empty value skips that asset.
# RATE_PROVIDER_ITEM_MAP="USD:usd_sell,EUR:eur,GOLD_COIN:sekkeh,GOLD_COIN_BAHAR:bahar,GOLD_GRAM:18ayar,SILVER:silver"
# Optional. Divide the provider quote to get toman (`1` = already toman, `10` = rial).
# RATE_PROVIDER_TOMAN_SCALE="1"
```

Cron (Bearer `CRON_SECRET` or `REFERENCE_RATE_INGEST_SECRET`):

```bash
curl -X GET http://localhost:3000/api/cron/reference-rates \
  -H "Authorization: Bearer $CRON_SECRET"
```

If the provider is down, the last stored positive rate stays in place.

The first wired adapter is Navasan (`GET /latest/?api_key=`). Add another vendor
as a new `RateProvider` class plus one `case` in `createRateProvider` — do not
touch available-money / purchasing-power math.

### Manual ingest (fallback)

```bash
curl -X POST http://localhost:3000/api/internal/reference-rates \
  -H "Authorization: Bearer $REFERENCE_RATE_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"GOLD_COIN","rateToToman":85000000,"source":"manual"}'
```

`assetType` is `USD` | `EUR` | `GOLD_COIN` | `GOLD_COIN_BAHAR` | `GOLD_GRAM` |
`SILVER`. `rateToToman` is whole toman per one unit of that asset.

You can also call `recordRate()` from a script.

### Provider contract

`src/lib/finance/rateProviders/` — `fetchRates()` returns `RawRate[]`
(`assetType`, `priceInToman` number, `fetchedAt`). Ingest rounds to a positive
integer toman and stores a `ReferenceRate` row. HTML scraping and LLMs are
disallowed.
