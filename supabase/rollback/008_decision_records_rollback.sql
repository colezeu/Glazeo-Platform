-- ══════════════════════════════════════════════
-- GLAZEO Next — ROLLBACK 008: decision_records
-- Refuză ștergerea dacă tabela nu este cea creată de migrația 008
-- sau dacă ar produce pierdere de date fără acord explicit.
--
-- Pierdere de date acceptată explicit:
--   select set_config('glazeo.allow_data_loss', 'on', false);
--   \i supabase/rollback/008_decision_records_rollback.sql
-- ══════════════════════════════════════════════

-- ── 0. PROVENIENȚĂ + SIGURANȚĂ ────────────────
do $$
declare
  v_oid oid;
  v_marker text;
  v_rows bigint;
  v_columns int;
  v_policies int;
  v_allow boolean;
begin
  v_oid := to_regclass('public.decision_records');

  if v_oid is null then
    raise notice 'ROLLBACK 008: public.decision_records nu există — nimic de făcut.';
    return;
  end if;

  v_marker := obj_description(v_oid, 'pg_class');
  if v_marker is distinct from 'GLAZEO:decision_records:v1' then
    raise exception
      'ROLLBACK 008 REFUZAT: marcaj de proveniență absent sau diferit (%)',
      coalesce(v_marker, 'NULL')
      using errcode = 'P0001';
  end if;

  select count(*) into v_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'decision_records';
  if v_columns <> 6 then
    raise exception 'ROLLBACK 008 REFUZAT: structură modificată (% coloane, așteptate 6)', v_columns
      using errcode = 'P0001';
  end if;

  select count(*) into v_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'decision_records';
  if v_policies <> 2 then
    raise exception 'ROLLBACK 008 REFUZAT: politici modificate (%)', v_policies using errcode = 'P0001';
  end if;

  -- Blochează scriitorii concurenți: numărul de rânduri rămâne valabil până la DROP.
  execute 'lock table public.decision_records in access exclusive mode';

  execute 'select count(*) from public.decision_records' into v_rows;
  v_allow := coalesce(current_setting('glazeo.allow_data_loss', true), 'off') = 'on';

  if v_rows > 0 and not v_allow then
    raise exception
      'ROLLBACK 008 REFUZAT: tabela conține % rânduri. Setați glazeo.allow_data_loss=on pentru a accepta pierderea de date.',
      v_rows
      using errcode = 'P0001';
  end if;

  if v_rows > 0 then
    raise notice 'ROLLBACK 008: pierdere de date acceptată explicit (% rânduri).', v_rows;
  end if;
end $$;

-- ── 1. ȘTERGERE ───────────────────────────────
drop policy if exists "Users can view own decision records" on public.decision_records;
drop policy if exists "Users can insert own decision records" on public.decision_records;

drop table if exists public.decision_records;

-- ── 2. VERIFICARE FINALĂ ──────────────────────
do $$
begin
  if to_regclass('public.decision_records') is not null then
    raise exception 'ROLLBACK 008: tabela există încă' using errcode = 'P0001';
  end if;
end $$;
