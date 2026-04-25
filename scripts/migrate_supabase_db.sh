#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   OLD_DB_PASS='xxx' NEW_DB_PASS='yyy' ./scripts/migrate_supabase_db.sh
# Optional:
#   OLD_REF='aqokzwbthhaywigdnapb' NEW_REF='ofndvijutedbjpccnmqq' ./scripts/migrate_supabase_db.sh
#   OLD_HOST='db.aqokzwbthhaywigdnapb.supabase.co' OLD_PORT='5432' OLD_DB_USER='postgres' ...
#   SCHEMAS='public,drizzle' ./scripts/migrate_supabase_db.sh
#   NEW_MIGRATE_DATABASE_URL='postgresql://postgres:pass@db.ofndvijutedbjpccnmqq.supabase.co:5432/postgres?sslmode=require' ./scripts/migrate_supabase_db.sh
#   ALLOW_INSECURE_NODE_TLS='1' ./scripts/migrate_supabase_db.sh
#   NEW_DATABASE_URL='postgresql://postgres.ofndvijutedbjpccnmqq:pass@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require' ./scripts/migrate_supabase_db.sh

OLD_REF="${OLD_REF:-aqokzwbthhaywigdnapb}"
NEW_REF="${NEW_REF:-ofndvijutedbjpccnmqq}"
DB_NAME="${DB_NAME:-postgres}"

# Defaults use Supabase transaction pooler (IPv4-compatible).
OLD_HOST="${OLD_HOST:-aws-1-ap-southeast-1.pooler.supabase.com}"
NEW_HOST="${NEW_HOST:-aws-1-ap-northeast-1.pooler.supabase.com}"
OLD_PORT="${OLD_PORT:-6543}"
NEW_PORT="${NEW_PORT:-6543}"
OLD_DB_USER="${OLD_DB_USER:-postgres.${OLD_REF}}"
NEW_DB_USER="${NEW_DB_USER:-postgres.${NEW_REF}}"
NEW_MIGRATE_DB_USER="${NEW_MIGRATE_DB_USER:-postgres}"
NEW_MIGRATE_HOST="${NEW_MIGRATE_HOST:-db.${NEW_REF}.supabase.co}"
NEW_MIGRATE_PORT="${NEW_MIGRATE_PORT:-5432}"
ALLOW_INSECURE_NODE_TLS="${ALLOW_INSECURE_NODE_TLS:-0}"

# Backward compatibility: DB_PASS can still provide both passwords.
DB_PASS="${DB_PASS:-}"
OLD_DB_PASS="${OLD_DB_PASS:-$DB_PASS}"
NEW_DB_PASS="${NEW_DB_PASS:-$DB_PASS}"
SCHEMAS="${SCHEMAS:-public}"

DUMP_FILE="${DUMP_FILE:-/tmp/mc_star_${OLD_REF}_to_${NEW_REF}_$(date +%Y%m%d_%H%M%S).dump}"

if [[ -z "$OLD_DB_PASS" || -z "$NEW_DB_PASS" ]]; then
  echo "[ERROR] Missing OLD_DB_PASS / NEW_DB_PASS."
  echo "Run: OLD_DB_PASS='old-pass' NEW_DB_PASS='new-pass' ./scripts/migrate_supabase_db.sh"
  exit 1
fi

for cmd in psql pg_dump pg_restore pnpm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Missing command: $cmd"
    exit 1
  fi
done

OLD_CONN="host=${OLD_HOST} port=${OLD_PORT} dbname=${DB_NAME} user=${OLD_DB_USER} sslmode=require"
NEW_CONN="host=${NEW_HOST} port=${NEW_PORT} dbname=${DB_NAME} user=${NEW_DB_USER} sslmode=require"
NEW_DATABASE_URL="${NEW_DATABASE_URL:-postgresql://${NEW_DB_USER}:${NEW_DB_PASS}@${NEW_HOST}:${NEW_PORT}/${DB_NAME}?pgbouncer=true&sslmode=require}"
NEW_MIGRATE_DATABASE_URL="${NEW_MIGRATE_DATABASE_URL:-postgresql://${NEW_MIGRATE_DB_USER}:${NEW_DB_PASS}@${NEW_MIGRATE_HOST}:${NEW_MIGRATE_PORT}/${DB_NAME}?sslmode=require}"

IFS=',' read -r -a SCHEMA_LIST <<< "$SCHEMAS"
SCHEMA_ARGS=()
for schema in "${SCHEMA_LIST[@]}"; do
  trimmed="$(echo "$schema" | xargs)"
  [[ -z "$trimmed" ]] && continue
  SCHEMA_ARGS+=(--schema="$trimmed")
done
if [[ "${#SCHEMA_ARGS[@]}" -eq 0 ]]; then
  echo "[ERROR] SCHEMAS is empty."
  exit 1
fi

echo "[1/7] Check old DB connectivity"
PGPASSWORD="$OLD_DB_PASS" psql "$OLD_CONN" -v ON_ERROR_STOP=1 -t -A -c "select now();" >/dev/null

echo "[2/7] Check new DB connectivity"
PGPASSWORD="$NEW_DB_PASS" psql "$NEW_CONN" -v ON_ERROR_STOP=1 -t -A -c "select now();" >/dev/null

echo "[3/7] Dump old DB -> $DUMP_FILE"
PGPASSWORD="$OLD_DB_PASS" pg_dump "$OLD_CONN" \
  --format=custom \
  --no-owner \
  --no-privileges \
  "${SCHEMA_ARGS[@]}" \
  --file="$DUMP_FILE"

echo "[4/7] Restore dump into new DB"
PGPASSWORD="$NEW_DB_PASS" pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "${SCHEMA_ARGS[@]}" \
  --dbname="$NEW_CONN" \
  "$DUMP_FILE"

echo "[5/7] Run app migrations on new DB"
if [[ "$ALLOW_INSECURE_NODE_TLS" == "1" ]]; then
  echo "[WARN] ALLOW_INSECURE_NODE_TLS=1, disabling Node TLS cert verification for drizzle migration."
  NODE_TLS_REJECT_UNAUTHORIZED=0 DATABASE_URL="$NEW_MIGRATE_DATABASE_URL" pnpm db:migrate
else
  DATABASE_URL="$NEW_MIGRATE_DATABASE_URL" pnpm db:migrate
fi

echo "[6/7] Validate key table counts"
OLD_RECEIPTS=$(PGPASSWORD="$OLD_DB_PASS" psql "$OLD_CONN" -t -A -c "select count(*) from warehouse_receipts;")
NEW_RECEIPTS=$(PGPASSWORD="$NEW_DB_PASS" psql "$NEW_CONN" -t -A -c "select count(*) from warehouse_receipts;")
OLD_ITEMS=$(PGPASSWORD="$OLD_DB_PASS" psql "$OLD_CONN" -t -A -c "select count(*) from inventory_items;")
NEW_ITEMS=$(PGPASSWORD="$NEW_DB_PASS" psql "$NEW_CONN" -t -A -c "select count(*) from inventory_items;")

echo "warehouse_receipts: old=${OLD_RECEIPTS} new=${NEW_RECEIPTS}"
echo "inventory_items:    old=${OLD_ITEMS} new=${NEW_ITEMS}"

echo "[7/7] Done"
echo "Dump file saved at: $DUMP_FILE"
