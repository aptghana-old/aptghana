# APT Ghana Media Migration Report

**Completed:** 2026-06-17T05:47:29.962Z  
**Duration:** 8.0s  
**Mode:** Dry Run (no changes written)  

## Totals

| Metric            | Count       |
|-------------------|-------------|
| URLs Scanned      | 13,697  |
| Attempted         | 13,697  |
| Uploaded          | 13,697  |
| Skipped           | 0  |
| MongoDB Docs Updated | 0  |
| Broken            | 0  |
| Storage Consumed  | 0.00 MB  |

## By Collection

| Collection | Scanned | Uploaded | Skipped | Broken | Docs Updated |
|------------|---------|----------|---------|--------|--------------|
| products_v2 | 13240 | 13240 | 0 | 0 | 0 |
| brands_v2 | 26 | 26 | 0 | 0 | 0 |
| categories_v2 | 415 | 415 | 0 | 0 | 0 |
| articles_v2 | 0 | 0 | 0 | 0 | 0 |
| industries | 0 | 0 | 0 | 0 | 0 |
| homepage_configs | 16 | 16 | 0 | 0 | 0 |

## Output Files

- `MIGRATION_REPORT.md` — this file
- `MIGRATION_BROKEN_ASSETS.csv` — assets that could not be downloaded
- `MIGRATION_SUMMARY.json` — machine-readable summary
- `MIGRATION_STATE.json` — resume checkpoint

## Next Steps

- No broken assets detected
- Run `tsx scripts/reindex-migrated-assets.ts --clear` to fully rebuild Meilisearch
- Verify site is serving assets from `https://assets.aptghana.com/aptghana-assets`
- Once verified, the old `migrate-assets-to-minio.ts` script can be retired