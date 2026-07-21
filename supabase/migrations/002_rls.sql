-- ══════════════════════════════════════════════
-- GLAZEO Next — RLS Policies
-- ══════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_participants enable row level security;
alter table public.configurations enable row level security;
alter table public.configuration_versions enable row level security;
alter table public.quotes enable row level security;
alter table public.orders enable row level security;
alter table public.activity_events enable row level security;

-- ── Organizations ──────────────────────────────────
create policy "Members can read their organizations"
  on public.organizations for select to authenticated
  using (exists (
    select 1 from public.organization_members
    where organization_id = id and user_id = auth.uid()
  ));

-- ── Profiles ───────────────────────────────────────
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (user_id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (user_id = auth.uid());

-- ── Organization Members ───────────────────────────
create policy "Members can read org membership"
  on public.organization_members for select to authenticated
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- ── Projects ───────────────────────────────────────
create policy "Members can read org projects"
  on public.projects for select to authenticated
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Members can insert projects"
  on public.projects for insert to authenticated
  with check (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Members can update org projects"
  on public.projects for update to authenticated
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- ── Project Participants ───────────────────────────
create policy "Members can read participants"
  on public.project_participants for select to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

-- ── Configurations ─────────────────────────────────
create policy "Members can read configs"
  on public.configurations for select to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can insert configs"
  on public.configurations for insert to authenticated
  with check (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can update configs"
  on public.configurations for update to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

-- ── Configuration Versions ─────────────────────────
create policy "Members can read config versions"
  on public.configuration_versions for select to authenticated
  using (configuration_id in (
    select c.id from public.configurations c
    join public.projects p on p.id = c.project_id
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can insert config versions"
  on public.configuration_versions for insert to authenticated
  with check (configuration_id in (
    select c.id from public.configurations c
    join public.projects p on p.id = c.project_id
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

-- ── Quotes ─────────────────────────────────────────
create policy "Members can read quotes"
  on public.quotes for select to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can insert quotes"
  on public.quotes for insert to authenticated
  with check (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can update quotes"
  on public.quotes for update to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

-- ── Orders ─────────────────────────────────────────
create policy "Members can read orders"
  on public.orders for select to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can insert orders"
  on public.orders for insert to authenticated
  with check (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

-- ── Activity Events ────────────────────────────────
create policy "Members can read activity events"
  on public.activity_events for select to authenticated
  using (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));

create policy "Members can insert activity events"
  on public.activity_events for insert to authenticated
  with check (project_id in (
    select p.id from public.projects p
    join public.organization_members om on om.organization_id = p.organization_id
    where om.user_id = auth.uid()
  ));
