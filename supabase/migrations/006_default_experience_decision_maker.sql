-- ══════════════════════════════════════════════
-- GLAZEO Next — 006: default experience = decision_maker (forward-only, SECURED)
-- ══════════════════════════════════════════════
-- NU editează migrările istorice (001/004).
-- Corecții de securitate (2026-08-28):
--   1) auth.uid() obligatoriu și egal cu p_user_id → 42501 înainte de orice insert/select;
--   2) SECURITY DEFINER cu search_path explicit (pg_catalog, public);
--   3) REVOKE ALL FROM PUBLIC + GRANT EXECUTE doar către authenticated;
--   4) retur minim: jsonb_build_object('default_experience', ...) — NU întregul rând;
--   5) email canonic DOAR din JWT (auth.jwt()); dacă lipsește sau e gol → 42501 (refuz
--      explicit). NU se acceptă p_email (client-supplied) ca identitate canonică.
--      p_email rămâne în semnătură doar pentru compatibilitatea contractului RPC.
-- Corecție concurență (2026-08-30):
--   6) advisory lock transaction-scoped pe p_user_id (== auth.uid(), validat mai sus),
--      înainte de primul SELECT/INSERT de inițializare → două inițializări concurente
--      pentru același user NU mai pot crea organizații/proiecte duplicate. Eliberare
--      automată la COMMIT/ROLLBACK. Cheie 64-bit deterministă (hashtextextended);
--      coliziuni teoretic posibile în spațiul 2^64 → doar serializare benignă, fără
--      deadlock (o singură cheie per tranzacție). Nu modifică modelul multi-org.
-- Idempotent: repetiția apelului returnează profilul existent, fără efecte laterale.

alter table public.profiles
  alter column default_experience set default 'decision_maker';

-- ── Înlocuire rpc_initialize_account (forward-only, securizat) ──
create or replace function rpc_initialize_account(
  p_user_id uuid,
  p_email text,
  p_full_name text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org_id uuid;
  v_project_id uuid;
  v_cfg1_id uuid;
  v_default text;
  v_email text := nullif(auth.jwt() ->> 'email', '');
begin
  -- 0. Ownership: DOAR propriul profil. Verificare înainte de orice insert/select.
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'insufficient_privilege: caller may only initialize their own profile'
      using errcode = '42501';
  end if;

  -- 0b. Email canonic: DOAR din JWT. Lipsește/gol → refuz explicit (42501).
  --     p_email (client-supplied) NU e acceptat ca identitate.
  if v_email is null then
    raise exception 'insufficient_privilege: authenticated email is required'
      using errcode = '42501';
  end if;

  -- 0c. Serialize inițializarea per user (race cross-session: tab-uri/dispozitive).
  --     Advisory lock transaction-scoped, cheie 64-bit deterministă din p_user_id
  --     (== auth.uid(), validat la 0). Eliberare automată la COMMIT/ROLLBACK.
  --     Funcții pg_catalog schema-qualified → imune la manipulări de search_path.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  -- 1. Profil: creează DOAR dacă nu există (DO NOTHING).
  --    Conturile existente (buyer/decision_maker) rămân exact cum sunt.
  insert into public.profiles (user_id, email, full_name, default_experience)
  values (p_user_id, v_email, p_full_name, 'decision_maker')
  on conflict (user_id) do nothing;

  -- 2. Conturile existente cu organizație NU primesc date noi.
  if exists (select 1 from public.organization_members where user_id = p_user_id) then
    select p.default_experience into v_default
    from public.profiles p where p.user_id = p_user_id;
    return jsonb_build_object('default_experience', v_default);
  end if;

  -- 3. Organizație + membru + proiect demo + configurații (comportament păstrat din 004).
  insert into public.organizations (name, type, buyer_level)
  values (coalesce(split_part(v_email, '@', 1), 'Company') || '''s Company', 'company', 'verified')
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'contractor');

  insert into public.projects (organization_id, name, product_type, status, progress, address, created_by)
  values (v_org_id, 'Vila Popescu', 'Balustrade + Cabine Duș', 'active', 65, 'Str. Plopilor 42, Timișoara', p_user_id)
  returning id into v_project_id;

  insert into public.configurations (project_id, name, product_type, status, current_version, last_edited)
  values (v_project_id, 'Balustradă terasă — 12.5m, inox lucios', 'Balustradă', 'draft', 3, 'acum 2 ore')
  returning id into v_cfg1_id;

  insert into public.configurations (project_id, name, product_type, status, current_version, last_edited)
  values (v_project_id, 'Cabină duș walk-in — 10mm clar', 'Cabină Duș', 'draft', 1, 'acum 1 zi');

  insert into public.configuration_versions (configuration_id, version, status) values
    (v_cfg1_id, 1, 'archived'),
    (v_cfg1_id, 2, 'archived'),
    (v_cfg1_id, 3, 'draft');

  insert into public.activity_events (project_id, type, text) values
    (v_project_id, 'project', 'Proiect creat'),
    (v_project_id, 'config', 'Configurație Balustradă terasă v3 salvată');

  -- 4. Retur minim — doar câmpul cerut de client (default_experience).
  select p.default_experience into v_default
  from public.profiles p where p.user_id = p_user_id;

  return jsonb_build_object('default_experience', v_default);
end;
$$;

-- ── Permisiuni: doar authenticated; PUBLIC și anon NU au acces ──
revoke all on function rpc_initialize_account(uuid, text, text) from public;
grant execute on function rpc_initialize_account(uuid, text, text) to authenticated;
