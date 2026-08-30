#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# GLAZEO — Concurrency regression for rpc_initialize_account (advisory lock)
# LOCAL ONLY — dedicated scratch database. NEVER against Supabase.
#
# Verifică:
#   P1. Contenție REALĂ pe cheia advisory (A ține cheia manual, B blochează)
#   P2. Două tranzacții/sesiuni GENUIN suprapuse (două RPC reale, același user)
#   P3. Chei de lock DIFERITE per user + ambele ținute simultan (fără serializare)
#
# Rulează întâi suita SQL de securitate (006_default_experience_security.sql)
# ca setup — oferă și rezultatul suitei în același run.
#
# Utilizare:  bash supabase/tests/run_concurrency_test.sh
# ══════════════════════════════════════════════════════════════════════
set -u
DB=glazeo_routing_conc_test_20260830
HERE="$(cd "$(dirname "$0")" && pwd)"

U1=10000000-0000-0000-0000-000000000011
U2=10000000-0000-0000-0000-000000000012
U3=10000000-0000-0000-0000-000000000013
U4=10000000-0000-0000-0000-000000000014

FAIL=0; PASS=0
note() { printf '%-72s' "$1"; }
ok()   { echo "PASS"; PASS=$((PASS+1)); }
ko()   { echo "FAIL"; FAIL=$((FAIL+1)); }
chk()  { if [ "$1" = "0" ]; then ok; else ko; echo "       $2"; fi; }
count() { psql -d "$DB" -tA -c "$1" 2>/dev/null | tr -d ' '; }

cleanup() { dropdb --if-exists "$DB" >/dev/null 2>&1; }
trap cleanup EXIT

echo "== Setup: scratch DB $DB =="
dropdb --if-exists "$DB" >/dev/null 2>&1
createdb "$DB" || { echo "FATAL: createdb failed"; exit 1; }
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "set glazeo_test.allowed='yes'" -f "$HERE/006_default_experience_security.sql" > /tmp/conc_sql_suite.log 2>&1
chk $? "SQL security suite failed — vezi /tmp/conc_sql_suite.log"
grep -q "SQL SECURITY TESTS: ALL PASS" /tmp/conc_sql_suite.log && ok || { ko "SQL suite nu raportează ALL PASS"; }
psql -q -d "$DB" -c "insert into auth.users (id) values ('$U1'),('$U2'),('$U3'),('$U4');" || { echo "FATAL: insert users"; exit 1; }

echo "== P1: same-user lock contention (A ține cheia exactă, B blochează) =="
psql -d "$DB" -q -c "begin; select pg_advisory_xact_lock(hashtextextended('$U1',0)); select pg_sleep(2); commit;" &
PID_A=$!
sleep 0.4
( psql -d "$DB" -v ON_ERROR_STOP=1 -c "set glazeo_test.uid='$U1'; set glazeo_test.jwt='{\"email\":\"conc1@glass.associates\"}'; select rpc_initialize_account('$U1'::uuid,'client@evil.com','Conc1');" > /tmp/conc_b.log 2>&1; echo "B_EXIT=$?" >> /tmp/conc_b.log ) &
PID_B=$!
sleep 0.9   # B trebuie să fie BLOCAT pe advisory; A încă doarme (2s)
G=$(count "select count(*) from pg_locks where locktype='advisory' and granted;")
W=$(count "select count(*) from pg_locks where locktype='advisory' and not granted;")
note "P1a. la t≈1.3s: advisory granted=$G, waiting=$W"
if [ "$G" -ge 1 ] && [ "$W" -ge 1 ]; then ok; else ko "așteptat ≥1 granted și ≥1 waiting (contenție reală pe cheie)"; fi
wait $PID_A
wait $PID_B
B_EXIT=$(grep -o "B_EXIT=.*" /tmp/conc_b.log | tail -1 | cut -d= -f2)
note "P1b. RPC-ul lui B (blocat apoi executat) reușește"
[ "${B_EXIT:-1}" = "0" ] && ok || { ko "B_EXIT=$B_EXIT"; cat /tmp/conc_b.log; }
grep -q "decision_maker" /tmp/conc_b.log
note "P1c. B returnează decision_maker"
chk $? "rezultat lipsă în /tmp/conc_b.log"
note "P1d. U1: 1 profil / 1 membru / 1 org / 1 proiect demo"
if [ "$(count "select count(*) from public.profiles where user_id='$U1'")" = "1" ] \
   && [ "$(count "select count(*) from public.organization_members where user_id='$U1'")" = "1" ] \
   && [ "$(count "select count(*) from public.organizations where name like 'conc1%'")" = "1" ] \
   && [ "$(count "select count(*) from public.projects p join public.organizations o on o.id=p.organization_id where o.name like 'conc1%'")" = "1" ]; then
  ok
else
  ko "profile=$(count "select count(*) from public.profiles where user_id='$U1'") membri=$(count "select count(*) from public.organization_members where user_id='$U1'") org=$(count "select count(*) from public.organizations where name like 'conc1%'") proiecte=$(count "select count(*) from public.projects p join public.organizations o on o.id=p.organization_id where o.name like 'conc1%'")"
fi

echo "== P2: two GENUINELY overlapping RPC sessions, same new user (U2) =="
( psql -d "$DB" -v ON_ERROR_STOP=1 -c "begin; set glazeo_test.uid='$U2'; set glazeo_test.jwt='{\"email\":\"conc2@glass.associates\"}'; select pg_sleep(0.8); select rpc_initialize_account('$U2'::uuid,'client@evil.com','Conc2'); commit;" > /tmp/conc_2a.log 2>&1; echo "A_EXIT=$?" >> /tmp/conc_2a.log ) &
( psql -d "$DB" -v ON_ERROR_STOP=1 -c "begin; set glazeo_test.uid='$U2'; set glazeo_test.jwt='{\"email\":\"conc2@glass.associates\"}'; select pg_sleep(0.8); select rpc_initialize_account('$U2'::uuid,'client@evil.com','Conc2'); commit;" > /tmp/conc_2b.log 2>&1; echo "B_EXIT=$?" >> /tmp/conc_2b.log ) &
wait
A2=$(grep -o "A_EXIT=.*" /tmp/conc_2a.log | cut -d= -f2)
B2=$(grep -o "B_EXIT=.*" /tmp/conc_2b.log | cut -d= -f2)
note "P2a. ambele sesiuni reușesc (fără deadlock/timeout)"
if [ "${A2:-1}" = "0" ] && [ "${B2:-1}" = "0" ]; then ok; else ko "A=$A2 B=$B2"; cat /tmp/conc_2a.log /tmp/conc_2b.log; fi
note "P2b. ambele returnează decision_maker"
if grep -q "decision_maker" /tmp/conc_2a.log && grep -q "decision_maker" /tmp/conc_2b.log; then ok; else ko "vezi /tmp/conc_2a.log /tmp/conc_2b.log"; fi
note "P2c. U2: 1 profil / 1 membru / 1 org / 1 proiect demo"
if [ "$(count "select count(*) from public.profiles where user_id='$U2'")" = "1" ] \
   && [ "$(count "select count(*) from public.organization_members where user_id='$U2'")" = "1" ] \
   && [ "$(count "select count(*) from public.organizations where name like 'conc2%'")" = "1" ] \
   && [ "$(count "select count(*) from public.projects p join public.organizations o on o.id=p.organization_id where o.name like 'conc2%'")" = "1" ]; then
  ok
else
  ko "profile=$(count "select count(*) from public.profiles where user_id='$U2'") membri=$(count "select count(*) from public.organization_members where user_id='$U2'") org=$(count "select count(*) from public.organizations where name like 'conc2%'") proiecte=$(count "select count(*) from public.projects p join public.organizations o on o.id=p.organization_id where o.name like 'conc2%'")"
fi

echo "== P3: lock keys differ per user; both held concurrently =="
K3=$(psql -d "$DB" -tA -c "select hashtextextended('$U3',0);")
K4=$(psql -d "$DB" -tA -c "select hashtextextended('$U4',0);")
note "P3a. chei diferite (U3=$K3, U4=$K4)"
if [ -n "$K3" ] && [ -n "$K4" ] && [ "$K3" != "$K4" ]; then ok; else ko; fi
( psql -d "$DB" -q -c "begin; select pg_advisory_xact_lock(hashtextextended('$U3',0)); select pg_sleep(1.5); commit;" ) &
( sleep 0.3; psql -d "$DB" -q -c "begin; select pg_advisory_xact_lock(hashtextextended('$U4',0)); select pg_sleep(1.5); commit;" ) &
sleep 1.0
G2=$(count "select count(*) from pg_locks where locktype='advisory' and granted;")
note "P3b. ambele lock-uri ținute simultan (granted=$G2 la t≈1.0s)"
if [ "$G2" -ge 2 ]; then ok; else ko; fi
T0=$(date +%s.%N)
wait
T1=$(date +%s.%N)
EL=$(echo "$T1 - $T0" | bc 2>/dev/null || python3 -c "print($T1-$T0)")
note "P3c. fără serializare globală (elapsed=${EL}s < 2.4s)"
python3 -c "import sys; sys.exit(0 if $EL < 2.4 else 1)" 2>/dev/null && ok || ko "elapsed=${EL}s (așteptat < 2.4s: lock-urile nu se blochează reciproc)"

echo "== Verdict =="
echo "CONCURRENCY RESULT: $PASS PASS / $FAIL FAIL"
if [ "$FAIL" = "0" ]; then
  echo "CONCURRENCY TESTS: ALL PASS"
else
  echo "CONCURRENCY TESTS: FAILED"
  exit 1
fi
# scratch DB șters automat de trap EXIT
