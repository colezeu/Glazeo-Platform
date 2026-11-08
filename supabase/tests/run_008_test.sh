#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# GLAZEO — Regression 008 (decision_records)
# LOCAL ONLY — cluster efemer, aruncat la final. NEVER against Supabase.
#
# Verifică:
#   P1. Suita SQL 008 (RED pre-migrare → GREEN post-migrare)
#   P2. Preflight-ul fail-closed: tabelă existentă FĂRĂ marcaj → migrarea ABANDONEAZĂ
#   P3. Idempotență: re-aplicare fără erori (inclusă în suită)
#
# Utilizare:  bash supabase/tests/run_008_test.sh
# ══════════════════════════════════════════════════════════════════════
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
PORT=${GLAZEO_TEST_PORT:-55452}
CLUSTER="${TMPDIR:-/tmp}/glazeo-008-cluster"
DB=glazeo_008_test
DB_NEG=glazeo_008_negative
LOG="${TMPDIR:-/tmp}/glazeo-008-suite.log"

FAIL=0

cleanup() {
  pg_ctl -D "$CLUSTER" -m immediate stop >/dev/null 2>&1
  rm -rf "$CLUSTER"
  if [ "${KEEP_LOGS:-0}" != "1" ]; then rm -f "$LOG"; fi
}
trap cleanup EXIT

echo "== Setup: cluster efemer (port $PORT) =="
rm -rf "$CLUSTER"
initdb -D "$CLUSTER" -A trust >/dev/null 2>&1 || { echo "FATAL: initdb"; exit 1; }
pg_ctl -D "$CLUSTER" -o "-p $PORT -k ${TMPDIR:-/tmp} -c listen_addresses=''" -l "$CLUSTER/server.log" start >/dev/null 2>&1 || {
  echo "FATAL: pg_ctl start"; cat "$CLUSTER/server.log"; exit 1;
}

PSQL="psql -h ${TMPDIR:-/tmp} -p $PORT -v ON_ERROR_STOP=1 -q"

for i in 1 2 3 4 5 6 7 8 9 10; do
  $PSQL -d postgres -c 'select 1' >/dev/null 2>&1 && break
  sleep 0.3
done

echo "== P1: suita SQL 008 (RED → migrare → GREEN) =="
$PSQL -d postgres -c "drop database if exists $DB" >/dev/null 2>&1
$PSQL -d postgres -c "create database $DB" >/dev/null 2>&1
if $PSQL -d "$DB" -c "set glazeo_test.allowed='yes'" -f "$HERE/008_decision_records_security.sql" > "$LOG" 2>&1; then
  echo "   PASS — suita s-a încheiat fără erori"
  grep -c "PASS" "$LOG" | xargs -I{} echo "   verificări PASS: {}"
else
  echo "   FAIL — vezi $LOG"
  tail -25 "$LOG"
  FAIL=1
fi
grep -q "SQL SECURITY TESTS 008: ALL PASS" "$LOG" || { echo "   FAIL — suita nu a raportat ALL PASS"; FAIL=1; }

echo "== P2: preflight fail-closed (tabelă fără marcaj) =="
$PSQL -d postgres -c "drop database if exists $DB_NEG" >/dev/null 2>&1
$PSQL -d postgres -c "create database $DB_NEG" >/dev/null 2>&1
$PSQL -d "$DB_NEG" <<'SQL' >/dev/null 2>&1
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create table public.decision_records (id text primary key);
SQL
if $PSQL -d "$DB_NEG" -f "$HERE/../migrations/008_decision_records.sql" > "$CLUSTER/neg.log" 2>&1; then
  echo "   FAIL — migrarea a trecut peste o tabelă fără marcaj"
  FAIL=1
else
  if grep -q "PREFLIGHT 008" "$CLUSTER/neg.log"; then
    echo "   PASS — abandonat cu PREFLIGHT 008"
  else
    echo "   FAIL — a eșuat, dar nu din preflight:"; tail -5 "$CLUSTER/neg.log"; FAIL=1
  fi
fi

echo
if [ "$FAIL" = "0" ]; then
  echo "REZULTAT: 008 TESTS — ALL PASS"
  exit 0
else
  echo "REZULTAT: 008 TESTS — FAIL"
  exit 1
fi
