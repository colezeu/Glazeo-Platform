-- ══════════════════════════════════════════════════════════════════════
-- GLAZEO Next — 007: gardă pe coloanele privilegiate din public.profiles
-- ══════════════════════════════════════════════════════════════════════
-- NU editează migrările istorice (001/002/006). Forward-only.
--
-- DE CE: politicile din 002_rls.sql permit clientului să-și scrie propriul rând
--   de profil (`Users can update own profile` / `Users can insert own profile`),
--   fără nicio restricție de coloană. Două consecințe reale:
--
--   1) ESCALADARE PE EXPERIENȚĂ (auto-atribuire de rol privilegiat)
--      `default_experience` e citită de SupabaseExperienceGateway și tratată ca
--      autoritativă de resolveExperience (fără fallback, prin design).
--      Un client autentificat putea face:
--          PATCH /rest/v1/profiles  { "default_experience": "admin" }
--      pe propriul rând (coloana permite 'admin' prin check-ul din 001) și ruta
--      rezolva experiența `admin` la următoarea încărcare. Același lucru pe
--      calea de INSERT, dacă rândul nu exista.
--
--   2) EMAIL DE IDENTITATE SPOOFABIL
--      `profiles.email` putea fi scris de client, în contradicție directă cu
--      principiul introdus de 006 pentru RPC ("email canonic DOAR din JWT").
--
-- CE FACE: o gardă column-level, aditivă, care nu modifică nicio politică
--   existentă. Rulează pe INSERT și UPDATE (ambele căi — un trigger doar pe
--   UPDATE lasă deschis INSERT-ul, iar politica din 002 permite insertul
--   propriului profil).
--
-- DE CE TRIGGER, NU coloană separată / RPC dedicat:
--   - coloană separată: `default_experience` rămâne coloana citită de resolver,
--     deci protecția tot trebuie pusă pe ea;
--   - RPC dedicat: cere eliminarea politicii de UPDATE pe profiles (altfel
--     clientul ocolește RPC-ul direct prin PostgREST) → schimbare mai mare,
--     care atinge 002;
--   - trigger: column-level, aditiv, nu atinge politicile, și e tiparul deja
--     validat local pentru garda echivalentă din GLAZEO Legacy (HF-3).
--
-- DETALIU CARE CONTEAZĂ: funcția de trigger e SECURITY INVOKER (implicit), NU
--   definer. Cu `security definer`, `current_user` ar fi mereu proprietarul
--   funcției (postgres) și garda ar lăsa TOTUL să treacă.
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Garda ──────────────────────────────────────────────────────────
create or replace function public.guard_profiles_privileged_columns()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  -- Roluri de încredere: migrații, SQL editor (postgres), edge functions cu
  -- service_role. NU sunt accesibile dintr-un client — nu se pot falsifica.
  -- (RPC-urile SECURITY DEFINER rulează tot ca owner = postgres → intră aici,
  --  deci onboarding-ul legitim nu e afectat.)
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  -- De aici încolo: context de client (authenticated/anon prin PostgREST).

  if tg_op = 'INSERT' then
    -- La inserare, clientul poate cere EXACT experiența de onboarding.
    -- Orice altă valoare (admin/builder/buyer) e o auto-atribuire de rol.
    if new.default_experience is distinct from 'decision_maker' then
      raise exception 'default_experience is not client-settable'
        using errcode = '42501';
    end if;

    -- Emailul de identitate trebuie să coincidă cu identitatea autentificată
    -- (derivată din JWT, nespoilabilă) — același principiu ca în 006.
    if new.email is distinct from auth.email() then
      raise exception 'identity email must match the authenticated identity'
        using errcode = '42501';
    end if;

    return new;
  end if;

  -- UPDATE
  if new.default_experience is distinct from old.default_experience then
    raise exception 'default_experience is not client-writable'
      using errcode = '42501';
  end if;

  if new.email is distinct from old.email then
    raise exception 'identity email is immutable from the client'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profiles_privileged_columns()
  from public, anon, authenticated;

-- ── 2. Trigger pe ambele căi ──────────────────────────────────────────
drop trigger if exists profiles_privileged_columns_guard on public.profiles;

create trigger profiles_privileged_columns_guard
  before insert or update on public.profiles
  for each row execute function public.guard_profiles_privileged_columns();

-- ── 3. Idempotent prin construcție ────────────────────────────────────
-- `create or replace function` + `drop trigger if exists` → migrarea poate fi
-- re-rulată fără efecte cumulative.
--
-- ── CE NU REZOLVĂ (intenționat, rămâne item separat) ──────────────────
-- Închide auto-escaladarea pe COLOANĂ. NU rezolvă limita pe care ADR-001 o
-- recunoaște singur (docs/adr/001-experience-resolution.md): politicile RLS
-- verifică apartenența (`is_org_member()`), nu ROLUL. Cât timp nu există o
-- experiență `admin` implementată (azi randează un ecran „nu este încă
-- disponibilă"), nu se vede; când va exista, 007 singur NU e suficient.
