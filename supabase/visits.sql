-- ─── Visits table ─────────────────────────────────────────────────────────────

create type visit_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create table visits (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  lead_id       uuid not null references leads(id) on delete cascade,
  agent_id      uuid references profiles(id) on delete set null,
  scheduled_at  timestamptz not null,
  address       text,
  notes         text,
  status        visit_status not null default 'pending'
);

-- Index for calendar queries
create index visits_scheduled_at_idx on visits(scheduled_at);
create index visits_lead_id_idx on visits(lead_id);

-- RLS
alter table visits enable row level security;

-- All authenticated users can read visits
create policy "Authenticated can read visits"
  on visits for select
  to authenticated
  using (true);

-- All authenticated users can insert visits
create policy "Authenticated can insert visits"
  on visits for insert
  to authenticated
  with check (true);

-- Admin or assigned agent can update
create policy "Admin or agent can update visits"
  on visits for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
    or agent_id = auth.uid()
  );
