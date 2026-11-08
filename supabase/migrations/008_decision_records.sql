-- ══════════════════════════════════════════════
-- GLAZEO Next — 008: decision_records
-- Snapshot imutabil al deciziilor Decision Maker.
--
-- Aplicare: o singură tranzacție (psql -1 sau SQL Editor, Run).
-- Marcaj de proveniență: GLAZEO:decision_records:v1
-- Rollback: supabase/rollback/008_decision_records_rollback.sql
--
-- Independentă de F0.4.4 / F0.4.6 (profiles, organizații, RPC-uri).
--
-- ID persistent: GENERAT DE BAZĂ (C1). Clientul NU mai trimite `id` — motoarele DM produc
-- identificatori de sesiune („DM-101"), resetabili la reload, deci nu sunt unici global.
-- `id` devine cheie server-side; identificatorul intern al deciziei rămâne în `snapshot`.
-- ══════════════════════════════════════════════

-- ── 0. PREFLIGHT (fail-closed) ─────────────────
do $$
declare
  v_marker text;
begin
  if to_regclass('auth.users') is null then
    raise exception 'PREFLIGHT 008: auth.users lipsește' using errcode = 'P0001';
  end if;

  if to_regprocedure('auth.uid()') is null then
    raise exception 'PREFLIGHT 008: auth.uid() lipsește' using errcode = 'P0001';
  end if;

  if to_regclass('public.decision_records') is not null then
    v_marker := obj_description(to_regclass('public.decision_records'), 'pg_class');
    if v_marker is distinct from 'GLAZEO:decision_records:v1' then
      raise exception
        'PREFLIGHT 008: public.decision_records există deja fără marcajul așteptat (marcaj actual: %)',
        coalesce(v_marker, 'NULL')
        using errcode = 'P0001';
    end if;
  end if;
end $$;

-- ── 1. TABELĂ ──────────────────────────────────
create table if not exists public.decision_records (
  -- C1: cheia persistentă o generează baza. Clientul trimite doar conținutul deciziei.
  id          text        not null default gen_random_uuid()::text,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  model_id    text        not null,
  decided_at  timestamptz not null default now(),
  snapshot    jsonb       not null,
  created_at  timestamptz not null default now(),

  constraint decision_records_pkey primary key (id),
  constraint decision_records_id_not_blank check (btrim(id) <> ''),
  constraint decision_records_id_length check (char_length(id) between 1 and 64),
  -- Aliniat cu validarea din src/persistence/decisionSaveMeta.ts
  constraint decision_records_model_id_format check (model_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'),
  constraint decision_records_model_id_real
    check (lower(model_id) not in ('unknown', 'undefined', 'null', 'n/a', 'none')),
  constraint decision_records_snapshot_object check (jsonb_typeof(snapshot) = 'object')
);

comment on table public.decision_records is 'GLAZEO:decision_records:v1';
comment on column public.decision_records.snapshot is
  'DecisionRecord complet, versionat prin schemaVersion (2 pentru înregistrările noi).';
comment on column public.decision_records.model_id is
  'Identificatorul real al modelului (ex. dm-004); nu acceptă valori placeholder.';
comment on column public.decision_records.id is
  'Cheie persistentă generată de bază (gen_random_uuid). Identificatorul intern al deciziei trăiește în snapshot.';

-- ── 2. INDEXURI ────────────────────────────────
-- Acoperă și filtrarea pe user_id pentru FK (on delete cascade).
create index if not exists idx_decision_records_user_decided
  on public.decision_records (user_id, decided_at desc);

-- ── 3. RLS ─────────────────────────────────────
alter table public.decision_records enable row level security;

drop policy if exists "Users can view own decision records" on public.decision_records;
create policy "Users can view own decision records"
  on public.decision_records for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own decision records" on public.decision_records;
create policy "Users can insert own decision records"
  on public.decision_records for insert to authenticated
  with check (auth.uid() = user_id);

-- Fără politici de UPDATE sau DELETE: înregistrările sunt imutabile.
-- Rândurile existente nu pot fi modificate sau șterse de utilizatori.

-- ── 4. PRIVILEGII ──────────────────────────────
-- Supabase acordă implicit ALL către anon/authenticated/service_role pe tabelele
-- din public. Aici restrângem explicit: anon și PUBLIC nu primesc nimic.
revoke all on public.decision_records from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.decision_records from anon';
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.decision_records from authenticated';
    execute 'grant select, insert on public.decision_records to authenticated';
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    -- service_role ocolește RLS, dar rămâne limitat la citire/scriere de rânduri noi.
    execute 'revoke all on public.decision_records from service_role';
    execute 'grant select, insert on public.decision_records to service_role';
  end if;
end $$;

-- ── 5. POST-CONDIȚII (fail-closed) ─────────────
do $$
declare
  v_missing text;
  v_policies int;
begin
  select string_agg(c, ', ')
    into v_missing
  from unnest(array['id', 'user_id', 'model_id', 'decided_at', 'snapshot', 'created_at']) as c
  where not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'decision_records' and column_name = c
  );
  if v_missing is not null then
    raise exception 'POST 008: coloane lipsă: %', v_missing using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.decision_records'::regclass and relrowsecurity
  ) then
    raise exception 'POST 008: RLS nu este activ' using errcode = 'P0001';
  end if;

  -- C1: id trebuie să aibă default server-side (clientul nu mai trimite cheia).
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'decision_records'
      and column_name = 'id' and column_default is not null
  ) then
    raise exception 'POST 008: id nu are default server-side (C1 nerespectat)' using errcode = 'P0001';
  end if;

  select count(*) into v_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'decision_records';
  if v_policies <> 2 then
    raise exception 'POST 008: număr neașteptat de politici (%)', v_policies using errcode = 'P0001';
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon')
     and has_table_privilege('anon', 'public.decision_records', 'select') then
    raise exception 'POST 008: anon are SELECT' using errcode = 'P0001';
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    if not has_table_privilege('authenticated', 'public.decision_records', 'select') then
      raise exception 'POST 008: authenticated nu are SELECT' using errcode = 'P0001';
    end if;
    if not has_table_privilege('authenticated', 'public.decision_records', 'insert') then
      raise exception 'POST 008: authenticated nu are INSERT' using errcode = 'P0001';
    end if;
    if has_table_privilege('authenticated', 'public.decision_records', 'update') then
      raise exception 'POST 008: authenticated are UPDATE' using errcode = 'P0001';
    end if;
    if has_table_privilege('authenticated', 'public.decision_records', 'delete') then
      raise exception 'POST 008: authenticated are DELETE' using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'decision_records' and grantee = 'PUBLIC'
  ) then
    raise exception 'POST 008: PUBLIC are privilegii pe tabelă' using errcode = 'P0001';
  end if;

  -- service_role ocolește RLS: privilegiile de tabel sunt singura barieră rămasă.
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    if not has_table_privilege('service_role', 'public.decision_records', 'select') then
      raise exception 'POST 008: service_role nu are SELECT' using errcode = 'P0001';
    end if;
    if has_table_privilege('service_role', 'public.decision_records', 'update') then
      raise exception 'POST 008: service_role are UPDATE (BYPASSRLS ar ocoli politica)' using errcode = 'P0001';
    end if;
    if has_table_privilege('service_role', 'public.decision_records', 'delete') then
      raise exception 'POST 008: service_role are DELETE (BYPASSRLS ar ocoli politica)' using errcode = 'P0001';
    end if;
  end if;
end $$;
