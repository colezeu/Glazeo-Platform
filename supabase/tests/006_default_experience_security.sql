-- ══════════════════════════════════════════════════════════════════════
-- GLAZEO Next — Migration 006 security regression (LOCAL ONLY)
--
-- ⚠️ DEDICATED LOCAL SCRATCH DATABASE ONLY. NEVER run against Supabase.
--    Acest fișier CREEAZĂ/ÎNLOCUIEȘTE schema `auth` și recreate tabelele
--    public.* din scratch DB — destructiv. Rulează doar într-o bază locală
--    dedicată testelor (ex: glazeo_routing_test_20260828).
--
-- Cum se rulează (Postgres local, fără Docker):
--   createdb glazeo_routing_test_20260828
--   psql -v ON_ERROR_STOP=1 -d glazeo_routing_test_20260828 \
--        -c "set glazeo_test.allowed='yes'" \
--        -f supabase/tests/006_default_experience_security.sql
--   # apoi, separat, testele de rol (în același runner):
--   psql -d glazeo_routing_test_20260828 -v ON_ERROR_STOP=1 -c "set role anon; select rpc_initialize_account(...)"   # → trebuie să EȘUEZE
--   psql -d glazeo_routing_test_20260828 -v ON_ERROR_STOP=1 -c "set role authenticated; set glazeo_test.uid=...; set glazeo_test.jwt=...; select rpc_initialize_account(...)"  # → trebuie să REUȘEASCĂ
--
-- Simulare auth: auth.uid()/auth.jwt() citesc GUC-uri de sesiune
-- (glazeo_test.uid / glazeo_test.jwt) — echivalentul local al claims-urilor
-- JWT puse de gateway-ul Supabase. Fiecare scenariu își setează propriile GUC-uri.
-- ══════════════════════════════════════════════════════════════════════

-- Guard: refuză execuția fără semnalizarea explicită a runnerului.
do $$
begin
  if coalesce(current_setting('glazeo_test.allowed', true), '') <> 'yes' then
    raise exception 'ABORT: acest fișier rulează DOAR într-un scratch DB local dedicat (set glazeo_test.allowed=yes). Nu executa niciodată contra Supabase.';
  end if;
end $$;

-- ── Setup scratch: schema auth simulată ────────────────────────────────
drop schema if exists public cascade;
drop schema if exists auth cascade;
create schema auth;

create table auth.users (
  id uuid primary key
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('glazeo_test.uid', true), '')::uuid
$$;

create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('glazeo_test.jwt', true), ''), '{}')::jsonb
$$;

-- ── Setup scratch: tabelele public.* folosite de 006 (minimal, fidel 001) ──
create schema public;

-- Mirror Supabase defaults: public schema USAGE pentru anon/authenticated.
-- Fără acest grant, testele de rol ar eșua pe USAGE de schemă, nu pe EXECUTE
-- de funcție (exact ceea ce 006 controlează prin REVOKE/GRANT).
grant usage on schema public to anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'company' check (type in ('company', 'studio', 'individual')),
  buyer_level text not null default 'public' check (buyer_level in ('public', 'verified', 'contracted')),
  created_at timestamp with time zone default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  default_experience text not null default 'buyer' check (default_experience in ('decision_maker', 'buyer', 'builder', 'admin')),
  created_at timestamp with time zone default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'contractor' check (role in ('architect', 'designer', 'developer', 'contractor', 'installer', 'admin')),
  joined_at timestamp with time zone default now(),
  unique(organization_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  product_type text,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  address text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table public.configurations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  product_type text not null,
  status text not null default 'draft' check (status in ('draft', 'quoted', 'ordered', 'archived')),
  current_version integer not null default 1,
  last_edited text,
  created_at timestamp with time zone default now()
);

create table public.configuration_versions (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid not null references public.configurations(id) on delete cascade,
  version integer not null,
  config_data jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'quoted', 'ordered', 'archived')),
  created_at timestamp with time zone default now(),
  unique(configuration_id, version)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('config', 'quote', 'order', 'project')),
  text text not null,
  created_at timestamp with time zone default now()
);

-- ── Reproduce live ACL drift (pre-006) ────────────────────────────────
-- Baza live avea grant-uri EXPLICITE către anon și service_role pe funcția
-- era-004 (ACL: {=X/postgres,...,anon=X/postgres,...,service_role=X/postgres}).
-- CREATE OR REPLACE păstrează ACL-ul funcției existente → migrarea 006 trebuie
-- să elimine drift-ul ATOMIC, prin REVOKE explicit de la public, anon, service_role.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'create role service_role nologin';
  end if;
end $$;

grant usage on schema public to service_role;

-- Funcție pre-006 (placeholder, aceeași semnătură) + grant-uri de drift.
create or replace function public.rpc_initialize_account(p_user_id uuid, p_email text, p_full_name text)
returns jsonb language plpgsql security definer as $$
begin
  return jsonb_build_object('status', 'pre-006-drift');
end $$;

grant execute on function public.rpc_initialize_account(uuid, text, text)
  to public, anon, service_role, authenticated;

-- ── Aplică migrarea 006 ────────────────────────────────────────────────
\ir ../migrations/006_default_experience_decision_maker.sql

-- ── Utilizatori de test ────────────────────────────────────────────────
insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),  -- OWNER  (suplinit alt user)
  ('10000000-0000-0000-0000-000000000002'),  -- VICTIM
  ('10000000-0000-0000-0000-000000000003'),  -- OWNER2 (email JWT lipsă)
  ('10000000-0000-0000-0000-000000000004'),  -- OWNER3 (profil nou)
  ('10000000-0000-0000-0000-000000000005');  -- OWNER4 (buyer existent)

-- ── Helper: așteaptă un anumit SQLSTATE + mesaj de la apelul RPC ───────
create or replace function glazeo_expect_error(p_state text, p_substr text, p_call text)
returns void
language plpgsql
as $$
begin
  begin
    execute p_call;
    raise exception 'CALL_SUCCEEDED_UNEXPECTEDLY';
  exception
    when others then
      if sqlerrm = 'CALL_SUCCEEDED_UNEXPECTEDLY' then
        raise exception 'FAIL: expected error % but call succeeded: %', p_state, p_call;
      end if;
      if sqlstate <> p_state then
        raise exception 'FAIL: expected SQLSTATE %, got % (%): %', p_state, sqlstate, sqlerrm, p_call;
      end if;
      if p_substr is not null and position(p_substr in sqlerrm) = 0 then
        raise exception 'FAIL: message lacks "%": %', p_substr, sqlerrm;
      end if;
      raise notice 'PASS: expected % ("%") — %', p_state, p_substr, p_call;
  end;
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 1: caller cannot supply another user's ID (auth.uid() <> p_user_id → 42501)
-- ══════════════════════════════════════════════════════════════════════
do $$
begin
  perform set_config('glazeo_test.uid', '10000000-0000-0000-0000-000000000001', false);
  perform set_config('glazeo_test.jwt', '{"email":"owner@glass.associates"}', false);
  perform glazeo_expect_error(
    '42501',
    'own profile',
    'select rpc_initialize_account(''10000000-0000-0000-0000-000000000002''::uuid, ''victim@glass.associates'', ''Victim'')'
  );
  -- și cazul auth.uid() null (neautentificat)
  perform set_config('glazeo_test.uid', '', false);
  perform glazeo_expect_error(
    '42501',
    'own profile',
    'select rpc_initialize_account(''10000000-0000-0000-0000-000000000001''::uuid, ''owner@glass.associates'', ''Owner'')'
  );
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 2: caller cannot store an email inconsistent with authenticated identity
-- ══════════════════════════════════════════════════════════════════════
do $$
declare v_email text;
begin
  perform set_config('glazeo_test.uid', '10000000-0000-0000-0000-000000000001', false);
  perform set_config('glazeo_test.jwt', '{"email":"owner@glass.associates"}', false);
  perform rpc_initialize_account(
    '10000000-0000-0000-0000-000000000001'::uuid,
    'attacker@evil.com',           -- client-supplied, INCONSISTENT cu identitatea
    'Owner'
  );
  select email into v_email from public.profiles
    where user_id = '10000000-0000-0000-0000-000000000001';
  if v_email <> 'owner@glass.associates' then
    raise exception 'FAIL: email canonic încălcat — profiles.email = % (așteptat owner@glass.associates)', v_email;
  end if;
  raise notice 'PASS: email stocat = % (JWT), p_email client-supplied ignorat', v_email;
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 3: missing authenticated email → 42501 explicit (fără fallback la p_email)
-- ══════════════════════════════════════════════════════════════════════
do $$
begin
  perform set_config('glazeo_test.uid', '10000000-0000-0000-0000-000000000003', false);
  perform set_config('glazeo_test.jwt', '{}', false);   -- JWT fără email
  perform glazeo_expect_error(
    '42501',
    'email is required',
    'select rpc_initialize_account(''10000000-0000-0000-0000-000000000003''::uuid, ''spoofed@glass.associates'', ''NoJwtEmail'')'
  );
  -- email gol în JWT → același refuz
  perform set_config('glazeo_test.jwt', '{"email":""}', false);
  perform glazeo_expect_error(
    '42501',
    'email is required',
    'select rpc_initialize_account(''10000000-0000-0000-0000-000000000003''::uuid, ''spoofed@glass.associates'', ''NoJwtEmail'')'
  );
  -- niciun rând scris
  if exists (select 1 from public.profiles where user_id = '10000000-0000-0000-0000-000000000003') then
    raise exception 'FAIL: profil creat deși email-ul JWT lipsea';
  end if;
  raise notice 'PASS: lipsă email autentic → refuz 42501, zero rânduri scrise';
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 4: own new profile → decision_maker (profil + retur minim)
-- ══════════════════════════════════════════════════════════════════════
do $$
declare v_result jsonb;
begin
  perform set_config('glazeo_test.uid', '10000000-0000-0000-0000-000000000004', false);
  perform set_config('glazeo_test.jwt', '{"email":"new@glass.associates"}', false);
  select rpc_initialize_account(
    '10000000-0000-0000-0000-000000000004'::uuid,
    'whatever@evil.com',
    'NewUser'
  ) into v_result;
  if v_result <> '{"default_experience":"decision_maker"}'::jsonb then
    raise exception 'FAIL: retur neașteptat %', v_result;
  end if;
  if (select default_experience from public.profiles where user_id = '10000000-0000-0000-0000-000000000004') <> 'decision_maker' then
    raise exception 'FAIL: profil nou nu are default_experience=decision_maker';
  end if;
  raise notice 'PASS: profil nou → decision_maker, retur = %', v_result;
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 5: own existing buyer → buyer (ON CONFLICT DO NOTHING, cont păstrat)
-- ══════════════════════════════════════════════════════════════════════
do $$
declare v_result jsonb;
begin
  insert into public.profiles (user_id, email, full_name, default_experience)
  values ('10000000-0000-0000-0000-000000000005', 'buyer@glass.associates', 'Buyer', 'buyer');
  insert into public.organizations (name, type, buyer_level)
  values ('Buyer Company', 'company', 'verified');

  insert into public.organization_members (organization_id, user_id, role)
  select id, '10000000-0000-0000-0000-000000000005', 'contractor'
  from public.organizations where name = 'Buyer Company';

  perform set_config('glazeo_test.uid', '10000000-0000-0000-0000-000000000005', false);
  perform set_config('glazeo_test.jwt', '{"email":"buyer@glass.associates"}', false);
  select rpc_initialize_account(
    '10000000-0000-0000-0000-000000000005'::uuid,
    'buyer@glass.associates',
    'Buyer'
  ) into v_result;
  if v_result <> '{"default_experience":"buyer"}'::jsonb then
    raise exception 'FAIL: buyer existent suprascris — retur %', v_result;
  end if;
  if (select default_experience from public.profiles where user_id = '10000000-0000-0000-0000-000000000005') <> 'buyer' then
    raise exception 'FAIL: default_experience al contului buyer a fost schimbat';
  end if;
  raise notice 'PASS: buyer existent → buyer păstrat, retur = %', v_result;
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 6: response contains ONLY default_experience (minimal JSON)
-- ══════════════════════════════════════════════════════════════════════
do $$
declare v_result jsonb; v_keys int;
begin
  perform set_config('glazeo_test.uid', '10000000-0000-0000-0000-000000000004', false);
  perform set_config('glazeo_test.jwt', '{"email":"new@glass.associates"}', false);
  -- a doua apelare (idempotent): profilul există deja, retur minim identic
  select rpc_initialize_account(
    '10000000-0000-0000-0000-000000000004'::uuid,
    'whatever@evil.com',
    'NewUser'
  ) into v_result;
  select count(*) into v_keys from jsonb_object_keys(v_result);
  if v_keys <> 1 then
    raise exception 'FAIL: retur cu % chei (așteptat doar default_experience): %', v_keys, v_result;
  end if;
  if not v_result ? 'default_experience' then
    raise exception 'FAIL: cheia default_experience lipsește din %', v_result;
  end if;
  raise notice 'PASS: retur minim JSON — exact o cheie: %', v_result;
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- TEST 7 (SQL-level): ACL după 006 — PUBLIC=no, anon=no, service_role=no,
-- authenticated=yes. Grant-urile istorice de drift trebuie eliminate atomic.
-- Execuția reală ca anon/authenticated/service_role se face în runner
-- (SET ROLE). Rolul local service_role e creat în secțiunea de drift;
-- curățarea lui se face de runner/curățenie (NU în acest fișier).
-- ══════════════════════════════════════════════════════════════════════
do $$
declare
  v_pub bool; v_anon bool; v_sr bool; v_auth bool;
begin
  select coalesce(bool_or(a.grantee = 0 and a.privilege_type = 'EXECUTE'), false) into v_pub
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(p.proacl) a
  where n.nspname = 'public' and p.proname = 'rpc_initialize_account';
  if v_pub then raise exception 'FAIL: PUBLIC are EXECUTE pe rpc_initialize_account (REVOKE lipsă)'; end if;

  select coalesce(bool_or(a.grantee = (select oid from pg_roles where rolname='anon') and a.privilege_type='EXECUTE'), false) into v_anon
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(p.proacl) a
  where n.nspname = 'public' and p.proname = 'rpc_initialize_account';
  if v_anon then raise exception 'FAIL: anon are EXECUTE pe rpc_initialize_account (drift anon neeliminat)'; end if;

  select coalesce(bool_or(a.grantee = (select oid from pg_roles where rolname='service_role') and a.privilege_type='EXECUTE'), false) into v_sr
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(p.proacl) a
  where n.nspname = 'public' and p.proname = 'rpc_initialize_account';
  if v_sr then raise exception 'FAIL: service_role are EXECUTE pe rpc_initialize_account (drift service_role neeliminat)'; end if;

  select coalesce(bool_or(a.grantee = (select oid from pg_roles where rolname='authenticated') and a.privilege_type='EXECUTE'), false) into v_auth
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(p.proacl) a
  where n.nspname = 'public' and p.proname = 'rpc_initialize_account';
  if not v_auth then raise exception 'FAIL: authenticated NU are EXECUTE pe rpc_initialize_account (GRANT lipsă)'; end if;

  raise notice 'PASS: ACL — PUBLIC=no, anon=no, service_role=no, authenticated=yes (drift normalizat atomic)';
end $$;

-- Verdict final: dacă s-a ajuns aici fără excepție → toate testele SQL au trecut.
do $$ begin
  raise notice 'SQL SECURITY TESTS: ALL PASS';
end $$;
