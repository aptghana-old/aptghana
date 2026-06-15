#!/usr/bin/env bash
# Runs inside the mongodb-backup container via cron at 02:00 UTC daily.
set -euo pipefail

DB="${MONGO_DB:-aptghana_v2}"
BACKUP_DIR="/backups"
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_NAME="${DB}-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

mongodump \
  --uri="${MONGO_URI}" \
  --db="${DB}" \
  --out="${BACKUP_PATH}" \
  --gzip \
  --quiet

tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_PATH}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup: ${BACKUP_NAME}.tar.gz"

find "${BACKUP_DIR}" -name "${DB}-*.tar.gz" -type f -mtime "+${RETENTION}" -delete
