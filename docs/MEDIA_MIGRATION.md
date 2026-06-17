# APT Ghana Media Asset Migration

Migrates all legacy media URLs stored in MongoDB to the VPS-hosted MinIO
object storage (`assets.aptghana.com`).

---

## Overview

Legacy content in the APT Ghana database contains image and document URLs
pointing to the old web server (`/uploads/…` or `https://aptghana.com/uploads/…`).
The migration scripts download each asset, upload it to MinIO under a
deterministic key, and replace the old URL in MongoDB.

After migration, all media is served from:
```
https://assets.aptghana.com/aptghana-assets/<folder>/<hash>-<filename>
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/migrate-media-assets.ts` | Download + upload assets, update MongoDB |
| `scripts/reindex-migrated-assets.ts` | Rebuild Meilisearch indexes after migration |

---

## Environment Variables

All variables must be available when running the scripts.  Copy your
production `.env` or export them directly.

```bash
# MongoDB
MONGODB_URI=mongodb://user:pass@167.233.36.110:27017/aptghana_v2?authSource=aptghana_v2

# MinIO / Storage
STORAGE_ENDPOINT=https://assets.aptghana.com
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_BUCKET=aptghana-assets
STORAGE_PUBLIC_URL=https://assets.aptghana.com/aptghana-assets

# Meilisearch (only needed for --reindex / reindex script)
MEILISEARCH_HOST=https://search.aptghana.com
MEILISEARCH_ADMIN_KEY=...
```

---

## Migration Script

### Basic usage

```bash
# Dry run — see what would be migrated without making any changes
tsx scripts/migrate-media-assets.ts --dry-run

# Full migration (recommended: start with dry run first)
tsx scripts/migrate-media-assets.ts

# Full migration + sync Meilisearch when done
tsx scripts/migrate-media-assets.ts --reindex
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--dry-run` | off | Print what would happen; no downloads, no DB writes |
| `--resume` | off | Load `MIGRATION_STATE.json` and skip already-processed URLs |
| `--reindex` | off | Sync updated documents to Meilisearch after migration |
| `--concurrency=N` | `5` | Number of parallel downloads |
| `--skip-products` | off | Skip `products_v2` collection |
| `--skip-brands` | off | Skip `brands_v2` collection |
| `--skip-categories` | off | Skip `categories_v2` collection |
| `--skip-articles` | off | Skip `articles_v2` collection |
| `--skip-industries` | off | Skip `industries` collection |
| `--skip-homepage` | off | Skip `homepage_configs` collection |
| `--skip-html-scan` | off | Skip scanning article HTML content for embedded images |

### Collections and fields scanned

**products_v2**
- `images.main.url`
- `images.gallery[].url`
- `videos[].url` (file-hosted; YouTube/Vimeo are skipped automatically)
- `videos[].thumbnail`
- `documents[].url`
- `seo.ogImage`

**brands_v2**
- `logo.url`
- `coverImage.url`
- `seo.ogImage`

**categories_v2**
- `image.url`
- `documents[].url`

**articles_v2**
- `featuredImage.url`
- `gallery[].url`
- `videos[].url` (file-hosted only)
- `attachments[].url`
- `seo.ogImage`
- `content` — all `<img src="…">` URLs embedded in the sanitized HTML

**industries**
- `image.url`

**homepage_configs**
- `carousel.slides[].desktopImage`
- `carousel.slides[].mobileImage`
- `carousel.sidePanels[].image`
- `sections[type=promo_banners].config.banners[].image`
- `sections[type=full_width_banner].config.desktopImage`
- `sections[type=full_width_banner].config.mobileImage`

### URL normalization

URLs are normalized before processing:

| Input | Normalized to |
|-------|---------------|
| `/uploads/product.jpg` | `https://aptghana.com/uploads/product.jpg` |
| `//cdn.example.com/img.png` | `https://cdn.example.com/img.png` |
| `https://…` | unchanged |
| `data:image/…` | skipped |
| YouTube / Vimeo URL | skipped |

### Skipped assets

The following are silently skipped (no broken-asset entry):
- URLs already on MinIO (`https://assets.aptghana.com/aptghana-assets/…`)
- `data:` URIs
- Streaming platforms: YouTube, Vimeo, Dailymotion, Wistia, Loom, Twitch,
  Brightcove, JWPlayer, Vidyard, Kaltura, Facebook

### Idempotency and resume

The script is safe to run multiple times:

1. **MinIO HEAD check** — before downloading, the script checks whether an
   asset with the deterministic key already exists in MinIO.  If it does, the
   existing URL is used and no download happens.

2. **Resume mode** — `--resume` loads `MIGRATION_STATE.json` written by a
   previous run, skipping URLs already in the state map without making MinIO
   HEAD requests (faster for large datasets).

3. **Completed collections** — in resume mode, entire collections that finished
   in a previous run are skipped automatically.

### Storage key format

```
<folder>/<sha256-12-chars>-<sanitized-filename>.<ext>

Examples:
  products/my-product-slug/a1b2c3d4e5f6-main-image.jpg
  datasheets/7c8d9e0f1a2b-product-datasheet-en.pdf
  homepage/carousel/3f4a5b6c7d8e-hero-desktop.webp
```

The 12-character SHA-256 prefix is derived from the original (normalized) URL,
ensuring the same source URL always maps to the same MinIO key.

### Retry logic

Downloads are retried up to 3 times with exponential backoff (1 s, 2 s):
- **Retried**: 5xx server errors, network timeouts, DNS failures, SSL errors
- **Not retried**: 404, 403, 410 — logged to `MIGRATION_BROKEN_ASSETS.csv`

---

## Reindex Script

After migration, Meilisearch must be updated because it caches image and logo
URLs in denormalized search records.

### Basic usage

```bash
# Reindex only collections that were updated during migration
tsx scripts/reindex-migrated-assets.ts --after-migration

# Full rebuild of all indexes
tsx scripts/reindex-migrated-assets.ts --clear

# Rebuild a single index
tsx scripts/reindex-migrated-assets.ts --index=products --clear
```

### Flags

| Flag | Description |
|------|-------------|
| `--index=NAME` | Reindex one index: `products`, `brands`, `categories`, `articles`, or `all` |
| `--clear` | Delete all documents before reindexing (clean rebuild) |
| `--after-migration` | Read `MIGRATION_STATE.json` and reindex only affected collections |
| `--batch-size=N` | Documents per Meilisearch batch (default: 250) |

### Indexes managed

| Index | Fields indexed |
|-------|----------------|
| `products` | name, mpn, sku, shortDescription, brandName, tags, specs, imageUrl, price |
| `brands` | name, slug, shortDescription, logoUrl, country |
| `categories` | name, slug, description, imageUrl, level |
| `articles` | title, excerpt, category, tags, authorName, featuredImageUrl, publishDate |

---

## Output Files

All output files are written to the project root directory.

| File | Contents |
|------|----------|
| `MIGRATION_REPORT.md` | Human-readable summary with per-collection breakdown |
| `MIGRATION_BROKEN_ASSETS.csv` | Assets that could not be downloaded (Collection, DocumentId, Field, OriginalUrl, Error) |
| `MIGRATION_SUMMARY.json` | Machine-readable totals and per-collection stats |
| `MIGRATION_STATE.json` | Resume checkpoint; maps original URL → new MinIO URL |

---

## Recommended Migration Sequence

```bash
# 1. Verify environment variables are set
echo $MONGODB_URI && echo $STORAGE_PUBLIC_URL && echo $MEILISEARCH_HOST

# 2. Dry run to estimate scope
tsx scripts/migrate-media-assets.ts --dry-run

# 3. Run migration (set concurrency to suit your network)
tsx scripts/migrate-media-assets.ts --concurrency=8

# 4. Review broken assets
cat MIGRATION_BROKEN_ASSETS.csv

# 5. Rebuild Meilisearch
tsx scripts/reindex-migrated-assets.ts --after-migration

# 6. (Optional) Force full Meilisearch rebuild if any discrepancies
tsx scripts/reindex-migrated-assets.ts --clear

# 7. If interrupted, resume safely
tsx scripts/migrate-media-assets.ts --resume --concurrency=8
```

---

## Safety notes

- MongoDB is **never updated until the MinIO upload succeeds**.
- Running the migration twice is safe — already-migrated assets are detected
  and skipped.
- The `--dry-run` flag produces zero side effects.
- Broken assets are logged but never block the rest of the migration.
- Streaming embeds (YouTube, Vimeo, etc.) are silently skipped — their URLs
  remain unchanged in MongoDB.
