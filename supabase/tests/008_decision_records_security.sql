-- ══════════════════════════════════════════════════════════════════════
-- GLAZEO Next — Migration 008 regression (decision_records) — LOCAL ONLY
--
-- ⚠️  DEDICATED LOCAL SCRATCH DATABASE ONLY. NEVER run against Supabase.
--     Recreează schema auth și tabelele public.* — destructiv.
--
-- Cum se rulează (Postgres local, fără Docker):
--   createdb glazeo_008_test
--   psql -v ON_ERROR_STOP=1 -d glazeo_008_test \
--        -c "set glazeo_test.allowed='yes'" \
--        -f supabase/tests/008_decision_records_security.sql
--
-- Structura:
--   PARTEA A — PRE-008: tabela lipsește, deci salvarea eșuează (42P01) → dovedește defectul
--   \ir ../migrations/008_decision_records.sql
--   PARTEA B — POST-008: INSERT/SELECT proprii, izolare între useri, imutabilitate
--   PARTEA C — privilegii: anon nimic, authenticated select+insert, service_role select+insert
--   PARTEA D — constrângeri: model_id placeholder, snapshot non-obiect, id duplicat
--   PARTEA E — idempotență: re-aplicarea migrării nu schimbă nimic
--
-- Mirror local al Supabase:
--   · roluri anon / authenticated / service_role (service_role cu BYPASSRLS)
--   · `postgres` ca proprietar de tabel
--   · DEFAULT PRIVILEGES care acordă ALL clienților pe tabelele noi din public —
--     exact comportamentul pe care migrarea 008 îl restrânge explicit.
-- ══════════════════════════════════════════════════════════════════════

-- Guard: refuză execuția fără semnalizarea explicită a runnerului.
do $$
begin
  if coalesce(current_setting('glazeo_test.allowed', true), '') <> 'yes' then
    raise exception 'ABORT: rulează DOAR într-un scratch DB local dedicat (set glazeo_test.allowed=yes).';
  end if;
end $$;

-- ── Setup: schemă + identitate ─────────────────────────────────────────
drop schema if exists public cascade;
drop schema if exists auth cascade;
create schema auth;
create schema public;

create table auth.users (
  id    uuid primary key,
  email text
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('glazeo_test.uid', true), '')::uuid
$$;

-- ── Setup: roluri (mirror Supabase) ────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'create role anon nologin';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'create role authenticated nologin';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    -- În Supabase, service_role are BYPASSRLS: privilegiile de tabel rămân singura barieră.
    execute 'create role service_role nologin bypassrls';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    execute 'create role postgres nologin';
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role, postgres;
grant usage on schema auth   to anon, authenticated, service_role, postgres;

-- Comportamentul implicit Supabase: tabelele noi din public primesc ALL pentru clienți.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

-- ── Setup: helper-e (identice ca stil cu suita 007) ────────────────────
create or replace function glazeo_as(p_role text, p_uid uuid, p_email text, p_sql text)
returns text language plpgsql as $$
declare v_out text;
begin
  perform set_config('glazeo_test.uid',   coalesce(p_uid::text, ''), false);
  perform set_config('glazeo_test.email', coalesce(p_email, ''),    false);
  execute format('set local role %I', p_role);
  begin
    execute p_sql into v_out;
    reset role;
    return coalesce(v_out, '<null>');
  exception when others then
    reset role;
    return 'ERROR ' || sqlstate || ': ' || sqlerrm;
  end;
end $$;

create or replace function glazeo_clear_identity() returns void language plpgsql as $$
begin
  perform set_config('glazeo_test.uid',   '', false);
  perform set_config('glazeo_test.email', '', false);
end $$;

create or replace function glazeo_expect_value(
  p_role text, p_uid uuid, p_email text, p_expected text, p_desc text, p_call text
) returns void language plpgsql as $$
declare v_res text;
begin
  v_res := glazeo_as(p_role, p_uid, p_email, p_call);
  if v_res is distinct from p_expected then
    raise exception 'FAIL [%]: așteptat %, primit %', p_desc, p_expected, v_res;
  end if;
  raise notice 'PASS [%]: %', p_desc, v_res;
end $$;

create or replace function glazeo_expect_error(
  p_role text, p_uid uuid, p_email text, p_state text, p_substr text, p_call text
) returns void language plpgsql as $$
declare v_res text;
begin
  v_res := glazeo_as(p_role, p_uid, p_email, p_call);
  if v_res not like 'ERROR %' then
    raise exception 'FAIL: apelul trebuia REFUZAT, dar a reușit (%): %', v_res, p_call;
  end if;
  if position(p_state in v_res) = 0 then
    raise exception 'FAIL: așteptat SQLSTATE %, primit: %', p_state, v_res;
  end if;
  if p_substr is not null and position(p_substr in v_res) = 0 then
    raise exception 'FAIL: mesajul nu conține "%": %', p_substr, v_res;
  end if;
  raise notice 'PASS: refuzat cu % ("%")', p_state, p_substr;
end $$;

-- ── Setup: doi utilizatori ─────────────────────────────────────────────
insert into auth.users (id, email) values
  ('40000000-0000-0000-0000-00000000000a', 'user-a@example.com'),
  ('40000000-0000-0000-0000-00000000000b', 'user-b@example.com');

-- Tabelă de captură pentru valorile generate (id-uri persistente).
create table public.test_capture (k text primary key, v text);
alter table public.test_capture owner to postgres;
grant select, insert on public.test_capture to authenticated, service_role;

\echo ''
\echo '════════ PARTEA A — PRE-008: salvarea eșuează (dovedește defectul) ════════'
\echo ''

\echo '--- A1: tabela lipsește (așteptat: ABSENT)'
select glazeo_expect_value('postgres', null, null, 'ABSENT',
  'A1 decision_records absent pre-008',
  $sql$select coalesce(to_regclass('public.decision_records')::text, 'ABSENT')$sql$);

\echo '--- A2: INSERT ca authenticated → 42P01 (așa eșua producția)'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '42P01', 'decision_records',
  $sql$insert into public.decision_records (user_id, model_id, snapshot)
       values ('40000000-0000-0000-0000-00000000000a', 'walk_in_shower', jsonb_build_object('id','DM-101'))$sql$);

\echo ''
\echo '════════ APLICARE MIGRARE 008 ════════'
\echo ''

\ir ../migrations/008_decision_records.sql

-- Proprietar de tabel ca în Supabase (după migrare, ca privilegiile să fie deja restrânse).
alter table public.decision_records owner to postgres;

\echo ''
\echo '════════ PARTEA B — POST-008: funcțional + RLS + imutabilitate ════════'
\echo ''

\echo '--- B1: user A inserează fără să trimită id (așteptat: 1)'
select glazeo_expect_value('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '1',
  'B1 insert propriu fără id',
  $sql$with i as (
         insert into public.decision_records (user_id, model_id, snapshot)
         values ('40000000-0000-0000-0000-00000000000a', 'walk_in_shower', jsonb_build_object('id','DM-101'))
         returning id
       )
       insert into public.test_capture (k, v) select 'id1', id from i
       returning 1$sql$);

\echo '--- B2: id-ul persistent are 36 caractere (uuid), nu id-ul intern al deciziei (așteptat: 36|false)'
select glazeo_expect_value('postgres', null, null, '36|false',
  'B2 id persistent generat, diferit de id-ul intern',
  $sql$select char_length(v)::text || '|' || (v like 'DM-%')::text from public.test_capture where k = 'id1'$sql$);

\echo '--- B3: al doilea insert al ACELUIAȘI decizie internă → alt id persistent (așteptat: distinct)'
select glazeo_expect_value('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '1',
  'B3 al doilea insert',
  $sql$with i as (
         insert into public.decision_records (user_id, model_id, snapshot)
         values ('40000000-0000-0000-0000-00000000000a', 'walk_in_shower', jsonb_build_object('id','DM-101'))
         returning id
       )
       insert into public.test_capture (k, v) select 'id2', id from i
       returning 1$sql$);

select glazeo_expect_value('postgres', null, null, 'distinct',
  'B3b chei persistente distincte pentru același id intern',
  $sql$select case when (select count(distinct v) from public.test_capture where k in ('id1','id2')) = 2
                   then 'distinct' else 'DUPLICATE' end$sql$);

\echo '--- B4: user A vede ambele rânduri proprii (așteptat: 2)'
select glazeo_expect_value('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '2',
  'B4 select propriu',
  $sql$select count(*)::text from public.decision_records$sql$);

\echo '--- B5: user B NU vede rândurile lui A (așteptat: 0)'
select glazeo_expect_value('authenticated',
  '40000000-0000-0000-0000-00000000000b', 'user-b@example.com', '0',
  'B5 izolare între utilizatori',
  $sql$select count(*)::text from public.decision_records$sql$);

\echo '--- B6: user B inserează pe user_id = A → refuzat 42501'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000b', 'user-b@example.com', '42501', 'row-level security',
  $sql$insert into public.decision_records (user_id, model_id, snapshot)
       values ('40000000-0000-0000-0000-00000000000a', 'walk_in_shower', jsonb_build_object('id','DM-X'))$sql$);

\echo '--- B7: UPDATE pe propriul rând → refuzat 42501 (privilegiul lipsește; al doilea strat e absența politicii)'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '42501', 'permission denied',
  $sql$with u as (
         update public.decision_records set model_id = 'tampered' returning 1
       ) select count(*)::text from u$sql$);

\echo '--- B8: DELETE pe propriul rând → refuzat 42501 (privilegiu absent)'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '42501', 'permission denied',
  $sql$delete from public.decision_records$sql$);

\echo '--- B9: conținutul a rămas neatins după încercările de modificare (așteptat: 2|walk_in_shower)'
select glazeo_expect_value('postgres', null, null, '2|walk_in_shower',
  'B9 rândurile sunt intacte',
  $sql$select count(*)::text || '|' || min(model_id) from public.decision_records$sql$);

\echo ''
\echo '════════ PARTEA C — PRIVILEGII (anon / authenticated / service_role) ════════'
\echo ''

\echo '--- C1: anon SELECT → 42501'
select glazeo_expect_error('anon', null, null, '42501', 'permission denied',
  $sql$select count(*) from public.decision_records$sql$);

\echo '--- C2: anon INSERT → 42501'
select glazeo_expect_error('anon', null, null, '42501', 'permission denied',
  $sql$insert into public.decision_records (user_id, model_id, snapshot)
       values ('40000000-0000-0000-0000-00000000000a', 'walk_in_shower', jsonb_build_object('id','DM-A'))$sql$);

\echo '--- C3: service_role SELECT (BYPASSRLS) → 2'
select glazeo_expect_value('service_role', null, null, '2',
  'C3 service_role poate citi',
  $sql$select count(*)::text from public.decision_records$sql$);

\echo '--- C4: service_role INSERT → 1'
select glazeo_expect_value('service_role', null, null, '1',
  'C4 service_role poate insera',
  $sql$with i as (
         insert into public.decision_records (user_id, model_id, snapshot)
         values ('40000000-0000-0000-0000-00000000000b', 'glass_balustrade', jsonb_build_object('id','DM-201'))
         returning 1
       ) select count(*)::text from i$sql$);

\echo '--- C5: service_role UPDATE → 42501 (BYPASSRLS nu ajută: privilegiul lipsește)'
select glazeo_expect_error('service_role', null, null, '42501', 'permission denied',
  $sql$update public.decision_records set model_id = 'tampered'$sql$);

\echo '--- C6: service_role DELETE → 42501'
select glazeo_expect_error('service_role', null, null, '42501', 'permission denied',
  $sql$delete from public.decision_records$sql$);

\echo '--- C7: matricea de privilegii (așteptat: false|true|true)'
select glazeo_expect_value('postgres', null, null, 'false|true|true',
  'C7 anon=f, authenticated=t, service_role=t pentru SELECT',
  $sql$select has_table_privilege('anon','public.decision_records','select')::text || '|'
                || has_table_privilege('authenticated','public.decision_records','select')::text || '|'
                || has_table_privilege('service_role','public.decision_records','select')::text$sql$);

\echo ''
\echo '════════ PARTEA D — CONSTRÂNGERI ════════'
\echo ''

\echo '--- D1: model_id „unknown" → 23514 (exact fallback-ul eliminat în C2)'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '23514', 'model_id_real',
  $sql$insert into public.decision_records (user_id, model_id, snapshot)
       values ('40000000-0000-0000-0000-00000000000a', 'unknown', jsonb_build_object('id','DM-1'))$sql$);

\echo '--- D2: model_id cu format invalid → 23514 (model_id_format)'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '23514', 'model_id_format',
  $sql$insert into public.decision_records (user_id, model_id, snapshot)
       values ('40000000-0000-0000-0000-00000000000a', 'bad model id', jsonb_build_object('id','DM-1'))$sql$);

\echo '--- D3: snapshot care nu e obiect JSON → 23514 (snapshot_object)'
select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000a', 'user-a@example.com', '23514', 'snapshot_object',
  $sql$insert into public.decision_records (user_id, model_id, snapshot)
       values ('40000000-0000-0000-0000-00000000000a', 'walk_in_shower', to_jsonb(array[1,2,3]))$sql$);

\echo '--- D4: id explicit duplicat → 23505 (dovedește de ce clientul nu mai trimite id)'
select glazeo_expect_value('postgres', null, null, '1',
  'D4 setup id explicit',
  $sql$insert into public.decision_records (id, user_id, model_id, snapshot)
       values ('explicit-id-1', '40000000-0000-0000-0000-00000000000a', 'walk_in_shower', jsonb_build_object('id','DM-9'))
       returning 1$sql$);

select glazeo_expect_error('authenticated',
  '40000000-0000-0000-0000-00000000000b', 'user-b@example.com', '23505', 'decision_records_pkey',
  $sql$insert into public.decision_records (id, user_id, model_id, snapshot)
       values ('explicit-id-1', '40000000-0000-0000-0000-00000000000b', 'walk_in_shower', jsonb_build_object('id','DM-9'))$sql$);

\echo ''
\echo '════════ PARTEA E — IDEMPOTENȚĂ + STARE FINALĂ ════════'
\echo ''

\echo '--- E1: re-aplicarea migrării 008 nu produce erori'
\ir ../migrations/008_decision_records.sql

\echo '--- E2: încă exact 2 politici, RLS activ, marcaj prezent (așteptat: 2|true|GLAZEO:decision_records:v1)'
select glazeo_expect_value('postgres', null, null, '2|true|GLAZEO:decision_records:v1',
  'E2 stare finală',
  $sql$select (select count(*) from pg_policies where schemaname='public' and tablename='decision_records')::text
           || '|' || (select relrowsecurity::text from pg_class where oid = 'public.decision_records'::regclass)
           || '|' || obj_description('public.decision_records'::regclass, 'pg_class')$sql$);

\echo '--- E3: id-ul are default server-side (C1), așteptat: 1'
select glazeo_expect_value('postgres', null, null, '1',
  'E3 id are default',
  $sql$select count(*)::text from information_schema.columns
        where table_schema='public' and table_name='decision_records'
          and column_name='id' and column_default is not null$sql$);

\echo ''
\echo '════════ STARE FINALĂ ════════'
select user_id::text, model_id, char_length(id) as id_len from public.decision_records order by created_at, model_id;

\echo ''
do $$ begin
  raise notice 'SQL SECURITY TESTS 008: ALL PASS';
end $$;
