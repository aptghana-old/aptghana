#!/usr/bin/env bash
# System health check for the APT Ghana self-hosted infrastructure.
# Run this on the VPS or via SSH to verify all services are healthy.
set -euo pipefail

DOMAIN="${DOMAIN:-aptghana.com}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/aptghana_v2}"
MEILI_HOST="${MEILISEARCH_HOST:-https://search.${DOMAIN}}"
MINIO_ENDPOINT="${STORAGE_ENDPOINT:-https://assets.${DOMAIN}}"

PASS=0
WARN=0
FAIL=0

pass()  { echo "  ✓ $*"; ((PASS++)) || true; }
warn()  { echo "  ⚠ $*"; ((WARN++)) || true; }
fail()  { echo "  ✗ $*"; ((FAIL++)) || true; }
header(){ echo ""; echo "── $* ──────────────────────────────────────────"; }

# ─── Docker containers ───────────────────────────────────────────────────────
header "Docker Containers"

for svc in aptghana-mongodb aptghana-meilisearch aptghana-minio aptghana-traefik; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${svc}" 2>/dev/null || echo "not-found")
  case "${STATUS}" in
    healthy)    pass "${svc}: healthy" ;;
    unhealthy)  fail "${svc}: UNHEALTHY" ;;
    starting)   warn "${svc}: starting" ;;
    *)          fail "${svc}: not running (${STATUS})" ;;
  esac
done

# ─── MongoDB ─────────────────────────────────────────────────────────────────
header "MongoDB"

if mongosh --quiet --eval "db.adminCommand('ping').ok" "${MONGO_URI}" 2>/dev/null | grep -q "1"; then
  pass "Connection OK"
  COUNT=$(mongosh --quiet --eval "db.getSiblingDB('aptghana_v2').products_v2.countDocuments()" "${MONGO_URI}" 2>/dev/null || echo "?")
  pass "Products in DB: ${COUNT}"
else
  fail "Cannot connect to MongoDB"
fi

# ─── Meilisearch ─────────────────────────────────────────────────────────────
header "Meilisearch"

MEILI_STATUS=$(curl -sf "${MEILI_HOST}/health" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unreachable")

if [[ "${MEILI_STATUS}" == "available" ]]; then
  pass "Health: available"
else
  fail "Health: ${MEILI_STATUS}"
fi

MEILI_STATS=$(curl -sf -H "Authorization: Bearer ${MEILISEARCH_API_KEY:-}" "${MEILI_HOST}/stats" 2>/dev/null || echo "{}")
PROD_COUNT=$(echo "${MEILI_STATS}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('indexes',{}).get('products',{}).get('numberOfDocuments',0))" 2>/dev/null || echo "?")
pass "Products indexed: ${PROD_COUNT}"

# ─── MinIO ────────────────────────────────────────────────────────────────────
header "MinIO Object Storage"

MINIO_HEALTH=$(curl -sf "${MINIO_ENDPOINT}/minio/health/live" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")

if [[ "${MINIO_HEALTH}" == "200" ]]; then
  pass "Health: live"
else
  fail "Health check returned HTTP ${MINIO_HEALTH}"
fi

# ─── SSL Certificates ────────────────────────────────────────────────────────
header "SSL Certificates"

for host in "search.${DOMAIN}" "assets.${DOMAIN}"; do
  EXPIRY=$(echo | openssl s_client -servername "${host}" -connect "${host}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
  if [[ -z "${EXPIRY}" ]]; then
    warn "${host}: cannot check cert"
  else
    EXPIRY_EPOCH=$(date -d "${EXPIRY}" +%s 2>/dev/null || date -j -f "%b %e %T %Y %Z" "${EXPIRY}" +%s 2>/dev/null || echo "0")
    DAYS_LEFT=$(( (EXPIRY_EPOCH - $(date +%s)) / 86400 ))
    if (( DAYS_LEFT > 14 )); then
      pass "${host}: cert valid ${DAYS_LEFT} days"
    elif (( DAYS_LEFT > 0 )); then
      warn "${host}: cert expires in ${DAYS_LEFT} days"
    else
      fail "${host}: cert EXPIRED"
    fi
  fi
done

# ─── Disk usage ──────────────────────────────────────────────────────────────
header "Disk Usage"

VOLUMES=$(docker system df -v 2>/dev/null | grep "aptghana" || echo "")
if [[ -n "${VOLUMES}" ]]; then
  echo "${VOLUMES}" | while read -r line; do
    echo "  ${line}"
  done
fi

DF_OUTPUT=$(df -h / 2>/dev/null | tail -1)
USED_PCT=$(echo "${DF_OUTPUT}" | awk '{print $5}' | tr -d '%')
if (( USED_PCT < 75 )); then
  pass "Root disk: ${USED_PCT}% used"
elif (( USED_PCT < 90 )); then
  warn "Root disk: ${USED_PCT}% used — consider cleanup"
else
  fail "Root disk: ${USED_PCT}% used — CRITICAL"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Health check: ${PASS} passed, ${WARN} warnings, ${FAIL} failed"
echo "════════════════════════════════════════════════════════════"

(( FAIL > 0 )) && exit 1
exit 0
