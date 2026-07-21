-- ══════════════════════════════════════════════
-- GLAZEO Next — Atomic RPC Functions
-- ══════════════════════════════════════════════

-- Atomic accept quote: update quote + supersede competing + create order + activity
create or replace function accept_quote_atomic(
  p_quote_id uuid,
  p_order_number text,
  p_config_id uuid,
  p_project_id uuid,
  p_product_name text,
  p_total numeric,
  p_currency text,
  p_config_version_id uuid
) returns void
language plpgsql
security definer
as $$
declare
  v_quote_number text;
begin
  -- Get quote number for activity text
  select number into v_quote_number from public.quotes where id = p_quote_id;

  -- 1. Mark quote as accepted
  update public.quotes
  set status = 'accepted', accepted_at = now()
  where id = p_quote_id and status = 'sent';

  -- 2. Supersede competing sent quotes for same config
  update public.quotes
  set status = 'superseded'
  where configuration_id = p_config_id
    and id != p_quote_id
    and status = 'sent';

  -- 3. Create order
  insert into public.orders (
    project_id, quote_id, configuration_id, configuration_version_id,
    number, product_name, total, currency, status,
    estimated_delivery
  ) values (
    p_project_id, p_quote_id, p_config_id, p_config_version_id,
    p_order_number, p_product_name, p_total, p_currency, 'pending',
    now() + interval '21 days'
  );

  -- 4. Mark config as ordered
  update public.configurations
  set status = 'ordered'
  where id = p_config_id;

  -- 5. Activity events
  insert into public.activity_events (project_id, type, text) values
    (p_project_id, 'order', 'Comandă ' || p_order_number || ' creată din oferta ' || v_quote_number),
    (p_project_id, 'quote', 'Ofertă ' || v_quote_number || ' acceptată');

  -- Update project progress
  update public.projects
  set progress = least(100, progress + 20),
      status = case when progress + 20 >= 100 then 'in_progress' else status end
  where id = p_project_id;
end;
$$;

grant execute on function accept_quote_atomic to authenticated;
