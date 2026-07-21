-- Gate 4 A5: RLS fix — eliminate recursion via is_org_member()
create or replace function is_org_member(p_org_id uuid) returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.organization_members where organization_id = p_org_id and user_id = auth.uid());
$$;

-- Recreate all policies using the helper
drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations" on public.organizations for select to authenticated using (is_org_member(id));

drop policy if exists "Members can read org projects" on public.projects;
drop policy if exists "Members can insert projects" on public.projects;
drop policy if exists "Members can update org projects" on public.projects;
create policy "Members can read org projects" on public.projects for select to authenticated using (is_org_member(organization_id));
create policy "Members can insert projects" on public.projects for insert to authenticated with check (is_org_member(organization_id));
create policy "Members can update org projects" on public.projects for update to authenticated using (is_org_member(organization_id));

drop policy if exists "Members can read participants" on public.project_participants;
create policy "Members can read participants" on public.project_participants for select to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));

drop policy if exists "Members can read configs" on public.configurations;
drop policy if exists "Members can insert configs" on public.configurations;
drop policy if exists "Members can update configs" on public.configurations;
create policy "Members can read configs" on public.configurations for select to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));
create policy "Members can insert configs" on public.configurations for insert to authenticated with check (is_org_member((select organization_id from public.projects where id = project_id)));
create policy "Members can update configs" on public.configurations for update to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));

drop policy if exists "Members can read config versions" on public.configuration_versions;
drop policy if exists "Members can insert config versions" on public.configuration_versions;
create policy "Members can read config versions" on public.configuration_versions for select to authenticated using (is_org_member((select p.organization_id from public.configurations c join public.projects p on p.id = c.project_id where c.id = configuration_id)));
create policy "Members can insert config versions" on public.configuration_versions for insert to authenticated with check (is_org_member((select p.organization_id from public.configurations c join public.projects p on p.id = c.project_id where c.id = configuration_id)));

drop policy if exists "Members can read quotes" on public.quotes;
drop policy if exists "Members can insert quotes" on public.quotes;
drop policy if exists "Members can update quotes" on public.quotes;
create policy "Members can read quotes" on public.quotes for select to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));
create policy "Members can insert quotes" on public.quotes for insert to authenticated with check (is_org_member((select organization_id from public.projects where id = project_id)));
create policy "Members can update quotes" on public.quotes for update to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));

drop policy if exists "Members can read orders" on public.orders;
drop policy if exists "Members can insert orders" on public.orders;
create policy "Members can read orders" on public.orders for select to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));
create policy "Members can insert orders" on public.orders for insert to authenticated with check (is_org_member((select organization_id from public.projects where id = project_id)));

drop policy if exists "Members can read activity events" on public.activity_events;
drop policy if exists "Members can insert activity events" on public.activity_events;
create policy "Members can read activity events" on public.activity_events for select to authenticated using (is_org_member((select organization_id from public.projects where id = project_id)));
create policy "Members can insert activity events" on public.activity_events for insert to authenticated with check (is_org_member((select organization_id from public.projects where id = project_id)));
