#!/usr/bin/env bash
# MongoDB backup script — runs inside the mongodb-backup container via cron,
# or directly on the VPS with mongodump in PATH.
#
# Produces: /backups/aptghana_v2-YYYY-MM-DD-HHMMSS.tar.gz
# Retains:  BACKUP_RETENTION_DAYS (default 30)
set -euo pipefail

DB="${MONGO_DB:-aptghana_v2}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/${DB}}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_NAME="${DB}-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ─── Pre-flight ───────────────────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"
log "Starting backup: ${BACKUP_NAME}"

# ─── Dump ────────────────────────────────────────────────────────────────────
mongodump \
  --uri="${MONGO_URI}" \
  --db="${DB}" \
  --out="${BACKUP_PATH}" \
  --gzip \
  --quiet

# ─── Archive ─────────────────────────────────────────────────────────────────
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_PATH}"

SIZE=$(du -sh "${BACKUP_PATH}.tar.gz" | cut -f1)
log "Backup complete: ${BACKUP_NAME}.tar.gz (${SIZE})"

# ─── Prune old backups ────────────────────────────────────────────────────────
log "Removing backups older than ${RETENTION} days..."
find "${BACKUP_DIR}" \
  -name "${DB}-*.tar.gz" \
  -type f \
  -mtime "+${RETENTION}" \
  -delete \
  -print | while read -r f; do log "Deleted: $f"; done

REMAINING=$(find "${BACKUP_DIR}" -name "${DB}-*.tar.gz" | wc -l | tr -d ' ')
log "Retained ${REMAINING} backups"

# ─── List current backups ────────────────────────────────────────────────────
echo ""
echo "Current backups:"
ls -lh "${BACKUP_DIR}"/${DB}-*.tar.gz 2>/dev/null || echo "(none)"
