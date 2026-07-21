-- ══════════════════════════════════════════════
-- GLAZEO Next — Database Schema v1.0
-- Rulează în SQL Editor (Supabase Dashboard)
-- ══════════════════════════════════════════════

-- 1. ORGANIZATIONS
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'company' check (type in ('company', 'studio', 'individual')),
  cui text,
  address text,
  contact_email text,
  buyer_level text not null default 'public' check (buyer_level in ('public', 'verified', 'contracted')),
  discount_tier text check (discount_tier in ('tier1', 'tier2', 'tier3', 'net')),
  created_at timestamp with time zone default now()
);

-- 2. PROFILES (extends auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  default_experience text not null default 'buyer' check (default_experience in ('decision_maker', 'buyer', 'builder', 'admin')),
  created_at timestamp with time zone default now()
);

-- 3. ORGANIZATION MEMBERS
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'contractor' check (role in ('architect', 'designer', 'developer', 'contractor', 'installer', 'admin')),
  joined_at timestamp with time zone default now(),
  unique(organization_id, user_id)
);

-- 4. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  product_type text,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  address text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- 5. PROJECT PARTICIPANTS
create table if not exists public.project_participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('architect', 'designer', 'developer', 'contractor', 'installer', 'viewer')),
  joined_at timestamp with time zone default now(),
  unique(project_id, user_id)
);

-- 6. CONFIGURATIONS
create table if not exists public.configurations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  product_type text not null,
  status text not null default 'draft' check (status in ('draft', 'quoted', 'ordered', 'archived')),
  current_version integer not null default 1,
  last_edited text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. CONFIGURATION VERSIONS
create table if not exists public.configuration_versions (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid not null references public.configurations(id) on delete cascade,
  version integer not null,
  config_data jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'quoted', 'ordered', 'archived')),
  created_at timestamp with time zone default now(),
  unique(configuration_id, version)
);

-- 8. QUOTES
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  configuration_id uuid not null references public.configurations(id),
  configuration_version_id uuid references public.configuration_versions(id),
  number text not null unique,
  total numeric(12,2) not null,
  currency text not null default 'EUR' check (currency in ('EUR', 'RON')),
  status text not null default 'sent' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired', 'superseded')),
  valid_until date,
  created_at timestamp with time zone default now(),
  accepted_at timestamp with time zone
);

-- 9. ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  quote_id uuid not null unique references public.quotes(id),
  configuration_id uuid not null references public.configurations(id),
  configuration_version_id uuid references public.configuration_versions(id),
  number text not null unique,
  product_name text not null,
  total numeric(12,2) not null,
  currency text not null default 'EUR' check (currency in ('EUR', 'RON')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'shipped', 'delivered', 'completed', 'cancelled')),
  estimated_delivery date,
  created_at timestamp with time zone default now()
);

-- 10. ACTIVITY EVENTS
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('config', 'quote', 'order', 'project')),
  text text not null,
  created_at timestamp with time zone default now()
);

-- ══════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_projects_org on public.projects(organization_id);
create index if not exists idx_project_participants_user on public.project_participants(user_id);
create index if not exists idx_configurations_project on public.configurations(project_id);
create index if not exists idx_quotes_project on public.quotes(project_id);
create index if not exists idx_quotes_config on public.quotes(configuration_id);
create index if not exists idx_orders_project on public.orders(project_id);
create index if not exists idx_activity_project on public.activity_events(project_id);
