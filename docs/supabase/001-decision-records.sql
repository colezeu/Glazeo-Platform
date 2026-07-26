-- ══════════════════════════════════════════════
-- GLAZEO — Decision Records Table
-- Supabase migration 001
-- ══════════════════════════════════════════════

-- Table: decision_records
create table if not exists public.decision_records (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  model_id    text not null,
  decided_at  timestamp with time zone not null default now(),
  snapshot    jsonb not null,
  created_at  timestamp with time zone not null default now()
);

-- Index for user-scoped queries
create index if not exists idx_decision_records_user_id
  on public.decision_records (user_id);

-- Index for sorted listing
create index if not exists idx_decision_records_user_decided
  on public.decision_records (user_id, decided_at desc);

-- RLS: enable
alter table public.decision_records enable row level security;

-- Policy: user sees only own records
create policy "Users can view own decision records"
  on public.decision_records
  for select
  using (auth.uid() = user_id);

-- Policy: user can insert own records
create policy "Users can insert own decision records"
  on public.decision_records
  for insert
  with check (auth.uid() = user_id);

-- Policy: no update or delete (records are immutable snapshots)
-- (no policy = denied by default)
