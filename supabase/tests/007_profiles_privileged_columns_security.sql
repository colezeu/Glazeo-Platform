-- ══════════════════════════════════════════════════════════════════════
-- GLAZEO Next — Migration 007 security regression (LOCAL ONLY)
--
-- ⚠️  DEDICATED LOCAL SCRATCH DATABASE ONLY. NEVER run against Supabase.
--     Recreează schema auth și tabelele public.* — destructiv.
--
-- Cum se rulează (Postgres local, fără Docker):
--   createdb glazeo_007_test
--   psql -v ON_ERROR_STOP=1 -d glazeo_007_test \
--        -c "set glazeo_test.allowed='yes'" \
--        -f supabase/tests/007_profiles_privileged_columns_security.sql
--
-- Structura testului (RED → aplică migrarea → GREEN):
--   PARTEA A — starea PRE-007: atacurile TREBUIE să reușească (dovedește defectul)
--   \ir ../migrations/007_guard_profiles_privileged_columns.sql
--   PARTEA B — starea POST-007: aceleași atacuri TREBUIE să eșueze cu 42501
--   PARTEA C — non-regresie: onboarding + scrieri legitime trebuie să treacă
--
-- Mirror local al rolurilor Supabase: `authenticated`/`anon` (clienți) și
-- `postgres` (proprietar de tabel + owner al RPC-urilor SECURITY DEFINER).
-- Rolul local `postgres` e creat în setup pentru fidelitate — fără el,
-- `current_user` într-un SECURITY DEFINER ar fi utilizatorul OS, iar garda
-- ar testa altceva decât testează în Supabase.
-- ══════════════════════════════════════════════════════════════════════

-- Guard: refuză execuția fără semnalizarea explicită a runnerului.
do $$
begin
  if coalesce(current_setting('glazeo_test.allowed', true), '') <> 'yes' then
    raise exception 'ABORT: rulează DOAR într-un scratch DB local dedicat (set glazeo_test.allowed=yes).';
  end if;
end $$;

-- ── Setup: schema auth simulată ────────────────────────────────────────
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

create or replace function auth.email() returns text
language sql stable as $$
  select nullif(current_setting('glazeo_test.email', true), '')
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
  -- Proprietarul de tabel/RPC în Supabase. NOLOGIN, fără superuser:
  -- garda verifică NUMELE (contextul), nu privilegiile.
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    execute 'create role postgres nologin';
  end if;
end $$;

grant usage on schema public to anon, authenticated;
grant usage on schema auth   to anon, authenticated;

-- ── Setup: public.profiles (fidel 001_schema.sql) ──────────────────────
create table public.profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  email              text,
  full_name          text,
  phone              text,
  default_experience text not null default 'buyer'
                     check (default_experience in ('decision_maker','buyer','builder','admin')),
  created_at         timestamptz default now()
);
alter table public.profiles enable row level security;

-- Politicile reale din 002_rls.sql (nume păstrate identic)
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (user_id = auth.uid());
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.profiles to authenticated;

-- Owner = mirror al lui `postgres` din Supabase (bypass RLS pentru SECURITY DEFINER).
alter table public.profiles owner to postgres;

-- În Supabase, `postgres` deține și schema `auth`, deci RPC-urile SECURITY
-- DEFINER pot apela auth.uid()/auth.email(). Mirror local al acelei realități.
grant usage on schema auth   to postgres;
grant usage on schema public to postgres;
grant execute on function auth.uid(), auth.email() to postgres;

-- ── Setup: RPC-ul de onboarding, în forma din 006 (SECURITY DEFINER) ───
-- Reproducem doar partea de profil a lui rpc_initialize_account: suficient
-- pentru a testa că garda NU rupe calea legitimă de onboarding.
create or replace function public.stub_initialize_profile(
  p_user_id uuid, p_email text, p_full_name text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'insufficient_privilege: caller may only initialize their own profile'
      using errcode = '42501';
  end if;
  insert into public.profiles (user_id, email, full_name, default_experience)
  values (p_user_id, p_email, p_full_name, 'decision_maker')
  on conflict (user_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

alter function public.stub_initialize_profile(uuid, text, text) owner to postgres;
revoke all on function public.stub_initialize_profile(uuid, text, text) from public, anon;
grant execute on function public.stub_initialize_profile(uuid, text, text) to authenticated;

-- ── Utilizatori de test ────────────────────────────────────────────────
insert into auth.users (id, email) values
  ('30000000-0000-0000-0000-00000000000a', 'attacker@example.com'),
  ('30000000-0000-0000-0000-00000000000b', 'existing@example.com'),
  ('30000000-0000-0000-0000-00000000000c', 'onboarding@example.com');

-- Profil EXISTENT pentru scenariul de escaladare pe UPDATE (cont deja onboardat,
-- cu experiență explicită 'buyer') — fără el, UPDATE-ul afectează 0 rânduri și
-- „atacul" nu demonstrează nimic.
insert into public.profiles (user_id, email, full_name, default_experience)
values ('30000000-0000-0000-0000-00000000000b', 'existing@example.com', 'Existing', 'buyer');

-- ── Helpers ────────────────────────────────────────────────────────────
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

create or replace function glazeo_expect_error(
  p_role text, p_uid uuid, p_email text, p_state text, p_substr text, p_call text
) returns void language plpgsql as $$
declare v_res text;
begin
  v_res := glazeo_as(p_role, p_uid, p_email, p_call);
  if v_res not like 'ERROR %' then
    raise exception 'FAIL: apelul trebuia să fie REFUZAT, dar a reușit (%): %', v_res, p_call;
  end if;
  if position(p_state in v_res) = 0 then
    raise exception 'FAIL: așteptat SQLSTATE %, primit: %', p_state, v_res;
  end if;
  if p_substr is not null and position(p_substr in v_res) = 0 then
    raise exception 'FAIL: mesajul nu conține "%": %', p_substr, v_res;
  end if;
  raise notice 'PASS: refuzat cu % ("%")', p_state, p_substr;
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

-- Curăță identitatea GUC (altfel garda blochează propriul cleanup).
create or replace function glazeo_clear_identity() returns void language plpgsql as $$
begin
  perform set_config('glazeo_test.uid',   '', false);
  perform set_config('glazeo_test.email', '', false);
end $$;

\echo ''
\echo '════════ PARTEA A — PRE-007: defectul există (atacurile TREBUIE să reușească) ════════'
\echo ''

-- A1: client NOU își auto-atribuie experiența `admin` prin INSERT
\echo '--- A1: INSERT propriu cu default_experience=admin (așteptat: 1 → VULNERABIL)'
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000a', 'attacker@example.com', '1',
  'A1 auto-atribuire admin la INSERT',
  'with i as (insert into public.profiles (user_id, email, full_name, default_experience)
              values (''30000000-0000-0000-0000-00000000000a'', ''attacker@example.com'',
                      ''Attacker'', ''admin'')
              returning 1) select count(*)::text from i');

-- A2: client EXISTENT își schimbă experiența pe `admin` prin UPDATE
\echo '--- A2: UPDATE propriu spre default_experience=admin (așteptat: 1 → VULNERABIL)'
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000b', 'existing@example.com', '1',
  'A2 escaladare admin la UPDATE',
  'with u as (update public.profiles set default_experience = ''admin''
              where user_id = ''30000000-0000-0000-0000-00000000000b''
              returning 1) select count(*)::text from u');

-- A3: client își falsifică emailul de identitate
\echo '--- A3: UPDATE propriu pe profiles.email (așteptat: 1 → VULNERABIL)'
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000b', 'existing@example.com', '1',
  'A3 spoofing email',
  'with u as (update public.profiles set email = ''office@glass.associates''
              where user_id = ''30000000-0000-0000-0000-00000000000b''
              returning 1) select count(*)::text from u');

-- Curățenie înainte de aplicarea migrației
select glazeo_clear_identity();
delete from public.profiles where user_id = '30000000-0000-0000-0000-00000000000a';
update public.profiles set default_experience = 'buyer', email = 'existing@example.com'
 where user_id = '30000000-0000-0000-0000-00000000000b';

\echo ''
\echo '════════ Aplică migrarea 007 ════════'
\echo ''

\ir ../migrations/007_guard_profiles_privileged_columns.sql

\echo ''
\echo '════════ PARTEA B — POST-007: atacurile TREBUIE refuzate (42501) ════════'
\echo ''

-- B1: auto-atribuire admin la INSERT
-- (formă CTE: `INSERT` nu poate fi folosit ca subquery în FROM în PostgreSQL)
\echo '--- B1: INSERT propriu cu default_experience=admin (așteptat: 42501)'
select glazeo_expect_error('authenticated',
  '30000000-0000-0000-0000-00000000000a', 'attacker@example.com',
  '42501', 'default_experience is not client-settable',
  'with x as (insert into public.profiles
     (user_id, email, full_name, default_experience)
     values (''30000000-0000-0000-0000-00000000000a'', ''attacker@example.com'',
             ''Attacker'', ''admin'') returning 1)
   select count(*)::text from x');

-- B2: escaladare admin la UPDATE
\echo '--- B2: UPDATE propriu spre admin (așteptat: 42501)'
select glazeo_expect_error('authenticated',
  '30000000-0000-0000-0000-00000000000b', 'existing@example.com',
  '42501', 'default_experience is not client-writable',
  'with x as (update public.profiles set default_experience = ''admin''
     where user_id = ''30000000-0000-0000-0000-00000000000b'' returning 1)
   select count(*)::text from x');

-- B3: spoofing email la UPDATE
\echo '--- B3: UPDATE propriu pe email (așteptat: 42501)'
select glazeo_expect_error('authenticated',
  '30000000-0000-0000-0000-00000000000b', 'existing@example.com',
  '42501', 'identity email is immutable',
  'with x as (update public.profiles set email = ''office@glass.associates''
     where user_id = ''30000000-0000-0000-0000-00000000000b'' returning 1)
   select count(*)::text from x');

-- B4: email de identitate inventat la INSERT (nu coincide cu cel din JWT)
\echo '--- B4: INSERT cu email ≠ identitatea autentificată (așteptat: 42501)'
select glazeo_expect_error('authenticated',
  '30000000-0000-0000-0000-00000000000a', 'attacker@example.com',
  '42501', 'must match the authenticated identity',
  'with x as (insert into public.profiles
     (user_id, email, full_name, default_experience)
     values (''30000000-0000-0000-0000-00000000000a'', ''office@glass.associates'',
             ''Attacker'', ''decision_maker'') returning 1)
   select count(*)::text from x');

-- B5: builder — tot auto-atribuire de rol (nu doar admin)
\echo '--- B5: INSERT propriu cu default_experience=builder (așteptat: 42501)'
select glazeo_expect_error('authenticated',
  '30000000-0000-0000-0000-00000000000a', 'attacker@example.com',
  '42501', 'not client-settable',
  'with x as (insert into public.profiles
     (user_id, email, full_name, default_experience)
     values (''30000000-0000-0000-0000-00000000000a'', ''attacker@example.com'',
             ''Attacker'', ''builder'') returning 1)
   select count(*)::text from x');

\echo ''
\echo '════════ PARTEA C — NON-REGRESIE (fluxurile legitime trebuie să treacă) ════════'
\echo ''

-- C1: client își creează profilul propriu, cu valorile de onboarding (legitim)
\echo '--- C1: INSERT propriu cu default_experience=decision_maker + email propriu (așteptat: 1)'
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000a', 'attacker@example.com', '1',
  'C1 profil propriu legitim',
  'with i as (insert into public.profiles (user_id, email, full_name, default_experience)
              values (''30000000-0000-0000-0000-00000000000a'', ''attacker@example.com'',
                      ''Attacker'', ''decision_maker'')
              returning 1) select count(*)::text from i');

-- C2: client își actualizează un câmp neprivilegiat
\echo '--- C2: UPDATE pe full_name (neprivilegiat) (așteptat: 1)'
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000a', 'attacker@example.com', '1',
  'C2 update neprivilegiat',
  'with u as (update public.profiles set full_name = ''Renamed''
              where user_id = ''30000000-0000-0000-0000-00000000000a''
              returning 1) select count(*)::text from u');

-- C3: calea legitimă de onboarding (RPC SECURITY DEFINER, owner=postgres) NU e ruptă
\echo '--- C3: RPC onboarding (SECURITY DEFINER) pentru user nou (așteptat: {"ok": true})'
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000c', 'onboarding@example.com', '{"ok": true}',
  'C3 onboarding legitim',
  'select public.stub_initialize_profile(
     ''30000000-0000-0000-0000-00000000000c''::uuid, ''onboarding@example.com'', ''New'')::text');

-- C4: valoarea scrisă de onboarding chiar a ajuns în tabel
\echo '--- C4: profilul creat de onboarding există cu decision_maker (așteptat: decision_maker)'
select glazeo_clear_identity();
select glazeo_expect_value('authenticated',
  '30000000-0000-0000-0000-00000000000c', 'onboarding@example.com', 'decision_maker',
  'C4 rezultat onboarding',
  'select default_experience from public.profiles
    where user_id = ''30000000-0000-0000-0000-00000000000c''');

-- C5: scriere de încredere (migrație / SQL editor) — contextul `postgres`,
-- exact ca în Supabase, NU utilizatorul OS al clusterului local.
\echo '--- C5: scriere de încredere în afara contextului de client (așteptat: 1)'
select glazeo_clear_identity();
set role postgres;
update public.profiles set default_experience = 'buyer'
 where user_id = '30000000-0000-0000-0000-00000000000a';
reset role;
select count(*)::text as c5_trusted_write_ok from public.profiles
 where user_id = '30000000-0000-0000-0000-00000000000a' and default_experience = 'buyer';

\echo ''
\echo '════════ STARE FINALĂ ════════'
select user_id::text, email, default_experience from public.profiles order by user_id;

\echo ''
do $$ begin
  raise notice 'SQL SECURITY TESTS 007: ALL PASS';
end $$;
