-- ══════════════════════════════════════════════
-- GLAZEO Next — Gate 4 RPC Functions
-- Mută toate operațiile de business server-side
-- ══════════════════════════════════════════════

-- ── 1. Initialize Account (atomic onboarding) ──────
create or replace function rpc_initialize_account(
  p_user_id uuid,
  p_email text,
  p_full_name text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
  v_project_id uuid;
  v_cfg1_id uuid;
  v_cfg2_id uuid;
begin
  -- Profile (upsert)
  insert into public.profiles (user_id, email, full_name, default_experience)
  values (p_user_id, p_email, p_full_name, 'buyer')
  on conflict (user_id) do update set email = excluded.email, full_name = excluded.full_name;

  -- Check if user already has an organization
  if exists (select 1 from public.organization_members where user_id = p_user_id) then
    return jsonb_build_object('status', 'existing', 'message', 'Account already initialized');
  end if;

  -- Create organization
  insert into public.organizations (name, type, buyer_level)
  values (split_part(p_email, '@', 1) || '''s Company', 'company', 'verified')
  returning id into v_org_id;

  -- Add as member
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'contractor');

  -- Create sample project
  insert into public.projects (organization_id, name, product_type, status, progress, address, created_by)
  values (v_org_id, 'Vila Popescu', 'Balustrade + Cabine Duș', 'active', 65, 'Str. Plopilor 42, Timișoara', p_user_id)
  returning id into v_project_id;

  -- Sample configurations
  insert into public.configurations (project_id, name, product_type, status, current_version, last_edited)
  values (v_project_id, 'Balustradă terasă — 12.5m, inox lucios', 'Balustradă', 'draft', 3, 'acum 2 ore')
  returning id into v_cfg1_id;

  insert into public.configurations (project_id, name, product_type, status, current_version, last_edited)
  values (v_project_id, 'Cabină duș walk-in — 10mm clar', 'Cabină Duș', 'draft', 1, 'acum 1 zi');

  -- Config versions
  insert into public.configuration_versions (configuration_id, version, status) values
    (v_cfg1_id, 1, 'archived'),
    (v_cfg1_id, 2, 'archived'),
    (v_cfg1_id, 3, 'draft');

  -- Activity events
  insert into public.activity_events (project_id, type, text) values
    (v_project_id, 'project', 'Proiect creat'),
    (v_project_id, 'config', 'Configurație Balustradă terasă v3 salvată');

  return jsonb_build_object(
    'status', 'created',
    'organization_id', v_org_id,
    'project_id', v_project_id
  );
end;
$$;

grant execute on function rpc_initialize_account to authenticated;

-- ── 2. Request Quote (server-side) ──────────────────
create or replace function rpc_request_quote(
  p_config_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_cfg record;
  v_quote_num text;
  v_valid_until date;
  v_version_id uuid;
  v_count int;
begin
  select * into v_cfg from public.configurations where id = p_config_id;
  if not found then
    return jsonb_build_object('error', 'Configuration not found');
  end if;
  if v_cfg.status != 'draft' then
    return jsonb_build_object('error', 'Configuration is not in draft status');
  end if;

  -- Check for existing sent quote for same config version
  select count(*) into v_count from public.quotes
  where configuration_id = p_config_id and status = 'sent';
  if v_count > 0 then
    return jsonb_build_object('error', 'Quote already requested for this configuration version');
  end if;

  -- Generate quote number
  select count(*) + 40 into v_count from public.quotes;
  v_quote_num := 'OF-2026-' || lpad(v_count::text, 4, '0');
  v_valid_until := (now() + interval '7 days')::date;

  -- Create config version
  insert into public.configuration_versions (configuration_id, version, config_data, status)
  values (p_config_id, v_cfg.current_version, '{}', 'quoted')
  returning id into v_version_id;

  -- Create quote
  insert into public.quotes (
    project_id, configuration_id, configuration_version_id,
    number, total, currency, status, valid_until
  ) values (
    v_cfg.project_id, p_config_id, v_version_id,
    v_quote_num, 2847, 'EUR', 'sent', v_valid_until
  );

  -- Update config status
  update public.configurations set status = 'quoted' where id = p_config_id;

  -- Activity
  insert into public.activity_events (project_id, type, text)
  values (v_cfg.project_id, 'quote', 'Ofertă ' || v_quote_num || ' generată din ' || v_cfg.name || ' v' || v_cfg.current_version);

  -- Update project progress
  update public.projects set progress = least(100, progress + 15)
  where id = v_cfg.project_id;

  return jsonb_build_object(
    'status', 'created',
    'quote_number', v_quote_num,
    'valid_until', v_valid_until
  );
end;
$$;

grant execute on function rpc_request_quote to authenticated;

-- ── 3. Duplicate Configuration (server-side) ────────
create or replace function rpc_duplicate_configuration(
  p_config_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_cfg record;
  v_new_version int;
  v_new_name text;
  v_new_id uuid;
begin
  select * into v_cfg from public.configurations where id = p_config_id;
  if not found then
    return jsonb_build_object('error', 'Configuration not found');
  end if;

  v_new_version := v_cfg.current_version + 1;
  v_new_name := regexp_replace(v_cfg.name, ' v\d+$', '') || ' v' || v_new_version;

  -- Create new config
  insert into public.configurations (
    project_id, name, product_type, status, current_version, last_edited
  ) values (
    v_cfg.project_id, v_new_name, v_cfg.product_type, 'draft', v_new_version, 'chiar acum'
  ) returning id into v_new_id;

  -- Create version record
  insert into public.configuration_versions (configuration_id, version, config_data, status)
  values (v_new_id, v_new_version, '{}', 'draft');

  -- Activity
  insert into public.activity_events (project_id, type, text)
  values (v_cfg.project_id, 'config', 'Configurație nouă ' || v_new_name || ' (v' || v_new_version || ')');

  return jsonb_build_object(
    'status', 'created',
    'config_id', v_new_id,
    'name', v_new_name,
    'version', v_new_version
  );
end;
$$;

grant execute on function rpc_duplicate_configuration to authenticated;

-- ── 4. Order Snapshots ──────────────────────────────
create table if not exists public.order_snapshots (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  quote_data jsonb not null,
  config_data jsonb not null,
  created_at timestamp with time zone default now()
);

alter table public.order_snapshots enable row level security;

create policy "Members can read order snapshots"
  on public.order_snapshots for select to authenticated
  using (order_id in (
    select o.id from public.orders o
    join public.projects p on p.id = o.project_id
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

-- Update accept_quote_atomic to include snapshot
create or replace function accept_quote_atomic(
  p_quote_id uuid,
  p_order_number text,
  p_config_id uuid,
  p_project_id uuid,
  p_product_name text,
  p_total numeric,
  p_currency text,
  p_config_version_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_quote_number text;
  v_order_id uuid;
  v_quote_data jsonb;
  v_config_data jsonb;
begin
  select number into v_quote_number from public.quotes where id = p_quote_id;

  -- 1. Mark quote as accepted (idempotent)
  update public.quotes set status = 'accepted', accepted_at = now()
  where id = p_quote_id and status = 'sent';

  if not found then
    return jsonb_build_object('error', 'Quote not in sent status or already accepted');
  end if;

  -- 2. Supersede competing sent quotes for same config
  update public.quotes set status = 'superseded'
  where configuration_id = p_config_id and id != p_quote_id and status = 'sent';

  -- 3. Capture snapshot data BEFORE creating order
  select row_to_json(q)::jsonb into v_quote_data
  from (select * from public.quotes where id = p_quote_id) q;

  select row_to_json(c)::jsonb into v_config_data
  from (select * from public.configurations where id = p_config_id) c;

  -- 4. Create order
  insert into public.orders (
    project_id, quote_id, configuration_id, configuration_version_id,
    number, product_name, total, currency, status, estimated_delivery
  ) values (
    p_project_id, p_quote_id, p_config_id, p_config_version_id,
    p_order_number, p_product_name, p_total, p_currency, 'pending',
    now() + interval '21 days'
  ) returning id into v_order_id;

  -- 5. Save snapshot
  insert into public.order_snapshots (order_id, quote_data, config_data)
  values (v_order_id, v_quote_data, v_config_data);

  -- 6. Mark config as ordered
  update public.configurations set status = 'ordered' where id = p_config_id;

  -- 7. Activity events
  insert into public.activity_events (project_id, type, text) values
    (p_project_id, 'order', 'Comanda ' || p_order_number || ' creata din oferta ' || v_quote_number),
    (p_project_id, 'quote', 'Oferta ' || v_quote_number || ' acceptata');

  -- 8. Update project progress
  update public.projects set progress = least(100, progress + 20),
    status = case when progress + 20 >= 100 then 'in_progress' else status end
  where id = p_project_id;

  return jsonb_build_object('status', 'accepted', 'order_id', v_order_id, 'order_number', p_order_number);
end;
$$;

grant execute on function accept_quote_atomic to authenticated;
