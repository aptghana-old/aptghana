#!/usr/bin/env bash
# Deploy or update the APT Ghana self-hosted infrastructure on the VPS.
# Run from the infrastructure/ directory after copying files to the VPS.
#
# Usage:
#   ./scripts/ops/deploy.sh [--update]  (--update = pull new images + restart, no data loss)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/../../infrastructure"
UPDATE_MODE="${1:-}"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
die()  { log "ERROR: $*"; exit 1; }
step() { echo ""; log "▶ $*"; }

# ─── Pre-flight ───────────────────────────────────────────────────────────────
[[ -f "${INFRA_DIR}/docker-compose.prod.yml" ]] || die "Run from repo root: infrastructure/docker-compose.prod.yml not found"
[[ -f "${INFRA_DIR}/.env.docker" ]] || die ".env.docker not found in infrastructure/ — copy from .env.docker.example"

cd "${INFRA_DIR}"

# ─── Swap (run once — 2GB swap gives headroom on 4GB RAM VPS) ────────────────
if [[ "${UPDATE_MODE}" != "--update" ]] && ! swapon --show | grep -q /swapfile 2>/dev/null; then
  if [[ ! -f /swapfile ]]; then
    step "Creating 2GB swapfile (one-time setup)..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
    log "  Swapfile created and activated"
  fi
fi

# ─── Update mode (rolling restart, no downtime) ───────────────────────────────
if [[ "${UPDATE_MODE}" == "--update" ]]; then
  step "Pulling latest images..."
  docker compose -f docker-compose.prod.yml pull --quiet

  step "Restarting services (zero-downtime rolling restart)..."
  # Restart services one at a time to minimise downtime
  for svc in meilisearch minio traefik; do
    log "  Restarting ${svc}..."
    docker compose -f docker-compose.prod.yml up -d --no-deps "${svc}"
    sleep 3
  done

  step "Running MinIO init (idempotent)..."
  docker compose -f docker-compose.prod.yml up --no-deps minio-init

  log "Update complete"
  exit 0
fi

# ─── Fresh deploy ─────────────────────────────────────────────────────────────
step "Verifying environment..."
source .env.docker
[[ -n "${MONGO_ROOT_PASSWORD:-}" ]] || die "MONGO_ROOT_PASSWORD not set in .env.docker"
[[ -n "${MEILISEARCH_MASTER_KEY:-}" ]] || die "MEILISEARCH_MASTER_KEY not set"
[[ -n "${MINIO_ROOT_PASSWORD:-}" ]] || die "MINIO_ROOT_PASSWORD not set"
[[ -n "${ACME_EMAIL:-}" ]] || die "ACME_EMAIL not set"

step "Creating Docker networks..."
docker network create aptghana-proxy    2>/dev/null || log "  aptghana-proxy already exists"
docker network create aptghana-internal 2>/dev/null || log "  aptghana-internal already exists"

step "Pulling images..."
docker compose -f docker-compose.prod.yml pull --quiet

step "Starting infrastructure (detached)..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

step "Waiting for MongoDB to be healthy (up to 60s)..."
for i in $(seq 1 20); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' aptghana-mongodb 2>/dev/null || echo "starting")
  [[ "${STATUS}" == "healthy" ]] && break
  log "  MongoDB status: ${STATUS} (attempt ${i}/20)"
  sleep 3
done

step "Waiting for MinIO to be healthy..."
for i in $(seq 1 20); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' aptghana-minio 2>/dev/null || echo "starting")
  [[ "${STATUS}" == "healthy" ]] && break
  sleep 3
done

step "Running MinIO bucket initialization..."
docker compose -f docker-compose.prod.yml up minio-init

step "Verifying deployment..."
docker compose -f docker-compose.prod.yml ps

log ""
log "═══════════════════════════════════════════════════"
log "Deployment complete. Next steps:"
log ""
log "1. Update Vercel environment variables:"
log "   MONGODB_URI = mongodb://aptghana_app:PASS@YOUR_VPS_IP:27017/aptghana_v2?authSource=aptghana_v2"
log "   MEILISEARCH_HOST = https://search.${DOMAIN:-aptghana.com}"
log "   STORAGE_ENDPOINT = https://assets.${DOMAIN:-aptghana.com}"
log "   STORAGE_PUBLIC_URL = https://assets.${DOMAIN:-aptghana.com}/aptghana-assets"
log ""
log "2. Run migration scripts:"
log "   tsx scripts/migrate-atlas-to-selfhosted.ts"
log "   tsx scripts/migrate-assets-to-minio.ts"
log "   tsx scripts/reindex-meilisearch.ts"
log ""
log "3. Validate: tsx scripts/validate-migration.ts"
log "═══════════════════════════════════════════════════"
