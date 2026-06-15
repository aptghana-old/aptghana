#!/bin/sh
# Runs inside the mongodb-backup container. Waits until 02:00 UTC, runs backup, sleeps 24h.
echo "[scheduler] Backup scheduler started (daily at 02:00 UTC)"

while true; do
  HOUR=$(date -u +%H)
  MIN=$(date -u +%M)
  if [ "$HOUR" = "02" ] && [ "$MIN" = "00" ]; then
    echo "[scheduler] Running backup at $(date -u)"
    /backup.sh >> /var/log/backup.log 2>&1
    sleep 61
  else
    sleep 55
  fi
done
