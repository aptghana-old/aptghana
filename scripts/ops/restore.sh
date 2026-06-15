#!/usr/bin/env bash
# MongoDB restore script.
#
# Usage:
#   ./restore.sh /backups/aptghana_v2-2025-01-01-120000.tar.gz
#   ./restore.sh latest   (restores the most recent backup)
#
# By default performs a DROP + restore. Pass --no-drop to skip the drop.
set -euo pipefail

DB="${MONGO_DB:-aptghana_v2}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/${DB}}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
NO_DROP="${2:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*"; exit 1; }

# ─── Resolve target ──────────────────────────────────────────────────────────
TARGET="${1:-}"

if [[ -z "${TARGET}" ]]; then
  die "Usage: $0 <backup-file.tar.gz> [--no-drop]"
fi

if [[ "${TARGET}" == "latest" ]]; then
  TARGET=$(find "${BACKUP_DIR}" -name "${DB}-*.tar.gz" -type f | sort | tail -1)
  [[ -z "${TARGET}" ]] && die "No backups found in ${BACKUP_DIR}"
  log "Latest backup: ${TARGET}"
fi

[[ -f "${TARGET}" ]] || die "File not found: ${TARGET}"

# ─── Safety check ────────────────────────────────────────────────────────────
log "You are about to restore: ${TARGET}"
log "Database: ${DB}"

if [[ "${NO_DROP}" != "--no-drop" ]]; then
  log "WARNING: This will DROP and recreate the ${DB} database."
  read -r -p "Type 'yes' to confirm: " CONFIRM
  [[ "${CONFIRM}" == "yes" ]] || die "Aborted"
fi

# ─── Extract ─────────────────────────────────────────────────────────────────
WORK_DIR=$(mktemp -d)
trap 'rm -rf "${WORK_DIR}"' EXIT

log "Extracting ${TARGET}..."
tar -xzf "${TARGET}" -C "${WORK_DIR}"

DUMP_DIR=$(find "${WORK_DIR}" -mindepth 1 -maxdepth 1 -type d | head -1)
[[ -d "${DUMP_DIR}" ]] || die "Could not find dump directory in archive"

# ─── Restore ─────────────────────────────────────────────────────────────────
DROP_ARG=""
[[ "${NO_DROP}" != "--no-drop" ]] && DROP_ARG="--drop"

log "Restoring to ${DB}..."
mongorestore \
  --uri="${MONGO_URI}" \
  --db="${DB}" \
  ${DROP_ARG} \
  --gzip \
  --quiet \
  "${DUMP_DIR}/${DB}"

log "Restore complete"

# ─── Quick sanity check ───────────────────────────────────────────────────────
PRODUCT_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('${DB}').products_v2.countDocuments()" "${MONGO_URI}" 2>/dev/null || echo "unknown")
log "Products in restored DB: ${PRODUCT_COUNT}"
