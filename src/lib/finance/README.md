# Finance helpers

Pure, integer-safe money math. Pages load snapshots; they do not invent formulas.

## Purchasing power rates

`ReferenceRate` rows are the only source of USD / gold equivalents. Conversion
(`calculatePurchasingPowerEquivalent`) is a pure function of a toman amount and
one stored row — it never fetches the network.

### Ingest a rate (MVP: manual)

```bash
curl -X POST http://localhost:3000/api/internal/reference-rates \
  -H "Authorization: Bearer $REFERENCE_RATE_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"GOLD_COIN","rateToToman":85000000,"source":"manual"}'
```

`assetType` is `USD` | `GOLD_COIN` | `GOLD_GRAM`. `rateToToman` is whole toman
per one unit of that asset.

You can also call `recordRate()` from a script or a cron.

### Extension point (do not scrape)

`fetchProviderRate()` in `referenceRates.ts` is the plug-in for a documented
REST/API provider. Leave it returning `null` until a provider is chosen.

A future job should:

1. `const payload = await fetchProviderRate(assetType)`
2. if present, `await recordRate({ assetType, ...payload })`

Calculation code must not change when the ingest source changes. Each UI number
is traced to a specific `ReferenceRate.id` and `effectiveAt`.
